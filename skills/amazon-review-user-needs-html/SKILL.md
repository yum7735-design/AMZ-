---
name: amazon-review-user-needs-html
description: Extract evidence-backed user needs from Amazon review JTBD and pain points, then deliver a Chinese interactive HTML report with prioritization and CSV export. Use for user-needs analysis; do not use for product specifications, solutions, or new-product recommendations.
---

# Amazon Review User Needs HTML

Answer only: what outcome, ability, or value do users need while completing their task? A need is not a material, construction, dimension, shrink ratio, feature list, SKU, or solution proposal.

Use this after scene, JTBD, and pain-point analysis where available. Reuse those results rather than reclassifying them. Do not extend the work into product capability, specification, product design, pricing, bundle, or launch recommendations.

## Inputs and scope

- Confirm marketplace, inclusion/exclusion rule, and original-review total before analysis. Preserve review ID, original title/body, and Chinese translation verbatim.
- Every original review must appear in detail output. If no explicit or evidence-backed inferred need exists, use `Not Mentioned` rather than inventing one.
- Retain `Main Scene → Sub Scene → Specific Application`, JTBD, pain point, pain evidence, severity, and confidence when supplied. Do not infer missing scene or JTBD solely to make cross-tabs larger.
- Use original-review count as the denominator. A review can mention multiple independent needs but counts once per need label in each summary.

## Need standard

Write needs as the result the user wants, not the mechanism:

- Pain: `Insufficient Shrink / 收缩不充分` → Need: `收缩后形成均匀、紧密且稳定的包覆`.
- Pain: `Water Ingress / 进水` → Need: `在连接部位形成可靠、防潮的密封`.
- Pain: `Tears or Cracks Easily / 易撕裂或开裂` → Need: `使用与收缩后保持材料完整，不易撕裂或开裂`.
- Pain: `Difficulty Fitting Over Connector / 难以套过连接器` → Need: `适配目标线缆与连接器的尺寸和形状`.

“需要胶层热缩管”“需要 4:1 收缩比”“需要 125°C 材料”是能力或方案，不是用户需求。 Read [references/need-taxonomy.md](references/need-taxonomy.md) before labeling.

## Evidence and inference rules

- `High`: reviewer directly states a desired result, need, wish, or expected outcome.
- `Medium`: a concrete pain point clearly supports a result-oriented need.
- `Pattern-based`: use only in summary findings when multiple independent reviews support the same inferred need; do not use it to make an unsupported per-review claim.
- `Low`: weak evidence; retain in detail but do not promote it to a core market need.
- `None`: no need evidence.

Do not infer a market need from one idiosyncratic request. Do not label a positive review as a need unless it directly states a user goal. Keep `No Pain Point`, `User Selection Issue`, `Not Product Related`, and listing-information mismatches visible in detail, but exclude them from product-use need ranking unless they also contain a separately evidenced in-use issue.

One review may generate multiple need rows only when distinct pain points or explicit goals require distinct desired outcomes.

## Need labels

Classify each need into a normalized category and type:

- Categories: `Protection`, `Sealing`, `Insulation`, `Repair`, `Durability`, `Temperature Resistance`, `Fit / Compatibility`, `Shrinking Performance`, `Adhesion`, `Installation / Usability`, `Size / Length`, `Organization / Storage`.
- Types: `Functional`, `Performance`, `Usability`, `Reliability`, `Compatibility`, `Durability`, `Other`.

Use the unified Chinese wording in the taxonomy. Merge synonymous results instead of creating a new need label for each review phrasing.

## Required detail output

For every detail row provide:

`Review ID`, scene fields, `JTBD`, `Pain Point`, `User Need`, `Need Category`, `Need Type`, `Evidence`, `Evidence Level`, `Confidence`, original review, and Chinese review.

## Required standalone Chinese HTML

Create an offline HTML report with safely embedded data and a UTF-8 BOM export of currently filtered rows. Guard CSV values against spreadsheet-formula interpretation.

Include:

- Top 20 user needs with review count, rate, category, type, and summary evidence level.
- Need-category distribution.
- JTBD → Pain Point → Need chain, plus Scene → Need and JTBD → Need views.
- Common needs across at least two explicitly identified main scenes, and scene-specific needs limited to one. State the evidence count; do not call a one-review observation a proven market segment.
- A transparent priority proxy: `frequency score × pain-severity score × evidence-strength score × scene-coverage proxy`. Define all score thresholds in the report and state that this is not commercial-market sizing.
- Potential requirement trade-offs only when reviews directly compare competing outcomes. If not directly evidenced, explicitly say no confirmed trade-off was found rather than fabricating one.
- Representative evidence for each frequent need.
- Filters for keyword, main scene, sub scene, JTBD, need category, need, and evidence level. Search English review, Chinese review, need/pain evidence, and identifiers.

## Quality check

Sample at least 20 labelled reviews across need categories and evidence levels. Confirm the phrasing describes a user result; evidence supports the inference; no design solution appears in the need label; synonyms are merged; no positive or generic review has been force-labelled; and scene-specific/common conclusions state their actual evidence base.

In the final response, state scope, report path, count of reviews with evidenced needs, and that the deliverable is need-only rather than a solution recommendation.
