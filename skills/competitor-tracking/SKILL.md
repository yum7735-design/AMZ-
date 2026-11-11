---
name: competitor-tracking
description: >
  Amazon 竞品每日追踪 skill。基于 SellerSprite MCP、飞书多维表格和必要时的 Amazon PDP 实时页面抓取，对一组 ASIN 做每日监控、异常判断和结果回写。适用于用户提到竞品追踪、每日追踪、竞品监控、competitor tracking、对手分析、竞品异动、ASIN 追踪，或要求把竞品数据写回飞书表格的场景。
---

# Amazon 竞品每日追踪（飞书多维表格版）

## 角色
充当 Amazon Senior Competitive Intelligence Analyst。识别竞品动作，判断促销和流量变化，评估对我方影响，并把结果写入飞书多维表格，保证可复盘和可追溯。

## 数据源

### 配置表
- app_token: `WKaNbIFfhalzkOsxWIBcP6o0neb`
- table_id: `tblz2C6qvBU2YoIB`

从配置表读取所有 `启用=true` 的记录。优先使用表中已有字段，不要假设字段名和旧版本文档完全一致。

当前实际字段以飞书表内为准，常见字段包括：
- `ASIN`
- `Marketplace`
- `产品类型`
- `品牌`
- `类型`
- `类目节点`
- `图片`
- `启用`

### 输出表
- app_token: `WKaNbIFfhalzkOsxWIBcP6o0neb`
- table_id: `tblqTfu7SlVaMxiU`

当前实际字段以飞书表内为准，常见字段包括：
- `ASIN`
- `图片`
- `产品类型`
- `日期`
- `类型`
- `品牌`
- `类目`
- `标题`
- `售价`
- `实际成交价`
- `促销类型`
- `小类排名`
- `变体数`
- `标签`
- `星级`
- `评论数`
- `自然流量词数`
- `TOP5流量词`
- `TOP自然排名`
- `TOP5广告排名`
- `异常标记`
- `异常详情`
- `异常等级`

注意：
- 输出表实际使用 `促销类型`，不是旧文档中的 `活动类型`
- 配置表和输出表字段都应先读取实际列表再使用，不要死记旧版字段描述

## 日期与月份规则

### 今日日期
始终以当前会话当天为准，不要写死日期。

写入 `日期` 字段时，使用当天 `00:00:00` 的 UTC+8 毫秒时间戳。

### SellerSprite 月份
`competitor_lookup` 这类月度接口必须显式传 `month=yyyyMM`。

默认使用“上一个完整月”：
- 如果今天是 `2026-07-09`，则 `month=202606`

如果用户明确指定月份，则以用户输入覆盖默认值。

## 执行顺序

### Step 1: 读取配置
1. 调用飞书 `manage_bitable_record(action=search)` 读取 `启用=true`
2. 抽取 ASIN、Marketplace、产品类型、品牌、类型、类目节点、图片
3. 如用户在对话中额外给了 ASIN，可与配置表合并

### Step 2: 读取输出表现状
先读取输出表全部记录，构建两类映射：
- `今日记录`: `(ASIN, 日期)` -> `record_id + fields`
- `历史最近记录`: `ASIN` -> 上一次非今日的 `fields`

用途：
- 今日存在则走 `update`
- 今日不存在则走 `create`
- 重跑时保留已写好的流量字段，避免把它们重置回 `待补`

### Step 3: 批量抓 SellerSprite 主数据
使用 `competitor_lookup` 批量拉取：
- 每批最多 40 个 ASIN
- 必须传 `marketplace`
- 必须传 `month`
- `variation="Y"`

主数据字段通常来自：
- `title`
- `brand`
- `price`
- `rating`
- `ratings`
- `variations`
- `badge`
- `bsr`
- `bsrCr`
- `unitsGr`
- `nodeLabelPath`
- `subcategories`

### Step 4: 用 `amazon_cookie` 抓 Amazon PDP 实时价格与促销
`售价`、`实际成交价`、`促销类型` 的唯一数据源是带 `amazon_cookie` 登录会话的 Amazon PDP 前台；绝不使用 SellerSprite 的 `price`、Coupon 趋势或其他 SellerSprite 字段来填写、回退或推断这三个字段。

