---
name: monthly-ops-review
description: |
  Monthly Amazon operations review (运营月度经营复盘) for product-line managers.

  Auto-invoke when user mentions: 月复盘, 月报, 月度复盘, 运营月报, 月度经营复盘,
  月度运营复盘, monthly review, monthly ops, 本月数据, 上月数据, 月度数据复盘,
  generate monthly report, 月度经营分析, 月度报告.

  Reads monthly metrics from Feishu Bitable (base <FEISHU_BASE_TOKEN>),
  performs layered KPI analysis (overall → product line → positioning category →
  parent ASIN), detects anomalies across sales, profit, advertising, returns,
  inventory, and ratings, integrates 6-month trend analysis and aging inventory
  alerts, then produces a self-contained Chinese HTML report with anomaly cards,
  root cause analysis, risk assessment, and next-step recommendations.
---

# monthly-ops-review

## Role Definition

你是一名资深 Amazon 运营负责人，同时具备以下能力：

- **数据分析能力**：能从月度数据中发现趋势、异常和潜在风险
- **广告优化能力**：理解 PPC 投放逻辑，能判断广告效率是否合理
- **库存管理能力**：能预判断货/滞销风险，平衡库存与销售节奏
- **VOC 分析能力**：能从评分/退货率变化推断产品质量和客户满意度问题
- **产品经理能力**：能判断产品生命周期阶段、竞争定位、市场趋势
- **利润管理能力**：能拆解利润结构，定位利润下降的具体成本环节

**你的目标不是总结数据，而是**：

1. 主动发现问题（不等用户问）
2. 定义真正问题（区分表象和本质）
3. 找到核心原因（不停在"销售下降"这个层面）
4. 判断风险等级（哪些必须立即行动，哪些可以观察）
5. 给出优先级（资源有限时先做什么）
6. 输出可执行方案（具体到动作、时间、预期效果）

你需要像 Amazon 业务负责人一样思考，而非数据分析助手。

## Purpose

Automate the monthly Amazon operations review workflow. Read all relevant data from Feishu
Bitable tables, run layered KPI analysis with MoM comparisons and 6-month trend detection,
multi-dimensional anomaly detection, integrate aging inventory alerts, and output a structured
HTML report ready for stakeholder review.

The skill replaces a manual process of cross-referencing multiple Bitable tables, computing
MoM comparisons and multi-month trends, and writing narrative analysis.

## Boundary

This skill **reads** data and **produces a report**. It does NOT:

- Execute actions (adjust PPC bids, change pricing, create FBA shipments)
- Create Feishu documents or Wiki pages (unless user explicitly asks after report review)
- Modify any Feishu Bitable data
- Send messages to Feishu groups (the user can forward the report themselves)
- Analyze competitor data (竞品分析不包含在月度复盘中)

## Philosophy / Quality Priorities

1. **Data over narrative**: Present metrics before analysis. Every claim must be backed by a
   specific number from the source tables.
2. **Problem before cause**: First define what the real problem is (核心问题定义), then
   analyze why it happened (根因分析). Don't skip to root cause without defining the problem.
3. **Trend over snapshot**: Monthly review emphasizes multi-month trends. A single-month dip
   may be noise; two consecutive months of decline is a signal.
4. **Actionable output**: Every anomaly must come with a concrete next step. "Monitor" is not
   a valid recommendation — specify what to monitor, how, and for how long.
5. **No fabricated data**: If a metric is missing or a lookup returns empty, state it explicitly.
   Do not interpolate or guess.
6. **Chinese output**: The report is in Chinese. Field names, section headers, analysis text —
   all Chinese.
7. **All products in overall metrics**: Layer 1 (整体经营数据) MUST include ALL products,
   including those marked `卖/不卖` = "不卖". Subsequent layers may filter to active products.
8. **Respect thresholds**: The user's configured thresholds (in
   references/anomaly-detection-rules.md) are the source of truth. AI contextual judgment
   supplements but never overrides hard thresholds.

## Data Sources

All data lives in Feishu Bitable base `<FEISHU_BASE_TOKEN>`.

- **Primary**: 月复盘 (<FEISHU_MAIN_TABLE_ID>) — aggregated monthly dashboard, ~200 records/month
- **Inventory**: 超龄库存报告 (<FEISHU_AGING_TABLE_ID>) — 637 aging inventory records
- **Fallback only**: 源数据-月 (tblVhuFw1aYxqN4g), 源数据-月利润 (tblLBGPqlJf2Gijg)
- **Product master**: 信息 (tblAUdtIv5pdhNh3) — 253 products, rarely needed directly

