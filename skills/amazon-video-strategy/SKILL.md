---
name: amazon-video-strategy
description: Build evidence-led Amazon US product-video strategies from Listing facts, VOC, personas, competitor listings, and publicly visible PDP videos. Use for deciding what videos to make and what claims they can prove; not for detailed shot-by-shot storyboards.
---

# Amazon US Product Video Strategy

Turn product evidence into an actionable video strategy without upgrading assumptions into facts. Work especially well for tools, automotive repair, electrical connections, and industrial products, but apply the evidence rules to any category.

## Scope and inputs

Start by naming the product scope: ASIN/parent ASIN, marketplace, selected child SKU(s), product family, and the point-in-time of Listing facts. Inventory the evidence actually supplied:

- Listing facts and product/operation documentation
- Product VOC, category VOC, returns, support questions, or review exports
- Personas, demographics, scenes, JTBD, keyword data
- Competitor listings and PDP assets
- Competitor videos or publicly visible PDP-video metadata

State missing layers directly. A parent ASIN does not establish the contents of every child variant. Do not treat one child review as parent-wide evidence without saying it is a merged-child or variation-specific sample.

Read [evidence rules](references/evidence-rules.md) before calculating review frequencies, reviewing PDP videos, or defining permitted claims.

## Strategy workflow

1. Separate product facts, explicit user evidence, analyst synthesis, and hypotheses. Record the source for every material conclusion.
2. Extract 3–5 purchase reasons as a chain: parameter/feature → functional outcome → user value → visible proof. Flag claims that need testing rather than treating Listing language as verified performance.
3. Build the buyer chain: target user → scene → JTBD → friction → product capability → video proof → purchase value. Rank groups by evidence strength, not invented demographics.
4. Quantify VOC only when the source exposes a sample denominator and unambiguous tags. With multi-label data, say rates do not add to 100%. A review not mentioning a need is not proof of absence.
5. Inspect competitor positioning: price/offer, listing claims, review/reputation signals, visual assets, and visible video availability. Do not claim to have analyzed a video’s hook, visuals, narration, or sequence unless it was actually viewed.
6. Produce a 15s/30s/60s opportunity matrix. Each proposal needs a target user, scene, pain, product point, source evidence, recommended visual proof, duration, difficulty, evidence strength, and priority.
7. Recommend one primary direction and one backup. Explain the tradeoff without predicting conversion rate.

## Deliverable

Write a decision-ready report with:

- product value and differentiation;
- VOC and decision analysis, including the evidence tier for key findings;
- competitor Listing/video evidence and access limitations;
- at least five feasible video opportunities when evidence supports them;
- primary and alternate recommendation; and
- a structured handoff brief for a creative team.

The handoff must include product facts, target people, scenes/tasks, pains, approved evidence, unverified claims that are prohibited, recommended creative territory, and production constraints.

Default to Markdown. When the user asks for a shareable or browser-ready artifact, render a self-contained HTML document and verify it contains the full matrix and brief.

## Boundaries

- Use Amazon US only when the task establishes US; otherwise ask for marketplace.
- Public PDP research is read-only. Do not log in, purchase, post, contact creators, solve CAPTCHAs, or access seller-only data.
- Do not invent counts, review quotes, demographics, results, safety certifications, comparative performance, or competitor video observations.
- Treat “perfect,” “stronger,” “easier,” “safer,” durability claims, and test results as unverified until the input provides proof or a controlled production test is specified.
- This skill defines strategy. For concepts and hooks use `amazon-video-creative`; for timed shot lists and production instructions use `amazon-video-storyboard`.