Cookie 约定：
- 优先从工作区 `amazon_cookie.txt` 读取 Cookie header；也可读取用户提供的等价 Cookie JSON/Netscape 文件。
- 仅在本地浏览器上下文导入 Cookie，不在对话、日志、本地结果文件或飞书中输出 Cookie 内容。
- Cookie 缺失、过期、页面异常或抓取失败时，保留当天已有的已验证价格/促销字段；新记录将这三个字段留空并在异常详情写明 `Amazon PDP 实时抓取失败`。不得回退 SellerSprite。

不要把 `competitor_lookup.price` 当作“今天实时价”的最终来源。

原因：
- `competitor_lookup` 更接近月度或阶段性快照
- 当天正在跑的 `LD / BD / Coupon / Prime / 多件促销` 可能不会及时反映

实时价格口径：
1. 使用导入 `amazon_cookie` 的 Amazon PDP 页面。
2. 从当前商品的 `priceToPay`、主价格模块或等价价格节点读取当前可见 `售价`。
3. 只从当前商品的主价格、deal badge、buybox、Coupon 和 promotion 模块识别 `LD`、`BD`、`Price discount`、`Coupon`、`Multi-buy`；不要扫描整页推荐/广告区域。
4. `实际成交价` 仅在当前商品明确有单件 Coupon 时按 Coupon price、固定额或百分比计算；其他促销保持当前单件展示价。

SellerSprite 的以下接口只作为辅助，不作为当天实时促销的唯一依据：
- `asin_detail_with_coupon_trend`
- `asin_coupon_trend`

它们更适合：
- 查历史 Coupon 轨迹
- 辅助判断是否长期跑促销
- 验证某个 ASIN 是否经常折价

不适合直接代表“此刻页面正在跑的促销”

## 促销识别与分类

将 Amazon 页面上的原始促销文案统一归类到以下标准值：
- `LD`
- `BD`
- `Coupon`
- `Multi-buy`
- `Price discount`
- `Prime`

允许组合值，用 `/` 连接，例如：
- `LD/Multi-buy`
- `Coupon/Prime`
- `Multi-buy/Price discount`

推荐分类规则：
- 当前商品自己的 deal/price 模块包含 `Limited time deal` -> `LD`
- 包含 `Best deal` 或明确 deal 价格体系 -> `BD`
- 包含 `Apply $X coupon`、`Apply X% coupon`、`coupon` -> `Coupon`
- 包含 `on 2 select item(s)`、`on 5 select item(s)`、`Shop items`、`if you qualify`、`Terms` 等条件型文案 -> `Multi-buy`
- 当前商品价格模块包含 `List Price`、`Was`、`Typical`、`savingsPercentage` 且参考价高于当前 `priceToPay` -> `Price discount`
- 包含 `Prime exclusive`、`Prime member` 等 -> `Prime`

重要边界：
- 只从当前商品的价格模块、deal 模块、coupon 模块、promotion 模块识别促销。
- 不要整页扫描 `Limited time deal`、`Typical`、`Was`、`List Price`，Amazon 页面推荐位、广告位、轮播位经常包含其他 ASIN 的折扣文案。
- `LD` 必须能在当前 ASIN 的主价格区、deal badge 区或 buybox 附近确认；如果 `Limited time deal` 只出现在 `p13n`、`sp_detail`、sponsored products、similar items、product bundle、lowest price devices 等推荐/广告/组件区域，不能写 `LD`。
- 当用户指出某个 ASIN 实际没有跑 `LD`，不要只修单条；先批量复核当天所有含 `LD` 的记录，用 Amazon PDP 当前商品模块重新抓取，清理旧解析残留。
- `Price discount` 表示当前商品存在划线价/参考价折扣，`实际成交价` 仍保持当前单件展示价。

### 价格计算规则

`售价`：
- 只写带 `amazon_cookie` 的 Amazon PDP 当前展示价。
- 抓取失败时不写 SellerSprite `price`，保留已验证值或留空。

`实际成交价`：
- 只有在明确识别到单件 Coupon 时才按 Coupon 计算
- 例如 `Apply $2 coupon`、`Apply 10% coupon`

不要把以下类型直接折算成单件成交价：
- `Multi-buy`
- `Price discount`
- 条件满减
- `if you qualify`
- `Shop items`
- `Terms`

这类促销应保留在 `促销类型`，但 `实际成交价` 仍保持单件展示价。

## 流量字段