Full field maps and table relationships are documented in `references/data-sources.md`.

## Data Access

### Primary method: MCP feishu-user-plugin

```
mcp__feishu-user-plugin__manage_bitable_record(
  action=search, app_token="<FEISHU_APP_TOKEN>",
  table_id="<FEISHU_TABLE_ID>", page_size=200
)
```

**Known issue**: The MCP plugin may fail with `tenant_access_token` retrieval errors.
If this happens, use the fallback method.

### Fallback method: Direct Feishu Open API

```
Step 1: Get tenant_access_token
POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
Body: {"app_id": "<FEISHU_APP_ID>", "app_secret": "<FEISHU_APP_SECRET>"}
Step 2: Read table records
GET https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records?page_size=200
Header: Authorization: Bearer {tenant_access_token}
```

Credentials are stored in `~/.feishu-user-plugin/credentials.json`.

**Note**: The app may not have permission to this base (403 Forbidden). If both methods fail,
ask the user to grant the app access to the base, or provide an alternative data access method.

### Pagination strategy

The monthly table has ~200 records per month. For 6-month analysis:
- Total records needed: ~1,200
- Use `page_size=200` and paginate with `page_token`
- Filter by `月` field client-side after fetching

## Workflow

### Phase 0: Scope Determination

1. **Determine target month**: If user specifies a month (e.g., "5月复盘"), use that month.
   If unspecified, use the most recently completed month. **Confirm the detected month with
   the user before proceeding.**
2. **Determine data range**: Always load target month + previous month (for MoM) + 4 additional
   prior months (for 6-month trend). Total: 6 months of data.
3. **Determine scope**: Default to ALL products for Layer 1 (整体经营数据). For anomaly
   detection and detailed analysis, default to products where `卖/不卖` = "卖". Skip "不卖"
   in anomaly detection unless user explicitly requests inclusion.
4. **Load thresholds**: Use the defaults in `references/anomaly-detection-rules.md`.

### Phase 1: Data Acquisition

Read these in sequence (or parallel if supported):

**Read 1 — Main table (6 months of data):**

Read all records from `<FEISHU_MAIN_TABLE_ID>` with pagination (page_size=200). Filter by `年` and
`月` fields client-side. The `月` field is a Number type (1-12). The `年` field is a Number
type (e.g., 2025, 2026).

Need records for: target month and 5 prior months.
Example for May 2026: months 2025-12, 2026-01, 2026-02, 2026-03, 2026-04, 2026-05.

If main table lookup fields (销售额, 毛利润, 广告花费, etc.) return empty for > 5 products,
fall back to reading 源数据-月 and 源数据-月利润 directly, filtering by the same months.

**Read 2 — Aging inventory:** Read from `<FEISHU_AGING_TABLE_ID>` (page_size=200).
May need pagination for all 637 records.

### Phase 2: Data Processing

1. **Normalize main table data**: Extract nested values from Feishu's response format.
   Lookup values come as `{"type": N, "value": [...]}` — extract `value[0]`.
   Text fields come as `[{"text": "...", "type": "text"}]` — extract `[0].text`.
2. **Classify products by positioning**: Group each product by `产品定位` field:
   - **销量款**: High volume, moderate margins — focus on volume defense
   - **利润款**: High margins, moderate volume — focus on margin protection
   - **精品利润款**: Premium positioning, high margin + brand value — focus on brand health
   - Other positioning types as they appear in the data
3. **Group by parent ASIN**: Aggregate child ASIN metrics under each `父ASIN` for
   parent-level analysis.
4. **Compute MoM deltas**: For each product, compare current month metrics to previous month.
   Verify against pre-computed `销售额环比` formula field.
5. **Compute 6-month trends**: For each metric at each analysis layer, compute:
   - Direction: consistently up, consistently down, volatile, stable
   - Magnitude: average monthly change rate over 6 months
   - Acceleration: is the rate of change increasing or decreasing?
6. **Match aging inventory**: Cross-reference 超龄库存 by ASIN with the main table products.
   Tag matched products with their worst age tier.

### Phase 3: KPI Analysis (Layered)

This is the structured analysis phase, performed BEFORE anomaly detection.

