# Input Contract

Use this reference when the product workbook or HTML tables do not obviously match the default schema.

## Expected Inputs

### 1. Product workbook

The generator expects one workbook containing a flat variant table.

Preferred fields:

| Meaning | Common aliases |
| --- | --- |
| Variant ASIN | `ASIN`, `asin` |
| Parent ASIN | `父ASIN`, `Parent ASIN`, `parent_asin` |
| Product name | `品名`, `Product Name`, `Name` |
| Existing title | `标题`, `Title` |
| Color | `具体颜色`, `颜色分类`, `Color` |
| Size | `尺寸规格`, `Size`, `Specification` |
| Length | `卷装长度`, `单个长度`, `Length` |
| Ratio / spec ratio | `收缩比`, `Ratio`, `Shrink Ratio` |
| Material | `材质`, `Material` |
| Packaging | `包装方式`, `Package Type`, `Package` |
| Quantity / pack count | `套装数量`, `Pack Count`, `Quantity` |

If several aliases exist, use the first matching non-empty column.

### 2. Needs map HTML

The generator reads HTML tables and looks for demand-side tables such as:

- JTBD / user tasks
- use cases / scenes
- pains / concerns
- purchase drivers / decision factors

The script only needs enough signal to extract:

- one or more priority needs
- one or more use scenes
- one or more purchase concerns or decision drivers

Common table headers the script already knows:

- `优先级`, `JTBD`, `任务解释`
- `场景`, `使用场景`, `Scene`
- `痛点`, `Pain`, `表现`, `影响`
- `购买驱动`, `决策因素`, `Purchase Driver`

### 3. Demand matrix HTML

The generator expects a keyword table with columns similar to:

| Meaning | Common aliases |
| --- | --- |
| Keyword | `关键词`, `Keyword`, `Search Term` |
| Priority | `优先级`, `Priority`, `Tier` |
| Search intent | `搜索意图`, `Search Intent`, `Intent` |
| Need | `用户需求`, `Need`, `User Need` |
| Scene | `使用场景`, `Scene`, `Use Case` |
| Pain point | `对应痛点`, `Pain Point`, `Pain` |
| Purchase driver | `购买驱动`, `Purchase Driver`, `Driver` |

## Fallback Rules

If the script cannot infer enough structure:

1. Inspect the workbook or HTML manually.
2. Map the real columns to the aliases above.
3. Patch the alias lists in `scripts/generate_listing_copy.py`.
4. Re-run the generator.

If the input is too irregular for reliable automation, generate the listing copy manually but preserve the same output table structure.
