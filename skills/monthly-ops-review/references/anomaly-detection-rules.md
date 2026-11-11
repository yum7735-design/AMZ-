# Anomaly Detection Rules (Monthly)

## Hard Thresholds

Apply these thresholds first. Any metric crossing a threshold triggers a flag before contextual rules are evaluated.

### Sales & Profit

| Metric | Red Alert | Yellow Alert | Direction |
|--------|-----------|--------------|-----------|
| 销售额环比 (MoM) | < -20% | < -10% | lower is worse |
| 毛利润环比 (MoM) | < -20% | < -10% | lower is worse |
| 毛利率 | < 15% | < 20% | lower is worse |

### Advertising

| Metric | Red Alert | Yellow Alert | Direction |
|--------|-----------|--------------|-----------|
| 广花比 (Ad/Sales) | > 30% | > 20% | higher is worse |
| CPC变动 (MoM) | > +30% | > +15% | higher is worse |
| CTR变动 (MoM) | < -30% | < -15% | lower is worse |
| CVR变动 (MoM) | < -30% | < -15% | lower is worse |

### Returns & Quality

| Metric | Red Alert | Yellow Alert | Direction |
|--------|-----------|--------------|-----------|
| 退货率 | > 8% | > 5% | higher is worse |
| 评分下跌 (absolute) | > -0.3 | > -0.1 | lower is worse |

### Ranking & Traffic

| Metric | Red Alert | Yellow Alert | Direction |
|--------|-----------|--------------|-----------|
| 小类排名下降 (positions) | > 30 | > 15 | higher is worse |
| 转化率变动 (MoM) | < -30% | < -15% | lower is worse |

### Inventory

| Metric | Red Alert | Yellow Alert | Direction |
|--------|-----------|--------------|-----------|
| 可售库存预计售卖月 | < 0.5 | < 1.0 | lower is worse |
| FBA可售库存变动 (MoM) | < -40% | < -20% | lower is worse |

## Monthly-Specific Contextual Rules

Apply these AFTER hard thresholds. They can escalate, de-escalate, or add new flags.

### Rule 1: Consecutive Decline Escalation (月度新增)

**When**: A product shows MoM decline > 10% for 2 consecutive months on the same metric.

**Action**: Automatically escalate severity by one level. Tag as "连续下滑". If already at
"严重" level, add "紧急" tag.

**Rationale**: Monthly data smooths out weekly noise. Two consecutive monthly declines indicate
a structural problem, not a blip.

### Rule 2: Trend Acceleration Warning (月度新增)

**When**: The rate of decline is accelerating — i.e., month N-1 dropped 10%, month N dropped 15%.

**Action**: Add "加速恶化" tag to the anomaly card. Include 6-month trend data in the card.

**Rationale**: Accelerating decline suggests the root cause is worsening, not stabilizing.

### Rule 3: Seasonal Adjustment

**When**: Product's month falls in a known seasonal transition period.

**Action**: Relax sales/profit thresholds by 50%. A 20% sales drop in post-holiday months is normal.

**Implementation**: Check if > 60% of products in the same product line also show sales decline
→ if yes, likely seasonal category trend.

### Rule 4: Lifecycle Leniency

**When**: `生命周期` is "导入期" or "成长期".

**Action**: 广花比 threshold relaxed to > 45% for red, > 35% for yellow. Profit margin thresholds
relaxed to > 5% red, > 10% yellow. High ad spend during launch/growth is expected.

### Rule 5: Product-Line Relative Benchmarking

**When**: Multiple products in the same `产品线` show the same directional change.

**Action**: Annotate the anomaly as "品类趋势" rather than "产品问题". If the entire product line
is declining, the root cause is external — not product-specific.

**Implementation**: Group products by `产品线`. If ≥ 70% of products in a line show the same
directional anomaly, tag as "品类趋势" and de-escalate individual product severity by one level.

### Rule 6: Compounding Escalation

**When**: 2+ yellow alerts fire on the same product simultaneously.

**Action**: Escalate to red.

**When**: 1 red + 1 yellow, or 2+ reds.

**Action**: Escalate to "严重" (critical).

### Rule 7: Inventory-Rating Coupling

**When**: `FBA可售库存` drops below 1 month of sales AND `评分` drops ≥ 0.1 in the same period.

**Action**: Flag as "紧急 — 断货+声誉双重风险".

### Rule 8: Return-Rating Coupling (Quality Incident)

**When**: `退货率` increases > 3 percentage points MoM AND `评分` drops ≥ 0.2 in the same month.

**Action**: Flag as "质量事故 — 疑似批次缺陷或Listing描述不准确".

### Rule 9: Long-term Stagnation (月度新增)

**When**: A product's sales have been flat (within ±5%) for 4+ consecutive months while the
product line average is growing.

**Action**: Flag as "增长停滞 — 需评估产品竞争力或调整定位". Yellow severity.

## Severity Levels Summary

| Level | CSS Class | Badge | Trigger |
|-------|-----------|-------|---------|
| Critical | severity-critical | 严重 | Compounding (Rule 6), Consecutive decline (Rule 1), or multiple reds |
| Red | severity-red | 预警 | Single hard threshold crossed |
| Yellow | severity-yellow | 关注 | Yellow threshold crossed |
| Green | severity-info | 正常 | No thresholds crossed |

## Root Cause Pattern Matching

Map anomaly combinations to likely root causes:

| Anomaly Pattern | Root Cause | Suggested Actions |
|----------------|------------|-------------------|
| Sales ↓ + CPC ↑ + CTR ↓ | 流量成本上升 | 降低非转化词出价, 提高精准匹配比例 |
| Sales ↓ + Rating ↓ + Return Rate ↑ | 质量/Listing问题 | 检查近期差评和退货原因, 更新Listing描述 |
| Sales ↓ + FBA库存 ↓ | 断货风险 | 加速补货, 或提价减缓出单速度延缓断货 |
| Margin ↓ + 广花比 ↑ + Sales flat | 过度投放 | 降低广告预算, 聚焦高CVR关键词 |
| Sales ↓ + Rank ↓ (no other signals) | Listing权重下降 | 检查Buy Box, 检查是否被跟卖, 检查类目节点变化 |
| All products in line declining | 品类趋势 | 评估是否季节性/市场萎缩, 不做单品调整 |
| Margin ↓ + 成本占比 ↑ (specific item) | 成本结构恶化 | 定位具体成本项, 评估供应链优化或定价调整 |
| Sales flat 4+ months + line growing | 增长停滞 | 评估产品竞争力, 考虑Listing优化或定位调整 |
| Consecutive 2-month decline | 结构性问题 | 需立即干预, 不能继续观察 |

## Metric Extraction Notes

Same as weekly — when reading from the main table, metric values come in nested structures:

- **Lookup fields**: `{"type": 2, "value": [304.52]}` → extract `value[0]`
- **Text fields**: `[{"text": "B08K78S7JW", "type": "text"}]` → extract `[0].text`
- **Formula fields**: Same as type 2. Parse `value[0]` as float.
- **Date fields**: `{"type": 5, "value": [1766937600000]}` → Unix ms timestamp

For MoM comparisons, compute `(current - previous) / previous` from the raw values.
