# Competitor Data Processing

## Data Source

Table: `对标竞品` (tbl01F1ENSCP0fRi) in base `FHxDbhbQKaIwrHsuNr3cUBXgn4d`.

## Table Structure

This is a pivoted table. Each row represents one competitor ASIN. Columns are a mix of:

1. **Static attributes** (fldsfJ1WiX through fldizLJNiE): brand, ASIN, specs, review count, star rating, ad strategy, pricing strategy
2. **Date-pair columns**: For each snapshot date, 2 columns store price/promotion info + subcategory ranking

Date columns follow naming like `5.18-US` (price) and `5.18-US_1` (ranking), where the date is in `M.D` format.

## Processing Steps

### Step 1: Discover Available Fields

Always start with `manage_bitable_field(action=list, app_token="<FEISHU_APP_TOKEN>", table_id="<FEISHU_TABLE_ID>")` to get the complete field list.

### Step 2: Identify Static vs Date Columns

Static fields have fixed field_id prefixes:
- fldsfJ1WiX, flda078H6n, fldz90a9bP, fld72319vj, fldsainKKN, fldAucjKKl, flddlc36lM, fldobuhrGX, fldjBDW2yp, fldhxAx4BV, fld4aMo03X, fld291eLG7, fldD3lutVx, fldfwvmQQC, fldizLJNiE

Date-pair columns have field_names matching the pattern `M.D-US` or `M.D-US_1` (e.g., "5.18-US", "5.18-US_1").

### Step 3: Extract Static Attributes Per Competitor

For each record, extract:

```
{
  "brand": fields["未命名_2"] (fldz90a9bP),
  "asin": fields["未命名_3"] (fld72319vj),
  "specs": fields["未命名_5"] (fldAucjKKl),
  "pcs": fields["未命名_6"] (flddlc36lM),
  "variant_count": fields["未命名_7"] (fldobuhrGX),
  "variant_price": fields["未命名_8"] (fldjBDW2yp),
  "review_count": fields["未命名_9"] (fldhxAx4BV),
  "star_rating": fields["未命名_10"] (fld4aMo03X),
  "ad_structure": fields["未命名_11"] (fld291eLG7),
  "ad_tactics": fields["未命名_12"] (fldD3lutVx),
  "pricing_strategy": fields["未命名_13"] (fldfwvmQQC),
  "notes": fields["未命名_14"] (fldizLJNiE)
}
```

### Step 4: Extract Time-Series Data

For each date pair (e.g., "5.18-US" + "5.18-US_1"), extract:

```
{
  "date": "2026-05-18",
  "price_promo": value from M.D-US field,
  "subcategory_rank": value from M.D-US_1 field
}
```

Date parsing: "5.18" → "2026-05-18" (year defaults to 2026 for this dataset).

### Step 5: Compute Trends

For each competitor, across the 4 most recent date snapshots:

**Price trend:**
- `price_current` = most recent non-null price
- `price_4w_ago` = price from ~4 weeks ago (or earliest available in window)
- `price_change_pct` = (current - 4w_ago) / 4w_ago
- `price_direction` = "down" if change < -5%, "up" if > +5%, else "stable"

**Rank trend:**
- `rank_current` = most recent non-null rank
- `rank_4w_ago` = rank from ~4 weeks ago
- `rank_change_abs` = current - 4w_ago (negative = improved)
- `rank_direction` = "improving" if change < -10, "declining" if change > +10, else "stable"

### Step 6: Compute Threat Signals

| Signal | Condition | Meaning |
|--------|-----------|---------|
| Price attack | price_change_pct < -10% | Competitor aggressively cutting price |
| Rank surge | rank_change_abs < -20 AND rank_direction = "improving" | Competitor gaining ranking fast |
| Combined threat | Price attack AND Rank surge | Active competitive threat |
| Segment price war | 3+ competitors in same category all show price ↓ > 10% | Price war in the segment |

### Step 7: Link Competitors to Own Products

Competitors don't have a formal foreign-key link to own products. Matching is manual:

1. Group own products by `产品线` from the main table
2. Group competitors by `类目` (flda078H6n)
3. Manually/contextually match product lines to competitor categories

For the initial implementation, present all competitor trends alongside own products so the analyst can see competitive dynamics at a glance.

## Using the Python Script

The `scripts/process_competitor_data.py` script automates steps 3-6:

```
python scripts/process_competitor_data.py <competitor_raw.json> <field_map.json>
```

Input:
- `competitor_raw.json`: Raw JSON from `manage_bitable_record(action=search)` on 对标竞品
- `field_map.json`: Field ID → name mapping from `manage_bitable_field(action=list)`

Output (`competitor_trends.json`):
```json
{
  "competitors": [
    {
      "brand": "Eventronic",
      "asin": "B0BVVMCY86",
      "star_rating": 4.7,
      "review_count": 32932,
      "pricing_strategy": "BD monthly",
      "price_trend": {
        "latest_price": 13.99,
        "price_4w_ago": 14.99,
        "change_pct": -6.7,
        "direction": "down"
      },
      "rank_trend": {
        "latest_rank": 12,
        "rank_4w_ago": 18,
        "change_abs": -6,
        "direction": "improving"
      },
      "threat_signals": ["price_attack"]
    }
  ],
  "segment_alerts": []
}
```

## Fallback: Manual Processing

If the Python script can't run (e.g., Python not available), process the data inline:

1. Read all competitor records with `manage_bitable_record(action=search)`
2. Read field list with `manage_bitable_field(action=list)`
3. Identify the 4 most recent date columns by parsing field names
4. For each competitor, extract price and rank from those 4 date pairs
5. Compute trends manually
6. Present findings in the competitor section of the report
