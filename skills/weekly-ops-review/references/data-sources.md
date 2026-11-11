# Data Sources

## Base Info

- **App Token**: `FHxDbhbQKaIwrHsuNr3cUBXgn4d`
- **URL**: `https://<tenant>.feishu.cn/base/<base_token>`
- **Auth**: feishu-user-plugin MCP (UAT-first)

## Tables

### 1. 周复盘 (Main Aggregation Table)

- **Table ID**: `tbl2l56CZpF0y1l1`
- **Key**: (周, ASIN)
- **Records per week**: ~50

**Direct fields:**

| Field ID | Name | Type | Notes |
|----------|------|------|-------|
| fldnjRvIwx | 周 | Text (1) | Primary, format: "12-29~01-04" |
| fldrLaCrlo | 月 | Number (2) | |
| fldnmIcYAv | 年 | Number (2) | |
| fld5m1D9nq | ASIN | Text (1) | |

**Lookup from 信息 (tbltzlR1bP3xbvyB) — matched on ASIN:**

| Field ID | Name |
|----------|------|
| fld2gpG5QG | 产品线 |
| fldU8mvzSa | 父ASIN品名 |
| fldsOXs9Os | 产品定位 |
| fldjMUULTL | 生命周期 |
| fldXBXMAPY | 卖/不卖 |
| fldRZMM0TS | 父ASIN |
| fldOinaPXY | 品名 |
| fld7bPzotI | 目标排名 |

**Lookup from 源数据-周 (tblFaBRW7fQKeMV0) — matched on ASIN + 周:**

| Field ID | Name |
|----------|------|
| fld4yk9LT0 | 周日期 |
| fldjI1b5ly | 访客 |
| fldVwIK7v8 | 订单量 |
| fldA0KKw5q | 销量 |
| fldWULZvrY | 销售额 |
| fld9JSqofq | 毛利润 |
| fldyI2lDzu | 广告花费 |
| fldwROi6cc | 广告订单量 |
| fldR0Qhinz | 广告点击 |
| fldzp9srE9 | 广告销售额 |
| fldyLVp0AF | 退货量 |
| fldxXX7lbz | FBA可售库存 |
| fldX57fDII | 评分 |
| fldomukKg9 | 评论数 |
| fldMHLXVTf | 小类排名 |

**Lookup from 利润源数据 (tblv5QHS4ViFamBh) — matched on ASIN + 周:**

| Field ID | Name |
|----------|------|
| fldqeSJHsN | 入库配置费 |
| flddqZzaSl | 仓储费 |
| fldA4txi9h | 采购成本 |
| fldZ6wWGfX | 促销成本 |
| fldyFrcCaC | 退款金额 |

**Formula fields (computed):**

| Field ID | Name | Formula |
|----------|------|---------|
| fldBFok7nM | 转化 | 订单量/访客 |
| fldceTA7Dh | 销售额环比 | WoW comparison |
| fldnWAJmoj | 毛利率 | 毛利润/销售额 |
| fldIjTBZFk | 毛利润环比 | WoW comparison |
| fldK3h8gqt | 广花比 | 广告花费/销售额 |
| fldeRrt1W9 | CPC | 广告花费/广告点击 |
| fldd1taRAL | 广告CVR | 广告订单量/广告点击 |
| fld6ci88Te | 广告ACOS | 广告花费/广告销售额 |
| fldOGTaunf | 退货率 | 退货量/销量 |
| fldatBjOq7 | 入库配置费占比 | 入库配置费/销售额 |
| fldT1EiU6a | 仓储费占比 | 仓储费/销售额 |
| fld36JfnV9 | 采购占比 | 采购成本/销售额 |
| fldzJhSQ0q | 促销占比 | 促销成本/销售额 |
| fldWVfPdbD | 退款占比 | 退款金额/销售额 |
| fldzpnyAGj | 可售库存预计售卖月 | (FBA可售库存/销量)/4 |

### 2. 源数据-周 (Weekly Source Data)

- **Table ID**: `tblFaBRW7fQKeMV0`
- **Key**: 序号
- **Use**: Fallback when main table lookup fields return empty

**Key fields for fallback reads:**

| Field ID | Name |
|----------|------|
| fldcDq1vIB | ASIN |
| fldtEfleVu | 周 |
| fldfDS00Op | 周日期 |
| fldw33dXI2 | 访客 |
| fldv5N26Op | 订单量 |
| fld5JenvnQ | 销量 |
| fldf0b19gy | 销售额 |
| fldzZ3W7La | 毛利润 |
| fldkFHCo6O | 广告花费 |
| fld7CLuh5j | 广告订单量 |
| fld8dFM8Vi | 广告点击 |
| fldkqwzMt1 | 广告销售额 |
| fld9JIXkCI | 退货量 |
| fldjkf3BFA | FBA可售库存 |
| fld15666QQ | 评分 |
| fld3YFeiGT | 评论数 |
| fldaH2QBb4 | 小类排名 |

