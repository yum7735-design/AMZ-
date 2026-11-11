# Data Sources

## Base Info

- **App Token**: `UvX8bhS8Larixksj4fjcOvbcn7e`
- **URL**: `https://xa0j7ax4q5v.feishu.cn/base/UvX8bhS8Larixksj4fjcOvbcn7e`
- **Auth**: feishu-user-plugin MCP (UAT-first)

## Tables

### 1. 月复盘 (Main Monthly Aggregation Table)

- **Table ID**: `tblBgs4glsFNq6NJ`
- **View ID**: `vewGJ1OH5B`
- **Key**: (年&月, ASIN)
- **Records per month**: ~200
- **Total records**: ~3,389

**Direct fields:**

| Name | Type | Notes |
|------|------|-------|
| 年&月 | Date | Primary time field, format: "2025-01-01" |
| 年 | Number | Year extracted, e.g., 2025 |
| 月 | Number | Month extracted, e.g., 1-12 |
| ASIN | Text | Child ASIN |

**Lookup from 信息 (tblAUdtIv5pdhNh3) — matched on ASIN:**

| Name | Notes |
|------|-------|
| 产品线 | Product line (裸端子, 热缩管, 电气箱, etc.) |
| 父ASIN品名 | Parent ASIN product name |
| 产品定位 | Positioning (销量款/利润款/精品利润款) |
| 生命周期 | Lifecycle stage (导入期/成长期/成熟期) |
| 卖/不卖 | Active status (卖/不卖) |
| 父ASIN | Parent ASIN |
| 品名 | Product name |

**Lookup from 源数据-月 (tblVhuFw1aYxqN4g) — matched on ASIN + month:**

| Name | Notes |
|------|-------|
| 访客 | Sessions / visitors |
| 订单量 | Order count |
| 销量 | Unit sales |
| 销售额 | Revenue (USD) |
| 毛利润 | Gross profit (USD) |
| 广告花费 | Ad spend (USD) |
| 广告订单量 | Ad-attributed orders |
| 广告点击 | Ad clicks |
| 广告销售额 | Ad-attributed revenue |
| 退货量 | Return units |
| FBA可售库存 | FBA sellable inventory |
| 评分 | Star rating |
| 评论数 | Review count |
| 小类排名 | Subcategory ranking |

**Lookup from 源数据-月利润 (tblLBGPqlJf2Gijg) — matched on ASIN + month:**

| Name | Notes |
|------|-------|
| 入库配置费 | Inbound placement fee |
| 仓储费 | Storage fee |
| 采购成本 | COGS |
| 促销成本 | Promotion cost |
| 退款金额 | Refund amount |

**Formula fields (computed):**

| Name | Formula | Notes |
|------|---------|-------|
| 转化 | 订单量/访客 | Conversion rate |
| 销售额环比 | MoM comparison | Pre-computed |
| 毛利率 | 毛利润/销售额 | Margin % |
| 毛利润环比 | MoM comparison | Pre-computed |
| 广花比 | 广告花费/销售额 | Ad/Sales ratio |
| CPC | 广告花费/广告点击 | Cost per click |
| 广告CVR | 广告订单量/广告点击 | Ad conversion rate |
| 广告ACOS | 广告花费/广告销售额 | Ad cost of sales |
| 退货率 | 退货量/销量 | Return rate |
| 入库配置费占比 | 入库配置费/销售额 | |
| 仓储费占比 | 仓储费/销售额 | |
| 采购占比 | 采购成本/销售额 | |
| 促销占比 | 促销成本/销售额 | |
| 退款占比 | 退款金额/销售额 | |
| 可售库存预计售卖月 | (FBA可售库存/销量) | Months of inventory |

### 2. 源数据-月 (Monthly Source Data)

- **Table ID**: `tblVhuFw1aYxqN4g`
- **Records**: ~3,399
- **Use**: Fallback when main table lookup fields return empty

**Key fields:**

