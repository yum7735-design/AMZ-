# 字段与口径

## 所需字段

产品表至少应包含：

| 业务含义 | 默认列名 | 可接受别名 |
|---|---|---|
| 父体 ASIN | `父ASIN` | `父体ASIN` |
| 子体 ASIN | `ASIN` | `子ASIN`、`子体ASIN` |
| 父体品名 | `父体品名` | `品名`、`产品名称` |
| 定位 | `定位` | 无 |
| 产品线 | `产品线` | 无 |

广告表至少应包含：

| 业务含义 | 默认列名 | 可接受别名 |
|---|---|---|
| 广告 ASIN | `ASIN` | `推广ASIN`、`已推广的ASIN` |
| 花费 | `花费-本币` | `花费`、`Spend` |
| 广告组合 | `广告组合` | `广告组`、`Ad Group` |
| 广告活动 | `广告活动` | `Campaign` |

可选字段：`广告名称`、`类型`、`广告销售额-本币`、`广告订单`、`曝光量`、`点击`。它们用于明细与对账展示，非父体花费占比的必要条件。

## 命令

```powershell
python -X utf8 scripts/analyze_parent_spend_share.py `
  --product "C:\\data\\产品表.xlsx" `
  --ads "C:\\data\\广告汇总.xlsx" `
  --output "C:\\data\\parent_spend_share.json" `
  --exclude-ad-groups "店铺-品牌广告" "焊锡/BHT/热缩/工具/铜鼻SB广告" `
  --product-lines "热缩管" "裸端子" "铜鼻接线端子" "铜鼻接线工具" `
  --threshold 0.05
```

`--exclude-ad-groups` 不传时不剔除任何广告组合。`--product-lines` 不传时不做指定产品线汇总。`--enterprise-keyword`、`--clearance-labels` 可覆盖默认口径。

## JSON 关键字段

- `qualified_rows`：达到阈值的父体结果。
- `parent_rows`：所有有花费、可纳入的父体结果。
- `product_line_rows`：用户指定的产品线汇总。
- `details`：每个广告记录到父体的等额分摊明细。
- `excluded_details`：精确广告组合剔除明细。
- `totals.reconciliation_gap`：对账差异。
- `data_quality.multiple_product_line_parents`：不能直接计入产品线汇总的父体。
