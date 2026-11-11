---
name: amazon-ads-b2b-analysis
description: "Analyze Amazon US SP, SB, SBV and SD advertising exports, including enterprise campaigns named 企业购, and produce an evidence-based HTML report with campaign, ASIN and search-term actions."
---

# Amazon Ads B2B Analysis

Use this skill when the user provides Amazon advertising exports and asks for a combined SP / SB / SBV / SD, enterprise-purchase, Campaign, ASIN, or search-term performance analysis. Use it for Amazon US unless the user specifies another marketplace. Do not use it for a generic listing, product, or keyword-research task without advertising performance exports.

## Inputs and outputs

Expect three inputs:

1. Product information table, matched to advertising rows by ASIN where possible.
2. Promoted-products report, the only source for account-level Spend, Sales, and Orders.
3. Search-term report, used only for term, targeting, match-type, and optimization analysis.

Deliver a self-contained HTML report by default. Use the request's desired format if specified. Keep source files intact and write outputs to a clearly named subdirectory.

## Required classification rules

- Separate SP, SB, SBV, and SD. Never merge SB and SBV.
- If the source labels all Sponsored Brands rows alike, classify SBV only when an available Ad Format, Creative Type, Campaign Name, or Ad Name explicitly identifies video. Put unresolved brand rows in `SB-未分类`; do not guess.
- Treat a Campaign as enterprise purchase only when its Campaign Name contains the literal `企业购`. Do not infer enterprise status from `B2B`, `Business`, `Business Price`, or buyer-related text.
- If a source field is missing, state the limitation rather than deriving or fabricating it. In particular, do not invent the advertised ASIN for a search-term report that does not include one.

## Metrics and decision logic

Calculate aggregates from raw counts and currency: CTR = Clicks / Impressions; CPC = Spend / Clicks; CVR = Orders / Clicks; ACOS = Spend / Sales; ROAS = Sales / Spend. Do not average row-level rates.

Assess efficiency jointly with Spend, Sales, Orders, CTR, CPC, and CVR. Low Spend, low Clicks, or fewer than two orders is a small sample; label it as such and do not make it a primary scaling decision. Campaign quadrants must define their Spend and efficiency benchmarks within the relevant advertising-type / enterprise scope.

For budget leakage, prioritize material loss: high Spend plus poor ACOS/ROAS or excess cost versus the account benchmark. Do not label a tiny zero-order test as the account's biggest waste merely because it has zero orders.

For SB versus SBV comparisons, make the table readable: thousands separators for counts, dollar notation for Spend/Sales/CPC, percentages for rates, and percentage-point (`pp`) changes for CTR/CVR/ACOS. Explain that a higher ACOS or lower ROAS is worse efficiency.

## Report requirements

Use the required detailed report outline in [report-spec.md](references/report-spec.md). It includes executive findings, type comparison, SB vs SBV, enterprise analysis, Campaign and product matrices, search-term actions, and budget reallocation.

Generate an action list that names the Campaign, ASIN, or Search Term, cites its numerical evidence, and assigns P0/P1/P2. Recommend negatives carefully: a non-converting term is not automatically a negative; distinguish bid reduction, further observation, negative exact, and negative phrase based on spend, clicks, relevance, and intent.

## HTML readability

Use a responsive, standalone Chinese HTML document. Preserve wide tables with horizontal scrolling on small screens. Use clear section headings, visible table headers, and business-friendly number formats. The HTML should state the report period, data-source hierarchy, enterprise rule, SBV detection rule, and all material data limitations.
