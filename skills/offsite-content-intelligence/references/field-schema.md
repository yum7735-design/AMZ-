# Video database field schema

Use this schema for a public-video evidence database. Keep the original field names when the user explicitly supplies a schema; add the final two fields if provenance would otherwise be lost.

| Field | Entry rule |
| --- | --- |
| Platform | Exact platform name. |
| Video Title | Publicly displayed title, not rewritten. |
| URL | Canonical public URL. Remove search/referral parameters where practical. |
| Creator | Displayed channel/account name. |
| Brand / Model | Only when explicitly identified by page/video evidence; otherwise `Not stated`. |
| Publish Date | Exact public date if available; otherwise preserve a displayed relative date with `(displayed)`. |
| Views / Likes / Comments | Public display value at collection time. Use `—` when unavailable. |
| Duration | Public duration. |
| Video Type | Review, Demo, Tutorial, Comparison, Unboxing, DIY build, etc. Mark as `AI interpretation` if not literal. |
| Drive Type | Manual, Hand crank, Drill, Motor, Automatic, or `Not stated`. Do not infer solely from a brand. |
| Material / Wire Type / Size | Literal page or inspected-video evidence only. |
| Scene | Extracted scene or explicitly marked interpretation. |
| Product Features | Literal feature claims or watched observation; identify source basis. |
| User Type | Creator category such as independent reviewer, electrician, scrap recycler, or official brand; mark interpretation where needed. |
| Engagement | Short qualitative statement grounded in recorded metrics. |
| Value Level | S/A/B/C using the skill rubric. |
| Reason | Why the record is retained. |
| Source / Verification Status | The evidence surface and what still needs review. |

For a Feishu import table, append these editable fields without filling them: `飞书记录ID`, `回填状态`, `人工复核状态`, `人工备注`. Use `待导入` and `待人工复核` only when the user asks for workflow defaults; otherwise leave all four blank.
