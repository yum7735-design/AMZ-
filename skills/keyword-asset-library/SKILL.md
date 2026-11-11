---
name: keyword-asset-library
description: |
  Build a complete 13-sheet keyword asset library for any Amazon product line. Use when the user asks to build a keyword library, keyword asset library, or keyword database for a product line; when they have advertising reports (promoted products report, search term report), listing data, and Seller Sprite MCP access; when they need structured keyword assets for SEO, advertising, new product expansion, and product matrix decisions. Integrates product info, listing data, ad reports, search term reports, and Seller Sprite MCP data into a single decision-grade Excel workbook.
---

# Amazon Product Line Keyword Asset Library Builder

Build a data-driven keyword asset library for any Amazon product line by fusing up to 5 data sources into a structured 13-sheet Excel workbook.

## Step 0: Gather User Inputs

Collect these inputs. If some are already known from conversation context, don't re-ask. Group remaining questions into one message.

**Required:**
- **产品线名称** — e.g., Heat Shrink Tubing, Wire Connectors, Ratchet Screwdriver
- **品牌名** — e.g., haisstronica, TICONN
- **数据文件路径** — folder or individual paths to Excel files (产品信息表, Listing表, 广告报告, 搜索词报告)
- **种子关键词** — 1-2 core keywords for SellerSprite keyword_miner (e.g., "heat shrink tubing")

**Optional (use defaults if not provided):**
- **代表ASIN** — 5 representative ASINs for traffic_keyword. Default: pick top 5 by sales from product info.
- **品牌定位** — 专业/B2B/高端 or 性价比/大众. Default: 专业/高端.
- **输出路径** — Default: `Desktop/关键词库/{ProductLine}_Keyword_Asset_Library.xlsx`

**Auto-derived from brand positioning:**
- If 专业/高端: bonus words = professional, commercial, industrial, marine, contractor, electrical, automotive; penalty words = cheap, budget, low cost
- If 性价比/大众: bonus words = value, best seller, popular, top rated; penalty words = industrial grade, commercial grade

## Step 1: Read and Preprocess Data Sources

Use Node.js with the `xlsx` module. For Windows paths, always use `path.join('C:', 'Users', ...)` to avoid backslash escape issues.

**Handle missing files gracefully** — if the user only has 2 or 3 of the 4 files, proceed with what's available. The skill works with partial data; MCP data alone can produce a useful library.

### 1a. Product Info Table (产品信息表)
Read the Excel, filter to the target product line's ASINs (match by 产品线/类目/品名 column). Key fields: ASIN, 父ASIN, SKU, 品名, 产品定位, 生命周期.

### 1b. Listing Table
Merge with product info by ASIN. Key fields: 标题, 价格, 30日销量, 30日销售额, 30日广告费, 小类排名, Rating.

### 1c. Ad Report (广告推广商品报告)
Aggregate by ASIN: sum spend/sales/orders, calculate weighted ACOS. Save as JSON.

### 1d. Search Term Report (搜索词报告)
Filter by campaign name matching the product line. Aggregate by search term: sum impressions/clicks/spend/orders/sales, calc CVR/ACOS/CPC/CTR. Exclude ASIN-format terms (starting with "b0"). Save as JSON.

Save all intermediate data as JSON files in the working directory for traceability.

### Mandatory product-line attribution guardrail

Treat product-line isolation as a hard requirement, not a relevance heuristic. Apply this order when filtering the search-term report:

1. Keep rows whose advertised ASIN or SKU maps to the target product line.
2. If the report lacks ASIN/SKU attribution, keep a row only when both its campaign name **and** the user search term match a product-specific intent pattern derived from the seed keywords and representative ASIN titles.
3. Never use a generic or another product line's campaign label as a fallback match.
4. Exclude terms belonging to adjacent owned product lines (for example, terminals/lugs in a screwdriver library) from ad metrics, strategic keywords, profit keywords, and SEO suggestions. Save them in `cross_line_exclusions.json` with the reason instead of silently retaining them.

Build the intent pattern from the current line's data. Example: a ratcheting screwdriver line may admit `screwdriver|ratchet|ratcheting|driver bit`, but not `terminal|connector|lug|heat shrink` merely because those words occur elsewhere in the account.

For each retained ad term, clamp CVR to 100% if source attribution produces orders greater than clicks, and record the raw values in the intermediate JSON for auditability.

## Step 2: SellerSprite MCP Data Collection

Read `references/mcp-workflow.md` for detailed API call patterns and field mappings.

**2a. keyword_miner** — Seed = user's core keyword. Returns ~200 related keywords with searches, purchases, purchaseRate, SPR, products, supplyDemandRatio, monopolyClickRate, bid.

