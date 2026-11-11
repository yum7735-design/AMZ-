---
name: amazon-review-tag-chain-html
description: Analyze Amazon reviews as an evidence-backed Main Scene → Sub Scene → JTBD → Pain Point → User Need → Product Capability tag chain, then deliver an interactive Chinese HTML coverage report. Use for combined review-tagging, tag coverage, or five-layer VOC chain analysis; not for product-spec or launch recommendations.
---

# Amazon Review Tag Chain HTML

Create one auditable, review-level tag-chain analysis that explains where the product is used, what the user tries to accomplish, what goes wrong, what outcome is needed, and what ability the product must have. The deliverable is a self-contained Chinese HTML report plus in-browser CSV export.

## Scope and source integrity

- Confirm marketplace, product filter, source table/view, and total original-review count before analysis. Apply a product-name filter only when the user explicitly supplies it.
- Retain review ID, ASIN, product name/brand, rating, date, original title/body, and an available Chinese-review field verbatim. Do not generate a translation to replace missing source text.
- Represent every source review in the detail dataset. Use `Not Mentioned` at a layer when evidence is absent; do not remove neutral reviews to make tag rates look higher.
- Use the original-review count as the denominator for every mention rate. For a label, count distinct review IDs once; a review can contribute to several independently evidenced labels.
- Read [references/report-contract.md](references/report-contract.md) before classifying or building the HTML.

## Tagging hierarchy and evidence standard

Maintain one traceable chain per independently evidenced item:

`Main Scene → Sub Scene → Specific Application → JTBD → Pain Point → User Need → Product Capability`.

- **Scene:** classify only explicit device, object, vehicle, vessel, machinery, or concrete application evidence. Use `Main Scene → Sub Scene → Specific Application`; normalize clear synonyms. Do not infer a scene from marketing claims or product-category theory.
- **JTBD:** state `object + action + intended result`. A product property (for example waterproofing, insulation, adhesion, durability, heat resistance) is not a job unless the review states the user's actual action or goal.
- **Pain point:** record an explicit complaint, failure, difficulty, negative result, stated expectation, or relevant workaround. Keep `No Pain Point`, user-selection issues, product-information mismatches, and non-product issues in detail; exclude those exceptions from product-use pain rankings.
- **User need:** phrase the desired outcome/value, not a material, exact parameter, SKU, structural solution, or feature list. Infer a per-review need from a concrete pain only when the outcome is direct and non-speculative.
- **Product capability:** phrase a verifiable ability that answers the user need; never label a material, construction, exact dimension, shrink ratio, or product proposal as a capability.
- Split multiple rows only for independently expressed scenes, tasks, pains, needs, or capabilities. Do not force a full chain: a review may have a scene without a JTBD, or JTBD without a pain point.
- Quote the shortest source phrase that supports every non-`Not Mentioned` label, preserve its evidence level/confidence, and prevent generic praise, star ratings, and listing copy from creating tags.

## Evidence levels

- **High / Level A:** direct user action, task, desired outcome, complaint, or explicit capability expectation.
- **Medium / Level B:** a concrete pain unambiguously supports the outcome or capability.
- **Low:** a weak but non-forced cue; retain in detail but do not promote as a core finding.
- **Pattern-based / Level C:** summary-only corroboration across multiple independent reviews; never use it to create an unsupported individual-review tag.
- **None:** no evidence. Report `Not Mentioned` rather than guessing.

## Required analysis and HTML

Build a standalone offline Chinese HTML report that embeds the full normalized review-level dataset safely. At minimum include:

1. Scope card: product filter, marketplace, original-review count, multi-label rule, evidence rule, and calculation denominator.
2. Five-layer coverage: distinct-review count and rate for Scene, JTBD, product-use Pain Point, User Need, and Product Capability, plus explicit `Not Mentioned` / untagged coverage.
3. A main-scene × sub-scene matrix that shows scene review count/rate and each layer's distinct-review coverage. Main scene and sub scene must be separate columns, never collapsed into a single ambiguous label.
4. Rankings for main scenes, sub scenes within their main scene, JTBD, product-use pain points, needs, and capabilities. State that multi-label scene rates can sum above 100%.
5. Chain views: `Scene → JTBD`, `JTBD → Pain Point → Need`, and complete `Main Scene → Sub Scene → JTBD → Pain Point → Need → Capability` combinations. Clearly distinguish zero / absent evidence from an exception.
6. Tag-combination distribution at review level, such as `JTBD + Need + Capability` or `No explicit tag`, using mutually exclusive combinations of the five layers.
7. Representative evidence for frequent labels. Do not make market-sizing, product-design, material, parameter, pricing, or launch recommendations unless separately requested.
8. Review-level detail table with all source fields, the full tag chain, evidence, confidence/level, and exception label.

Include keyword search across source text, Chinese text, identifiers, scenes, labels, and evidence; filters for main scene, dependent sub scene, JTBD, pain point, need, capability, confidence/evidence level, and combination status; reset; and export of the currently filtered rows.

## HTML and CSV safety

- Embed data with JSON escaping that prevents review text from terminating a script. The report must run offline with no server or third-party dependency.
- Export UTF-8 BOM CSV; quote every field and prefix values beginning with `=`, `+`, `-`, or `@` to prevent spreadsheet-formula execution.
- Make the export columns match the detail table, including main scene and sub scene as separate fields.

## Validation before delivery

- Sample at least 20 non-`Not Mentioned` records across labels and evidence levels. Correct inferred scenes, properties mislabeled as JTBD, positive statements mislabeled as pains, and solution-language mislabeled as needs/capabilities.
- Verify every source review ID appears in detail output; summary counts use distinct review IDs; original-review total is the shared denominator; and per-label rates reconcile to the embedded data.
- Verify the main-scene/sub-scene matrix, dependency of filters, search, reset, and CSV controls; parse-check client-side JavaScript; and visually inspect the saved report in a browser when available.

Deliver the output path, data scope, original-review count, and a brief caveat that the results reflect review evidence rather than market sizing.
