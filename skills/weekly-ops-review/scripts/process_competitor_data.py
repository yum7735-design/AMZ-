"""
Unpivot and process competitor benchmarking data from Feishu Bitable.

Input: JSON output from manage_bitable_record(action=search) on tbl01F1ENSCP0fRi
       + field map from manage_bitable_field(action=list)

Output: competitor_trends.json with per-competitor trend analysis
"""
import json
import re
import sys
from datetime import datetime, timedelta


def parse_date_from_field(name):
    """Parse '5.18-US' or '5.18-US_1' into ('2026-05-18', 'price'|'rank')."""
    m = re.match(r'(\d{1,2})\.(\d{1,2})-US(?:_1)?$', name)
    if not m:
        return None
    month = int(m.group(1))
    day = int(m.group(2))
    is_rank = '_1' in name
    date_str = f"2026-{month:02d}-{day:02d}"
    metric = "rank" if is_rank else "price"
    return (date_str, metric)


def load_field_map(filepath):
    """Load field_id -> field_name mapping from manage_bitable_field output."""
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    mapping = {}
    items = raw.get('items', raw) if isinstance(raw, dict) else raw
    if isinstance(items, dict):
        items = items.get('items', [])
    for item in items:
        mapping[item['field_id']] = item['field_name']
    return mapping


def process(raw_records, field_map):
    """Main processing: unpivot, compute trends, output structured results."""
    # Step 1: Categorize fields
    static_field_map = {
        'flda078H6n': 'category',
        'fldz90a9bP': 'brand',
        'fld72319vj': 'asin',
        'fldAucjKKl': 'specs',
        'flddlc36lM': 'pcs',
        'fldobuhrGX': 'variant_count',
        'fldjBDW2yp': 'variant_price',
        'fldhxAx4BV': 'review_count',
        'fld4aMo03X': 'star_rating',
        'fld291eLG7': 'ad_structure',
        'fldD3lutVx': 'ad_tactics',
        'fldfwvmQQC': 'pricing_strategy',
        'fldizLJNiE': 'notes',
    }

    # Identify date-pair columns from field_map
    date_fields = {}
    for fid, fname in field_map.items():
        parsed = parse_date_from_field(fname)
        if parsed:
            date_str, metric = parsed
            if date_str not in date_fields:
                date_fields[date_str] = {}
            date_fields[date_str][metric] = fid

    # Step 2: Process each competitor record
    competitors = []
    for record in raw_records:
        fields = record.get('fields', record)

        # Extract static attributes
        comp = {}
        for fid, key in static_field_map.items():
            val = fields.get(fid, '')
            if isinstance(val, list):
                val = val[0].get('text', '') if isinstance(val[0], dict) else val[0]
            elif isinstance(val, dict) and 'text' in val:
                val = val['text']
            comp[key] = val

        # Skip header row (first row has descriptive text)
        if not comp.get('asin') or comp['asin'] == 'ASIN':
            continue

        # Extract time series
        time_series = []
        for date_str in sorted(date_fields.keys()):
            price_fid = date_fields[date_str].get('price')
            rank_fid = date_fields[date_str].get('rank')

            price_val = None
            rank_val = None

            if price_fid and price_fid in fields:
                pv = fields[price_fid]
                if isinstance(pv, dict) and 'value' in pv:
                    price_val = pv['value'][0] if pv['value'] else None
                elif isinstance(pv, list) and len(pv) > 0:
                    price_val = pv[0].get('text', pv[0]) if isinstance(pv[0], dict) else pv[0]

            if rank_fid and rank_fid in fields:
                rv = fields[rank_fid]
                if isinstance(rv, dict) and 'value' in rv:
                    rank_val = rv['value'][0] if rv['value'] else None
                elif isinstance(rv, list) and len(rv) > 0:
                    rank_val = rv[0].get('text', rv[0]) if isinstance(rv[0], dict) else rv[0]

            if price_val is not None or rank_val is not None:
                # Try to convert to numbers
                try:
                    price_val = float(price_val) if price_val is not None else None
                except (ValueError, TypeError):
                    pass
                try:
                    rank_val = float(rank_val) if rank_val is not None else None
                except (ValueError, TypeError):
                    pass
                time_series.append({
                    'date': date_str,
                    'price': price_val,
                    'rank': rank_val,
                })

        # Step 3: Compute trends (last 4 data points)
        comp['time_series'] = time_series
        comp['price_trend'] = compute_trend(time_series, 'price')
        comp['rank_trend'] = compute_trend(time_series, 'rank')

        # Step 4: Detect threat signals
        signals = []
        if comp['price_trend']:
            if comp['price_trend'].get('direction') == 'down' and comp['price_trend'].get('change_pct', 0) < -10:
                signals.append('price_attack')
        if comp['rank_trend']:
            if comp['rank_trend'].get('direction') == 'improving' and comp['rank_trend'].get('change_abs', 0) < -20:
                signals.append('rank_surge')
        if 'price_attack' in signals and 'rank_surge' in signals:
            signals.append('combined_threat')
        comp['threat_signals'] = signals

        competitors.append(comp)

    # Step 5: Detect segment-level alerts (price war)
    brands_down = [c for c in competitors if 'price_attack' in c.get('threat_signals', [])]
    if len(brands_down) >= 3:
        segment_alert = {
            'type': 'price_war',
            'affected_competitors': [c['brand'] for c in brands_down],
            'count': len(brands_down),
        }
    else:
        segment_alert = None

    return {
        'competitors': competitors,
        'segment_alerts': [segment_alert] if segment_alert else [],
        'date_range': {
            'start': min(date_fields.keys()) if date_fields else None,
            'end': max(date_fields.keys()) if date_fields else None,
        },
    }


