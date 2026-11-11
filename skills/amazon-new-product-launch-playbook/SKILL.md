---
name: amazon-new-product-launch-playbook
description: Build an evidence-based Amazon US new-product launch playbook from product facts, competitor analysis, keyword exports, and constraints. Use for 30/60/90-day launch strategy, keyword pyramids, ad architecture, rank acceleration, listing readiness, and HTML operating plans; not for a generic Amazon operations overview.
metadata:
  short-description: Build Amazon new-product launch playbooks
---

# Amazon New Product Launch Playbook

Create a product-specific launch plan that explains how an Amazon US product earns its first orders, builds keyword rank and natural traffic, then shifts to defensible growth. The output must tie every major action to supplied product facts, keyword/competitor evidence, unit economics, inventory, and the user's risk tolerance.

## Use this skill when

- The user needs a new Amazon product launch, cold-start, ranking, campaign, promotion, or 30/60/90-day plan.
- Inputs include a product brief, competitor research, Amazon keyword exports, advertising data, inventory or a target BSR.
- The user asks for an execution-ready HTML report, campaign design, keyword management plan, or weekly operating mechanism.

Do not use it for a generic marketplace introduction, a review-only VOC project, or competitor research with no launch decision required.

## Working rules

1. Start from the user's existing research. Do not redo competitor analysis that they have already provided. Extract only the evidence that changes launch choices.
2. Never invent Search Volume, CPC, CPR, rank, competitor price, conversion, margins, or category sales thresholds. Distinguish source facts, calculations, recommendations, and open data gaps.
3. If the product has two versions, verify whether the underlying product capability differs. Do not use a bundle/accessory difference to imply higher performance.
4. If a target BSR is given, translate inventory into daily sell-through targets, then calibrate against BSR competitors' observed sales data when supplied. State plainly when the BSR-to-sales mapping is unavailable.
5. Treat stockout as a strategy only when the user explicitly accepts it. Reserve enough units for customer-service replacements; stop wasteful acquisition ads when stock coverage becomes too short.
6. Keep all review and promotion tactics Amazon-compliant: no purchased reviews, incentivized reviews, review manipulation, misleading performance claims, or competitor trademarks in Listing copy/back-end terms.
7. Treat competitor brand keywords as separate, low-budget tests. Do not put those brands in the title, bullets, A+, images, or search terms.

## Workflow

### 1. Establish the decision frame

Extract:

- SKU/ASIN, version relationship, price, cost or pre-ad margin, inventory, replenishment lead time, launch date.
- Product capability, verifiable differentiators, operating boundaries, prohibited claims, target user and scenario.
- Brand assets: Brand Registry, Vine eligibility, A+, video, Store, external-content and B2B readiness.
- Launch objective: sales, BSR, keyword rank, margin/ACOS tolerance, and whether stockout is acceptable.

When required information is absent, include a concise `需要补充的数据` section. Continue with evidence-supported recommendations instead of masking gaps with made-up numbers.

### 2. Read and classify keyword evidence

For `.xlsx`, `.csv`, or `.tsv` keyword exports, use the spreadsheet skill. Preserve the raw source; inspect headers and determine what the measures actually represent before calculating.

If a multi-ASIN export contains fields such as relevance score, weekly search volume, suggested CPC, click conversion rate, competition difficulty, competitor natural rank, competitor SP/SB rank, traffic share, or position, read the full relevant keyword range. Record the date range of the extract.

Read [the keyword analysis framework](references/keyword-analysis.md) before assigning keyword tiers, bids, or exclusions.

### 3. Test listing readiness before buying traffic

Identify the single greatest conversion uncertainty, normally one of: product compatibility, proof of outcome, version/configuration difference, price/value explanation, or unclear operating/safety requirements.

Map it to a required Listing asset: title, compliant main image, secondary image, Bullet, A+, video, FAQ, Store, or back-end terms. Do not scale a keyword because its CPC is attractive if the Listing cannot fulfill its intent.

### 4. Model economics and resource allocation

Calculate using the supplied definitions. If gross margin is pre-ad, then:

