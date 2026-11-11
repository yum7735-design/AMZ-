# HTML Report Template

## Structure

The report is a single self-contained HTML file with inline CSS. All styles are embedded — no external
dependencies. The report is written in Chinese.

## Layout Blueprint

```
+--------------------------------------------------+
| HEADER: 运营周经营复盘                              |
| 周期: YYYY-Www (MM/DD~MM/DD) | 生成时间: YYYY-MM-DD |
+--------------------------------------------------+
| EXECUTIVE SUMMARY BANNER                          |
| [N] 严重  [N] 预警  [N] 关注  |  最高风险: [text]    |
+--------------------------------------------------+
| SECTION 1: 关键指标总览 (按产品线汇总)               |
| 表格: 产品线 | ASIN数 | 销售额 | 毛利润 | 毛利率 |    |
|       广告费 | 广花比 | CPC | CTR | CVR | 退货率 | 库存健康 |
+--------------------------------------------------+
| SECTION 2: 异常识别与风险评估                        |
| 每个有异常的产品一张卡片 (按严重度排序)                |
+--------------------------------------------------+
| SECTION 3: 产品线分层分析                            |
| For each 产品线:                                    |
|   - 产品线汇总卡片                                  |
|   - 产品明细表 (全部产品)                             |
|   - 竞品排名/价格趋势                                |
+--------------------------------------------------+
| SECTION 4: 超龄库存预警                              |
| 按ASIN匹配的产品超龄库存明细                          |
+--------------------------------------------------+
| SECTION 5: 下一步动作建议                             |
| 优先级排序表: 动作 | 关联ASIN | 建议 | 优先级          |
+--------------------------------------------------+
| FOOTER: 数据源说明 | 使用阈值 | 免责声明               |
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
```

## Table Styles

```css
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--line); color: var(--muted); font-weight: 600; }
td { padding: 8px 12px; border-bottom: 1px solid var(--line); }
tr:nth-child(even) { background: var(--bg); }
tr:hover { background: #eef2ff; }

.metric-up { color: var(--green); }
.metric-down { color: var(--red); }
.metric-stable { color: var(--muted); }
```

## Product Line Section

Each product line gets a section block:

```html
<section class="product-line-section">
  <h2 class="pl-title">产品线: <span class="pl-name">裸端子</span></h2>

  <!-- Summary card -->
  <div class="card pl-summary">
    <div class="summary-grid">
      <div class="summary-item"><span class="label">ASIN数</span><span class="value">20</span></div>
      <div class="summary-item"><span class="label">总销售额</span><span class="value">$3,456</span></div>
      <div class="summary-item"><span class="label">平均毛利率</span><span class="value">24.5%</span></div>
      <div class="summary-item"><span class="label">异常ASIN</span><span class="value metric-down">3</span></div>
    </div>
  </div>

  <!-- Product detail table -->
  <table class="product-detail-table">
    <!-- all products in this line -->
  </table>

  <!-- Competitor overlay (if applicable) -->
  <div class="card competitor-overlay">
    <h3>竞品动态</h3>
    <!-- competitor trend summary for this product line -->
  </div>
</section>
```

## Anomaly Card Template

```html
<div class="card anomaly-card severity-red">
  <div class="card-header">
    <span class="badge badge-red">预警</span>
    <strong>B08K78S7JW — 铜芯盒装-220pcs</strong>
    <span class="badge badge-info">裸端子</span>
  </div>
  <div class="card-body">
    <div class="anomaly-metrics">
      <p><strong>异常指标：</strong>销售额环比 -28% (本周 $304 vs 上周 $423)</p>
      <p><strong>关联信号：</strong>竞品 Eventronic B0BVVMCY86 降价 15%</p>
    </div>
    <div class="anomaly-analysis">
      <p><strong>根因分析：</strong>竞品降价抢占了排名位置，同时广告CPC上升导致流量成本增加</p>
    </div>
    <div class="anomaly-risk">
      <p><strong>风险评估：</strong>若持续2周，预计月销售额损失约$480</p>
    </div>
    <div class="anomaly-actions">
      <p><strong>建议动作：</strong></p>
      <ol>
        <li>检查竞品降价是否为短期促销（关注对标竞品表未来更新）</li>
        <li>评估是否调整Coupon至15%匹配竞品力度</li>
        <li>监控未来3天小类排名变化</li>
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
ops-reports/2026-05-12_to_2026-05-18_ops_review.html
```

Where the date range is Monday-Sunday of the target week.

## Key Implementation Notes

1. All data is embedded directly in the HTML — no external JS, no API calls at render time
2. Use `{{PLACEHOLDER}}` style markers or direct string interpolation when generating
3. Chinese text must be properly encoded (utf-8 meta tag)
4. Keep the file under 500KB — collapse detailed tables if too large
5. Include a "Generated by weekly-ops-review skill" footer
6. Do NOT reference other skills (voc-analysis, segment-market-capability, etc.) — the report is self-contained
7. Metric values that are better than previous week get `metric-up` class (green), worse get `metric-down` class (red)
