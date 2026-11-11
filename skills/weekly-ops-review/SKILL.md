---
name: weekly-ops-review
description: |
  Weekly Amazon operations review (运营周经营复盘) for product-line managers.

  Auto-invoke when user mentions: 周复盘, 周报, 每周复盘, 运营周报, 经营复盘,
  运营复盘, weekly review, weekly ops, 本周数据, 上周数据, 本周复盘, 上周复盘,
  generate weekly report, 运营报告, 数据复盘, 经营分析.

  Reads weekly metrics from Feishu Bitable (base FHxDbhbQKaIwrHsuNr3cUBXgn4d),
  performs layered KPI analysis (overall → product line → positioning category →
  parent ASIN), detects anomalies across sales, profit, advertising, returns,
  inventory, and ratings, integrates competitor pricing+ranking trends and aging
  inventory alerts, then produces a self-contained Chinese HTML report with
  anomaly cards, root cause analysis, risk assessment, and next-step recommendations.
---

# weekly-ops-review

## Role Definition

你是一名资深 Amazon 运营负责人，同时具备以下能力：

- **数据分析能力**：能从周度数据中发现趋势、异常和潜在风险
- **广告优化能力**：理解 PPC 投放逻辑，能判断广告效率是否合理
- **库存管理能力**：能预判断货/滞销风险，平衡库存与销售节奏
- **VOC 分析能力**：能从评分/退货率变化推断产品质量和客户满意度问题
- **产品经理能力**：能判断产品生命周期阶段、竞争定位、市场趋势
- **利润管理能力**：能拆解利润结构（含广告广花比），定位利润下降的具体成本环节

**你的目标不是总结数据，而是**：

1. 主动发现问题（不等用户问）
2. 定义真正问题（区分表象和本质）
3. 找到核心原因（不停在"销售下降"这个层面）
4. 判断风险等级（哪些必须立即行动，哪些可以观察）
5. 给出优先级（资源有限时先做什么）
6. 输出可执行方案（具体到动作、时间、预期效果）

你需要像 Amazon 业务负责人一样思考，而非数据分析助手。

## Purpose

Automate the weekly Amazon operations review workflow. Read all relevant data from Feishu
Bitable tables, run layered KPI analysis and multi-dimensional anomaly detection, integrate
competitor intelligence and inventory aging alerts, and output a structured HTML report ready
for stakeholder review.

The skill replaces a manual process of cross-referencing 6 Bitable tables, computing YoY/WoW
comparisons, and writing narrative analysis — reducing a 2-4 hour workflow to a single command.

## Boundary

This skill **reads** data and **produces a report**. It does NOT:

- Execute actions (adjust PPC bids, change pricing, create FBA shipments)
- Create Feishu documents or Wiki pages (unless user explicitly asks after report review)
- Modify any Feishu Bitable data
- Send messages to Feishu groups (the user can forward the report themselves)

## Philosophy / Quality Priorities

1. **Data over narrative**: Present metrics before analysis. Every claim must be backed by a
   specific number from the source tables.
2. **Problem before cause**: First define what the real problem is (核心问题定义), then
   analyze why it happened (根因分析). Don't skip to root cause without defining the problem.
3. **Actionable output**: Every anomaly must come with a concrete next step. "Monitor" is not
   a valid recommendation — specify what to monitor, how, and for how long.
4. **No fabricated data**: If a metric is missing or a lookup returns empty, state it explicitly.
   Do not interpolate or guess.
5. **Chinese output**: The report is in Chinese. Field names, section headers, analysis text —
   all Chinese.
6. **Respect thresholds**: The user's configured thresholds (in
   references/anomaly-detection-rules.md) are the source of truth. AI contextual judgment
   supplements but never overrides hard thresholds.

## Data Sources

All data lives in Feishu Bitable base `FHxDbhbQKaIwrHsuNr3cUBXgn4d`.

- **Primary**: 周复盘 (tbl2l56CZpF0y1l1) — aggregated dashboard, ~50 records/week
- **Competitor**: 对标竞品 (tbl01F1ENSCP0fRi) — ~35 competitor ASINs with daily price/rank snapshots
- **Inventory**: 超龄库存报告 (tblsMqzOk1fhNLh2) — 637 aging inventory records
- **Fallback only**: 源数据-周 (tblFaBRW7fQKeMV0), 利润源数据 (tblv5QHS4ViFamBh)

