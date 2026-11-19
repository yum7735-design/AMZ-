# Data Sources

## Base Info

- **App Token**: `FHxDbhbQKaIwrHsuNr3cUBXgn4d`
- **URL**: `https://xa0j7ax4q5v.feishu.cn/base/FHxDbhbQKaIwrHsuNr3cUBXgn4d`
- **Auth**: feishu-user-plugin MCP (UAT-first)

## Tables

### 1. 周复盘 (Main Aggregation Table)

- **Table ID**: `tbl2l56CZpF0y1l1`
- **Key**: (周, ASIN)
- **Records per week**: 动态数量；2026-11近期约270条，完整分页后以接口总数为准。

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

### 5. 超龄库存报告 (Aging Inventory)

- **Table ID**: `tblsMqzOk1fhNLh2`
- **Records**: 动态数量；2026-11-18读取634条，不作为固定预期。
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
                               超龄库存报告
```

## 周筛选、分页与去重

- 主表按 `年 + 周` 搜索，例如 `2026` 与 `11-09~11-15`；客户端复核 `周日期` 是否为预期周一。跨年周结合实际起始日期处理，不能只按MM-DD同名周匹配。
- 至少读取目标周、上周，通常再取前两周。飞书 lookup 可能使 `年` 也是嵌套数字，需要解包。
- 每周请求使用独立分页游标；从实际响应取 `pageToken/page_token`，直到 `hasMore/has_more` 为假，不自行编码或预测游标。
- `page_size` 采用工具/API支持值，100或200均可；条数超过页大小时必须继续，不能假定一页即全量。
- 记录保留 `record_id`；核对实际记录数、接口 `total`（如有）与唯一记录数。按周日期+ASIN检查重复，回查后再决定，不盲目合并/删除。
- 停卖记录在获取阶段不排除；先保留完整周，再分别构建整体和在售范围。
- 没有广告曝光字段时不推导CTR；报告直接省略该指标。

## 超龄快照

`snapshot-date` 是快照/收费期线索，不等于周末FBA可售状态。检查所有快照日期，选择相应快照；不得跨快照重复累加同一库存。运营动作使用最新快照时明确日期。按 `asin` 与在售周表匹配后按父体汇总，保留币种和国家，不混加不同币种。

## 字段解析

- lookup：`{"type":2,"value":[304.52]}` → 304.52。
- 富文本：`[{"text":"B08K78S7JW","type":"text"}]` → ASIN文本。
- 嵌套文本 lookup：先解包 `value` 再提取 `text`。
- 缺失/空数组保留null，合法0保留0；多值需核对匹配唯一性。
- 使用显示字段名查值，表中field_id用于发现和核对；不假设记录JSON键一定是field_id。

## 鉴权回退

优先使用已配置的飞书用户插件只读查询。若其鉴权失败而本机已有凭证，可使用飞书官方API：
1. 从已有的用户插件配置定位凭证；常见旧路径 `~/.feishu-user-plugin/credentials.json`，实际位置以本机已有配置为准。
2. 通过 `POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal` 换取令牌；凭证和响应中的令牌只保留于内存。
3. 使用 `GET /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records` 查询并分页；参数、筛选和日期语义以实际接口支持为准。
4. 不把凭证、Bearer或令牌写入代码、终端输出或报告，不因该回退修改记录或重新配置账号。
