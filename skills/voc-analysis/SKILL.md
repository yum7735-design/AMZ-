---
name: voc-analysis
description: |
  Analyze Amazon Voice of Customer data for product development, product selection, competitor benchmarking, and listing improvement.
  Use this skill when the user asks for VOC analysis, 卖家之声 analysis, seller voice analysis, review mining, Amazon review analysis,
  product opportunity mining, customer pain point clustering, product improvement recommendations, listing optimization based on reviews,
  competitive review comparison, or category-level customer insight reports.
---

# VOC Analysis

Analyze Amazon reviews and related VOC inputs to produce actionable product and market recommendations. Focus on product decisions, not lightweight summarization.

## Goal

Answer three questions with evidence:

1. What should we build or improve?
2. Why does the market want it?
3. How should we position and sell it?

## Intake

Choose the workflow based on the user input.

### Review file workflow

Use this path when the user provides CSV, XLSX, Helium10 exports, 卖家精灵 exports, or other VOC datasets.

- Require review text and rating fields
- Prefer title, date, ASIN, variation, and verified-purchase fields when available
- Inspect columns first and map them explicitly if names are ambiguous
- Clean duplicates, blank rows, and obviously malformed records before analysis

### ASIN or listing workflow

Use this path when the user provides Amazon ASINs or listing URLs.

- If review fetching tools are available, collect a bounded sample and state the sampling rule
- If review fetching is unavailable, ask the user for exported review files instead of fabricating data
- Keep market/language boundaries separate

### Hybrid workflow

Use this path when the user provides both review files and competitor listings or category keywords.

- Merge review evidence with competitor context
- Keep raw evidence traceable to its source

## Processing

Apply the following pipeline before writing conclusions:

1. Clean and normalize text
2. Segment by sentiment using rating as the first signal
3. Extract recurring entities such as size, material, durability, packaging, fit, compatibility, and accessories
4. Tag common usage scenarios
5. Cluster pain points and unmet needs
6. Quantify findings where the data supports it

## Analysis Framework

Run the standard 10-chapter framework. Read [references/analysis-framework.md](references/analysis-framework.md) before drafting the final report.

Always include:

| # | Chapter | Core Question |
|---|---------|---------------|
| 1 | Executive Summary | What is the main opportunity and main risk? |
| 2 | Market Logic | Why do users buy this category? |
| 3 | Usage Scenarios | Where and how is it used? |
| 4 | Purchase Drivers | What drives conversion? |
| 5 | Negative Review Analysis | What causes dissatisfaction, returns, or low ratings? |
| 6 | Specification Matrix | Which specs matter most? |
| 7 | Competitor Structure | What are top competitors doing right or wrong? |
| 8 | Opportunity Mining | What market gaps are visible? |
| 9 | Bundle Recommendation | Which combinations or accessory bundles make sense? |
| 10 | Listing Optimization | How should the offer be presented? |

Add category-specific sections only when the data supports them.

## Output Levels

### Level 1: Markdown discussion draft

Use this by default.

- Produce a clean Markdown report
- Keep the structure easy to edit and reuse
- Include tables for evidence-heavy sections

### Level 2: Formal deliverable

Use this when the user explicitly asks for presentation-ready output.

- Generate styled HTML and optionally PDF
- Include charts only when the underlying counts are reliable
- Keep the report auditable

### Level 3: Collaboration export

Use this only if the user asks for Feishu, Notion, or other downstream formatting.

## Output Location

Unless the user specifies a different destination, save outputs under `voc-reports/` in the current project root.

Use a slug like `<product-category>-<market>-voc-analysis`.

Examples:

- `heat-shrink-tubing-us-voc-analysis.md`
- `silicone-spatula-us-voc-analysis.html`

## Constraints

- Never fabricate missing evidence
- Separate observation from inference
- Quantify findings whenever possible
- Preserve representative customer language with short supporting quotes
- Make every important claim traceable to source reviews

## Reporting Patterns

Use this executive-summary skeleton:

```markdown
## Core Judgment
[1-2 sentences on the biggest insight]

## Top 3 Opportunities
| Rank | Opportunity | Value |
|------|-------------|-------|
| 1 | ... | Highest / High / Medium |

## Top 3 Risks
| Rank | Risk | Severity |
|------|------|----------|
| 1 | ... | High / Medium / Low |

## Recommended Entry Strategy
- ...
```

Use this pain-point table shape:

```markdown
| Problem | User Language | Frequency | Severity | Solvable? | Solution Direction |
|---------|---------------|-----------|----------|-----------|-------------------|
| ... | "review quote" | 23% of negative reviews | High | Yes | ... |
```

## Bundled Resources

- Read [references/analysis-framework.md](references/analysis-framework.md) for the chapter-by-chapter reporting framework
- Read [references/multi-site-scope.md](references/multi-site-scope.md) when the user wants non-US marketplaces or cross-market comparison

The `scripts/` directory is currently optional. If repeatable parsing, clustering, or report-generation code is needed, add scripts there instead of rewriting the same logic for every task.