Full field maps and table relationships are documented in `references/data-sources.md`.

## Data Access

### Primary method: Direct Feishu Open API

The MCP feishu-user-plugin may encounter `tenant_access_token` retrieval issues. When that
happens, use direct HTTP calls:

```
Step 1: Get tenant_access_token
POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
Body: {"app_id": "<FEISHU_APP_ID>", "app_secret": "<FEISHU_APP_SECRET>"}
Step 2: Read table records
GET https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records?page_size=100
Header: Authorization: Bearer {tenant_access_token}
```

Credentials are stored in `~/.feishu-user-plugin/credentials.json`.

### Fallback method: MCP plugin

```
mcp__feishu-user-plugin__manage_bitable_record(
  action=search, app_token="<FEISHU_APP_TOKEN>",
  table_id="<FEISHU_TABLE_ID>", page_size=50
)
```

## Workflow

### Phase 0: Scope Determination

1. **Determine target week**: If user specifies "本周" or "上周", compute the corresponding
   Monday-Sunday range. If unspecified, use the most recently completed week (last Monday to
   last Sunday). **Confirm the detected week with the user before proceeding.**
2. **Determine scope**: Default to all products where `卖/不卖` = "卖". Skip "不卖" unless
   user explicitly requests inclusion.
3. **Load thresholds**: Use the defaults in `references/anomaly-detection-rules.md`. If the
   user has customized thresholds, load those instead.

### Phase 1: Data Acquisition

Read these in parallel:

**Read 1 — Main table (current week + previous 3 weeks):**

Read all records from `tbl2l56CZpF0y1l1` and filter by `周` field client-side. The `周` field
format is "MM-DD~MM-DD". Need at minimum current week + previous week for WoW comparisons.

If main table lookup fields (销售额, 毛利润, 广告花费, etc.) return empty for > 5 products,
fall back to reading 源数据-周 and 利润源数据 directly, filtering by the same week.

**Read 2 — Competitor table:** Read from `tbl01F1ENSCP0fRi` (page_size=50).
Then `manage_bitable_field(action=list)` to discover date column names.

**Read 3 — Aging inventory:** Read from `tblsMqzOk1fhNLh2` (page_size=200).
May need pagination for all 637 records.

### Phase 2: Data Processing

Follow the processing strategy in `references/competitor-processing.md`:

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
4. **Compute WoW deltas**: For each product, compare current week metrics to previous week.
   Verify against pre-computed `销售额环比` formula field.
5. **Process competitor data**: Per `references/competitor-processing.md`. Extract the 4 most
   recent date snapshots and compute price/rank trends.
6. **Match aging inventory**: Cross-reference 超龄库存 by ASIN with the main table products.
   Tag matched products with their worst age tier.

### Phase 3: KPI Analysis (Layered)

This is the structured analysis phase, performed BEFORE anomaly detection. The goal is to
build a complete picture at each level.

#### Layer 1: 整体周环比

Compare aggregated totals across ALL active products:
- 总销售额 (本周 vs 上周, 环比%)
- 总毛利润 (本周 vs 上周, 环比%)
- 整体毛利率 (本周 vs 上周)
- 总广告花费, 整体广花比 (广告花费/销售额)
- 整体 CPC, CTR, CVR
- 总订单量, 整体转化率

#### Layer 2: 产品线周环比

For each `产品线` (e.g., 裸端子, 电气箱, 热缩管):
- 产品线销售额, 毛利润, 毛利率 (本周 vs 上周)
- 产品线广告花费, 广花比, CPC, CTR, CVR
- 产品线内 ASIN 数量, 异常 ASIN 数量

#### Layer 3: 按产品定位分类分析

Group products by `产品定位` (销量款 / 利润款 / 精品利润款), then for each group,
从**父ASIN维度**聚合子ASIN数据进行分析：

