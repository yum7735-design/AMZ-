## Feishu backfill workflow

The skill supports two Feishu backfill modes.

1. Table-driven mode
   Run `node cli.mjs feishu` when the table already contains ASIN values.
   The skill updates rows that have an `ASIN` but are still missing the backfill date and questions.

2. Sequential blank-row mode
   Run `node cli.mjs feishu B0XXXX B0YYYY` when the table has pre-created blank rows.
   The skill fills the visible blank rows in order before creating any new row.

Behavior notes:

- If an ASIN already exists in the target table or view, that row is updated in place.
- If an ASIN does not exist yet, the skill fills the next blank row in sequence.
- Only when no blank row is available will the skill create a new record at the end.
- The backfill fields default to `ASIN`, `问题1` to `问题N`, and `回填日期`.
- You can still override the Feishu app, base, table, view, and field names with CLI flags or environment variables.

Current defaults:

- App ID: `<FEISHU_APP_ID>`
- Base: `<FEISHU_BASE_TOKEN>`
- Table: `<FEISHU_TABLE_ID>`
- View: `vewbtIgju6`

Useful examples:

```bash
node cli.mjs feishu --dry-run
node cli.mjs feishu B0C81FHPHN
node cli.mjs feishu B0C81FHPHN B0ABCDEF12
```