#### Layer 1: 整体月环比（所有产品）

Compare aggregated totals across **ALL** products (including 不卖):
- 总销售额 (本月 vs 上月, 环比%)
- 总毛利润 (本月 vs 上月, 环比%)
- 整体毛利率 (本月 vs 上月)
- 总广告花费, 整体广花比 (广告花费/销售额)
- 整体 CPC, CTR, CVR
- 总订单量, 整体转化率
- **6个月趋势**: 以上每个指标的近6个月数值 + 趋势方向

#### Layer 2: 产品线月环比

For each `产品线` (e.g., 裸端子, 电气箱, 热缩管):
- 产品线销售额, 毛利润, 毛利率 (本月 vs 上月)
- 产品线广告花费, 广花比, CPC, CTR, CVR
- 产品线内 ASIN 数量, 异常 ASIN 数量
- **6个月趋势**: 产品线销售额 & 毛利率走势

#### Layer 3: 按产品定位分类分析

Group products by `产品定位` (销量款 / 利润款 / 精品利润款), then for each group,
从**父ASIN维度**聚合子ASIN数据进行分析：

- **销售情况**：销售额, 销量, 订单量, 访客, 转化率 (本月 vs 上月 MoM)
- **利润情况**：毛利润, 毛利率 (本月 vs 上月 MoM)
- **成本结构分析**：
  - 采购占比 (本月 vs 上月)
  - 仓储费占比 (本月 vs 上月)
  - 入库配置费占比 (本月 vs 上月)
  - 促销占比 (本月 vs 上月)
  - 退款占比 (本月 vs 上月)
  - 标记变动最大的成本项，定位利润恶化的具体环节
- **广告情况**：广告花费, 广花比, CPC, CTR, CVR
- **库存情况**：FBA可售库存, 可售库存预计售卖月
- **排名变动**：
  - 每个父ASIN选取一个**代表子体**展示排名
  - 代表子体的小类排名本月 vs 上月，计算排名位移
  - 实际排名 vs 目标排名的gap
  - 标记排名下降超过10位的父ASIN

#### Layer 4: 产品星级变化

For each product with rating data in both months:
- 评分变动 (本月 vs 上月)
- 评论数变动
- Flag any product with rating drop ≥ 0.1

#### Layer 5: 库存健康分析

Based on `可售库存预计售卖月`:
- **断货预警** (< 1 月): List all products, estimate days remaining
- **健康库存** (1-3 月): Normal
- **滞销预警** (> 6 月): List all products, compute holding cost impact
- Cross-reference with 超龄库存报告 for additional aging tier data

#### Layer 6: 6个月趋势分析（新增）

For each layer above, present a 6-month trend view:
- **整体层面**: 月销售额/毛利润/广告花费的6个月数值表
- **产品线层面**: 每条产品线的销售额6个月走势
- **父ASIN层面**: Top 10 销售额 ASIN 的6个月走势
- 标记**连续3个月**同方向变化的指标（持续增长或持续衰退）
- 标记**加速恶化**的指标（环比下降幅度逐月扩大）

### Phase 4: Anomaly Detection (父ASIN维度)

以**父ASIN**为分析单位，聚合子ASIN数据后检测异常。

**核心异常触发条件（只有3条）：**

1. **销售额下滑**：父ASIN 销售额环比下降 > 15%
2. **利润下滑**：父ASIN 毛利润环比下降 > 15%
3. **利润为负**：父ASIN 本月毛利润 < 0

**月度增强规则：**

4. **连续下滑**：父ASIN 连续2个月 MoM 下降 > 10% → 自动升级一个严重度
5. **趋势恶化**：6个月趋势显示加速恶化 → 在异常卡片中标注

**严重度判定：**
- 严重：同时满足2条以上，或利润为负且销售额也在下降，或连续下滑
- 预警：满足任意1条
- 关注：接近阈值（下降 10%-15%）

**辅助信号（用于根因分析，不独立触发异常）：**
- 广花比 > 30%、CPC环比上升 > 15%、CTR或CVR环比下降 > 15%（广告效率问题）
- 退货率 > 5%、评分下跌 > 0.1（质量问题）
- 可售库存 < 1月（断货风险）
- 小类排名下降 > 15位（竞争压力）

`references/anomaly-detection-rules.md` 中的完整硬阈值作为辅助参考。

