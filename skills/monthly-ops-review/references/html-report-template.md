# HTML Report Template (Monthly)

## Structure

The report is a single self-contained HTML file with inline CSS. All styles are embedded — no external
dependencies. The report is written in Chinese.

## Layout Blueprint

```
+--------------------------------------------------+
| HEADER: 运营月度经营复盘                              |
| 月份: YYYY年MM月 | 生成时间: YYYY-MM-DD              |
+--------------------------------------------------+
| EXECUTIVE SUMMARY BANNER                          |
| [N] 严重  [N] 预警  [N] 关注  |  最高风险: [text]    |
+--------------------------------------------------+
| SECTION 1: 关键指标总览（全部产品）                    |
| 整体月环比 + 6个月趋势表                               |
+--------------------------------------------------+
| SECTION 2: 产品线分层分析                              |
| For each 产品线:                                    |
|   - 产品线汇总卡片 + 6个月趋势                         |
|   - 按定位分类汇总                                    |
|   - 产品明细表 (全部产品)                               |
+--------------------------------------------------+
| SECTION 3: 6个月趋势分析                               |
| 整体趋势表 + 产品线趋势 + Top ASIN 趋势                 |
+--------------------------------------------------+
| SECTION 4: 产品星级与库存健康                           |
| 星级变化表 + 库存健康分布 + 超龄库存预警                  |
+--------------------------------------------------+
| SECTION 5: 异常识别与核心问题                           |
| 每个有异常的产品一张卡片 (按严重度排序)                   |
+--------------------------------------------------+
| SECTION 6: 根因分析与风险评估                           |
| 根因分析 + 风险评估矩阵                                 |
+--------------------------------------------------+
| SECTION 7: 下一步动作建议                               |
| 优先级排序表: 动作 | 关联ASIN | 建议 | 优先级            |
+--------------------------------------------------+
| FOOTER: 数据源说明 | 使用阈值 | 免责声明                 |
+--------------------------------------------------+
```

## CSS Variables

```css
:root {
  /* Colors */
  --ink: #1c2430;
  --muted: #627084;
  --line: #d9e0ea;
  --bg: #f7f9fc;
  --surface: #ffffff;
  --accent: #2563eb;

  /* Severity */
  --critical: #9b2c2c;
  --critical-bg: #fef2f2;
  --red: #c0392b;
  --red-bg: #fef5f5;
  --yellow: #a85b18;
  --yellow-bg: #fffbeb;
  --green: #0b6b58;
  --green-bg: #f0fdf7;

  /* Layout */
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.08);
  --max-width: 1200px;
}
```

## Card Component Classes

```css
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; box-shadow: var(--shadow); }
.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.card-body { font-size: 14px; line-height: 1.6; }

.anomaly-card { border-left: 4px solid var(--line); }
.anomaly-card.severity-critical { border-left-color: var(--critical); background: var(--critical-bg); }
.anomaly-card.severity-red { border-left-color: var(--red); background: var(--red-bg); }
.anomaly-card.severity-yellow { border-left-color: var(--yellow); background: var(--yellow-bg); }
```

## Badge Component

```css
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
.badge-critical { background: var(--critical); color: white; }
.badge-red { background: var(--red); color: white; }
.badge-yellow { background: var(--yellow); color: white; }
.badge-green { background: var(--green); color: white; }
.badge-info { background: var(--bg); color: var(--muted); border: 1px solid var(--line); }
.badge-trend-up { background: var(--green-bg); color: var(--green); border: 1px solid var(--green); }
.badge-trend-down { background: var(--red-bg); color: var(--red); border: 1px solid var(--red); }
.badge-trend-flat { background: var(--bg); color: var(--muted); border: 1px solid var(--line); }
```

## Table Styles

```css
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--line); color: var(--muted); font-weight: 600; }
td { padding: 8px 12px; border-bottom: 1px solid var(--line); }
tr:nth-child(even) { background: var(--bg); }
tr:hover { background: #eef2ff; }

.metric-up { color: var(--green); font-weight: 600; }
.metric-down { color: var(--red); font-weight: 600; }
.metric-stable { color: var(--muted); }
```

## 6-Month Trend Table Component (Monthly-specific)

CSS-only inline bar chart for showing 6-month trends:

```css
.trend-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.trend-table th { padding: 6px 8px; text-align: center; font-size: 11px; }
.trend-table td { padding: 6px 8px; text-align: right; }
.trend-table .month-header { font-weight: 600; color: var(--accent); }
.trend-table .current-month { background: #eef2ff; font-weight: 700; }

.trend-bar-cell { position: relative; }
.trend-bar { display: inline-block; height: 16px; border-radius: 2px; min-width: 2px; vertical-align: middle; }
.trend-bar-positive { background: var(--green); opacity: 0.7; }
.trend-bar-negative { background: var(--red); opacity: 0.7; }
.trend-value { font-size: 11px; margin-left: 4px; }

.trend-direction { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; }
.trend-direction-up { background: var(--green-bg); color: var(--green); }
.trend-direction-down { background: var(--red-bg); color: var(--red); }
.trend-direction-flat { background: var(--bg); color: var(--muted); }
```