def compute_trend(time_series, metric_key):
    """Compute trend from time series for a given metric."""
    valid = [p for p in time_series if p.get(metric_key) is not None]
    if len(valid) < 2:
        return None

    # Use last entry and entry from ~4 weeks ago (or earliest available)
    latest = valid[-1][metric_key]
    earliest = valid[0][metric_key]

    # Try to find a point closer to 4 weeks back
    latest_date = datetime.strptime(valid[-1]['date'], '%Y-%m-%d')
    target_date = latest_date - timedelta(weeks=4)
    for point in valid:
        point_date = datetime.strptime(point['date'], '%Y-%m-%d')
        if abs((point_date - target_date).days) <= 3:
            earliest = point[metric_key]
            break

    if earliest == 0:
        return None

    change_pct = ((latest - earliest) / abs(earliest)) * 100
    change_abs = latest - earliest

    if change_abs == 0:
        direction = 'stable'
    elif metric_key == 'rank':
        # For rank, negative change = improvement (lower rank number is better)
        direction = 'improving' if change_abs < -10 else ('declining' if change_abs > 10 else 'stable')
    else:
        direction = 'down' if change_pct < -5 else ('up' if change_pct > 5 else 'stable')

    return {
        'latest': latest,
        'earliest': earliest,
        'change_pct': round(change_pct, 1),
        'change_abs': round(change_abs, 1),
        'direction': direction,
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python process_competitor_data.py <raw_records.json> [field_map.json]")
        print("  If field_map.json is omitted, reads field names from stdin or defaults.")
        sys.exit(1)

    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        raw = json.load(f)

    # Handle feishu response wrapper: {items: [...]}
    if isinstance(raw, dict) and 'items' in raw:
        raw = raw['items']

    if len(sys.argv) >= 3:
        field_map = load_field_map(sys.argv[2])
    else:
        # Minimal field_map: try to infer from the first record's keys
        field_map = {}
        if raw and isinstance(raw[0], dict):
            first_fields = raw[0].get('fields', raw[0])
            # We don't know field names, so just use IDs as names
            for key in first_fields.keys():
                field_map[key] = key

    result = process(raw, field_map)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
