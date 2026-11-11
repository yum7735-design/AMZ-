---
name: voc-analysis-claude
description: |
  Amazon VOC (Voice of Customer) analysis for product development, selection, and iteration.
  
  Use this skill whenever the user mentions: VOC analysis, 卖家之声, seller voice, product review analysis, 
  选品开发, product selection, product improvement, 产品改进升级, competitive product analysis, 
  竞品分析, Amazon reviews, customer pain points, product opportunity mining, or wants to understand 
  what customers are saying about a product category.
  
  This skill is for deep, structured VOC analysis — not simple review summarization. It produces 
  multi-chapter reports covering executive summary, market logic, usage scenarios, purchase drivers, 
  negative review clustering, specification matrices, competitor analysis, opportunity mining, 
  bundle recommendations, and listing optimization.
---

# VOC Analysis Skill

Analyze Amazon product reviews to extract actionable product development insights. The goal is NOT to summarize reviews, but to mine user needs, product defects, market opportunities, and differentiation angles — then produce structured reports for product managers, supply chain teams, and marketing.

## Core Philosophy

```
VOC --> Product Development --> Listing Strategy --> Operations
```

Every analysis must answer: **"What should we build, why should we build it, and how should we sell it?"**

## Workflow

### Phase 1: Data Intake

Determine which input method the user provides and handle accordingly:

**Method A: Review Files (Recommended for deep analysis)**
- Accept CSV, Excel (.xlsx), Helium10 export, JiaMaiLing (卖家精灵) export, or third-party VOC tool exports
- Required fields: Review Title, Review Content, Rating
- Recommended fields: Date, ASIN, Variation, Verified Purchase
- Parse the file, identify columns, validate data quality
- If column names are ambiguous, ask the user to map them

**Method B: ASIN / Listing URLs (Quick research)**
- Accept Amazon ASINs, listing URLs, or multiple competitor links
- Limit: ≤10 ASINs per run, ≤500 reviews per ASIN
- Use available tools to fetch reviews. If web fetching is unavailable, ask the user to provide exported review files
- Clean: deduplicate, filter non-English (unless user requests otherwise), flag verified purchases

**Method C: Hybrid (Best practice for enterprise)**
- Combine review files + competitor links + category keywords
- Merge: Review VOC + Search Intent + Scenario Keywords + Pain Point Keywords
- This produces the most comprehensive analysis

### Phase 2: Review Processing

1. **Clean & Normalize**: Remove empty reviews, normalize whitespace, deduplicate
2. **Sentiment Classification**: Classify each review as positive (4-5 star), neutral (3 star), negative (1-2 star)
3. **Entity Extraction**: Extract mentioned specifications (sizes, colors, materials, lengths, etc.)
4. **Scenario Tagging**: Tag each review with usage scenarios (DIY, automotive, marine, industrial, home, etc.)
5. **Pain Point Clustering**: Cluster negative reviews by topic using keyword co-occurrence

### Phase 3: Analysis

Execute the standard 10-chapter framework. See [references/analysis-framework.md](references/analysis-framework.md) for detailed instructions on each chapter.

**Core chapters (always include):**

| # | Chapter | Core Question |
|---|---------|---------------|
| 1 | Executive Summary | What's the #1 opportunity and #1 risk? |
| 2 | Market Logic | Why do users buy this category? |
| 3 | Usage Scenarios | Where and how is the product used? |
| 4 | Purchase Drivers | What makes users click "buy"? |
| 5 | Negative Review Analysis | What's causing returns and bad ratings? |
| 6 | Specification Matrix | Which specs matter most? |
| 7 | Competitor Structure | What are top sellers doing right/wrong? |
| 8 | Opportunity Mining | What gaps exist in the market? |
| 9 | Bundle Recommendation | What SKU combinations win? |
| 10 | Listing Optimization | How should we present the product? |

**Category-adaptive extensions**: Beyond the core chapters, add category-specific analysis sections. For example, for tools/equipment add durability and compatibility analysis; for consumables add repurchase cycle analysis. Let the data guide what additional sections are valuable.

### Phase 4: Report Generation

Generate reports at three levels:

**Level 1: HTML Report (default)**
- Always generate a self-contained, browser-ready HTML report
- Use professional styling, clear typography, responsive data tables, and color-coded severity
- Include charts only when the underlying counts are reliable; do not fabricate visual evidence
- Use CSS `@page` so the HTML is print-ready on A4

**Level 2: Alternate Formats (only on request)**
- Generate Markdown only when the user explicitly asks for a discussion draft or Markdown file
- Generate PDF only when the user explicitly asks for a PDF or management-review print deliverable

**Level 3: Feishu Integration (optional)**
- Generate Feishu table summaries
- Create structured documents for team sync
- Link to multi-dimensional tables

### Output File Location

All reports are saved under `voc-reports/` in the current project root, organized by product name:

```
voc-reports/
└── <product-name-slug>/
    ├── <product>-voc-analysis.html      # Default HTML report (always generated)
    ├── <product>-voc-analysis.md        # Optional Markdown discussion draft
    ├── <product>-voc-analysis.pdf       # Optional PDF report
    ├── charts/                          # Extracted charts for Feishu/PPT
    │   ├── sentiment-distribution.png
    │   ├── wordcloud-pain-points.png
    │   └── scenario-breakdown.png
    └── data/                            # Intermediate data (auditability)
        ├── reviews-cleaned.csv
        ├── sentiment-scores.csv
        └── pain-point-clusters.csv
```

**Naming convention**: `<product-category>-<market>-voc-analysis`
- Example: `heat-shrink-tubing-roll-us-voc-analysis.html`
- Use lowercase, hyphens, keep under 80 chars

**If the user specifies a different output path, follow their instruction.**

### Scope Rules

- **Default**: Amazon US only (largest review volume, most direct user expression)
- **Multi-site**: If user requests, expand to UK (usage habits), DE (industrial/parameter sensitivity), JP (refinement needs). Always separate VOC by market — never mix languages or regional preferences.
- See [references/multi-site-scope.md](references/multi-site-scope.md) for detailed rules.

## Important Constraints

1. **Never fabricate data.** If review data is insufficient for a conclusion, state "insufficient data" rather than guessing
2. **Always distinguish correlation from causation.** "Users who mention X also complain about Y" vs. "X causes Y"
3. **Quantify when possible.** Prefer "23% of negative reviews mention X" over "many users complain about X"
4. **Preserve user voice.** Include direct quotes from reviews to ground analysis in real customer language
5. **Source traceability.** Link findings back to specific review excerpts so conclusions are auditable

## Output Templates

### Executive Summary Format

```markdown
## Core Judgment
[1-2 sentences on the biggest insight]

## Top 3 Opportunities
| Rank | Opportunity | Value |
|------|-------------|-------|
| 1 | ... | Highest / High / Medium |

## Top 3 Risks
| Rank | Risk | Severity |
|------|-----|----------|
| 1 | ... | High / Medium / Low |

## Recommended Entry Strategy
[Bullet points on how to enter the market]
```

### Pain Point Table Format

```markdown
| Problem | User Language | Frequency | Severity | Solvable? | Solution Direction |
|---------|--------------|-----------|----------|-----------|-------------------|
| ... | "quote from review" | 23% of negative | High | Yes | ... |
```

## Automation

No bundled scripts are currently provided. Use available review-fetching tools when present; otherwise ask the user for exported review data. Add repeatable scripts only when a task genuinely requires them, then test them before reuse.
