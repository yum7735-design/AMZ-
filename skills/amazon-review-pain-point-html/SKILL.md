---
name: amazon-review-pain-point-html
description: Extract evidence-backed product-use pain points from Amazon reviews and deliver a Chinese interactive HTML report with scene/JTBD cross-analysis and CSV export. Use for review pain-point analysis; do not use for JTBD-only, feature-request, or product-recommendation analysis.
---

# Amazon Review Pain Point HTML

Identify what goes wrong while users carry out their actual task with the product. This skill answers only: what problem, difficulty, failure, limitation, or unsatisfactory outcome did users encounter?

Use it after usage-scene and/or JTBD analysis when those artifacts are available. Do not turn pain points into feature requirements, improvement proposals, purchase reasons, product advantages, or new-product recommendations.

## Inputs and scope

- Confirm marketplace, product inclusion/exclusion rule, and total count of original reviews before classifying. A temporary table filter is not a confirmed data scope.
- Retain review ID, original title/body, and available Chinese translation verbatim. Every original review must appear in the detail output.
- Reuse validated `Main Scene → Sub Scene → Specific Application` and JTBD fields when present. If unavailable, leave them `Not Mentioned`; do not invent them to make pain-point tables fuller.
- Use the original review count as the denominator. A review may have multiple pain points, but count it only once per pain-point label in each summary.

## Evidence-first classification

Only classify a pain point when the review provides direct or clearly implied evidence of an actual issue. Quote the shortest supporting sentence as Evidence.

- Direct complaint: “The tubing never shrunk tight enough.” → `Insufficient Shrink / 收缩不充分`.
- Failure or negative outcome: “Water got into the connection.” → `Water Ingress / 进水`.
- Difficulty: “Hard to get over the connector.” → `Difficulty Fitting Over Connector / 难以套过连接器`.
- Workaround: “I had to use two layers.” → record the pain point plus the exact workaround sentence.
- User expectation with no confirmed failure: “I wish it had better waterproofing.” → `Inadequate Waterproofing / 防水能力不足`, `Evidence Type = User Expectation`; do not state that water entered.

Do not infer problems from product theory, application context, rating, or marketing language. A boat application does not prove water ingress; “marine grade” does not prove sealing failure. Positive statements such as “doesn't melt” or “doesn't tear” are not pain points.

Read [references/pain-point-taxonomy.md](references/pain-point-taxonomy.md) before classification.

## Exceptions and boundaries

- `No Pain Point`: the review expresses no actual product-use problem.
- `User Selection Issue`: the reviewer explicitly chose the wrong size, failed to measure, or says the mismatch is their mistake. Keep it in detail but exclude it from product-use pain-point ranking.
- `Not Product Related`: shipping, delivery, seller service, or unrelated damage. Keep it in detail but exclude it from ranking.
- `Product Information Mismatch`: listing/advertised quantity or length does not match the received item. Keep separate from in-use defects unless the review also states a concrete use failure.
- Split independent problems in one review into separate rows; do not combine them as generic “quality issue.”

## Severity and confidence

- `High`: core task cannot be completed or protection/connection fails (cannot shrink, cannot install, no bonding, confirmed water ingress, unusable deformation or tearing).
- `Medium`: task remains possible but fit, reliability, amount, length, or handling is materially impaired.
- `Low`: minor inconvenience such as labels, organization, or mild packaging friction.
- `Confidence = High` for direct complaint, failure, difficulty, or result; `Medium` for stated expectation; `None` for `No Pain Point`.

Set `Evidence Type` to one of: `Direct Complaint`, `Failure`, `Difficulty`, `Negative Result`, `Workaround`, `User Expectation`, `Other`, `None`.

## Required detail schema

For each pain-point row output:

`Review ID`, `Main Scene`, `Sub Scene`, `Specific Application`, `JTBD`, `Pain Point`, `Pain Point Category`, `Evidence`, `Evidence Type`, `Workaround`, `Severity`, `Confidence`, original review, and Chinese review.

## Required Chinese HTML deliverable

Create a self-contained offline HTML report and use a UTF-8 BOM CSV export of the current filter result. Safely escape review text in embedded data and guard exported cells against spreadsheet formula interpretation.

Include:

- Top 20 overall pain-point ranking with count and mention rate.
- Pain-point-category distribution.
- Severity matrix and `Frequency × Severity` opportunity score, using High=3, Medium=2, Low=1. Describe the score as within-dataset prioritization only.
- `Main Scene × Sub Scene × Pain Point` and `JTBD × Pain Point` tables, with clearly stated denominators.
- Workaround pain points with exact evidence.
- Representative evidence for frequent pain points.
- Detail filters at minimum for keyword, main scene, sub scene, JTBD, pain-point category, pain point, severity; search original review, Chinese review, evidence, workaround, and identifiers.
- Rows for `No Pain Point`, `User Selection Issue`, `Not Product Related`, and `Product Information Mismatch` must remain accessible in the detail table, even though they are excluded from product-use rankings.

## Quality check

Before delivery, manually sample at least 20 labelled reviews across categories and severities. Confirm that each cited sentence supports the label; positive or generic language is not misclassified; exceptions are excluded from rankings; independent multi-pain reviews are split; and pain-point names are unified. Correct the taxonomy or rows before reporting results.

State the output path, scope, pain-point-only boundary, and the strict evidence rule in the final response.