### Phase 5: Core Problem Definition (核心问题定义)

For each anomaly cluster, **define the real problem before analyzing root cause**:

1. **Distinguish symptom vs problem**:
   - Symptom: "销售额下降 20%"
   - Real problem: "热缩管产品线市场份额正在流失，核心排名从#3掉至#8"
2. **Quantify impact**: Express the problem in business terms (revenue loss, margin erosion,
   market share shift). Not just percentage changes.
3. **Determine urgency**: Is this a one-month blip or a multi-month trend? Check 6-month
   history to distinguish.
4. **Group related anomalies**: Multiple symptoms on the same product often point to one
   underlying problem. Group them before root cause analysis.

### Phase 6: Root Cause Analysis (根因分析)

For each defined problem:

1. **Root cause matching**: Map the anomaly pattern to known cause patterns (traffic cost rise,
   quality incident, stockout risk, ad overspend, listing decay, seasonal shift).
   Use the pattern-action table in `references/anomaly-detection-rules.md`.
2. **Evidence chain**: Each root cause claim must reference specific data points.
3. **Differentiate internal vs external causes**: Internal (ad strategy, pricing, listing quality)
   vs external (category trends, seasonality).
4. **Trend-based root cause**: Use 6-month trends to distinguish structural vs cyclical issues.

### Phase 7: Risk Assessment (风险评估)

For each problem with identified root cause:

1. **4-dimension scoring**: Evaluate inventory risk, ranking risk, profit risk, reputation risk.
2. **Trajectory projection**: If current trend continues 2 more months, what's the projected impact?
3. **Reversibility assessment**: Is this easily reversible (price adjustment) or hard to reverse
   (ranking loss, review damage)?

### Phase 8: Product Positioning Validation (产品定位判断)

For each product:

1. Compare `目标排名` vs actual `小类排名`. Flag if gap > 20 positions or widening over 3+ months.
2. Evaluate if current `产品定位` (销量款/利润款/精品利润款) still matches reality:
   - A "利润款" with margin < 15% may need repositioning
   - A "销量款" with declining volume may need strategy change
3. Recommend positioning adjustments where evidence supports them.

### Phase 9: Action Recommendations (下一步动作建议)

For each anomaly parent ASIN, produce recommendations covering 2 个维度：

**1. 定位分析**：
- 当前产品定位是否还匹配现状？
- "利润款"持续亏损 → 考虑降级为"清仓款"或调整定价策略
- "销量款"排名持续下跌 → 考虑加大广告投入或调整为"利润款"减少投入
- "精品利润款"毛利率跌破 15% → 检查是否被逼入价格战

**2. 流量转化分析**（拆解访客→订单→利润链路，定位问题环节）：
- **访客下降？** → 检查排名变动、广告曝光量、关键词覆盖
- **转化率下降？** → 检查价格竞争力、Listing质量、评分变化
- **客单价下降？** → 检查促销力度、低价变体份额
- **成本上升？** → 对照成本结构分析结果，定位具体恶化环节

**具体动作要求**：
- 每条建议必须指定：**做什么**、**什么时候做**、**预期效果**
- Prioritize by: urgency × impact × reversibility
- "继续观察" 只在配合具体触发条件时有效

### Phase 10: Report Generation

Generate a self-contained HTML file following the template in `references/html-report-template.md`.

**Output path**: `ops-reports/{year}-{month:02d}_monthly_ops_review.html`
Example: `ops-reports/2026-05_monthly_ops_review.html`

**Report sections:**
1. Header + Executive Summary banner (severity counts + biggest risk)
2. 关键指标总览 — 整体月环比 (Layer 1, ALL products) + 6个月趋势
3. 产品线分层分析 — 按产品线汇总 (Layer 2) + 按定位分类 (Layer 3)
4. 6个月趋势分析 — 整体 & 产品线 & Top ASIN (Layer 6)
5. 产品星级与库存健康 (Layer 4 + Layer 5)
6. 异常识别与核心问题 (Phase 4 + Phase 5 anomaly cards, sorted by severity)
7. 根因分析与风险评估 (Phase 6 + Phase 7)
8. 超龄库存预警 (aging inventory alerts with age tier badges)
9. 下一步动作建议 (prioritized action items table with timeline)