### Step 5: 填充流量字段
对所有 ASIN 调用：
- `traffic_keyword_stat`
- `traffic_keyword`

推荐逻辑：
- `traffic_keyword_stat` 不传月份，优先拿当前近实时结构
- `traffic_keyword` 不传月份，优先拿当前近实时流量词

写入：
- `自然流量词数`
- `TOP5流量词`
- `TOP自然排名`
- `TOP5广告排名`

格式约定：
- `TOP5流量词`: `keyword1(12.3%), keyword2(8.1%), ...`
- `TOP自然排名`: `#2, #5, -, #8, ...`
- `TOP5广告排名`: `#1, -, #3, ...`

如果接口返回空：
- 如果 SellerSprite 正常返回 `keywords=0`、`total=0`、`items=null`，这是确认无流量词，不是抓取失败
- `自然流量词数` 写 `0`
- `TOP5流量词` 写 `无流量词`
- `TOP自然排名`、`TOP5广告排名` 写 `-`
- 只有接口报错、超时、非 OK、鉴权失败等真正抓取失败时，才写 `无数据`，并进入低并发重试

### 重跑保护
如果只是重跑主数据修正价格，不要把已经写好的流量字段覆盖回 `待补`。

主数据重跑时：
- 若今日记录已存在，优先复用该记录里的流量字段
- 只有流量补全过程才重写流量字段
- 流量补全后要同步更新飞书输出表和本地 `today_main_rows.json`、日期版 `*_main_rows.json`
- 如果今日记录的流量字段仍是 `待补`、空值或 `无数据`，优先只重试缺失项；若批量接口出现较多 fetch error，降低并发后只重试失败项，不要全量覆盖已成功数据

## 异常判断

最低限度保留以下异常：
- `价格异常`: 与上次记录相比变化 >= 3%
- `BSR异常`: `abs(bsrCr) > 15`
- `评论异常`: 评论数相较上次明显跳变
- `销量异常`: `abs(unitsGr) > 20`
- `变体异常`: 变体数变化
- `标签异常`: BS / AC 等标签变化
- `流量异常`: 流量词数量或结构明显变化；或 TOP5 词出现 AC / ER / 官方推荐词

等级建议：
- `🔴极高`: 3 个及以上异常，或单项极重
- `🔴高`: 2 个异常
- `🟡中`: 1 个异常
- `正常`: 无异常

## 写入飞书

始终按幂等 upsert 执行：
- 今日不存在 -> `create`
- 今日已存在 -> `update`

每批最多 500 条。

## 输出摘要

对话内摘要不要只罗列数字。至少输出：
1. 今日高风险竞品
2. 价格/促销动作
3. 流量异常或机会
4. 建议动作

## 已验证的关键坑位

下次执行时默认遵循以下经验：
- 不要把 `competitor_lookup.price` 当今天实时促销价
- 不要把 SellerSprite 历史 `couponTrends` 当今天实时促销快照
- Amazon PDP 的 `priceToPay` 更适合做今日 `售价`
- `Save 5% | on 2 select item(s)` 这类应归类为 `Multi-buy`，不要直接下调单件 `实际成交价`
- `List Price` / `Was` / `Typical` / `savingsPercentage` 这类当前商品价格区信号应归类为 `Price discount`
- 不要用整页全文兜底扫描促销，否则会把推荐位或广告位里其他 ASIN 的折扣误写到当前 ASIN
- `LD` 是高误判字段：如果当天结果里出现 `LD`，尤其用户点名如 `B0FSKYYWBW` 这类“前台没跑 LD”的 ASIN，要批量审计所有含 `LD` 的今日记录。
- LD 审计逻辑：重新抓 Amazon PDP，只采信当前商品 price/deal/buybox 模块；新版快照不含 `LD` 时，应从 `促销类型` 中移除 `LD`，保留仍被确认的 `Multi-buy`、`Price discount`、`Coupon` 等其他类型。
- 清理 false-LD 时只更新 `促销类型` 字段，不要顺手覆盖价格、流量词或异常字段。
- 主数据重跑时要保住当天已补好的流量字段
- 本地产物最好带日期落盘，避免覆盖前一天结果

## 示例

```
跑今天的竞品追踪
```

```
继续补充流量词完整版
```

```
修正今天的价格和促销类型，卖家精灵价格不是最新的
```