- **销售情况**：销售额, 销量, 订单量, 访客, 转化率 (本周 vs 上周 WoW)
- **利润情况**：毛利润, 毛利率 (本周 vs 上周 WoW)
- **成本结构分析**（关键新增）：
  - 采购占比 (本周 vs 上周)
  - 仓储费占比 (本周 vs 上周)
  - 入库配置费占比 (本周 vs 上周)
  - 促销占比 (本周 vs 上周)
  - 退款占比 (本周 vs 上周)
  - **广花比** (广告花费/销售额, 本周 vs 上周) — 作为独立成本项参与利润下滑归因
  - 标记变动最大的成本项，定位利润恶化的具体环节
  - **重要：成本占比方向判断** — 飞书中成本占比为负数（如采购占比=-30%），
    从-30%变为-35%意味着成本负担增加。计算delta时必须用 `abs(curr) - abs(prev)`，
    delta>0 表示成本上升（红色/不利），delta<0 表示成本下降（绿色/有利）。
    展示时也用绝对值（30% → 35%，上升5.0pp），避免负号造成方向混淆。
- **广告情况**：广告花费, 广花比 (广告花费/销售额), CPC, CTR, CVR
- **库存情况**：FBA可售库存, 可售库存预计售卖月
- **排名变动**（关键新增）：
  - 每个父ASIN选取一个**代表子体**展示排名（选取规则：销量最高的子ASIN，或有目标排名的子ASIN优先）
  - 代表子体的小类排名本周 vs 上周，计算排名位移
  - **排名变化展示规则（必须遵守）**：Amazon 排名数字越小越好。计算 `rankDelta = 本周排名 - 上周排名`；`rankDelta < 0` 表示排名上升，必须显示为绿色 `上升 +abs(rankDelta) 位`；`rankDelta > 0` 表示排名下降，必须显示为红色 `下降 -rankDelta 位`。不得把数值正负号直接当作业务涨跌方向。
  - 实际排名 vs 目标排名的gap
  - 标记排名下降超过10位的父ASIN

#### Layer 4: 产品星级变化

For each product with rating data in both weeks:
- 评分变动 (本周 vs 上周)
- 评论数变动
- Flag any product with rating drop ≥ 0.1

#### Layer 5: 库存健康分析

Based on `可售库存预计售卖月`:
- **断货预警** (< 1 月): List all products, estimate days remaining
- **健康库存** (1-3 月): Normal
- **滞销预警** (> 6 月): List all products, compute holding cost impact
- Cross-reference with 超龄库存报告 for additional aging tier data

### Phase 4: Anomaly Detection (父ASIN维度)

以**父ASIN**为分析单位，聚合子ASIN数据后检测异常。

**在售产品毛利率标准**：毛利率 ≥ 8%。父体及产品线的毛利率风险判断仅纳入在售子体；低于 8% 标记为“毛利率红线”，8%–10% 标记为“毛利率关注”。“不卖”子体仍保留在父体汇总中，但不改变在售产品的毛利率达标判断。

**核心异常触发条件（只有3条）：**

1. **销售额下滑**：父ASIN 销售额环比下降 > 15%
2. **利润下滑**：父ASIN 毛利润环比下降 > 15%
3. **利润为负**：父ASIN 本周毛利润 < 0

**严重度判定：**
- 严重：同时满足2条以上，或利润为负且销售额也在下降
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
   - Real problem: "热缩管产品线市场份额正在被竞品侵蚀，核心排名从#3掉至#8"
2. **Quantify impact**: Express the problem in business terms (revenue loss, margin erosion,
   market share shift). Not just percentage changes.
3. **Determine urgency**: Is this a one-week blip or a multi-week trend? Check 3-week history
   to distinguish.
4. **Group related anomalies**: Multiple symptoms on the same product often point to one
   underlying problem. Group them before root cause analysis.

### Phase 6: Root Cause Analysis (根因分析)

For each defined problem:

1. **Root cause matching**: Map the anomaly pattern to known cause patterns (traffic cost rise,
   competitor attack, quality incident, stockout risk, ad overspend, listing decay).
   Use the pattern-action table in `references/anomaly-detection-rules.md`.
2. **Evidence chain**: Each root cause claim must reference specific data points.
   "竞品降价" must cite which competitor, what price change, which date range.
3. **Differentiate internal vs external causes**: Internal (ad strategy, pricing, listing quality)
   vs external (competitor moves, category trends, seasonality).

### Phase 7: Risk Assessment (风险评估)

For each problem with identified root cause:

1. **4-dimension scoring**: Evaluate inventory risk, ranking risk, profit risk, reputation risk.
2. **Trajectory projection**: If current trend continues 2 more weeks, what's the projected impact?
3. **Reversibility assessment**: Is this easily reversible (price adjustment) or hard to reverse
   (ranking loss, review damage)?

### Phase 8: Product Positioning Validation (产品定位判断)

