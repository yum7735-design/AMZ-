"""Build an auditable parent-ASIN enterprise-ad spend-share analysis from two Excel files."""

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

import pandas as pd

ASIN_PATTERN = re.compile(r"\b[A-Z0-9]{10}\b")
PRODUCT_ALIASES = {
    "parent": ("父ASIN", "父体ASIN"),
    "child": ("ASIN", "子ASIN", "子体ASIN"),
    "name": ("父体品名", "品名", "产品名称"),
    "positioning": ("定位",),
    "product_line": ("产品线",),
}
ADS_ALIASES = {
    "asin": ("ASIN", "推广ASIN", "已推广的ASIN"),
    "spend": ("花费-本币", "花费", "Spend"),
    "group": ("广告组合", "广告组", "Ad Group"),
    "campaign": ("广告活动", "Campaign"),
    "ad_name": ("广告名称",),
}


def as_text(value):
    return "" if pd.isna(value) else str(value).strip()


def as_amount(value):
    if pd.isna(value):
        return 0.0
    if isinstance(value, str):
        value = value.replace("$", "").replace(",", "").strip()
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def asin_tokens(value):
    return list(dict.fromkeys(ASIN_PATTERN.findall(as_text(value).upper())))


def resolve_columns(frame, aliases, required):
    result = {key: next((column for column in choices if column in frame.columns), None) for key, choices in aliases.items()}
    missing = [key for key in required if not result[key]]
    if missing:
        raise ValueError(f"缺少必要字段 { {key: aliases[key] for key in missing} }；实际字段：{list(frame.columns)}")
    return result


def value(row, column):
    return "" if not column else as_text(row[column])


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--product", required=True, help="产品表 .xlsx")
    parser.add_argument("--ads", required=True, help="广告汇总表 .xlsx")
    parser.add_argument("--output", required=True, help="输出分析 JSON")
    parser.add_argument("--threshold", type=float, default=0.05)
    parser.add_argument("--enterprise-keyword", default="企业购")
    parser.add_argument("--clearance-labels", nargs="*", default=["清货", "清库存"])
    parser.add_argument("--exclude-ad-groups", nargs="*", default=[])
    parser.add_argument("--product-lines", nargs="*", default=[])
    parser.add_argument("--period", default="按广告文件名/用户指定周期")
    return parser.parse_args()


