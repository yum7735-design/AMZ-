---
name: feishu-bitable-review-translation
description: Translate reviews in a Feishu Bitable into natural Simplified Chinese and safely write them back by native Record ID. Use for Amazon review/comment translation; not for general document translation.
metadata:
  short-description: Safely translate Feishu Bitable reviews
---

# Feishu Bitable Review Translation

Translate an English review field to Simplified Chinese in the same Feishu Bitable record. Preserve the original field and maintain an exact `Record ID → translation` mapping throughout.

## Locate the target safely

- Start by inspecting accessible Bitable metadata, tables, and fields. If the user supplied a Base and Table token, use them. If more than one table is plausible, list Base name, table name, and relevant fields and ask the user to choose.
- Identify an English source field and Chinese destination field from names such as `英文评论` / `English Review` / `评论正文` and `中文评论` / `Chinese Review` / `翻译评论`. Detect a translation-status field when it already exists, but never create or change fields.
- Before writing, report Base, Table, the resolved source/destination/status fields, total records, source-nonempty count, destination-empty count, and expected candidates. Obtain counts through pagination; never load the entire table in one request.

## Select and translate

- Default candidates are source nonempty and destination empty. If a status field exists, also require its value to be `待翻译` (or the user-specified pending value).
- Skip source text that is already Chinese, clearly another language when the task is English-only, or contains only identifiers, model/SKU/ASIN-like text, numbers, or symbols. If a writable status field exists, set skipped records to `跳过`; otherwise track their Record IDs in the result so they are not repeatedly considered within the run.
- Produce natural Simplified Chinese faithful to the review’s wording, sentiment, scenarios, claims, and caveats. Do not add commentary labels or unsupported product information.
- Preserve technical strings and values such as ASIN, SKU, brand names, AWG, SAE, UL, IP67, ratios, voltage, dimensions, and product codes. Retain the reviewer’s casual tone.

## Write and verify in batches

- Read and process no more than 50 records per batch unless the user explicitly requests another safe size. For every candidate, build the mapping `{record_id, source_text, translation}` before updating.
- Use the Bitable API’s native `record_id` for every update. Never use row number, sort position, spreadsheet row, or review sequence as the key.
- Update only the destination field, plus an existing status field where authorized: `已完成` after successful translation, `失败` on a write/translation failure, or `跳过` when skipped.
- Begin a new job with a five-record pilot (or fewer if fewer candidates exist), update it, and re-read those same record IDs before continuing. If the user asked for automatic execution, continue after the pilot succeeds.
- After every batch, re-read the updated records (or re-query and match their Record IDs) to confirm the destination is nonempty and corresponds to the intended mapping. On an API error, re-read first, then retry only Record IDs whose destination remains empty.
- Treat nonempty destination text as complete on reruns. This makes the workflow resumable without needing a checkpoint file.

## Close out

Report total, source-nonempty, candidates, successful writes, skips, failures, success rate, and failed Record IDs with reasons. If stopping before completion, report completed, remaining, failures, and that rerunning will safely continue from destination-empty records.
