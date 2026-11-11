---
name: amazon-us-listing-optimization
description: Analyze and optimize Amazon US product Listing copy with evidence from product facts, current Listing text, keyword data, and VOC. Use for titles, Item Highlights, bullet points, keyword placement, Listing diagnosis, variant-specific copy, character verification, and approved Feishu Bitable write-back.
---

# Amazon US Listing Optimization

## Purpose

Create evidence-based, conversion-oriented Amazon US Listing copy. Do not merely rewrite copy. Diagnose the current Listing, classify keywords, translate VOC into buyer-decision strategy, write natural American English, validate claims and character limits, and optionally write approved outputs back to the user's Feishu Bitable.

## Non-Negotiable Rules

- Treat the product facts as the source of truth for materials, dimensions, quantities, compatibility, performance, certifications, and included components.
- Do not invent product facts, rankings, search volumes, review percentages, guarantees, certifications, test results, compatibility, service terms, warranties, or performance outcomes.
- Distinguish product facts, customer feedback, analytical inference, and unverified hypotheses.
- Do not treat a competitor problem as the user's product advantage unless the supplied product evidence proves the advantage.
- Do not add competitor brands, irrelevant traffic terms, incorrect product types, or unsupported attributes simply to improve keyword coverage.
- Never claim that an optimization will certainly improve rank, conversion, or sales.
- If a requested service, warranty, return, or support statement is not documented, do not write it. Use a verified product or packaging benefit instead.

## Inputs

Accept any available combination of:

1. Current Listing: title, Item Highlight, bullets, description, A+ copy, images, prior revisions.
2. Product facts: brand, ASIN/SKU, variants, quantities, dimensions, materials, structure, included components, verified performance, limits, price, positioning.
3. Keyword data: keyword, search volume/trend/rank/conversion data, ad search terms, competitor terms, relevance.
4. VOC: review text, rating, sample size, tags, review summaries, scenarios, pain points, purchase drivers, unmet needs.
5. Destination Bitable: Base URL, target table, target fields, matching key (normally ASIN or SKU).

When material is missing, continue with the available evidence and state the gap. Do not fill gaps from assumption.

## Workflow

### 1. Establish product scope

- Identify the parent ASIN and each active child ASIN/SKU.
- Separate active, inactive, and discontinued variants.
- Record which facts vary by child: pack count, dimensions, color, size count, material, components, price, or use constraints.
- Use separate copy whenever a factual difference would make shared copy misleading.

### 2. Audit the current Listing

For Title, Item Highlight, and every Bullet Point, record:

| Field | Existing copy | Current role | Problem | Evidence | Optimization direction | Priority |
|---|---|---|---|---|---|---|

Audit for:

- Product identity and the core product keyword.
- Variant-critical specifications and quantity.
- Clear differentiators supported by evidence.
- Redundant terms, synonym stacking, empty modifiers, and poor readability.
- Purchase objections that are not answered.
- Repeated content between title, Item Highlight, and bullets.
- Absolute, comparative, medical, safety, longevity, or certification claims without proof.

### 3. Clean and classify keywords

Classify every usable keyword into:

- Core product term.
- Specification term.
- Functional or structural attribute.
- Use scenario.
- User task / job-to-be-done.
- High-intent long-tail term.
- Low-relevance, misleading, competitor-brand, or inapplicable term.

Create a layout table:

| Keyword | Type | Relevance | Demand data and period | Intent | Recommended position | Reason | Must cover? |
|---|---|---|---|---|---|---|---|

Rules:

- Prioritize relevance and purchase intent over raw search volume.
- Use the title for product identity and essential differentiating specifications.
- Use Item Highlight for a concise non-duplicative value phrase.
- Spread useful terms naturally across bullets; do not repeat close synonyms just for coverage.
- If live traffic data is used, label it precisely, for example: “parent-ASIN traffic in the last 7 days,” not “search volume.”

### 4. Convert VOC into copy strategy

Extract only substantiated insights:

- User types and high-frequency scenarios.
- JTBD and purchase triggers.
- Pre-purchase questions and objections.
- Satisfaction drivers and use obstacles.
- Product problems it can solve, and limits it cannot promise to solve.