For each product:

1. Compare `目标排名` vs actual `小类排名`. Flag if gap > 20 positions or widening over 3+ weeks.
2. Evaluate if current `产品定位` (销量款/利润款/精品利润款) still matches reality:
   - A "利润款" with margin < 8% may need repositioning
   - A "销量款" with declining volume may need strategy change
3. Recommend positioning adjustments where evidence supports them.

### Phase 9: Action Recommendations (下一步动作建议)

For each anomaly parent ASIN, produce recommendations covering 3 个维度：

**1. 定位分析**：
- 当前产品定位（销量款/利润款/精品利润款）是否还匹配现状？
- "利润款"持续亏损 → 考虑降级为"清仓款"或调整定价策略
- "销量款"排名持续下跌 → 考虑加大广告投入或调整为"利润款"减少投入
- "精品利润款"毛利率跌破 8% → 检查是否被竞品逼入价格战

**2. 流量转化分析**（拆解访客→订单→利润链路，定位问题环节）：
- **访客下降？** → 检查排名变动（排名跌=自然流量减少）、广告曝光量、关键词覆盖是否被竞品挤占
- **转化率下降？** → 检查价格竞争力（对比竞品价格）、Listing主图/A+页面质量、评分变化、是否有差评涌入
- **客单价下降？** → 检查促销力度（Coupon/BD是否过度）、低价变体是否蚕食高价变体份额
- **成本上升？** → 对照成本结构分析结果，定位是采购成本、仓储费、广告费还是退款哪个环节恶化

**3. 具体动作**（基于以上分析）：
- 每条建议必须指定：**做什么**、**什么时候做**、**预期效果**
- Prioritize by: urgency × impact × reversibility
- "继续观察" 只在配合具体触发条件时有效
  (e.g., "观察2周，若排名继续下降超过5位则启动价格调整")

### Phase 10: Report Generation

Generate a self-contained HTML file following the template in `references/html-report-template.md`.

**Output path**: `ops-reports/{monday}_to_{sunday}_ops_review.html`
Example: `ops-reports/2026-05-12_to_2026-05-18_ops_review.html`

**Report sections:**
1. Header + Executive Summary banner (severity counts + biggest risk)
2. 关键指标总览 — 整体周环比 (Layer 1)
3. 产品线分层分析 — 按产品线汇总 (Layer 2)，跳过无销量产品线
4. 异常识别与风险评估 (Phase 4 anomaly cards, sorted by severity，排除"不卖"产品)
5. 利润专项分析 — 利润下滑产品的成本结构拆解（含广花比/ACOS），每个产品卡片展示：
   - 毛利润/毛利率/销售额环比
   - 广告花费/广花比/ACOS 本周vs上周
   - 6项成本占比表格（采购/仓储/入库配置费/促销/退款/广花比），用绝对值展示，
     delta>0标红"上升"，delta<0标绿"下降"
   - 主要原因高亮 + 对应优化策略
6. 库存健康分析 (Layer 5: 断货风险 + 滞销预警)
7. 产品星级变化 (Layer 4)
8. 下一步动作建议 (prioritized action items table)

**排名字段渲染校验**：父 ASIN 表格中的“代表排名周变化”必须使用“上升 +N 位”（绿色）或“下降 -N 位”（红色）的业务语义；不得出现绿色负号或红色正号的排名变化。

**Verification before delivering:**
- Confirm record count for target week is ≥ 10 (expected ~50)
- Confirm each red anomaly's metric is verified against raw data
- Confirm HTML file was written successfully and Chinese renders correctly
- Check that no fabricated data appears (empty fields say "无数据" not guessed values)

## Output

A single file: `ops-reports/{start_date}_to_{end_date}_ops_review.html`

## Example Invocation

```
User: 生成本周运营复盘
→ Skill auto-invokes
→ Confirms: "检测到当前周为 2026-05-18~2026-05-24，分析50个活跃ASIN，继续?"
→ Reads all data sources (direct API or MCP plugin)
→ Runs 5-layer KPI analysis
→ Detects 3 严重, 5 预警, 8 关注
→ Defines 4 core problems, traces root causes
→ Writes ops-reports/2026-05-18_to_2026-05-24_ops_review.html
→ Reports: "周复盘报告已生成。发现4个核心问题: [1] 热缩管产品线竞品降价侵蚀...[2]..."
```