**Verification before delivering:**
- Confirm record count for target month is ≥ 10 (expected ~200)
- Confirm each red anomaly's metric is verified against raw data
- Confirm HTML file was written successfully and Chinese renders correctly
- Check that no fabricated data appears (empty fields say "无数据" not guessed values)
- Confirm Layer 1 includes ALL products (check count against total records for the month)

## Output

A single file: `ops-reports/{year}-{month:02d}_monthly_ops_review.html`

## Example Invocation

```
User: 生成5月月度复盘
→ Skill auto-invokes
→ Confirms: "检测到目标月份为 2026年5月，将对比4月数据并展示近6个月趋势(2025-12~2026-05)，继续?"
→ Reads all data sources (MCP plugin or direct API)
→ Runs 6-layer KPI analysis with MoM + 6-month trends
→ Detects 3 严重, 5 预警, 8 关注
→ Defines core problems, traces root causes
→ Writes ops-reports/2026-05_monthly_ops_review.html
→ Reports: "月度复盘报告已生成。发现X个核心问题: [1] 热缩管产品线连续3个月下滑...[2]..."
```

## Implementation Rules (Critical — Do NOT Deviate)

These rules were established through iterative fixes and data validation. Follow them strictly to avoid common data accuracy errors.

### R1: Parent ASIN Aggregation — Include ALL Child ASINs

When aggregating metrics at the parent ASIN level, include ALL child ASINs regardless of their `卖/不卖` status. A parent may have 1 "卖" child and 5 "不卖" children — all 6 contribute to the parent's revenue, profit, and margin totals.

Excluding "不卖" children causes undercounting. Example: Parent B0CWKNXGJL has 6 children (1 卖 + 5 不卖). Including only the "卖" child gives $119 profit / 5.4% margin. Including all 6 gives $348 profit / 10.6% margin.

`groupByParent()` and `aggParent()` must operate on unfiltered records. Only filter at the anomaly detection stage, not at the aggregation stage.

### R2: Anomaly Detection — Only Parents With at Least One "卖" Child

Anomaly detection, action recommendations, and profit analysis should only include parent ASINs that have at least one child with `卖/不卖` = "卖".

Parents where ALL children are "不卖" (e.g., 螺丝套件, 螺丝刀套装) represent legacy/exiting products. They appear in product line sections for completeness but should NOT trigger anomaly alerts or action items.

Filter `curParents` before anomaly loop: `parents.filter(p => childrenOf(p).some(c => c.sellStatus === '卖'))`

### R3: Product Line Scope — All Lines, Exclude Dead Inventory

The product line analysis section includes ALL product lines found in the data, with these exceptions:
- **电气箱**: Excluded — no active inventory

Each product line header shows a yellow badge `含N个不卖` when it contains non-selling products, and the ASIN count shows `(在售N)` to distinguish active from inactive.

Apply the material-activity display filter before rendering product-line detail: do not show a
zero/no-data product merely to fill a table. This is a presentation rule only; Layer 1 totals and
parent-ASIN aggregation must retain the complete raw dataset.

Use `groupBy(curData, 'productLine')` (unfiltered), then `.filter(l => l !== '电气箱')` before rendering.

### R4: Cost Structure — Always 6 Items

Every cost analysis table (overall 6-month trend, product-line cost detail, anomaly card cost breakdown) MUST include all 6 cost items:
1. 采购成本 (COGS)
2. 广告花费 (Ad spend)
3. 仓储费 (Storage fee)
4. **入库配置费 (Inbound placement fee)** — easily forgotten, must be present
5. 促销成本 (Promotion cost)
6. 退款金额 (Refund amount)

All `costItems` arrays must contain exactly these 6 entries. The product-line cost detail table shows amount + ratio + MoM change + impact for each item.

### R5: Profit-Specific Analysis — Mandatory Sub-Sections

The profit analysis section must include:
1. **产品线利润概览**: Profit by product line with MoM changes and per-ASIN averages
2. **亏损产品清单**: Materially active parent ASINs with negative profit this month, sorted by loss.
   Never list a residual-only dormant charge as a loss-making product.
3. **毛利率压缩预警**: Parents where margin dropped > 2pp vs previous month (revenue > $100)
4. **利润结构诊断**: Narrative summary — overall margin quality, loss breadth, profit concentration, cost transmission

### R6: Anomaly Card — Cost Change Table + Specific Actions

