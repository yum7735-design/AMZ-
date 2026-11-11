# Anomaly Detection Rules

## Hard Thresholds

Apply these thresholds first. Any metric crossing a threshold triggers a flag before contextual rules are evaluated.

### Sales & Profit

| Metric | Red Alert | Yellow Alert | Direction |
|--------|-----------|--------------|-----------|
| 销售额环比 (WoW) | < -20% | < -10% | lower is worse |
| 毛利润环比 (WoW) | < -20% | < -10% | lower is worse |
| 毛利率（在售产品） | < 8% | 8%–10% | lower is worse |

### Advertising

| Metric | Red Alert | Yellow Alert | Direction |
|--------|-----------|--------------|-----------|
| 广花比 (Ad/Sales) | > 30% | > 20% | higher is worse |
| CPC变动 (WoW) | > +30% | > +15% | higher is worse |
| CTR变动 (WoW) | < -30% | < -15% | lower is worse |
| CVR变动 (WoW) | < -30% | < -15% | lower is worse |

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

## Contextual Rules

Apply these AFTER hard thresholds. They can escalate, de-escalate, or add new flags.

### Rule 1: Seasonal Adjustment

**When**: Product's `周` falls in a known seasonal transition period (e.g., post-Q4 holiday in Jan, post-Prime Day in Jul).

**Action**: Relax sales/profit thresholds by 50%. A 20% sales drop in January is normal post-holiday.

**Implementation**: Check if > 60% of products in the same product line also show sales decline → if yes, likely seasonal category trend.

### Rule 2: Lifecycle Leniency

**When**: `生命周期` is "导入期" or "成长期".

**Action**: 广花比 threshold relaxed to > 45% for red, > 35% for yellow. Profit margin thresholds relaxed to > 5% red, > 10% yellow. High ad spend during launch/growth is expected.

### Rule 3: Product-Line Relative Benchmarking

**When**: Multiple products in the same `产品线` show the same directional change.

**Action**: Annotate the anomaly as "品类趋势" rather than "产品问题". If the entire product line is declining, the root cause is external (category demand shift, seasonality, major competitor entry) — not product-specific.

**Implementation**: Group products by `产品线`. If ≥ 70% of products in a line show the same directional anomaly, tag as "品类趋势" and de-escalate individual product severity by one level.

### Rule 4: Competitor Threat Escalation

**When**: A product's `小类排名` declines AND at least one competitor in the same subcategory shows price drop > 10% AND rank improvement > 20 positions in the same period.

**Action**: Escalate to "严重" (critical). Tag as "竞争威胁 — 竞品降价抢量". This is the highest-priority anomaly because it indicates active competitive pressure.

**Data needed**: Cross-reference `周复盘.小类排名` with `对标竞品` recent price/rank trends.

### Rule 5: Compounding Escalation

**When**: 2+ yellow alerts fire on the same product simultaneously.

**Action**: Escalate to red.

**When**: 1 red + 1 yellow, or 2+ reds.

**Action**: Escalate to "严重" (critical). Multiple simultaneous anomalies indicate a systemic issue rather than a single-metric blip.

### Rule 6: Inventory-Rating Coupling

**When**: `FBA可售库存` drops below 1 month of sales AND `评分` drops ≥ 0.1 in the same period.

**Action**: Flag as "紧急 — 断货+声誉双重风险". The product risks running out of stock while also accumulating negative reviews. Prioritize restocking AND addressing review issues simultaneously.

### Rule 7: Return-Rating Coupling (Quality Incident)

**When**: `退货率` increases > 3 percentage points WoW AND `评分` drops ≥ 0.2 in the same week.

**Action**: Flag as "质量事故 — 疑似批次缺陷或Listing描述不准确". Recommend immediate VOC deep-dive on recent returns and negative reviews.

## Severity Levels Summary

| Level | CSS Class | Badge | Trigger |
|-------|-----------|-------|---------|
| Critical | severity-critical | 严重 | Compounding (Rule 5) or Competitor threat (Rule 4) |
| Red | severity-red | 预警 | Single hard threshold crossed |
| Yellow | severity-yellow | 关注 | Yellow threshold crossed |
| Green | severity-info | 正常 | No thresholds crossed |

## Root Cause Pattern Matching

Map anomaly combinations to likely root causes:

| Anomaly Pattern | Root Cause | Suggested Actions |
|----------------|------------|-------------------|
| Sales ↓ + CPC ↑ + CTR ↓ | 流量成本上升 | 降低非转化词出价, 提高精准匹配比例 |
| Sales ↓ + Competitor Price ↓ + Competitor Rank ↑ | 竞品降价抢量 | 评估竞品策略持续性, 调整Coupon/价格, 优化Listing |
| Sales ↓ + Rating ↓ + Return Rate ↑ | 质量/Listing问题 | 检查近期差评和退货原因, 更新Listing描述, 联系买家 |
| Sales ↓ + FBA库存 ↓ | 断货风险 | 加速补货, 或提价减缓出单速度延缓断货 |
| Margin ↓ + 广花比 ↑ + Sales flat | 过度投放 | 降低广告预算, 聚焦高CVR关键词 |
| Sales ↓ + Rank ↓ (no other signals) | Listing权重下降 | 检查Buy Box, 检查是否被跟卖, 检查类目节点变化 |
| All products in line declining | 品类趋势 | 评估是否季节性/市场萎缩, 不做单品调整 |

## Metric Extraction Notes

When reading from the main table, metric values come in nested structures:

- **Lookup fields**: `{"type": 2, "value": [304.52]}` → extract `value[0]`
- **Text fields**: `[{"text": "B08K78S7JW", "type": "text"}]` → extract `[0].text`
- **Formula fields**: Same as type 2. Parse `value[0]` as float.
- **Date fields**: `{"type": 5, "value": [1766937600000]}` → Unix ms timestamp

For WoW comparisons, compute `(current - previous) / previous` from the raw values. Formula fields like `销售额环比` are pre-computed by Feishu but may be stale if source data hasn't refreshed.
