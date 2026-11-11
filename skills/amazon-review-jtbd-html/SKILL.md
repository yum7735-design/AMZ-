---
name: amazon-review-jtbd-html
description: Extract evidence-backed JTBD from Amazon reviews and deliver an interactive Chinese HTML report with filters, scene cross-analysis, and CSV export. Use when users ask what customers are trying to accomplish in a use scenario; do not use for pain points, feature requests, or product-development recommendations.
---

# Amazon Review JTBD HTML

Extract users' actual tasks from Amazon review text. This skill answers only: what is the user trying to accomplish?

Use it for JTBD, usage-task, or “场景 × 任务” analysis. Do not extend the work into product features, pain points, purchase reasons, advantages/disadvantages, or new-product recommendations unless separately requested.

## Inputs and scope

- Confirm marketplace, product filter, total original-review count, and exclusions before analysis. A temporary table-view filter is not part of scope unless confirmed.
- Retain source review ID, original title/body, and available Chinese translation verbatim.
- If a validated usage-scene analysis exists, reuse its Main Scene → Sub Scene → Specific Application values. Do not force a JTBD onto a scene when task evidence names another object.
- Every source review must appear in the detail output. Use Not Mentioned when it lacks an explicit task.

## JTBD standard

Write a job as object + action + intended result.

Examples:

- 修复充电线破损端部，防止损伤进一步扩大。
- 密封船舶线缆连接处，降低水分进入的风险。
- 覆盖裸露导体，恢复外部绝缘保护。
- 加固线缆接头，减少弯折和拉扯造成的损坏。

Do not label a product attribute or capability as the job. Waterproofing, insulation, adhesion, heat resistance, abrasion resistance, shrink ratio, sealing performance, and cable protection become a task only when the review explicitly states what the user is doing and, where stated, the desired result.

Read [references/jtbd-taxonomy.md](references/jtbd-taxonomy.md) before classification.

## Evidence rules

- Require an explicit user action, use, need, or intended application. Product-description language, test outcomes, generic capability claims, and marketing labels do not qualify by themselves.
- Quote the shortest sentence that proves the task as JTBD Evidence.
- One review may have multiple tasks only where independent actions or goals are explicit. Keep separate rows per task and preserve the review ID.
- Do not infer sealing from a boat, waterproof product language, or marine-grade wording. Do not infer repair merely from “broken”, “damaged”, or a product complaint without a user repair action.
- Confidence: High for explicit first-person action/need and named object; Medium for a clear task with incomplete actor/object; Low for a weak but non-forced cue; None for no task evidence.

## Required output

For each review-task row include Review ID, Main Scene, Sub Scene, Specific Application, JTBD, JTBD Type, JTBD Evidence, Confidence, original review, and Chinese review when present.

Use original-review count as the denominator. Count each review once per JTBD type in summaries, even if it produces multiple detail rows.

For HTML, create a standalone Chinese HTML file with:

- Overall JTBD type ranking and mention rate.
- Main Scene × JTBD and Sub Scene × JTBD tables, plus ranked scene + JTBD combinations.
- JTBD Not Mentioned count/rate.
- Representative evidence for each frequent task type.
- Keyword, main scene, sub scene, specific application, JTBD type, and confidence filters.
- Search across original/Chinese review, evidence, and source identifiers.
- CSV download of only filtered rows, encoded with UTF-8 BOM and guarded against spreadsheet-formula interpretation.
- Safely embedded data, so review text cannot terminate scripts and the report works offline.

## Quality check

Before delivery, sample at least 20 task-labelled reviews. Verify that each task comes from the cited sentence, abilities were not labelled as jobs, multi-task rows are independent, similar jobs share wording, and scene × JTBD matches the evidence object. Correct the taxonomy or detail rows before reporting results.

State the report path, scope, and task-only boundary in the final answer.