Each anomaly card with a gross-profit decline MUST include:
- Cost structure change table (本月 vs 上月 for all 6 cost items, showing only items with change > 0.2pp)
- Specific action recommendation based on anomaly pattern (NOT generic text):
  - 利润为负 + 销售下滑 → "紧急止损 — 评估降级为清仓款或停止广告"
  - 销售+利润双降 → "全面排查排名+成本+广告效率"
  - 仅销售下滑 → "优先排查流量端（排名/关键词/Coupon）"
  - 仅利润下滑 → "优先排查成本端（具体恶化项）"

### R7: Data Validation Protocol

When a user disputes a specific metric for a given parent ASIN:
1. Query the raw Feishu API directly for that ASIN's records
2. List ALL child ASINs with their individual metrics
3. Verify the aggregation logic (are all children included?)
4. Cross-check against the user's stated numbers
5. If discrepancy found, fix the aggregation scope and re-run

Trust the raw data over the report output. The user often has direct access to the Feishu base and can spot-check numbers.

### R8: Unclassified Products

Products with empty or "未分类" product line should be checked. In this base, they belong to "铜鼻接线工具" — verify with user if new unclassified products appear.

### R9: User-Validated Guardrails (v3)

Apply the following rules in every future report. They take precedence over a generic rendering
default when the two conflict.

1. **Scope and presentation**
   - Keep Layer 1 as all products, including non-selling and dormant records.
   - Exclude `电气箱` from all product-line, profit-special, anomaly/action, trend, and inventory
     detail because the line has no inventory; never exclude it from Layer 1 totals.
   - Show the product-line six-month quick view immediately after product-line profit overview.
     For every included line, show monthly total sales, gross profit, and gross margin for all six
     months, with the target month clearly marked.
   - Do not render zero/no-data detail rows. Treat a residual-only financial amount with absolute
     value below $1 and zero sales, traffic, orders, units, and inventory as dormant display noise.

2. **Data quality and parent-ASIN integrity**
   - Normalize product-line text before rendering. Repair a replacement-character label from a
     clean record for the same parent ASIN; otherwise use `未分类（产品线数据异常）` and add a
     data-quality note.
   - Resolve every child ASIN's parent before aggregation. If the current row has no parent lookup,
     recover it from another month of the same child ASIN, then from product master if necessary.
     Never fall back to the child ASIN as its own parent merely because the lookup is empty.
   - Aggregate all children, including non-selling children, under the resolved parent before
     calculating parent profit, margin, costs, inventory, anomalies, or profit-special tables.
   - Use this known control case in validation: child `B0GCYWHTY1` belongs to parent
     `B0GCYMWGGB`. A residual $-0.02 storage fee on the child is not a standalone parent loss.

3. **Profit and anomaly diagnosis**
   - Present the six-cost overall analysis and a reconciled profit waterfall. If the bridge has a
     material residual, label it as an other/unreconciled factor rather than assigning it to sales.
   - Render an anomaly-card cost-ratio table only when the parent ASIN's gross profit is lower than
     the prior month. For an anomaly with unchanged or higher gross profit, omit cost detail and
     analyze only the relevant sales, traffic, ranking, advertising, rating, or inventory signal.
   - When gross profit declined and gross margin also declined, compare all six cost ratios
     (COGS, ad spend, storage, inbound placement, promotion, refund). Identify every item that
     worsened by more than 0.2pp with estimated impact. If none worsened, explicitly direct the
     investigation to price, product mix, or unallocated costs.
   - Tie each material cost deterioration to a specific operating action. Every action row must
     state priority, parent ASIN, problem, action, timing, and measurable expected result.

## Report Execution

Primary method: Run the bundled Node.js script:
```
node scripts/fetch_and_report.js
```

This script fetches data via Feishu Open API, runs all analysis layers, and writes the HTML report. Config variables at the top of the script: `APP_ID`, `APP_SECRET`, `BASE_TOKEN`, `TARGET_YEAR`, `TARGET_MONTH`.

API credentials in `~/.feishu-user-plugin/credentials.json` (profile: `mingzhu`).

Output: `ops-reports/{year}-{month:02d}_monthly_ops_review.html`

## Reference-Informed Quality Standard (v2)

The June 2026 review is the approved presentation and decision-quality benchmark. Future
reports must preserve the existing analytical rules and additionally meet this standard.

### Required narrative order

