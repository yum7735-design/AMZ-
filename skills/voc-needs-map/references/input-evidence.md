# Input Evidence Rules

Use this file when the user supplies a mix of product files, VOC summaries, raw reviews, or partially structured evidence.

## Accepted Inputs

- Product workbooks: ASIN tables, spec matrices, variation sheets, listing exports
- Category VOC: HTML, Markdown, XLSX, CSV, PDF, or raw review exports
- Product VOC: ASIN-specific review exports, merged child-review files, HTML/PDF analyses
- Adjacent context: keyword assets, search-term analysis, competitor notes, listing screenshots

## Evidence Priority

Use the strongest source available for each claim:

1. Raw review text with ratings, dates, and variation identifiers
2. Structured worksheets or analysis files with auditable counts
3. Pre-made HTML/Markdown reports
4. Product sheet and listing facts
5. Inference built from the layers above

Do not let a polished HTML report override stronger raw evidence if both are available.

## Scope Normalization

Before writing the report, explicitly state:

- target parent ASIN, product family, or variant set
- product market or locale when known
- whether product VOC is one ASIN, multiple ASINs, or merged children
- whether category VOC is the same subcategory or a nearby proxy

If any of these are unclear, make the narrowest safe assumption and say so.

## Workbook Handling

- Read sheet names first.
- Identify the sheet that contains the actual product matrix rather than performance or keyword tables.
- Map ambiguous headers explicitly.
- If a workbook has multiple product families, filter before drawing VOC conclusions.

## Evidence Checks

Check for these failure modes:

- product sheet and title describe different pack forms
- category VOC refers to a nearby but not identical product type
- product VOC is dominated by one child variation while the requested scope is the full family
- counts are cited in the report but the source is actually anecdotal
- review pain points are really setup misuse or expectation mismatch

## Claim Discipline

- Use direct observations for counts, ratings, percentages, and explicit review themes.
- Mark anything else as inference, implication, or recommended interpretation.
- If a claim needs stronger proof, write it as a hypothesis for validation instead of a fact.
