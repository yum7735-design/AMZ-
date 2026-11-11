# Feishu review Bitable

Use a provided Feishu Bitable only as a read-only evidence source unless the user explicitly asks for a write.

## Safe retrieval path

1. Parse the base URL for the app token and table ID.
2. Call manage_bitable_field with action list before reading records. Identify the exact ASIN, review text, rating, date, verified-purchase, Vine, helpful, media, and optional analyst-tag fields.
3. Call manage_bitable_record with action search and an exact ASIN filter. Do not fetch every record merely to filter locally when the API supports a server-side filter.
4. Follow pagination until hasMore is false. Record the returned total and treat it as the review population only when the exact filter was applied.

## Field normalization

Feishu Text fields may be returned as arrays of text objects. Normalize them to strings before counting. Treat missing fields as missing rather than as negative or zero.

Common useful columns include:

| Meaning | Typical field name |
| --- | --- |
| Exact product | ASIN |
| Text evidence | 评论正文 |
| Rating | 星级数值 or 星级 |
| Customer title | 评论标题 |
| Review date | 评论日期 |
| Verified status | 是否认证购买 |
| Vine status | Vine评论 |
| Helpful votes | Helpful数 |
| Media flag | 含图片 |
| Existing tags | 情感, 问题大类, 关键主题 |

## Analysis rules

- Deduplicate using Amazon review ID when it is available. If duplicates are found, state the deduplication rule and resulting n.
- Report both star distribution and source tag distribution, since they can disagree.
- Use tags to organize review reading, but derive final pain-point claims from original review text.
- Count keyword mentions only as text occurrences, never as unique-user counts, unless each review is counted once per theme under a documented tagging rule.
- Use record ID and a short quote to make high-stakes conclusions auditable.
- Do not expose reviewer names unnecessarily in the final report.