Example trend table HTML:

```html
<table class="trend-table">
  <tr>
    <th>指标</th>
    <th class="month-header">12月</th>
    <th class="month-header">1月</th>
    <th class="month-header">2月</th>
    <th class="month-header">3月</th>
    <th class="month-header">4月</th>
    <th class="month-header current-month">5月</th>
    <th>MoM</th>
    <th>趋势</th>
  </tr>
  <tr>
    <td>总销售额</td>
    <td>$38,200</td>
    <td>$35,100</td>
    <td>$36,800</td>
    <td>$40,500</td>
    <td>$42,300</td>
    <td class="current-month">$47,986</td>
    <td class="metric-up">↑13.4%</td>
    <td><span class="trend-direction trend-direction-up">持续增长</span></td>
  </tr>
</table>
```

## Product Line Section

Each product line gets a section block:

```html
<section class="product-line-section">
  <h2 class="pl-title">产品线: <span class="pl-name">裸端子</span></h2>

  <!-- Summary card with 6-month mini trend -->
  <div class="card pl-summary">
    <div class="summary-grid">
      <div class="summary-item"><span class="label">ASIN数</span><span class="value">20</span></div>
      <div class="summary-item"><span class="label">月销售额</span><span class="value">$13,456 <span class="metric-up">↑8.2%</span></span></div>
      <div class="summary-item"><span class="label">平均毛利率</span><span class="value">24.5%</span></div>
      <div class="summary-item"><span class="label">异常ASIN</span><span class="value metric-down">3</span></div>
    </div>
  </div>

  <!-- 6-month trend for this product line -->
  <table class="trend-table">
    <!-- 6 months of key metrics -->
  </table>

  <!-- Product detail table -->
  <table class="product-detail-table">
    <!-- all products in this line -->
  </table>
</section>
```

## Anomaly Card Template

```html
<div class="card anomaly-card severity-red">
  <div class="card-header">
    <span class="badge badge-red">预警</span>
    <strong>B08K78S7JW — 铜芯盒装-220pcs</strong>
    <span class="badge badge-info">裸端子</span>
    <span class="badge badge-trend-down">连续下滑</span>
  </div>
  <div class="card-body">
    <div class="anomaly-metrics">
      <p><strong>异常指标：</strong>销售额环比 -28% (本月 $304 vs 上月 $423)</p>
      <p><strong>6个月趋势：</strong>$520 → $480 → $450 → $430 → $423 → $304 (持续下滑)</p>
    </div>
    <div class="anomaly-analysis">
      <p><strong>根因分析：</strong>排名下滑导致自然流量减少，广告CPC上升导致流量成本增加</p>
    </div>
    <div class="anomaly-risk">
      <p><strong>风险评估：</strong>若持续下滑，预计下月销售额可能跌至$220</p>
    </div>
    <div class="anomaly-actions">
      <p><strong>建议动作：</strong></p>
      <ol>
        <li>评估是否调整Coupon至15%提升转化</li>
        <li>优化广告结构，降低非转化词出价</li>
        <li>考虑是否从"利润款"调整为"清仓款"</li>
      </ol>
    </div>
  </div>
</div>
```

## Responsive / Print

```css
@media print {
  body { font-size: 12px; }
  .card { break-inside: avoid; }
  .anomaly-card { break-inside: avoid; }
}

@media (max-width: 768px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  table { font-size: 11px; }
}
```

## Output File Naming

```
ops-reports/2026-05_monthly_ops_review.html
```

Where the date is YYYY-MM of the target month.

## Key Implementation Notes

1. All data is embedded directly in the HTML — no external JS, no API calls at render time
2. Use `{{PLACEHOLDER}}` style markers or direct string interpolation when generating
3. Chinese text must be properly encoded (utf-8 meta tag)
4. Keep the file under 500KB — collapse detailed tables if too large
5. Include a "Generated by monthly-ops-review skill" footer
6. Metric values that are better than previous month get `metric-up` class (green), worse get `metric-down` class (red)
7. 6-month trend tables should highlight the current month column with `current-month` class
8. Trend direction badges: `trend-direction-up` (green), `trend-direction-down` (red), `trend-direction-flat` (grey)
9. Consecutive decline products should have `badge-trend-down` badge with "连续下滑" text
10. Layer 1 (整体经营数据) must include ALL products — verify ASIN count matches total records for the month
