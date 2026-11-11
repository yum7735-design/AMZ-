---
name: amazon-onsite-video-intelligence
description: Collect and structure publicly visible Amazon product-detail-page videos for supplied ASINs, including Product Videos cards and gallery video items. Use for evidence-led onsite video research and Feishu/Bitable-ready import tables; not for review mining, advertising analysis, purchasing, or seller-console work.
---

# Amazon Onsite Video Intelligence

Collect Amazon on-site video evidence without filling gaps with assumptions. The usual output is one flat, Feishu-importable row per individually visible video/card/thumbnail, plus a clear statement of what Amazon did not expose.

## Scope and authorization

- Collect only from the marketplace the user specifies. If no marketplace is stated, ask once; use Amazon US only when the surrounding task establishes it.
- Work from user-supplied ASINs. Do not substitute similar products or infer ASINs from titles.
- Public PDP observation is read-only. Do not log in, buy, post, contact creators, use CAPTCHA bypasses, or access seller-only tools.
- The request concerns videos on the supplied PDPs. Do not treat sponsored videos for other products as videos belonging to the target ASIN.

## Collection procedure

For each ASIN, open the canonical PDP (`/dp/<ASIN>`) and capture the product context needed to make video records useful: ASIN, canonical URL, title, brand, displayed rating/review count, product facts relevant to the category, and collection date.

Then enumerate separately visible video surfaces:

1. **Product Videos widget** — record every accessible video card. Look for card title, creator/account, `Customer Review`, `Earns commissions`, brand/seller identifiers, and any visible duration. Wait briefly for asynchronous cards to load before deciding the widget is absent.
2. **Product media gallery** — record each separately accessible gallery video thumbnail/card. Capture its displayed position and any exposed title or thumbnail details. A gallery `VIDEO` indicator is valid evidence even where the underlying item metadata is absent.
3. **Other on-page target-ASIN videos** — include only when they are a distinct PDP video asset, with a clear source label. Exclude third-party sponsored-video placements and videos advertising other ASINs.

Use the source-type taxonomy and complete schema in [references/field-schema.md](references/field-schema.md). Read it before making an import table or when a source type is ambiguous.

## Evidence boundaries

- Treat `14 VIDEOS`, `4 VIDEOS`, or a similar gallery label as a **PDP-level displayed media count**, never as views, engagement, or the number of individually captured records.
- Amazon often exposes only one featured Product Videos card even when the PDP-level count is larger. Record the visible card(s); state that the aggregate count was not expanded when applicable.
- Do not invent duration, upload date, views, likes, comments, creator identity, title, wire type, or demonstrated actions. Leave fields blank or use `Not publicly captured`.
- Do not save unstable `blob:` URLs as video URLs. The canonical PDP URL is the stable evidence link unless Amazon exposes an ordinary public video URL.
- When a gallery card and widget card may be the same asset but Amazon does not expose a shared identity, keep both rows and mark `potential duplicate / identity not exposed`. Do not silently merge them.
- Do not classify a creator as influencer, customer, brand, or seller merely from the name. Use the label Amazon displays. If no label is present, use `Unlabeled creator/seller video` and state the ambiguity.

## Classification and quality control

- Classify source using observed labels: Brand official video, Brand tutorial, Seller video, Influencer video (`Earns commissions`), Customer Review video, Product media gallery video, or Unlabeled creator/seller video.
- Separate source evidence from product-listing facts. Product title/bullets may support `Drive Type`, `Wire Size`, `Features`, and `Scene`, but do not claim the video itself demonstrates those facts unless the video/card shows them.
- De-duplicate only when title/creator/asset identity or otherwise reliable evidence shows the same content. Cross-ASIN variants should remain distinct PDP records.
- Rank value from observable evidence, not unknown engagement. A visible customer-review video, operating tutorial, or well-described creator video can rank higher than an unlabelled thumbnail. Explain the reason in the record.

## Deliverable

For a requested table, create or append a flat Excel/CSV table. If working with `.xlsx` or `.csv`, use the spreadsheet skill. Preserve these editable Feishu workflow columns: `飞书记录ID`, `回填状态`, `人工复核状态`, `人工备注`.

Report separately:

- number of individually identifiable video records captured;
- number of visible gallery video items with metadata gaps;
- PDP-level aggregate counts that could not be expanded; and
- access or metadata limitations.

Never describe partial visibility as exhaustive collection of all underlying Amazon-hosted videos.