### 3. 利润源数据 (Profit Source Data)

- **Table ID**: `tblv5QHS4ViFamBh`
- **Key**: 序列
- **Use**: Fallback for cost detail

**Key fields for fallback reads:**

| Field ID | Name |
|----------|------|
| fldcDq1vIB | ASIN |
| fldtEfleVu | 周 |
| fldqbdAroU | 入库配置费 |
| fldkDWIQAm | 仓储费 |
| fld1jLFedz | 采购成本 |
| fld4HItEvg | 促销成本 |
| flds4RB1Ex | 退款金额 |

### 4. 信息 (Product Master)

- **Table ID**: `tbltzlR1bP3xbvyB`
- **Key**: MSKU
- **Use**: Rarely needed directly (main table has lookups)

### 5. 对标竞品 (Competitor Benchmarking)

- **Table ID**: `tbl01F1ENSCP0fRi`
- **Records**: ~36 (1 header row + ~35 competitor ASINs)
- **Structure**: Pivoted — static attributes + date-pair columns (price + rank per snapshot)
- **Date range**: 2026-03-08 to 2026-05-18, ~47 snapshot dates
- **IMPORTANT**: JSON keys are Chinese field NAMES (e.g., `未命名_2`) and date strings (e.g., `5.18-US`), NOT field IDs. The first row is a header row — skip it (ASIN field = "ASIN").

**Static attributes (JSON keys):**

| JSON Key | Content | Example |
|----------|---------|---------|
| 未命名 | 序列 | "1" |
| 未命名_1 | 类目 | "Heat Shrink Tubing" |
| 未命名_2 | 竞品品牌 | "Eventronic" |
| 未命名_3 | ASIN | "B0BVVMCY86" |
| 未命名_4 | 图片 | (URL) |
| 未命名_5 | 参数 | "3:1 ratio, 400pcs" |
| 未命名_6 | 数量-pcs | "400" |
| 未命名_7 | 变体数量 | "3" |
| 未命名_8 | 变体价格 | (price range) |
| 未命名_9 | review数量 | "32932" |
| 未命名_10 | 星级 | "4.7" |
| 未命名_11 | 广告架构 | "SP+SB+SBV" |
| 未命名_12 | 广告打法 | (description) |
| 未命名_13 | 定价策略 | "BD monthly" |
| 未命名_14 | 备注 | (notes) |

**Date-pair columns (JSON keys, e.g., `5.18-US` and `5.18-US_1`):**

- `M.D-US` = 价格/促销 (price + promotion info as text, e.g. "13.99" or "BD-15.29" or "14.99-coupon10%")
- `M.D-US_1` = 小类排名 (subcategory ranking as number string, e.g. "2")

Dates range from `3.8-US` through `5.18-US`. Latest date = `5.18-US`, 4-weeks-ago ≈ `4.20-US`.

### 6. 超龄库存报告 (Aging Inventory)

- **Table ID**: `tblsMqzOk1fhNLh2`
- **Records**: 637
- **Key**: 序列
- **IMPORTANT**: JSON keys are English field names (e.g., `asin`, `surcharge-age-tier`), NOT field IDs. The Feishu `序列` auto-number field uses its Chinese name as the key.

**Key fields (JSON keys):**

| JSON Key | Content | Notes |
|----------|---------|-------|
| 序列 | Auto-number | Primary key |
| fnsku | Text | FNSKU code (e.g. "X004LWWRUP") |
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
| volume-unit | Text | "cubic_feet" |
| SourceID | Text | System identifier |

## Table Relationship Summary

```
信息 (Product Master)
  └─ ASIN ──┐
             │ Lookup (ASIN)
             v
源数据-周 ──Lookup(ASIN+周)──> 周复盘 (MAIN) <──Lookup(ASIN+周)── 利润源数据
                                        │
                                        │ Manual ASIN match (no formal link)
                                        v
                               超龄库存报告  对标竞品
```

## Reading the Main Table by Week

The `周` field uses format like "12-29~01-04" (month-day~month-day). To find records for a specific week, use `manage_bitable_record` with `action=search` and filter on the `周` field, or read all records (max 50 per week) and filter client-side.

## Pagination

- Main table: 50 records per week, typically fits in one page with `page_size=50`
- 超龄库存: 637 records, use `page_size=200`, may need 4 pages
- 对标竞品: ~36 records, one page with `page_size=50`
