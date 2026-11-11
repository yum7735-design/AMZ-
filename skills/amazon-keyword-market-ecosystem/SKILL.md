---
name: amazon-keyword-market-ecosystem
description: Build an evidence-led Amazon keyword market-ecosystem analysis from keyword-level ASIN, sales, listing, traffic, and VOC data. Use for category entry, competitor landscape, whitespace, product-line, and launch-strategy decisions; do not use for listing-only keyword-to-demand mapping.
---

# Amazon Keyword Market Ecosystem

## Outcome

Turn a keyword's retrieved ASIN set into an auditable market-entry decision: define the real market, map its competitive and commercial structure, identify defensible gaps, and distinguish validated findings from hypotheses that need testing.

Use this skill for a keyword or tightly defined product segment, not a whole category assembled from unrelated search terms. Keep the target marketplace and data window explicit throughout.

## Workflow

1. Define scope before calculation: marketplace, focal keyword or segment, product boundary, dataset coverage, and date range. State whether the work concerns the whole category or only the keyword-retrieved submarket.
2. Audit and clean the ASIN universe. Remove adjacent products, materially different materials or forms, duplicate/parent-child double counts, and zero-activity records when they distort the decision. Record each exclusion rule and count; never silently alter the denominator.
3. Build the market map from the cleaned dataset. Analyze brand concentration, ASIN/product form, price bands, technical attributes, seller geography, sales/revenue mix, time trend, and successful recent entrants.
4. Inspect representative competitors in each important winning model. Compare their product architecture, variant coverage, certification or feature proof, reviews, listing expression, traffic sources, and promotion use. Do not infer the entire market from a few listings.
5. Identify gaps as intersections of demand, competition, price/value, and product-line extendability. A missing attribute alone is not an opportunity. Rank candidates only after checking demand evidence, competitor intensity, willingness to pay, execution constraints, and follow-on SKU potential.
6. Convert the analysis into an entry strategy: avoid zones, positioning, first-SKU choices, pricing logic, a staged product-line path, key risks, and validation experiments.
7. Label every material claim as `实证` (directly supported), `推断` (reasoned but not proven), or `假设/待验证` (decision-relevant but unsupported). Include an evidence-boundary section rather than presenting uncertainty as a conclusion.

## Inputs and Data Integrity

- Prefer ASIN-level data covering price, sales or revenue, brand, title, rating/reviews, listing date, and a consistent time range. Add monthly data when making trend or seasonality claims.
- Parse product attributes from structured fields when available; use titles only as a fallback and mark unparseable values as unknown rather than forcing a classification.
- Treat revenue as distinct from sales volume. When aggregating, use weighted averages where relevant and state whether the price is current, average, or implied revenue per unit.
- Traffic, advertising, coupon, and review evidence from selected ASINs are representative samples unless coverage is broad enough to claim market-wide patterns.
- Do not derive margin, feasibility, compliance status, keyword ranking difficulty, or advertising ROI without the corresponding cost, certification, search, or spend data.

## Deliverable

Before drafting, read [references/analysis-framework.md](references/analysis-framework.md) and [references/output-structure.md](references/output-structure.md).

Default to a Chinese decision report when the user writes in Chinese. Use tables for comparisons and ensure every recommendation names its evidence, caveat, and next validation action. HTML is appropriate when the user requests a presentation-ready report; preserve the same evidence labels and analysis logic.

## Boundaries

- Do not turn a keyword's results into a claim about the total category without validating representativeness.
- Do not recommend copying a top listing merely because it sells well; identify the winning mechanism and whether a new entrant can credibly reproduce or bypass it.
- Do not treat an empty cell or absent listing attribute as proof of zero demand.
- Keep product, marketing, and operations recommendations separate when they rely on different evidence.
