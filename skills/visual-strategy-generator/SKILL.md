---
name: visual-strategy-generator
description: Create Amazon listing image strategies from product spreadsheets, user-needs maps, keyword demand matrices, VOC summaries, and related research inputs. Use when Codex needs to plan a main image and secondary images such as Image 2-7, map user pain points to visuals and copy, or deliver the result in a fixed planning table or Excel workbook for ecommerce creative execution.
---

# Visual Strategy Generator

Build an evidence-based image plan instead of a generic feature list. Tie each image to a user concern, the conversion job it needs to do, the scene that should be shown, and the copy that should appear on the asset.

## Input Conditions

Accept any combination of the following inputs:
- product information files such as `.xlsx`, `.csv`, listing exports, or structured specs
- user-needs maps, VOC summaries, review mining outputs, or persona notes
- keyword demand matrices, search-intent research, ad search-term reports, or SEO notes
- optional competitor screenshots, existing listing images, packaging references, or product briefs

Minimum viable input:
- one product information source
- one demand or VOC source

Best-practice input set:
- product information
- user-needs or VOC map
- keyword demand matrix

Extract or infer these fields before writing the image plan:
- product type
- variation logic such as size, color, count, length, or pack form
- core promised result
- top purchase scenarios
- top mispurchase or misuse risks
- top buyer objections

## Workflow

1. Read the product inputs first.
   Typical inputs include product spreadsheets, listing exports, VOC reports, user-needs maps, keyword demand matrices, competitor notes, or existing listing images.

2. Identify the product frame before writing any image idea.
   Confirm:
   - product type and variation logic
   - core functional promise
   - most likely purchase scenario
   - misuse or mismatch risks
   - what makes this product different from adjacent product types

3. Extract evidence in four buckets.
   - Product facts: size, color, pack form, structure, included parts, material, performance claims
   - VOC pain points: confusion, trust gaps, failure fears, setup friction, mismatch complaints
   - User needs: what result the buyer wants, not just what feature exists
   - Keyword intent: what shoppers are explicitly trying to confirm before purchase

4. Decide the image sequence by conversion priority, not by feature inventory.
   Default order:
   - Main image: clarify exactly what the product is
   - Image 2: prove the primary result
   - Image 3: remove the biggest selection or compatibility doubt
   - Image 4: prove the highest-value scene or trust claim
   - Image 5: reduce usage friction with a simple process
   - Image 6: clarify use-case boundaries or best-fit scenarios
   - Image 7: reinforce pack form, quantity, storage, included items, or finishing quality

5. Write the plan in a fixed table.
   Required columns:
   - `图片`
   - `目的`
   - `VOC痛点`
   - `用户需求`
   - `画面`
   - `文案`

6. Keep every row executable for a designer.
   The `画面` field should describe what must be shown, not vague creative direction. The `文案` field should be short, conversion-oriented, and suitable for on-image copy.

7. Export to Excel when the user asks for a workbook deliverable.
   Use the spreadsheets skill for `.xlsx` output. Keep one execution sheet with the full table and, when useful, add a source-notes sheet that records the evidence used.

## Decision Rules

- Lead with the buyer's desired result, not the brand's internal terminology.
- Prefer one image per major objection. Do not overload a single image with unrelated claims.
- If the product is easy to confuse with nearby product types, spend the main image and one early secondary image reducing mispurchase risk.
- If compatibility or size selection is the biggest blocker, move that topic earlier.
- If trust depends on harsh-environment use, show finished outcomes in realistic scenes rather than empty lifestyle imagery.
- If the product requires correct setup or tooling, dedicate one image to simple usage instruction.
- If some common use cases are a poor fit, say so clearly to prevent refunds and negative reviews.

## Output Standard

Always produce:
- a short strategy summary
- one `主图规划` row
- rows for `Image 2-7` unless the user asks for a different count

Default tone:
- specific
- conversion-oriented
- evidence-based
- easy for a designer or listing operator to execute

## Excel Deliverable

When exporting to Excel:
- keep the main planning table in a clear first worksheet
- freeze the header row
- wrap text for `VOC痛点`, `用户需求`, `画面`, and `文案`
- use a second sheet for source notes when the inputs are complex
- do not bury the fixed planning table inside narrative text blocks

## References

Read these only when needed:
- `references/output-patterns.md`: fixed table format, sequencing logic, and common image-angle patterns