```text
Unit gross contribution = selling price × pre-ad gross margin rate
Break-even ACOS = unit gross contribution ÷ selling price
Maximum CPC = realized selling price × observed CVR × target ACOS
```

For coupons or launch discounts, derive unit cost from the normal-price margin when possible, then recalculate contribution and break-even ACOS at the discounted price. Do not use normal-price ACOS limits after a deep discount.

Allocate budget by keyword role and SKU role, not evenly. Where one SKU is the strategic conversion/version lead, give it priority on shared Exact terms and avoid self-bidding. Use the user's inventory horizon and rank goal to set a daily order trajectory and a capped daily budget range.

### 5. Design the campaign system

Create actual campaign rows with names, targeting, match types, bids, budget, placement logic, purpose, and an activation condition. Include as relevant:

- SP Exact core terms, one keyword per ad group when rank control is needed.
- SP Exact functional/scenario/high-CVR terms.
- SP Phrase/Broad and Auto discovery, separated from rank campaigns.
- SP Product Targeting for named competitor ASINs and an explicit stop rule.
- SB Brand defense immediately when eligible; SB Video only when the video conveys the missing proof and early listing conversion is credible.
- SD view remarketing only after sufficient listing traffic exists; do not start it as a Day 1 budget sink.

Use the source export's suggested CPC as an initial reference, then check it against Maximum CPC. Launch bids may exceed the strict efficiency bid only when the user explicitly authorizes a time-boxed rank investment; label the incremental spend as such.

### 6. Sequence promotion, review, content, and external traffic

Define Day 1–3, Day 4–7, Week 2, Week 3, Week 4, then 31–60 and 61–90 day actions. Specify which channel supplies first orders, why it fits the target user, its budget, the indicator to check, and when to expand or stop.

Use Vine and Amazon's standard review request pathway only within platform rules. Prioritize content in the order that resolves the main conversion uncertainty; do not recommend every content channel at once.

### 7. Close the PPC-to-organic loop

Specify a keyword dashboard with natural rank, paid rank, clicks, orders, CVR, spend, ad-attributed orders, organic orders, and week-over-week change. Create `Scale`, `Maintain`, `Reduce`, and `Kill/Negative` rules using the product's actual price, ACOS target, CPC, and CVR instead of a generic fixed-click cutoff.

Explain the decision when spend rises but rank does not: relevance mismatch, weak Listing conversion, wrong query intent, insufficient order density, price/review gap, or unusually strong competition. Do not prescribe more bids as the automatic answer.

## Deliverables

When the user requests a complete plan, organize it as:

1. Market entry strategy
2. Product positioning
3. Target users
4. Core scenarios and JTBD
5. Keyword strategy and pyramid
6. Listing readiness
7. Advertising architecture
8. Budget and unit economics
9. Cold start and first-order sources
10. Review plan
11. Keyword rank plan and dashboard
12. Competitor interception
13. Scenario marketing
14. Content plan
15. Off-Amazon traffic
16. Amazon Business
17. 30/60/90-day route
18. Weekly operating review
19. Risk radar and decision rules
20. Product-line strategy
21. A text-based operating map from positioning to product-line expansion

For an HTML request, create one self-contained UTF-8 HTML file with:

- A readable title, stated objective, date/as-of period, and any material assumptions.
- Sticky or compact section navigation when the report is long.
- Responsive tables, no clipped columns, print styles, and a source/data-gap section.
- The actual keyword tables, campaign table, 30/60/90 roadmap, review/optimization rules, and operating map—not an executive summary that omits execution details.
- Clear labels for source data versus recommendations. Do not expose internal paths in the HTML.

## Quality gate

Before delivering, verify:

- Every bid and budget is traceable to source CPC/CVR, a stated economics calculation, or an explicitly labelled rank-investment decision.
- Both version positioning and all product claims match the product brief.
- The keyword strategy separates high-relevance rank terms, high-conversion efficiency terms, broad discovery terms, competitor-brand tests, and negatives.
- Stockout, price discount, and rank goals are reconciled with inventory and contribution margin.
- The plan answers what to do, why, when, budget, metric, scale condition, stop condition, and next action.