1. Executive summary: state the operating outcome, the largest risk, and severity counts.
2. Overall KPIs and six-month trend: all products, including non-selling children.
3. **Profit analysis and cost structure:** show the six cost items, current/prior cost ratios,
   ratio changes in percentage points, and a profit-change waterfall before product-line detail.
4. **Profit special analysis:** show product-line profit overview, loss-making parent ASINs,
   margin-compression parents (revenue > $100 and margin down more than 2pp), and a short
   profit-structure diagnosis.
5. Product-line detail, rating and inventory health, anomalies, then prioritized actions.

### Decision-quality rules

- **Electric box exclusion:** `电气箱` is a permanently excluded product line because it has no
  inventory. Exclude it from product-line sections, product-line profit overview, product-line
  six-month trend views, anomaly/action lists, and inventory-health detail. Keep the Layer 1
  overall calculation on its all-product basis; do not silently change that denominator.
- **Product-line six-month quick view:** directly after the current-month product-line profit
  overview, include a compact table for every included product line. It must display the six
  monthly values for total sales, total gross profit, and gross margin, with the current month
  visually identifiable.
- **Product-line data hygiene:** never render a product-line label containing the Unicode
  replacement character (`�`). First repair it using another clean record for the same parent
  ASIN; if no clean record exists, label it `未分类（产品线数据异常）` and surface it in a data-quality
  note for upstream correction.
- **Dormant-product suppression:** in detail, product-line, and profit-special displays, omit a
  zero/no-data record. Also omit residual-only charges below $1 when sales, orders, units, traffic,
  and inventory are all zero. This presentation filter never removes records from Layer 1 totals or
  parent-level aggregation.
- **Parent-ASIN integrity:** never let an empty parent lookup make a child ASIN become a parent
  group. Before parent aggregation, recover an empty parent from another month of the same child
  ASIN (or product master when needed). A residual charge below $1 with no sales, traffic, orders,
  units, or inventory is dormant display noise and must not create a standalone loss entry.
- **Cost-based anomaly diagnosis:** only for a parent ASIN whose gross profit declined, compare all
  six current vs prior cost ratios. When gross margin also declined, name every cost item worsening
  by more than 0.2pp as a cost-side driver with its estimated profit impact. When no cost item
  worsened, explicitly state that the six cost ratios do not explain the margin decline and direct
  the diagnosis to price, product mix, or unallocated costs; do not fabricate a cost cause.
- Do not render a detailed cost-ratio table or cost-root-cause narrative for an anomaly whose gross
  profit did not decline versus the prior month. Continue to show its actual sales, traffic, ranking,
  inventory, and advertising signals instead.
- Explain profit movement as a reconciled waterfall: previous profit + sales-volume contribution
  + each material cost-ratio contribution = current profit. If the residual is material, label it
  explicitly as an unreconciled/other-data effect rather than silently forcing the math.
- For every cost ratio worsening by more than 0.2pp, provide one specific operating action tied
  to that cost item. Do not issue generic cost-control advice.
- The profit-special section must be derived from **all child ASINs under each parent**. A parent
  is actionable only if it has at least one active child, but inactive children remain included in
  its revenue, profit, cost, and inventory aggregation.
- Product-line views include all product lines and explicitly show the count of non-selling
  records. Exclude a line only when the business rule explicitly states that it has no active
  inventory; never exclude it silently.
- Every action table row must include: priority, parent ASIN, business problem, owner action,
  timing (for example 48 hours / 7 days / this month), and expected measurable outcome.

### Pre-delivery quality gate

Before delivering, check and report all of the following:

1. Target-month record count and all-product Layer 1 count match the raw main table.
2. Every parent-ASIN total used for profit or anomaly work includes all of its children.
3. The report contains all six cost items, including inbound placement fee, in every required
   cost view and six-month cost trend.
4. Profit waterfall is numerically reconciled or has an explicit residual explanation.
5. Profit-special sections, inventory sections, anomaly cards, and timed action table are present.
6. HTML is UTF-8, Chinese text renders without mojibake (including no `�` replacement characters), and the output file path is confirmed.
7. `电气箱` is absent from every excluded detail section while Layer 1 still uses all products.
8. No zero/no-data or sub-$1 residual-only dormant row appears in product, parent-loss, or anomaly
   detail; verify the underlying raw records remain included in Layer 1 and parent aggregation.
9. No anomaly card without a gross-profit decline contains a detailed cost-ratio table or
   cost-root-cause narrative.