| Name | Notes |
|------|-------|
| 序号 | Sequence number |
| 店铺 | Store (e.g., haisstronica-US) |
| listing标签 | Listing tag / product line |
| 父ASIN | Parent ASIN |
| ASIN | Child ASIN |
| 品名 | Product name |
| SKU | Seller SKU |
| Sessions Total | Visitor sessions |
| 访客, 订单量, 销量, 销售额, 毛利润 | Core metrics |
| 广告花费, 广告订单量, 广告点击, 广告销售额 | Ad metrics |
| 退货量, FBA可售库存, 评分, 评论数, 小类排名 | Other metrics |

### 3. 源数据-月利润 (Monthly Profit Source Data)

- **Table ID**: `tblLBGPqlJf2Gijg`
- **Records**: ~2,624
- **Use**: Fallback for cost detail

**Key fields:**

| Name | Notes |
|------|-------|
| ASIN | Child ASIN |
| 父ASIN | Parent ASIN |
| 品名 | Product name |
| 入库配置费 | Inbound placement fee |
| 仓储费 | Storage fee |
| 采购成本 | COGS |
| 促销成本 | Promotion cost |
| 退款金额 | Refund amount |

### 4. 信息 (Product Master)

- **Table ID**: `tblAUdtIv5pdhNh3`
- **Records**: 253
- **Key**: MSKU
- **Use**: Rarely needed directly (main table has lookups)

**Key fields:**

| Name | Notes |
|------|-------|
| MSKU | Primary key |
| SKU | Seller SKU |
| 店铺 | Store |
| ASIN | Child ASIN |
| 父ASIN | Parent ASIN |
| 品名 | Product name |
| 备注 | Notes |
| 产品线 | Product line |
| 父ASIN品名 | Parent ASIN name |

### 5. 超龄库存报告 (Aging Inventory)

- **Table ID**: `tblf9z0XIaKzmK8z`
- **Records**: 637
- **Key**: 序列
- **IMPORTANT**: JSON keys are English field names (same structure as weekly base)

**Key fields (JSON keys):**

| JSON Key | Content | Notes |
|----------|---------|-------|
| 序列 | Auto-number | Primary key |
| fnsku | Text | FNSKU code |
| asin | Text | ASIN — link to main table |
| product-name | Text | Amazon product title |
| sku | Text | Seller SKU |
| condition | Text | "New" |
| qty-charged | Number | Units charged LTSF |
| amount-charged | Number | Fee amount in USD |
| surcharge-age-tier | Text | Age bracket: "181-210", "211-240", "271-300", "301-" |
| rate-surcharge | Number | Per-unit fee rate |
| per-unit-volume | Number | Cubic feet per unit |
| snapshot-date | Text | ISO timestamp |
| currency | Text | "USD" |
| country | Text | "US" |

## Table Relationship Summary

```
信息 (Product Master)
  └─ ASIN ──┐
             │ Lookup (ASIN)
             v
源数据-月 ──Lookup(ASIN+月)──> 月复盘 (MAIN) <──Lookup(ASIN+月)── 源数据-月利润
                                        │
                                        │ Manual ASIN match (no formal link)
                                        v
                               超龄库存报告
```

## Reading the Main Table by Month

The `月` field is a Number (1-12) and `年` field is a Number (e.g., 2025, 2026).
To find records for a specific month, filter by `年` + `月` combination.

For 6-month analysis (e.g., May 2026):
- Read all records with pagination (page_size=200)
- Filter client-side: keep records where (年=2025 AND 月>=12) OR (年=2026 AND 月<=5)

## Pagination

- Main table: ~200 records per month, ~1200 for 6 months, use page_size=200
- 超龄库存: 637 records, use page_size=200, need 4 pages
- 源数据-月: 3,399 records (only read as fallback)

## Metric Extraction Notes

When reading from the main table, metric values come in nested structures:

- **Lookup fields**: `{"type": 2, "value": [304.52]}` → extract `value[0]`
- **Text fields**: `[{"text": "B08K78S7JW", "type": "text"}]` → extract `[0].text`
- **Formula fields**: Same as type 2. Parse `value[0]` as float.
- **Date fields**: `{"type": 5, "value": [1766937600000]}` → Unix ms timestamp
- **Number fields**: Direct numeric value

For MoM comparisons, compute `(current - previous) / previous` from the raw values.
Formula fields like `销售额环比` are pre-computed by Feishu but may be stale.