**2b. traffic_keyword** — Call for each of 5 representative ASINs. Gets actual traffic-driving keywords per ASIN.

**2c. traffic_extend** — Extends keyword coverage. Fetch page 1; note total pages for the user if > 1.

Hardcode MCP results as arrays in the build script — don't try to pass large result sets through tool chains.

## Step 3: Build Unified Keyword Pool

Merge all sources into one deduplicated pool keyed by `keyword.toLowerCase().trim()`:

```javascript
function addToPool(kw, source, data) {
  const key = kw.toLowerCase().trim();
  if (!key || key.length < 2) return;
  if (!kwPool[key]) kwPool[key] = { keyword: key, sources: [], market: {}, ad: {} };
  if (!kwPool[key].sources.includes(source)) kwPool[key].sources.push(source);
  if (source === 'miner' || source === 'traffic') Object.assign(kwPool[key].market, data);
  if (source === 'ad') kwPool[key].ad = data;
}
```

## Step 4: Classify Keywords

Read `references/classification-rules.md` for the framework. The key principle: **build classification patterns from the actual data**, not from a template.

After getting keyword_miner results, scan them to identify which attribute dimensions exist for this product line:
- Do keywords mention sizes/dimensions? → create 属性词-尺寸 patterns
- Do keywords mention colors? → create 属性词-颜色 patterns
- Do keywords mention materials? → create 属性词-材质 patterns
- Do keywords mention usage scenarios? → create 场景词 patterns
- etc.

This makes the classification work for any product line without hardcoding.

## Step 5: Score Keywords (100-point scale)

Read `references/scoring-methodology.md` for the full formula. The scoring has 6 components totaling 100 points: search volume (25), purchases (20), ad orders (20), CVR (15), competition (10), brand relevance (10).

Rating tiers: A+(>=85), A(70-84), B(55-69), C(40-54), D(<40).

**Calibration check:** After scoring, the top 1-3 core product keywords should score A+. If none reach A+, add a +5 "core keyword bonus" for the product's primary search terms when they have searches >= 5000. If too many reach A+, the bonus may be too generous.

## Step 6: ABCD Search Term Grading

Grade each search term from the ad report:
- **A-成交词**: orders >= 5 AND CVR >= 15%
- **B-潜力词**: orders >= 1 (or clicks >= 10 with orders 1-4)
- **C-流量词**: impressions >= 1000 AND clicks < 10
- **D-浪费词**: spend >= $10 AND orders = 0 (or clicks >= 5 AND orders = 0)

## Step 7: Four-Quadrant Analysis

Cross MCP search volume with ad conversion:

| | Orders >= 5 | Orders < 5 |
|---|---|---|
| **Searches >= 2000** | Q1: Must-win, invest heavily | Q2: Optimize listing or negate |
| **Searches < 2000** | Q3: Profit words, Exact low bid | Q4: Low priority, SEO only |

## Step 8: Generate 13-Sheet Excel

Read `references/excel-sheet-spec.md` for the complete specification of each sheet including column definitions and data generation logic.

The sheets cover: product structure, full keyword table, strategic keywords, profit keywords, product positioning keywords, ASIN-specific keywords, keyword tree, quadrant analysis, ABCD grading, new product opportunities, ad structure suggestions, SEO layout suggestions, and negative keyword list.

**Sheets 11 (广告结构) and 12 (SEO布局) are template-based** — the skill generates them dynamically using the product line's actual keyword data and product structure. See the reference for the 7-campaign ad structure template and SEO layout template.

## Step 9: Quality Verification

After generating the Excel, verify:
1. Total keyword count (expect 500-3000+ depending on category)
2. Top keyword scores are reasonable (core terms should be A+ or A)
3. ABCD distribution (A smallest, C usually largest)
4. Negative keywords don't include core product terms
5. Report summary to user: total keywords, grade distribution, profit word count, top 5 keywords with scores
6. Run a cross-line contamination audit before delivery: report the count of excluded cross-line terms and verify that no excluded-category token appears in Sheets 2-5, 9, 11, or 12. If any remain, fix the attribution filter and rebuild; do not deliver the workbook.

## Technical Notes

- **Node.js + xlsx module**: `const XLSX = require('xlsx')` for Excel I/O
- **Windows paths**: Always use `path.join('C:', 'Users', ...)` in Node.js eval
- **MCP spacing**: Space out MCP calls, especially traffic_keyword (5 separate calls)
- **Script approach**: Build a single self-contained .js script with all MCP data hardcoded as arrays, then run it once to generate the Excel
