# Excel Output Specification — 13 Sheets

## Sheet 1: 产品线结构
Product line matrix with sales and ad performance.

Columns: ASIN, 父ASIN, SKU, 品名, 产品定位, 生命周期, 标题, 价格, 30日销量, 30日销售额, 30日广告费, 广告销售额, 广告ACOS, 广告订单, 小类排名, Rating总数, 评分

Sort by 30日销量 descending. Data source: merged product info + listing + ad report.

## Sheet 2: 关键词资产总表
The master keyword table — every keyword with full metrics and scoring.

Columns: 关键词, 分类, 月搜索量, 月购买量, 购买率, SPR, 商品数, 供需比, 点击集中度, PPC竞价, 广告曝光, 广告点击, 广告花费, 广告订单, 广告销售额, CVR, ACOS, 评分, 评级, 四象限, 搜索词等级, 数据来源

Sort by 评分 descending.

## Sheet 3: 战略词与流量词
Filter from Sheet 2: keywords with grade A+ or A only.

## Sheet 4: 利润词
Filter from Sheet 2: ACOS < 30% AND ad orders >= 3. These are proven profitable keywords.

## Sheet 5: 产品定位词
Sheet 2 data + an additional 产品定位 column tagging each keyword to a product sub-category (e.g., Kit套装, Roll成卷, specific series). Derive sub-categories from the actual product line structure.

## Sheet 6: ASIN专属词
Top converting search terms grouped by ASIN. For each of the top 10 ASINs (by ad spend or sales), list their top 30 search terms with: ASIN, 品名, 搜索词, 订单, 点击, CVR, 花费, 销售额, ACOS.

If ASIN-to-search-term mapping isn't available (search terms aren't tied to specific ASINs in the data), use the top converting search terms across all campaigns and note this limitation.

## Sheet 7: 关键词树
Hierarchical keyword grouping. Build these categories dynamically:

| Layer | What goes in it |
|-------|----------------|
| 产品线战略词 | A+ grade keywords |
| 产品线流量词 | Keywords with monthly searches >= 5000, excluding A+ |
| 产品线利润词 | Same as Sheet 4 |
| 属性词-尺寸 | All keywords classified as 属性词-尺寸 |
| 属性词-功能 | All keywords classified as 属性词-功能 |
| 属性词-颜色 | All keywords classified as 属性词-颜色 |
| 属性词-形态 | All keywords classified as 属性词-形态 |
| 场景词 | All keywords classified as 场景词 |
| 品牌词 | Brand + competitor brand keywords |
| 长尾词 | All keywords classified as 长尾词 |
| B端采购词 | Keywords matching bulk/industrial/commercial/professional/wholesale |

Columns: 层级, 关键词, 评级, 评分, 月搜索量, 广告订单

## Sheet 8: 四象限分析
Group keywords by quadrant with section headers and recommendations:

```
--- ①高搜索+高转化 (必争核心词) ---    建议: 加大投入，争取自然排名Top3
[keyword rows]

--- ②高搜索+低转化 (优化或否定) ---    建议: 检查Listing相关性，优化或精准否定
[top 30 keyword rows]

--- ③低搜索+高转化 (精准利润词) ---    建议: Exact Match低bid持续投放
[keyword rows]

--- ④低搜索+低转化 (低优先级) ---      建议: 暂不投放或仅做SEO覆盖
```

Columns per keyword row: 关键词, 月搜索量, 广告订单, CVR, ACOS, 评级

## Sheet 9: 搜索词ABCD
All search terms from ad report with ABCD grading.

Columns: 搜索词, 等级, 曝光, 点击, 花费, 订单, 销售额, CVR, ACOS, CPC

Sort by grade (A → B → C → D), then by 订单 descending within each grade.

## Sheet 10: 新品机会
Keywords with market opportunity but no current ad conversion. Criteria:
- Monthly searches >= 1000
- Purchase rate >= 10%
- Click concentration < 50% (market not monopolized)
- SPR <= 15 (achievable ranking)
- NOT already converting in your ads (no orders in search term report)

