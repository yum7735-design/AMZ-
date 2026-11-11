---
name: amazon-competitor-voc-playbook
description: Analyze Amazon competitor ASINs using Xiyou, SellerSprite, public PDP evidence, and optional Feishu Bitable reviews to explain positioning, traffic, VOC, and concrete product opportunities. Use for evidence-backed competitor playbooks; not for a review-only summary or a single metric lookup.
---

# Amazon Competitor VOC Playbook

Build a decision-grade competitor playbook that answers why an ASIN sells, which mechanisms are verified, and what should be copied, upgraded, or avoided. Keep product facts, keyword/traffic facts, customer review evidence, and commercial inferences traceable.

## Scope and output

- Confirm the Amazon marketplace from the user's request. Do not silently mix marketplaces.
- Analyze the ASINs supplied by the user. Expand to a market sample only when the request asks for market structure, routes, or opportunity validation.
- Use the user's requested format. When they ask for HTML, produce one self-contained responsive HTML file in the workspace and return an absolute clickable link.
- Do not write back to Amazon, Feishu, ad accounts, or any external system unless explicitly asked.

## Evidence labels

Every material statement must use one of these labels:

- 【事实】: direct source observation. Name the source and snapshot period where useful.
- 【推断】: a conclusion supported by two or more facts, but not directly displayed by a source.
- 【假设】: plausible but not adequately validated.
- 【建议】: an action tied to the preceding evidence.
- 【暂无数据】: an unavailable metric or an analysis that cannot be justified.

Never manufacture sales, revenue, traffic, PPC spend, CPC, conversion rates, review proportions, BSR history, launch dates, or market share. Do not re-label a traffic score as visitor volume or merge incompatible source metrics.

## Data collection

Use only the smallest set of calls necessary to answer the requested decision. Preserve the original user request in Xiyou user_task and use a concise step-specific intent_summary.

### Product and commercial facts

1. Xiyou: call get_asin_info, get_asin_orders_last_30_days, and get_asin_traffic for supplied ASINs.
2. SellerSprite: call asin_detail_with_coupon_trend for parent, launch, category, BSR, variation, dimensions, seller, Listing features, current coupon, and historical promotion. Use asin_sales_trend only when lifecycle or price/sales history is part of the decision.
3. Inspect the public Amazon PDP when available for full title, bullets, visible image carousel, A+, Brand Story, current offer presentation, and visible review text. Do not bypass login, CAPTCHA, paywalls, or safety interstitials.

### Keywords, traffic, and market validation

1. Use Xiyou get_asin_keywords for the ASIN's latest seven-day keyword, natural rank, SP rank, and traffic-score mix.
2. Use SellerSprite keyword_research for the small set of relevant core, scenario, and product-form keywords. Keep monthly search demand separate from Xiyou seven-day ranking data.
3. Use Xiyou get_keyword_asin_analysis to inspect a core keyword's mixed search-result landscape when needed. Separate direct product substitutes from adjacent tools or product forms.
4. Use SellerSprite competitor_lookup for a bounded direct-comparable sample and label units/revenue as SellerSprite estimates, not Amazon actuals.

### Optional Feishu Bitable review evidence

Read [review-bitable.md](references/review-bitable.md) before reading a Feishu review table.

Use this path only when the user gives a Feishu Bitable link or explicitly authorizes its use. It is read-only by default.

## Analysis requirements

### Product identity and positioning

Define the product by operating mechanism, drive type, channels, adjustment mechanism, compatible wire range, intended workload, and use case. Do not let a broad Amazon category substitute for this identity check.

Express positioning as: target user + scenario + task + core value.

Map facts into: user → scene → JTBD → pain point → product ability → purchase rationale.

### Listing and content

Explain title order and each bullet's job: product explanation, feature/benefit proof, scenario, objection handling, or conversion push. Analyze only images and A+ elements actually visible on the PDP. If some carousel images or A+ content are unavailable, state that instead of inventing their messages.

### Review/VOC

Use raw review text as the primary evidence. Count only after filtering the exact ASIN; report the review population (n), rating distribution, verified purchase count, Vine count, image-review count, and review date coverage if available.

Treat Bitable fields such as sentiment, problem category, and key theme as analyst tags unless raw review text independently supports them. Do not use a Vine review as proof that all reviews were acquired through Vine. A low star but positive-sounding review must remain in the rating distribution and be described as an inconsistency rather than discarded.

Prioritize explicit purchase drivers, scenarios and user skill levels, workflow friction, fit/compatibility and specification constraints, durability/feeding/blade/safety failures, Listing expectation gaps, and short representative quotes with record IDs when available.

For a small sample, describe counts rather than asserting category-level prevalence. Distinguish observed in reviews from not observed.

### Pricing, lifecycle, and traffic

- Display asynchronous current prices instead of choosing one source as the definitive transaction price.
- Treat Xiyou near-seven-day traffic as scores; never call them visits.
- Keep Xiyou recent orders, SellerSprite monthly estimates, and parent/child historical points separate.
- Make a lifecycle call only when launch timing plus at least one trend signal supports it. Otherwise use 【暂无数据】 or a cautious hypothesis.
- Presence in a sponsored placement proves observable ad presence, not bid, spend, ACOS, search-term profitability, or a complete campaign structure.

### Recommendations

Recommendations must name a product, user, scene, capability, and proof needed. Avoid generic advice such as “improve quality” or “optimize keywords.”

Classify actions as directly copyable content/process logic; capability or bundle logic to adapt; and non-copyable assets such as brand history, review inventory, and existing brand demand.

Do not recommend a new product direction without direct evidence from product structure, VOC, keywords, or market samples. For each recommended direction, give the target user, JTBD, core feature set, differentiation, likely price band if source-supported, and evidence gaps.

## Deliverable shape

For a full competitor playbook, use this order when the user asks for it:

1. One-line positioning
2. Product route
3. Product profile
4. Target users
5. Scenes
6. JTBD
7. Capability matrix
8. Listing
9. Images/A+
10. Keywords
11. Organic ranking
12. Advertising
13. Price and promotion
14. Review/VOC
15. Core selling points
16. Growth flywheel
17. Lifecycle
18. Moats
19. Copy/adapt/avoid
20. Breakthrough points
21. Opportunity matrix
22. Horizontal competitor matrix, when multiple ASINs or market validation is in scope
23. Product-route map, when market validation is in scope
24. Final playbook map and product directions

State source dates and data conflicts at the end. Read [report-conventions.md](references/report-conventions.md) when producing an HTML deliverable.
