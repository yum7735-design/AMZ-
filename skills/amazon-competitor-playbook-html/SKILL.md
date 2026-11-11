---
name: amazon-competitor-playbook-html
description: Analyze one or more Amazon marketplace competitor ASINs with Xiyou and SellerSprite, verify product identity from listing facts and main images, and create an evidence-layered Chinese HTML playbook. Use for competitor strategy, product positioning, listing, keyword, traffic, pricing, advertising, or product-line decisions; not for review-only VOC analysis.
---

# Amazon Competitor Playbook HTML

Create a decision-grade Chinese competitor analysis that explains why an ASIN sells and what to copy, improve, avoid, or attack. The framework is category-neutral: let Listing facts, images, and keyword data reveal the product category and decision drivers rather than assuming a product type.

## Scope and boundaries

- Use the marketplace named by the user. If it is missing and the available ASIN sources require it, ask for the marketplace rather than silently mixing countries.
- Treat user-provided ASINs as the comparison set. Do not expand to a category-wide study unless the user explicitly asks for category size, market structure, or whitespace.
- Do not write to Feishu, Amazon, advertising accounts, or any external system unless the user explicitly asks for it.
- Mark source-backed observations as `【数据事实】`; label explanations as `【推测】`, `【可能原因】`, or `【待验证】`.
- State the source and period for each metric. Xiyou near-7-day traffic, Xiyou near-30-day orders, SellerSprite monthly estimates, and price-history observations are distinct measurements.

## Data collection

Use the smallest tool set that resolves the user's decision. For every Xiyou call, preserve the user's original request verbatim in `user_task` and use a concise, step-specific `intent_summary`.

### Product facts and images

1. Use Xiyou `get_asin_info` in batch for title, price, rating, rating count, PDP URL, and `bigPicUrl`.
2. Use Xiyou `get_asin_orders_last_30_days` in batch for current order scale.
3. Use Xiyou `get_asin_traffic` in batch for natural/advertising traffic, keyword counts, and seven-day changes.
4. Use SellerSprite `asin_detail_with_coupon_trend` for Listing features, variation structure, launch date, BSR, dimensions, badges, current coupon, and historical promotions.
5. Use SellerSprite `asin_sales_trend` only when sales, price, or BSR history is necessary for the conclusion.

### Keywords and competition

- For one ASIN, use Xiyou `get_asin_keywords` to inspect its keyword mix.
- For a user-requested comparison of multiple ASINs, use `get_multi_asin_keyword_comparison` rather than treating separate single-ASIN views as a comparison.
- Use SellerSprite keyword tools only when additional demand, purchase-rate, CPC, competition, or title-density evidence is required.
- Retry a failed data call once only when the tool allows it. Otherwise report the missing item; do not fabricate it.

## Product identity and comparison guardrail

Before declaring products to be direct competitors, inspect the main image, title, model/variation, core features, specifications, and category path.

1. State the product identity in plain language: product family, operating mechanism, key specification, and intended use.
2. Classify each product as a **direct substitute**, **adjacent/solution competitor**, or **irrelevant search/category neighbor** for the user's product goal.
3. Do not infer a function, material, certification, compatibility, capacity, or operating mode solely from a broad category label or a single ambiguous image detail.
4. If the user supplies a product taxonomy, follow its definition. Where Listing evidence conflicts with the taxonomy or cannot prove a classification, state the ambiguity and use `【待验证】` rather than forcing a category.
5. Put the main image beside the identity/classification note in HTML so the user can validate the decision visually.

## Analysis requirements

### Commercial positioning

For each ASIN, show image, ASIN, brand, launch date, current price, coupon, rating/reviews, BSR, variations, relevant specifications, current order scale, and a concise position statement:

> `目标人群 + 核心场景 + 核心能力 + 价格带 = 竞争定位`

Map evidence into:

`人群 → 场景 → JTBD → 痛点 → 产品能力 → 购买理由`

Separate baseline capability, competitive capability, differentiated capability, and unverified marketing claims. Text appearing in a bullet is a Listing claim, not independent performance proof.

### Listing and image logic

Explain the title's keyword order and the role of each major bullet: feature → benefit → scene/pain point → proof. If only a main image or an A+/video badge is available, embed what is available but explicitly say full carousel/A+ review is unavailable. Never invent per-image content.

### Keyword, traffic, and advertising logic

- Segment terms into category, product/attribute, scenario, specification, competitor-brand, and irrelevant/mismatched intent.
- Report natural and advertising rankings separately. Do not add overlapping natural/ad keyword counts together.
- Treat a large generic keyword as an opportunity requiring conversion validation, not as automatically relevant demand.
- Identify whether each ASIN appears naturally established, ad-dependent, or mixed, using traffic share and rank patterns.
- When ad conversion, spend, search-term, and TACoS data are absent, recommend campaign structure and tests—not fixed bids, budgets, or profitability conclusions.

### Pricing and competitor map

- Separate current price/current coupon from historical deal evidence.
- When sources disagree on price, display both as asynchronous snapshots instead of choosing one as the true transaction price.
- Split direct substitutes from keyword/intent competitors. The same search term can contain products with very different product capabilities or buyer needs.

## Promotion recommendations for a user's own ASIN

When the user identifies an ASIN as their own, compare it with the requested competitors and recommend:

1. **Positioning:** which buyer, use case, or specification band it should own.
2. **SEO:** high-intent terms that already have a reachable natural rank; title/bullet/image gaps that block relevance or conversion.
3. **Ads:** separate exact high-intent terms, broader discovery terms, scenario terms, product targeting, competitor-brand tests, and negative/mismatch candidates.
4. **Conversion:** image and Listing evidence needed to make the intended value proposition credible.
5. **Price/promotion:** price relationship and a test only when margin and conversion data make it reasonable.

Tie each action to observed evidence. Do not claim conversion rate from incompatible order and traffic-score metrics.

## HTML delivery

When the user asks for HTML, or has established HTML as the desired delivery format in the current workflow, create a self-contained `.html` file in the current workspace with `apply_patch`.

Include:

1. Hero: ASINs, marketplace, date, and sources.
2. Executive conclusion, product-identity check, and direct-versus-adjacent competitor boundary.
3. Main-image cards and a comparable data table.
4. Individual competitor playbooks: positioning, Listing facts, traffic/keyword logic, pricing, weaknesses, and opportunities.
5. Cross-ASIN keyword/traffic matrix.
6. Market consensus, whitespace, over-competition, and competitor map.
7. `建议复制 / 改进后复制 / 不建议复制 / 反向竞争`.
8. For a user's own ASIN: product, Listing, image, keyword, advertising, and price recommendations with P0/P1/P2.
9. Data periods, conflicts, and unknowns.

Embed `bigPicUrl` as a remote image and link it to the Amazon PDP. Make the report responsive. Verify the output file exists, then return a clickable absolute file link.

## Category-study extension

Only when a user explicitly asks for category market size, brand landscape, price bands, category keywords, or whitespace: read the Xiyou category-insight guide, search the category, let the user confirm the category, then generate and reuse a category resource. Do not spend category credits for an ASIN-only task.
