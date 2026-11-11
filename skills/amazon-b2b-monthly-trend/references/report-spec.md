# Report specification

## Required output sections

Deliver a self-contained HTML report by default. It should contain:

1. An executive view with the analysis window, portfolio KPIs, and a concise conclusion on whether B2B importance is rising, declining, or stable.
2. Monthly portfolio trends for total orders, B2B orders and share, total units, B2B units and share, total sales, and B2B sales share.
3. Product TOP tables for core products, growth products, potential products, and risk products.
4. A data-quality table and clear scope caveats.
5. Product-line or packaging analysis when product name or label information makes it feasible.
6. An 8月 vs 7月 (or latest month vs preceding month) section when the selected window includes both months. Show absolute B2B-unit change, B2B MoM, total-unit MoM, and B2B-share change. Treat it as a freshness signal, not a replacement for the three-month comparison.
7. A full product score table with ASIN, product, product line, packaging, B2B units, B2B share, recent-window trend, score, classification, demand judgement, and recommended action.

## B2B share tiers

Show a product-level weighted B2B-unit-share tier table by default:

| Tier | Rule |
| --- | --- |
| High | B2B unit share ≥30% |
| Medium-high | 20%–30% |
| Medium | 10%–20% |
| Low | <10% |

For each tier, report product count, total units, B2B units, weighted B2B share, recent-three-month share, change versus the prior three months, average potential score, core/mature product count, and risk-product count.

Place a collapsible full product table directly below each tier. Include a local CSV download link for that tier, with headers suitable for bulk analysis: ASIN, product, product line, packaging, total units, B2B units, B2B share, recent B2B units, B2B growth, share change, score, classification, demand judgement, and action.

Exclude products with no computable total-unit denominator from the four tiers, disclose their count, and retain them in the all-product detail table.

## Presentation guidelines

- Make clear that all product ratios are volume-weighted.
- Present percentage-point changes separately from percent growth.
- Do not rank “growth” tables purely by percent growth when the base is tiny; use a minimum B2B-volume guard or prominently label the sample as small.
- Use Chinese management language by default when the user writes in Chinese.
- Keep source path, field mapping, selected date range, thresholds, and score method auditable in the report.
