---
name: offsite-content-intelligence
description: "Discover, verify, deduplicate, and structure off-site product videos across public platforms. Use for evidence-led product-use video research and reusable Feishu/Bitable import tables; not for creator outreach or posting."
---

# Offsite Content Intelligence

Build an evidence-led database of public product videos before drawing product or Listing conclusions. The outcome is a deduplicated, source-traceable table that can be imported into a spreadsheet or Feishu Bitable.

## Scope and setup

- Identify the product/category, marketplace/geography if supplied, target use cases, and the user's required platforms. Do not silently substitute a different product class.
- Start with the user's platform priority. Default priority when none is given: YouTube, TikTok, Instagram, Facebook, Reddit, Google Video, brand sites, and named competitor brands.
- Read [the field schema](references/field-schema.md) before creating a database or import file.
- Use public, accessible content only. Do not log in, bypass access controls, resolve CAPTCHAs, or claim to have viewed a video that cannot be played or inspected.

## Discovery workflow

1. Build a keyword matrix instead of using one search phrase. Cover product/category terms, operating/drive modes, user scenarios, content formats, competitor brands/models, and material/specification terms.
2. Search in focused batches by intent, not by blindly enumerating query variants. Record the exact search terms used and collection date.
3. Expand the matrix only with new terms supported by discovered public evidence: brands, models, wire/material types, usage contexts, features, and repeated questions. Label the term as discovered rather than treating it as an established market fact.
4. Prefer real user operation, creator-led tests, and real DIY/workshop use over official advertising. Retain official material only when it provides a useful product or creative benchmark.
5. Canonicalize URLs and deduplicate by platform video ID first. For probable re-uploads or syndicated clips with different IDs, retain the most primary/complete/engaged source and mark the reason for excluding the other record.

## Evidence discipline

- Never invent views, likes, comments, date, duration, model, scenes, wire/material types, user opinions, or on-screen actions. Use `—` or `Not publicly captured` when unavailable.
- Separate **actual extraction** from **AI interpretation**. Metadata and literal title/description claims are extraction; video-type, creator/user type, inferred drive mode, likely scene, and priority rationale are interpretations and must say what supports them.
- Never turn a search match into a content claim. A video surfaced by a `Romex` search does not establish that it shows Romex unless the page or footage supports it.
- For each record, keep an evidence/provenance note: e.g. `detail page JSON-LD`, `visible result metadata`, `public Google result only`, or `fully watched`.
- Treat public counts as time-sensitive. Preserve the display value and collection date rather than presenting it as a permanent total.
- Do not use incomplete-access platforms as ranking evidence. Short-form leads without accessible metrics/content can remain C-level leads but should be excluded from a data-driven Top list.

## Value classification and ranking

Use these defaults unless the user supplies a rubric:

- **S**: creator-led real operation with multiple tests, setup/adjustment, outcome/result, comparison, or rich real-world context; engagement strengthens but does not replace evidence.
- **A**: useful independent review, tutorial, test, comparison, or authentic DIY/workflow with clear product relevance.
- **B**: official demo, simple demonstration, unboxing, or otherwise limited but useful reference.
- **C**: advertisement, repost, weakly evidenced short-form lead, duplicate, or little/no operation.

Rank a Top list with transparent qualitative ordering: content richness × user authenticity × publicly captured engagement. Do not manufacture a numeric score just to rank.

## Deliverables

Produce the requested format. For a database, use the fields in the schema. Include:

- A complete video database with canonical URL and provenance.
- A Top list with why it matters, what to inspect, and a cautious statement of potential Listing/creative relevance.
- A short factual-observations section. Clearly separate counts/extracted patterns from AI hypotheses; do not jump to final strategy unless asked.
- When Feishu Bitable import is requested, produce one flat table with Chinese headers, blank `飞书记录ID`, `回填状态`, `人工复核状态`, and `人工备注` columns. Use an `.xlsx` with one data sheet; add UTF-8 CSV only if it would help the user's import workflow.

## Stop conditions and limitations

- State which platforms were actually searched and which were inaccessible or lacked complete public metadata.
- Do not pad a Top 30 if fewer than 30 candidates satisfy the inclusion standard. Return the valid count and keep remaining leads separate.
- Do not claim visual facts unless the video was watched/inspected. When only metadata is available, provide a link and a verification task rather than a fabricated content description.