Columns: 关键词, 月搜索量, 月购买量, 购买率, SPR, 点击集中度, PPC竞价, 供需比, 机会分析, 建议方向

机会分析 logic:
- supplyDemandRatio > 2 → '供不应求，值得进入'
- monopolyClickRate < 0.35 → '市场分散，新品有机会'
- purchaseRate > 0.15 → '高转化率，精准需求'
- else → '中等机会'

Also add manual opportunity analysis rows based on your understanding of the product line — identify specific product gaps (e.g., a color/size/feature combination with search demand but no current product).

## Sheet 11: 广告结构建议
Template-based 7-campaign structure. Adapt the keyword examples to the actual product line:

| Campaign | Type | Keyword Source | Bid Strategy | Budget % |
|----------|------|---------------|--------------|----------|
| 1: Brand Defense | SP-Exact | Brand keywords | Fixed Bid, high | 5% |
| 2: Core Exact | SP-Exact | A+/A grade strategic keywords | Dynamic Down Only | 30% |
| 3: Profit Exact | SP-Exact | Profit keywords (ACOS<30%) | Fixed Bid, controlled | 20% |
| 4: Scene Broad | SP-Broad | Scene keywords | Dynamic Up & Down | 15% |
| 5: Long Tail Phrase | SP-Phrase | B-grade + long-tail keywords | Dynamic Down Only | 15% |
| 6: Auto Discovery | SP-Auto | Automatic | Dynamic Down Only | 10% |
| 7: Negative Keywords | Negative | D-grade waste keywords | - | - |

After the 7 campaigns, add product sub-category campaign groups — each major product variant gets its own campaign to avoid budget competition. Use actual parent ASINs and their product names.

## Sheet 12: SEO布局建议
Template-based SEO keyword allocation:

```
=== Title布局 (75字符限制) ===
  [Product Type 1 Title Template]: Core keyword + [quantity/spec] + top feature keywords
  [Product Type 2 Title Template]: Core keyword + [size/length] + feature keywords

=== Item Highlights布局 (125字符/条) ===
  Highlight 1: Primary functional feature → covers function attribute keywords
  Highlight 2: Specifications/variety → covers size/spec attribute keywords  
  Highlight 3: Usage scenarios → covers scene keywords
  Highlight 4: Quality/professional positioning → covers user/positioning keywords
  Highlight 5: Technical parameters → covers material/spec attribute keywords

=== Search Terms布局 (250字节) ===
  Priority 1: Core keyword synonyms/variants not in title
  Priority 2: Scene keyword supplements
  Priority 3: Foreign language long-tail (e.g., Spanish for US market)
```

Fill in actual keywords from the keyword pool for each slot.

## Sheet 13: 否定词库
D-grade waste keywords for campaign negation.

Filter: spend >= $10 AND orders = 0, OR clicks >= 8 AND orders = 0 AND spend >= $5.
Exclude: keywords containing the core product name or brand name (safety check).

Columns: 否定词, 曝光, 点击, 花费, 订单, 否定类型, 原因

否定类型: 2 words or fewer → Negative Phrase; 3+ words → Negative Exact
原因: spend >= $20 → '高花费零转化'; else → '持续消耗无回报'

## Formatting

Set column widths: first column 35 chars, all others 15 chars. Apply to all sheets:
```javascript
[ws1,ws2,...ws13].forEach(ws => {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws['!cols'] = [];
  for (let i = 0; i <= range.e.c; i++) {
    ws['!cols'].push({ wch: i === 0 ? 35 : 15 });
  }
});
```

## Attribution Integrity Gate (required before delivery)

Use ASIN/SKU attribution first. Campaign-name matching is permitted only as a secondary, product-specific fallback and must also pass a user-search-term intent check. Do not allow a campaign label from another product line to admit data into the target library.

Create `cross_line_exclusions.json` beside the other intermediate data. Include keyword, campaign, matched ASIN/SKU when present, and exclusion reason. Verify all of the following:

- zero excluded terms appear in the master keyword table, strategic/profit/positioning sheets, search-term ABCD, ad structure, or SEO sheet;
- CVR values shown in the workbook are no greater than 100%;
- the delivery summary states the cross-line exclusion count.
