---
name: amazon-review-scene-html
description: Analyze Amazon review usage scenes and JTBD with evidence-backed multi-label classification, then deliver an interactive Chinese HTML report with filtering and CSV export. Use for requests to identify where a product is used and what users are trying to accomplish; not for pain-point or product-development analysis.
---

# Amazon Review Scene HTML

Create an auditable scene-classification or JTBD deliverable from Amazon review data. It answers only where the product is used, the device/object involved, and the exact component, connection, or task.

Use this for Amazon review scene segmentation, JTBD extraction, and interactive HTML exports. Do not use it for sentiment, pain points, purchase reasons, product improvements, or product-development recommendations unless those are separately requested.

## Evidence and scope

- Confirm marketplace, product filters, and total review count before classifying. Do not carry temporary UI filters such as a selected brand into the analysis unless explicitly requested.
- Preserve original review title and body verbatim. If the source has a Chinese-review field, show it alongside the original; never replace source text or fabricate a translation.
- Classify only from explicit review evidence. Do not infer a scene from product marketing terms such as `waterproof`, `marine grade`, or `automotive`, nor generic `wire`, `cable`, or `connector`.
- Use `Main Scene → Sub Scene → Specific Application`. Accept the user's taxonomy when provided. Otherwise use a concise device-led taxonomy, always including `Other` and `Not Mentioned`.
- Normalize unambiguous synonyms; do not create labels by brand, model year, size, or wording variation.
- A review may create multiple rows only when it explicitly names multiple independent uses. Keep its review ID on each row.
- Every input review must be represented. No-evidence reviews become `Not Mentioned → Not Mentioned → Not Mentioned`.
- Include the shortest supporting `Scene Evidence` phrase for every non-unmentioned row.

Use confidence consistently:

- **High:** explicit device, vehicle, vessel, machinery, or concrete object.
- **Medium:** explicit application domain but incomplete device.
- **Low:** weak yet non-speculative scene cue; never force a category.
- **None:** no scene information.

For heat-shrink tubing, read [references/heat-shrink-taxonomy.md](references/heat-shrink-taxonomy.md) before classification.

## JTBD mode

Use this mode only when the user asks what they are trying to accomplish. Read [references/jtbd-task-taxonomy.md](references/jtbd-task-taxonomy.md) before extracting tasks.

- Reuse the validated Scene → Sub Scene → Specific Application mapping if it exists, but do not force a task onto a scene when the task evidence names a different object.
- Express every job as a user task: `object + action + intended result`. Do not report product abilities such as waterproofing, insulation, adhesive, durability, shrink ratio, or corrosion resistance as the JTBD itself.
- A task must be supported by an explicit user action, use, need, or stated target. Product-description language alone is insufficient.
- Permit multiple jobs per review only when independently expressed. Use `Not Mentioned` when no actual task is explicit.
- Provide a job statement, normalized task type, exact evidence, and confidence for every job row. Calculate type frequency using distinct review IDs.
- Add overall JTBD distribution, Main Scene × JTBD, Sub Scene × JTBD, Scene + JTBD combinations, Not Mentioned, and representative evidence to the HTML. Include JTBD type filters and columns in detail CSV exports.
- Inspect at least 20 sampled non-unmentioned rows before delivery. Correct false positives where an ability or test result was labelled as a user task.

## Counts

Use the original-review count as the denominator:

`Mention Rate = distinct reviews mentioning the main scene ÷ total original reviews × 100%`

A multi-scene review counts once in every applicable main-scene numerator, so combined rates can exceed 100%. Calculate sub-scene share using distinct reviews within its main scene. Report `Not Mentioned` count and rate separately.

## Standalone HTML deliverable

When HTML is requested, create an offline, self-contained Chinese HTML report in the current workspace or the user's requested location. Embed all detail data safely so the page opens without a server.

Include:

- Scope, original-review count, classification-row count, and Not Mentioned count/rate.
- Main-scene ranking, sub-scene ranking within main scenes, and specific-application ranking.
- Detail table: review ID, available source metadata, original title/body, Chinese review (if available), hierarchy, evidence, and confidence.
- Keyword search across original and Chinese review text, evidence, review ID, ASIN, brand, and product name.
- Main-scene, sub-scene, application, and confidence filters. Dependent filter options must respect parent selections.
- Reset action and an in-browser export of only currently filtered rows to UTF-8-BOM CSV.
- CSV formula protection and safe JSON escaping, so review text cannot execute formulas or terminate an embedded script block.

If a spreadsheet is also requested, export the same detail rows and fields, one row per classified scene, with worksheet filters.

## Validation

Before delivery, verify:

- All input review IDs appear in detail output; row count may exceed review count because of explicit multi-scene uses.
- Summary numbers are based on distinct review IDs, not duplicate classification rows.
- Embedded data count matches displayed totals.
- Browser script parses; all filters, reset, and CSV controls exist; CSV fields follow the detail table.
- Missing Chinese source text is clearly marked, not generated.

Deliver the file path and scope only; do not add non-scene VOC conclusions.
