# Keyword Analysis Framework

Use this reference only when a keyword export or competitor keyword data is present.

## Read the source correctly

Start with the source date range, marketplace, product scope, row count, unique keyword count, and the meaning of each metric. Do not treat a field named `traffic share` as search volume or sales share without validating its definition.

For each keyword, retain at least:

| Field | Use |
|---|---|
| Keyword | Exact query to classify and target |
| Relevance score / label | Eligibility filter, not proof of conversion |
| Search volume / ABA rank | Demand scale |
| Suggested CPC / range | Initial bid reference |
| Click conversion rate | Early CPC ceiling proxy until first-party CVR exists |
| Competition difficulty | Ranking friction, not a reason to ignore a high-value term |
| Competitor natural/SP/SB rank | Current page ownership and paid-space gap |
| Competitor traffic contribution | Helps identify each competitor's dependency; preserve its source definition |

## Classify into five working tiers

### A. Core rank terms

Use only terms that are highly relevant, materially demanded, and accurately represent the product. They deserve dedicated SP Exact campaigns and rank tracking. High search volume alone does not make a term core.

### B. Functional or efficiency terms

Use terms that describe the product's verified mechanism, configuration, or job and show stronger source CVR / lower CPC than core terms. These often create the first profitable order density. Do not use functionality that the product cannot truly fulfill.

### C. Scenario and long-tail terms

Use application, user, material, or task terms that the Listing can visibly support. They improve relevance and build lower-cost orders, but do not receive the same rank budget as A terms.

### D. Discovery terms

Use broad, phrase, auto, and ambiguous high-volume terms only in isolated, capped campaigns. Review the search-term report frequently. A generic query with high category CVR can still be poor for the product because it masks multiple product forms.

### E. Competitor-brand terms and ASIN targets

Use separate low-budget tests for competitor brand queries or product pages where allowed. Do not include competitor brands in the Listing or backend terms. Prefer direct ASIN targeting when the competitor product and user task are demonstrably comparable.

## Intent and compliance filters

Place a term on the negative/not-core list if it suggests a different product form, such as a hand tool, a crimper, an industrial machine, an included motor, automatic functionality, or an unrelated category. A query may be eligible for an isolated test if the product can meet the underlying job without misleading the buyer; the Listing must make the limitation unmistakable.

For foreign-language terms in the US marketplace, use a separate exact/phrase test only when the translated intent matches the product. Do not add a foreign-language query to back-end terms solely because a competitor ranks for it.

## Bid calibration

Calculate an initial ceiling:

```text
Maximum CPC = realized selling price × CVR × target ACOS
```

Use the export's click conversion rate only as a temporary proxy before first-party data exists. Compare the ceiling with suggested CPC, then choose one of three labels:

| Result | Action |
|---|---|
| Suggested CPC is below ceiling | Start close to suggested CPC; use placement adjustment only if rank objective warrants it |
| Suggested CPC is close to ceiling | Start below or near it and monitor actual CPC/CVR daily |
| Suggested CPC exceeds ceiling | Do not automatically exclude; use a small, time-boxed rank test only if the user authorizes its loss exposure |

For overlapping versions, one SKU should lead the shared term. The secondary SKU bid must stay below it unless a specific price/intention experiment is running.

## Competitor-gap reading

Use competitor rank patterns to find opportunity, not merely to copy their keyword list:

- Competitors natural high + no SP: paid search may have an inexpensive visibility gap.
- Competitors dominate a branded query: treat it as interception, not a rank target.
- Multiple competitors strong on a broad word but weak on a verified feature/scenario term: use the feature/scenario as the early conversion and rank path.
- A competitor's current top position does not prove that the word will convert for a new Listing. Validate with first-party CVR and return/QA signals.

## Post-launch reclassification

Every week, classify each paid search term as:

| Status | Evidence | Action |
|---|---|---|
| Scale | Relevant, converting at or better than target, natural rank improving | Increase bid or budget in controlled increments |
| Maintain | Some conversion but sample too small | Hold and collect more data |
| Reduce | Relevant but CVR/ACOS weak | Reduce bid or placement; fix Listing if intent is still valid |
| Negative | Product-form mismatch or sufficient no-order sample based on actual CVR | Add exact/phrase negative as appropriate |

Do not calculate a universal no-order-click cutoff. Use the SKU's current realized price, target ACOS, CPC, and observed CVR. Document the date range and sample size for every reclassification.
