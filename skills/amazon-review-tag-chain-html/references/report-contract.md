# Five-layer review tag-chain reporting contract

## Data model

Use a normalized row model. A review can have more than one row only when it has independently evidenced uses or tags. Keep a stable review ID in every row.

| Field group | Required fields |
|---|---|
| Source | Review ID, ASIN, product name, brand, rating, date, original title, original body, available Chinese review |
| Scene | Main Scene, Sub Scene, Specific Application, Scene Evidence, Scene Confidence |
| JTBD | JTBD, JTBD Type, JTBD Evidence, JTBD Confidence |
| Pain | Pain Point, Pain Category, Evidence, Evidence Type, Workaround, Severity, Confidence, Exception |
| Need | User Need, Need Category, Need Type, Evidence, Evidence Level, Confidence |
| Capability | Product Capability, Capability Category, Evidence, Evidence Level, Confidence |

One review can have multiple chains only for independent evidence. Never manufacture a missing intermediate layer to complete a visual chain. If a shared detail table uses a single evidence field, retain field-specific evidence labels or evidence-source columns so provenance remains auditable.

## Counting rules

Let `N` equal all original reviews after the explicitly agreed product/table filter. For every label `L`:

`mention rate(L) = distinct review IDs with L ÷ N × 100%`

Count a review once per label, even when duplicate detail rows occur because of other independently tagged dimensions. A review with two main scenes counts in both main-scene rates, so summed scene rates may exceed 100%.

For `Sub Scene` ranking, show both:

- count/rate against `N`, enabling comparison across the complete review set;
- optional share within its parent Main Scene, using distinct review IDs in that parent as the denominator.

For the scene × five-layer matrix, each layer count is `distinct review IDs in that Main Scene + Sub Scene whose chain contains an evidenced non-Not Mentioned label`. It must not be a count of duplicate rows.

Pain rankings use only product-use pains. Report the following separately in detail and exception summaries: `No Pain Point`, `User Selection Issue`, `Product Information Mismatch`, `Not Product Related`.

## Interpretation guardrails

- All coverage measures are mentions in the selected review dataset, not prevalence in the total customer population or market size.
- A low count is an observed signal, not proof that a scenario, need, or capability is unimportant.
- Do not convert a need into a solution or claim a capability gap unless the linked review actually records a failure, expectation, or workaround.
- Report a cross-scene need/capability as common only when it has explicit evidence in at least two named main scenes; otherwise call it scene-specific or sparse evidence.
- State direct trade-offs only if a review explicitly compares competing outcomes. Otherwise report no confirmed trade-off.

## Suggested HTML structure

1. Title, scope, methodology, and KPI coverage cards.
2. Main scene and sub-scene hierarchy with the five-layer coverage matrix.
3. Layer rankings and review-level tag-combination distribution.
4. Chain cross-tabs and representative evidence.
5. Searchable, filterable full-detail data and current-filter CSV export.

Use labels in clear Chinese. Retain original-review wording and optionally display any source-provided Chinese translation side by side.