Create the mapping:

| User need / pain point | Review evidence | Frequency / sample qualification | Product capability | Safe expression | Listing position | Confidence |
|---|---|---|---|---|---|---|

Do not calculate percentages unless the denominator, sample selection, and tag method are reliable. If reviews span multiple variants, say so and avoid variant-specific generalizations without matching evidence.

### 5. Define the copy strategy before drafting

State:

1. Target buyer and primary purchase scenario.
2. The 3–5 most important purchase reasons.
3. The three most important objections to resolve.
4. Core keywords and priorities.
5. What will change versus the current Listing.
6. Facts to retain, remove, and add.
7. Claims that cannot be written until product evidence is provided.

### 6. Write Listing copy

Use natural, concise American English.

#### Title

Use the requested project limit. If none is supplied, ask for it or state the relevant marketplace/category policy needs manual confirmation.

Preferred structure:

`Brand + Quantity/Pack Count + Core Product Keyword + Key Specification + Necessary Differentiator`

- State exactly what the product is.
- Include only specifications needed to identify the correct variant.
- Do not duplicate near-synonyms or use empty advertising language.
- Verify every character count programmatically.

#### Item Highlight

If the user requests phrase format, write a natural comma-separated phrase, not a sentence.

Recommended pattern:

`Verified Structure or Key Benefit, Use Task, Relevant Scenarios`

- Do not restate the complete title.
- Do not use unverified claims such as `marine-rated`, `waterproof`, `certified`, `premium`, or `best`.
- Verify character count programmatically.

#### Five Bullet Points

Assign different jobs instead of repeating the title.

1. Core function or primary buyer value.
2. Structure, material, or verified performance mechanism.
3. Variant-specific contents, dimensions, quantity, or included components.
4. Suitable scenarios and user task.
5. A verified differentiator such as organization, usability, or documented brand/service terms.

Use Title Case only for the short lead-in before the colon. Do not use all caps unless the user explicitly asks.

Example structure:

`Short Topic Phrase: Specific factual explanation and buyer value.`

If the product has no verified service or warranty information, do not fabricate it for Bullet 5. Use a verified packaging, organization, color-coding, selection, or use-convenience benefit instead.

### 7. Validate before delivery

Programmatically count all title and Item Highlight characters. Also report bullet character counts if no category-specific limit is given.

For each field, verify:

- Quantity, dimensions, color, material, model, and components match the target child ASIN.
- Claims have evidence.
- No keyword stuffing or unnatural language remains.
- No unsubstantiated superlatives, comparisons, safety effects, medical effects, or guaranteed outcomes are present.
- Policy status is described as “requires manual confirmation” when current official policy text is unavailable.

## Required Output Order

1. Current Listing diagnosis.
2. Keyword layout table.
3. VOC-to-copy mapping table.
4. Copy strategy.
5. Optimized complete English Listing, separated by variant where necessary.
6. Old-to-new comparison table.
7. Quality check: passed items, risks, missing product facts, manual compliance checks.
8. Copy-ready final version.

## Optional Feishu Bitable Write-Back

Only write when the user explicitly asks to write back and provides or authorizes a destination table.

1. List the tables and inspect target field names.
2. Read target records using a specific match key such as ASIN or SKU.
3. Confirm active variants and record IDs before writing.
4. Update only the approved fields, for example `标题`, `亮点`, and `五点1` through `五点5`.
5. Never overwrite source fields such as `旧标题` or `旧五点` unless the user specifically requests it.
6. Read the records again after the update and report the ASIN/SKU rows that were successfully verified.
7. If table access is denied, report the exact access error and do not attempt alternate destructive writes.

## Final Checklist

- [ ] All copy is grounded in supplied product evidence.
- [ ] Each active variant has accurate specifications.
- [ ] Title and Item Highlight limits are verified by code.
- [ ] Item Highlight matches requested sentence/phrase format.
- [ ] Bullet lead-ins follow requested capitalization.
- [ ] Keyword relevance outweighs raw traffic.
- [ ] VOC evidence is not overstated.
- [ ] Unverified service, warranty, certification, or performance claims are excluded.
- [ ] Bitable write-back, if requested, is verified after update.
