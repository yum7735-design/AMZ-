---
name: voc-needs-map
description: Build ecommerce user-needs maps from product spreadsheets, category VOC, product VOC, review exports, and related research inputs. Use when Codex needs to turn product facts plus review evidence into structured outputs such as Persona, JTBD, Scene, Workflow, functional pain points, communication pain points, packaging pain points, decision drivers, emotional needs, purchase drivers, listing implications, or a Markdown/HTML report.
---

# VOC Needs Map

Build a needs map that explains what users are trying to achieve, where they fail, and how the listing or product should respond. Prefer evidence-backed synthesis over generic VOC summarization.

## Workflow

1. Read the product-scope inputs first.
   Typical inputs include a product spec workbook, parent/child ASIN table, listing export, or manually provided scope such as a target parent ASIN, product family, or variation.

2. Decide the evidence stack before writing conclusions.
   Common input layers:
   - product facts: specs, variation logic, pack form, size, color, material, structure
   - category VOC: broad buying logic, common frustrations, segment patterns, decision criteria
   - product VOC: variation-specific or ASIN-specific wins, losses, scenario boundaries, claim risk

3. Normalize the target scope.
   State:
   - which product or family is in scope
   - whether VOC is category-level, product-level, or mixed
   - whether the product VOC includes merged child reviews
   - which evidence is direct observation vs. inference

4. Extract findings in four buckets.
   - user roles: who is buying and in what share or priority order
   - job and scenario logic: what result they want and where they use the product
   - friction and failure: product issues, packaging issues, listing confusion, setup mistakes
   - conversion logic: what makes them trust, choose, and finally buy

5. Write the fixed needs-map modules.
   Read `references/output-modules.md` before drafting the final report.

6. Render the deliverable in Markdown first.
   Save a clean Markdown report that is easy to edit and audit before creating HTML.

7. Render HTML when the user asks for a presentation-friendly file.
   Use `scripts/render_needs_map_html.py` with the Markdown report as input.

## Input Rules

- Inspect workbook sheets and headers before assuming field meanings.
- Filter to the requested parent ASIN, product family, or variation set before synthesizing.
- If the user only provides pre-made VOC HTML or PDF outputs, treat them as secondary evidence and do not invent raw counts that are not present.
- If raw reviews are available, prefer them over summarized commentary for quote selection and quantification.
- If category VOC and product VOC disagree, keep both and explain whether the product is outperforming, underperforming, or operating in a narrower scenario.
- If the product is easy to misuse, make scenario boundaries explicit instead of burying them in caveats.

## Output Standard

- Separate observation from inference.
- Quantify findings whenever the source supports it.
- Keep quotes short and representative.
- Use the buyer's desired result, not just internal product terminology.
- Make the final report useful for product, listing, and creative teams at the same time.
- When evidence is incomplete, name the gap directly.

## Deliverable Pattern

Default output:
- one Markdown report
- one HTML report when requested

Default save location:
- user-specified folder when provided
- otherwise a project report folder such as `voc-reports/`

## Resources

Read these only when needed:
- `references/input-evidence.md`: input handling, evidence hierarchy, and scope normalization rules
- `references/output-modules.md`: required needs-map sections and what each section must contain
- `scripts/render_needs_map_html.py`: convert a Markdown needs-map report into a styled HTML deliverable
