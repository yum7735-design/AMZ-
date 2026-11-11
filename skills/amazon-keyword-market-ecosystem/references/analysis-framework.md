# Analysis Framework

## 1. Scope card

Place this at the start of the analysis:

| Field | Required disclosure |
|---|---|
| Market | Marketplace and category/node, if known |
| Retrieval lens | Keyword, product segment, or ASIN cohort |
| Time window | Exact period and whether it is trailing 12 months, calendar months, etc. |
| Unit of analysis | ASIN, parent, variation, brand, or seller |
| Dataset coverage | Raw count, cleaned count, missing fields, and data sources |
| Decision | Entry, expansion, positioning, launch, or portfolio decision |

## 2. Cleaning audit

Create a removal table with rule, examples, count, and decision impact. Typical rules include irrelevant adjacent products, different material/form factor, duplicate variants, non-comparable bundles, and no-activity records. Do not delete broad subsegments merely because they are inconvenient; state if the report is intentionally narrow.

Preserve both raw and cleaned totals. Calculate all reported shares from one stated denominator.

## 3. Market structure metrics

Use only metrics the dataset supports:

- Brand share: ASIN count, unit share, revenue share, weighted average price, rating/review context, product-form and attribute coverage.
- Concentration: `CR3` / `CR5` by units and revenue. Do not call a market concentrated based on one measure alone.
- Price architecture: use mutually exclusive bands selected from observed price distribution and business decision needs. Show ASINs, units, revenue, shares, and brand count for each.
- Product architecture: compare form factor, material, key technical specification, capacity/size, bundle composition, and price. Use a matrix to reveal crowded and sparse intersections.
- Trend: aggregate comparable monthly sales/revenue and identify peaks, troughs, and outliers. Treat a one-year pattern as indicative, not a causal explanation.
- Entrants: define “new” with a transparent cutoff, then compare their sales, price, features, and evidence of traction against established peers.

Check every percentage against totals. Mark current-price / historical-sales comparisons as non-comparable where relevant.

## 4. Competitor ecosystem analysis

Select competitors to represent distinct winning models rather than simply the highest sales rank. Useful models include low-price volume, review-led trust, technical differentiation, premium/professional, capacity/value, bundle solution, product-line ecosystem, or distribution/channel control.

For each competitor, document:

- core offer and target customer/use case, where evidence exists
- SKU, parent/variant, feature, size, and price ladder coverage
- adjacent products, tools, accessories, or bundles that create a system advantage
- visible conversion levers: reviews, certificates, A+ content, video, badges, packaging, or service
- traffic and promotion patterns, clearly marked as sampled if only a few ASINs were inspected

Separate a competitor’s observed facts from the inferred “why it wins.”

## 5. Opportunity scoring

For each candidate gap, record:

| Dimension | Question |
|---|---|
| Demand validation | Is there sales, search, VOC, or comparable-product evidence? |
| Competition | How many credible direct offerings, and how strong are their review/variant/brand moats? |
| Value capture | Is there a realistic price or revenue-quality advantage, not just an empty attribute? |
| Differentiation | Is the advantage visible and meaningful to a buyer? |
| Extendability | Can it anchor adjacent SKUs, bundles, or a coherent product line? |
| Execution | What product, certification, supply-chain, channel, and launch constraints apply? |

Use `P1/P2/P3` only after explaining the evidence and trade-offs. Use “watchlist” for a speculative empty space with no demand validation.

## 6. Evidence taxonomy

- `实证`: Directly calculated from the supplied dataset or observed in a cited listing/source.
- `推断`: A conclusion drawn from multiple facts; name the facts and alternative explanations where material.
- `假设/待验证`: A decision-relevant proposition without enough direct evidence. Pair it with a low-risk validation method, cost/range if known, and time horizon.

Never upgrade a finding solely because it is plausible or common industry knowledge.
