---
name: feishu-google-sheets-review-translation
description: Bulk-translate Feishu Bitable review comments through Google Sheets GOOGLETRANSLATE and safely write Simplified Chinese back by native Record ID. Use when Google Sheets is the authorized translation route; not for ordinary document translation.
metadata:
  short-description: Google Sheets bulk translation for Feishu reviews
---

# Feishu Review Translation via Google Sheets

Use Google Sheets only when the user has explicitly authorized sending the specified table's review text to Google for Chinese translation. The authority applies only to translation and writing the Chinese result back into that same Feishu table. Do not infer it for other tables, fields, destinations, or uses.

## Resolve the table

- Confirm the Base token, table ID, source review fields, and Chinese target field before any upload or write. Typical source fields are `评论标题` and `评论正文`; typical target field is `中文评论`.
- Paginate the full table to report total records, source-nonempty records, target-filled records, translation candidates, and skips.
- A candidate has source text and an empty target. Combine title and body with clear labels so the output remains interpretable.
- Translate Spanish and other non-Chinese languages with source language `auto`. Do not restrict the run to English.
- Skip reviews that are already Chinese or contain only numbers, punctuation, emoji, identifiers, or model/SKU-like text. Do not create status fields; retain skipped Record IDs for the final report.

## Preserve the ID mapping

Every staged row must contain the exact Feishu native `record_id`, never a spreadsheet row number or a visible table sequence:

| Column | Contents |
| --- | --- |
| A | `record_id` |
| B | Combined source review text |
| C | Simplified-Chinese translation |

Keep a one-to-one mapping `record_id → source text → translation` throughout. Do not update any source fields.

## Google Sheets translation workflow

1. Create a new, clearly named Google Sheet or a new sheet tab. Do not overwrite a prior translation sheet.
2. Import or paste the staged A/B data, with an explicit header row.
3. In `C2`, enter:

   `=IFERROR(GOOGLETRANSLATE(B2,"auto","zh-CN"),"")`

4. Fill the formula through the final staged row.
5. Wait until every candidate has a nonempty output. Do not treat blanks, `正在加载`, or formula/error values as translations.
6. Export the sheet as `.xlsx` and read the cached values from columns A/C. Prefer this over CSV when formula-output columns may be omitted or stale.
7. Require that every expected Record ID occurs exactly once and has a nonempty, non-error translation before beginning Feishu writes.

Do not delete the Google Sheet, Google Drive upload, or local staging/export artifacts unless the user asks.

## Write and verify Feishu

- Build updates as `{record_id, fields: {"中文评论": translation}}`.
- Start with a five-record pilot (or fewer if fewer candidates). Re-read those exact records and compare the stored target text to the intended mapping.
- After a successful pilot, update no more than 50 records in one request. Re-query and match the records after each batch; on an error, re-read first and retry only target fields that remain empty.
- Do not overwrite an already nonempty target on a resumed run unless the user explicitly requests retranslating it.
- After all batches, paginate the entire table and compare every translated `record_id` and Chinese target value exactly against the staged mapping.

## Close out

Report: total records, source-nonempty count, pre-existing target count, translated candidates, successful verified writes, skipped count and IDs with reasons, failures with IDs/reasons, and remaining empty targets.

If the user cannot see results, first verify they opened the exact Base/table/view URL. Then direct them to reveal or horizontally scroll to the `中文评论` field; a view may hide a populated field.