def main():
    args = parse_args()
    product = pd.read_excel(args.product, dtype=str)
    ads = pd.read_excel(args.ads, dtype=str)
    pcol = resolve_columns(product, PRODUCT_ALIASES, ("parent", "child", "name", "positioning", "product_line"))
    acol = resolve_columns(ads, ADS_ALIASES, ("asin", "spend", "group", "campaign"))
    clearance_labels, excluded_groups = set(args.clearance_labels), set(args.exclude_ad_groups)

    asin_to_parent, parent_meta = {}, {}
    for _, row in product.iterrows():
        parent = value(row, pcol["parent"]).upper()
        child = value(row, pcol["child"]).upper()
        if not parent:
            continue
        meta = parent_meta.setdefault(parent, {"parent_name": value(row, pcol["name"]), "positioning_values": set(), "product_line_values": set()})
        positioning, product_line = value(row, pcol["positioning"]), value(row, pcol["product_line"])
        if positioning:
            meta["positioning_values"].add(positioning)
        if product_line:
            meta["product_line_values"].add(product_line)
        for asin in (parent, child):
            if asin and asin not in asin_to_parent:
                asin_to_parent[asin] = parent

    eligible_parents = {
        parent for parent, meta in parent_meta.items()
        if not (meta["positioning_values"] & clearance_labels)
    }
    parent_totals = defaultdict(lambda: {"total_spend": 0.0, "enterprise_spend": 0.0, "allocated_line_count": 0})
    details, excluded_details, scope = [], [], defaultdict(float)

    for source_index, row in ads.iterrows():
        spend = as_amount(row[acol["spend"]])
        scope["report_spend"] += spend
        group, campaign = value(row, acol["group"]), value(row, acol["campaign"])
        is_enterprise = args.enterprise_keyword in campaign
        if group in excluded_groups:
            scope["excluded_spend"] += spend
            excluded_details.append({"source_row": int(source_index) + 2, "advertising_group": group, "campaign_activity": campaign, "advertising_name": value(row, acol["ad_name"]), "spend": spend, "exclusion_reason": f"广告组合：{group}"})
            continue
        tokens = asin_tokens(row[acol["asin"]])
        if not tokens:
            scope["blank_asin_spend"] += spend
            continue
        share = spend / len(tokens)
        for asin in tokens:
            parent = asin_to_parent.get(asin)
            if not parent:
                scope["unmapped_spend"] += share
                continue
            if parent not in eligible_parents:
                scope["clearance_spend"] += share
                continue
            bucket = parent_totals[parent]
            bucket["total_spend"] += share
            if is_enterprise:
                bucket["enterprise_spend"] += share
            bucket["allocated_line_count"] += 1
            meta = parent_meta[parent]
            details.append({"source_row": int(source_index) + 2, "parent_asin": parent, "parent_name": meta["parent_name"], "positioning": "、".join(sorted(meta["positioning_values"])), "product_line": "、".join(sorted(meta["product_line_values"])), "advertising_group": group, "campaign_activity": campaign, "source_asin_list": value(row, acol["asin"]), "source_asin_count": len(tokens), "allocated_spend": share, "is_enterprise_campaign": "是" if is_enterprise else "否"})

    parent_rows = []
    for parent, amounts in parent_totals.items():
        meta, total = parent_meta[parent], amounts["total_spend"]
        parent_rows.append({"parent_asin": parent, "parent_name": meta["parent_name"], "positioning": "、".join(sorted(meta["positioning_values"])), "product_line": "、".join(sorted(meta["product_line_values"])), **amounts, "enterprise_share": amounts["enterprise_spend"] / total if total else 0.0})
    parent_rows.sort(key=lambda item: (-item["enterprise_share"], -item["enterprise_spend"], item["parent_asin"]))
    qualified_rows = [item for item in parent_rows if item["enterprise_share"] >= args.threshold]

    line_totals = {line: {"total_spend": 0.0, "enterprise_spend": 0.0, "parent_count_with_spend": 0, "allocated_line_count": 0} for line in args.product_lines}
    multiple_line_parents = []
    for item in parent_rows:
        lines = [line for line in item["product_line"].split("、") if line]
        if len(lines) != 1:
            multiple_line_parents.append({"parent_asin": item["parent_asin"], "product_lines": item["product_line"]})
            continue
        if lines[0] in line_totals:
            bucket = line_totals[lines[0]]
            bucket["total_spend"] += item["total_spend"]
            bucket["enterprise_spend"] += item["enterprise_spend"]
            bucket["parent_count_with_spend"] += 1
            bucket["allocated_line_count"] += item["allocated_line_count"]
    product_line_rows = [{"product_line": line, **values, "enterprise_share": values["enterprise_spend"] / values["total_spend"] if values["total_spend"] else 0.0} for line, values in line_totals.items()]

    allocated_spend = sum(item["total_spend"] for item in parent_rows)
    scope["analysis_scope_spend"] = scope["report_spend"] - scope["excluded_spend"]
    scope["parent_allocated_spend"] = allocated_spend
    scope["parent_enterprise_spend"] = sum(item["enterprise_spend"] for item in parent_rows)
    scope["reconciliation_gap"] = scope["analysis_scope_spend"] - allocated_spend - scope["clearance_spend"] - scope["blank_asin_spend"] - scope["unmapped_spend"]
    result = {"metadata": {"period": args.period, "threshold": args.threshold, "enterprise_rule": f"广告活动字段包含“{args.enterprise_keyword}”", "ad_group_exclusions": sorted(excluded_groups), "clearance_rule": sorted(clearance_labels), "allocation_rule": "单条广告记录按 ASIN 字段内可识别 ASIN 数量等额分摊", "currency": "广告报告花费字段币种"}, "totals": dict(scope), "qualified_rows": qualified_rows, "parent_rows": parent_rows, "product_line_rows": product_line_rows, "details": details, "excluded_details": excluded_details, "data_quality": {"product_rows": len(product), "ads_rows": len(ads), "eligible_parent_count": len(eligible_parents), "multiple_product_line_parents": multiple_line_parents}}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"qualified_parent_count": len(qualified_rows), "product_line_rows": product_line_rows, "reconciliation_gap": scope["reconciliation_gap"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
