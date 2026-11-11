# Amazon PDP Video Import Schema

Use these fields for a flat, row-per-visible-video import table. Preserve the original field labels when appending to an existing user table.

| Field | Guidance |
| --- | --- |
| 飞书记录ID | Blank editable field for the Bitable record ID. |
| 回填状态 | Editable workflow state, e.g. 待导入 / 已导入 / 已回填 / 跳过. |
| 平台 | Marketplace and surface, e.g. `Amazon.com PDP`. |
| Amazon ASIN | Supplied target ASIN. |
| 品牌 | Brand displayed by the PDP; leave blank if not exposed. |
| 商品标题 | PDP title as displayed. |
| 商品页链接 | Canonical `/dp/<ASIN>` link. |
| 商品星级 | PDP rating as displayed; no inference. |
| 商品评价数 | PDP displayed review count; preserve the displayed value. |
| PDP显示视频数 | Aggregate gallery/media count only. Use `Not publicly captured` if not displayed. |
| 可见主视频标题 | Exact visible title or `Not publicly captured`. |
| 视频创作者/账号 | Exact creator/account name, if displayed. |
| 视频来源类型 | Use the taxonomy below. |
| 归属标记 | Exact Amazon-visible marker such as `Earns commissions`, `Customer Review`, `Brand account displayed`, or `No ownership marker displayed`. |
| Drive Type | Listing-supported mechanism such as Manual, Drill-powered, Motor/Electric. Do not imply video proof. |
| Wire Types / Wire Size | Listing-supported wire material/type/range. Keep blank if unavailable. |
| 商品页功能/结构 | Listing-supported features only. |
| 场景 | Listing-supported application context. |
| Value Level | S/A/B/C based on observable on-page value, not assumed engagement. |
| 入选原因 | Short reason focused on what is actually visible. |
| 来源/核验状态 | Evidence source, metadata gaps, potential duplicates, and access caveats. |
| 人工复核状态 | Editable field, e.g. 待人工复核 / 已复核 / 不适用. |
| 人工备注 | Blank editable field. |
| 采集日期 | Collection date in `YYYY-MM-DD`. |

## Source-type taxonomy

| Observed evidence | Record as |
| --- | --- |
| PDP card identifies the product brand/account | Brand official video or Brand tutorial (only when title/label supports tutorial) |
| PDP card displays `Earns commissions` | Influencer video |
| PDP card displays `Customer Review` | Customer Review video |
| Account is visibly a seller account but not the brand | Seller video |
| Video thumbnail/card is in the main media gallery and no creator/title is exposed | Product media gallery video |
| Named card has neither a brand/seller/customer/influencer label | Unlabeled creator/seller video |

## Per-PDP counting rule

Count and report these separately:

1. **Identifiable record count**: number of visible cards/thumbnails represented by rows.
2. **Gallery metadata-gap count**: identifiable media-gallery video rows whose title/creator are not exposed.
3. **PDP-level displayed video count**: Amazon’s aggregate label, retained as context only.

Do not expand an aggregate count into invented rows. If a gallery tile says `7 VIDEOS` but exposes only one video thumbnail, record the one visible thumbnail and say the remaining aggregate count was not individually exposed.
