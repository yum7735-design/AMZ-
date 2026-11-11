---
name: amazon-review-product-capability-html
description: Map evidence-backed Amazon review user needs to product capabilities and deliver a Chinese interactive HTML report with capability priorities and CSV export. Use for capability analysis after needs/pain points; do not use for materials, specifications, product designs, or new-product proposals.
---

# Amazon Review Product Capability HTML

Answer only: what must the product be able to do to satisfy the evidenced user need? Product capability is not a material, construction, exact parameter, SKU, or product proposal.

Use this after scene, JTBD, pain-point, and user-needs analysis where those artifacts are available. Reuse those validated fields; do not recreate previous stages unless they are missing. Do not extend the work into material selection, temperature/voltage/shrink-ratio targets, structure, configuration, pricing, or product-development recommendations.

## Scope and evidence chain

Maintain an auditable chain for every capability:

`Scene → JTBD → Pain Point → User Need → Product Capability`.

- Retain review ID, original review title/body, Chinese translation, and prior-stage fields verbatim.
- Every source review must appear in detail output. Use `Not Mentioned` when no evidenced user need maps to an ability.
- A capability must be supported by the linked user need and its source pain/review. Do not add theory-based category capabilities (for example UV, oil, corrosion, vibration, high temperature) just because they could matter for the product category.
- A user need may map to multiple independently justified capabilities. Split them into separate rows, keeping the same review ID and chain fields.
- Count each review once per capability label in summaries, using original-review count as the denominator.

## Capability standard

Write abilities that could later be verified, without naming the implementation.

- Need: `收缩后形成均匀、紧密且稳定的包覆` → `Tight Shrink Fit / 紧密收缩贴合` and `Uniform Shrinking / 均匀收缩`.
- Need: `在连接部位形成可靠、防潮的密封` → `Reliable Moisture / Water Sealing / 可靠防潮密封` and, where durability is evidenced, `Long-term Seal Integrity / 长期密封完整性`.
- Need: `适配目标线缆与连接器的尺寸和形状` → `Connector Clearance & Size Compatibility / 连接器通行与尺寸适配`.
- Need: `受热环境下保持材料完整和保护表现` → `High-temperature Stability / 高温稳定性`.

Do not write “dual-wall adhesive construction,” “silicone,” “4:1,” or “150°C” unless the user explicitly authorizes technical solutions and source data supports them. Read [references/capability-taxonomy.md](references/capability-taxonomy.md) before classification.

## Evidence levels

- `Level A`: directly maps a reviewer-stated need or desired outcome to a capability.
- `Level B`: inferred from a concrete, explicit pain point and a valid user need.
- `Level C / Pattern-based`: summary-level label only, used when multiple independent review rows support the same capability.
- `None`: no capability evidence.

Never use Level C to turn a single weak comment into a capability. Do not treat generic praise, a high/low star rating, or marketing copy as evidence.

## Required categories

Use normalized labels and categories from the taxonomy. Preferred categories are:

`Shrinking`, `Sealing`, `Adhesion`, `Insulation`, `Mechanical Protection`, `Temperature Resistance`, `Environmental Resistance`, `Durability`, `Fit & Compatibility`, `Installation`, `Material Handling`, `Size & Length`, `Identification & Organization`, `Product Consistency`, `Other`.

## Required detail and Chinese HTML

Each detail row must include:

`Review ID`, scene fields, `JTBD`, `Pain Point`, `User Need`, `Product Capability`, `Capability Category`, `Evidence`, `Evidence Level`, `Confidence`, original review, and Chinese review.

Generate a self-contained Chinese HTML report with safely escaped embedded data and UTF-8 BOM CSV export of filtered rows. Protect CSV fields from spreadsheet-formula interpretation.

Include:

- Top 20 capabilities and category distribution.
- Scene × Capability, JTBD × Capability, and the full five-layer evidence chain.
- Common core capabilities across multiple explicitly identified main scenes, plus scene-specific capabilities. Display actual scene-evidence counts and do not overstate sparse observations.
- Capability combinations only when two or more independently mapped capabilities occur in the same review chain.
- Capability gaps only when a workaround is directly relevant to that capability. Do not attach a workaround from the same sentence to an unrelated pain point.
- Capability trade-offs only when reviews directly compare competing abilities; otherwise explicitly state that no confirmed trade-off exists.
- Priority proxy: `frequency score × pain-severity score × evidence-strength score × scene-coverage score`. Define thresholds in the report and state it is a within-dataset ranking, not market sizing or a product decision.
- Representative VOC evidence, keyword/scene/JTBD/category/capability/evidence-level filters, and CSV download.

## Quality check

Sample at least 20 labelled capability rows across categories and evidence levels. Check that each ability remains at the capability layer; no material, structure, exact parameter, or solution slipped in; multi-capability mappings are independently justified; workarounds align to their gap; synonyms are unified; and low scene evidence is not promoted to a strong cross-scenario conclusion.

In the final response, state scope, report path, the number of reviews with capability evidence, and the capability-only boundary.
