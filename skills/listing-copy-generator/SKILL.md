---
name: listing-copy-generator
description: Generate Amazon listing copy from structured product data, VOC/user-needs maps, keyword-demand matrices, and marketplace rule sets. Use when Codex needs to create or refresh titles, item highlights, bullet points, backend search terms, or delivery workbooks for Amazon listings, especially when the inputs include `.xlsx` product catalogs plus `.html` needs maps or keyword matrices.
---

# Listing Copy Generator

Create VOC-driven Amazon listing copy from structured inputs and export the result as CSV, Markdown, or `.xlsx`.

## Workflow

1. Inspect the input files before writing copy.
   Read [references/input-contract.md](references/input-contract.md) when column names or HTML tables are unfamiliar.

2. Map the listing scope.
   Determine the target parent ASIN or variant subset, brand-name rule, marketplace, and the required count of item highlights.

3. Generate the copy.
   Use `scripts/generate_listing_copy.py` for repeatable batch output.
   Prefer `--item-highlight-count 1` unless the user explicitly asks for more.
   Pass an explicit `--brand-name` when the title must lead with the brand.

4. Export the delivery format.
   Leave the CSV/Markdown outputs in place when the user only needs raw copy tables.
   Use `scripts/build_listing_copy_workbook.mjs` when the user wants a shareable `.xlsx`.

5. Run QA before delivery.
   Read [references/qa-checklist.md](references/qa-checklist.md) and confirm title length, highlight length, duplication, keyword placement, and rule compliance.

## Commands

Generate the listing-copy tables:

```powershell
python scripts/generate_listing_copy.py `
  --product "C:\path\product.xlsx" `
  --needs-map "C:\path\needs-map.html" `
  --demand-matrix "C:\path\demand-matrix.html" `
  --outdir "C:\path\outputs\listing-copy" `
  --brand-name "haisstronica" `
  --item-highlight-count 1
```

Build an `.xlsx` delivery workbook from the generated CSV files:

```powershell
$env:LISTING_COPY_XLSX_NAME = "listing_copy_delivery.xlsx"
node scripts/build_listing_copy_workbook.mjs
```

## Notes

- Follow user-provided marketplace rules over the defaults in this skill.
- Treat current listing titles as hints, not ground truth.
- Keep titles and highlights concise; use bullets and backend terms for the rest.
- When the inputs do not match the expected schema, update the column-alias mapping or generate the copy manually instead of forcing the script.
