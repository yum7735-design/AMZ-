# Keyword Classification Framework

## Categories

| Category | Chinese | Description |
|----------|---------|-------------|
| 核心词 | Core | The product's primary search terms, 2-3 words, directly naming the product |
| 属性词-尺寸 | Attribute-Size | Size, dimension, length, gauge specifications |
| 属性词-规格 | Attribute-Spec | Technical specs: ratios, ratings, standards |
| 属性词-颜色 | Attribute-Color | Color variants |
| 属性词-材质 | Attribute-Material | Material types |
| 属性词-功能 | Attribute-Function | Functional features: waterproof, adhesive, insulated |
| 属性词-形态 | Attribute-Form | Product packaging/form: kit, roll, set, pack, bulk |
| 场景词 | Scene | Usage context: marine, automotive, electrical, outdoor |
| 用户词 | User | Target user: electrician, mechanic, DIY, contractor |
| 品牌词 | Brand | Own brand keywords |
| 竞品品牌词 | Competitor | Competitor brand keywords |
| 长尾词 | Long-tail | 4+ word specific intent phrases |

## How to Build Classification Patterns Dynamically

Don't copy regex patterns from a previous product line. Instead, derive them from the data:

### Step 1: Identify the core keyword pattern
Look at the seed keyword and top keyword_miner results. The core pattern is the 2-3 word phrase that most results share.

Example derivation:
- Seed: "wire connector" → core pattern: `/^wire\s*connector(s)?$|^connector(s)?\s*for\s*wire/`
- Seed: "heat shrink tubing" → core pattern: `/^heat\s*shrink\s*tub|^shrink\s*tub|^heat\s*shrink$|^heat-shrink/`

### Step 2: Scan keyword_miner results for attribute dimensions
Group the ~200 keywords and look for recurring modifiers:

```
For each keyword in minerKeywords:
  Remove the core product name
  What's left? → these are the attribute modifiers
```

**Size patterns** — look for: numbers with units (inch, mm, ft, gauge, awg), fractions (1/4, 3/8), ranges
```javascript
// Generic starting point, then add product-specific sizes found in the data
const sizePatterns = /\b(\d+\/\d+|\d+\s*(inch|mm|ft|feet|gauge|awg|cm|m)\b|\d+\s*x\s*\d+)/i;
```

**Color patterns** — usually universal:
```javascript
const colorPatterns = /\b(black|red|blue|green|yellow|white|clear|transparent|colored|multicolor|orange|purple|grey|gray|pink)\b/i;
```

**Material patterns** — product-specific, derive from data:
```javascript
// Scan keywords for material terms, build pattern from what you find
// Examples: polyolefin, silicone, nylon, copper, brass, stainless steel, PVC
```

**Function patterns** — derive from data:
```javascript
// Examples: waterproof, insulated, adhesive, heat-resistant, crimp, solder
```

**Form patterns** — usually common:
```javascript
const formPatterns = /\b(kit|assortment|roll|set|pack|bundle|box|spool|bulk|bag|piece|pcs)\b/i;
```

**Scene patterns** — derive from data:
```javascript
// Examples: marine, automotive, electrical, industrial, outdoor, home
```

**User patterns** — derive from data:
```javascript
// Examples: electrician, mechanic, DIY, contractor, professional, hobbyist
```

### Step 3: Brand detection
```javascript
// Own brand — exact match at start
if (keyword.startsWith(brandName.toLowerCase())) return '品牌词';
// Competitor brands — build list from keyword_miner results that look like brand names
// Heuristic: low relevancy score + appears as first word + not a common English word
```

### Step 4: Classification priority order
Apply rules in this order (first match wins):
1. Brand / Competitor brand
2. Core keyword (short, 2-3 words, matches core pattern)
3. Size attributes
4. Spec attributes (ratios, standards)
5. Color attributes
6. Material attributes
7. Function attributes
8. Form attributes
9. Scene keywords
10. User keywords
11. Long-tail (4+ words, no other match)
12. Default to 核心词

### Step 5: Product positioning tags (for Sheet 5)
In addition to classification, tag each keyword with a product sub-category. Derive these from the parent ASINs / product variants:

```javascript
// Example for a product line with Kit vs Roll vs different specs:
function getProductPosition(keyword) {
  if (/kit|assortment|set|pack|pcs/.test(keyword)) return 'Kit套装';
  if (/roll|spool|ft|feet|foot/.test(keyword)) return 'Roll成卷';
  // Add more based on the actual product sub-categories
  return '通用';
}
```
