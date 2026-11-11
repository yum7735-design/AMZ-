# Multi-Site VOC Analysis Rules

Read this reference when the user requests VOC analysis across multiple Amazon marketplaces or platforms.

## Default: Amazon US Only

Unless the user explicitly requests multi-site analysis, analyze Amazon US only.

Reason: Largest review volume, most complete VOC, most direct user expression, best baseline for product development.

## Multi-Site Expansion Rules

When multi-site analysis is requested, follow these rules strictly:

### Rule 1: Separate by Market

Always analyze each site independently. Never pool reviews across markets — user preferences differ significantly by region.

### Rule 2: Language Isolation

- Amazon US/UK: English only
- Amazon DE: German only (do not machine translate unless necessary, flag if translated)
- Amazon JP: Japanese only (be especially careful with nuance)
- If reviews contain mixed languages, filter to the primary market language

### Rule 3: Regional Difference Output

For each market, produce a dedicated section highlighting:

| Market | Analysis Focus |
|--------|---------------|
| US | DIY scenarios, ease of use, value perception |
| UK | Usage habits, weather resistance, installation complexity |
| DE | Industrial parameters, certifications, technical specs |
| JP | Storage/收纳, precision, size refinement, packaging quality |
| Walmart | Price sensitivity, basic functionality, value comparisons |
| Home Depot | Tool-specific use, job site durability, pro vs. DIY split |
| Reddit | Real complaints, modification scenarios, honest comparisons |

### Rule 4: Regional Opportunity Output

Produce a cross-market comparison table:

```markdown
| Opportunity | US Demand | EU Demand | JP Demand | Priority |
|-------------|-----------|-----------|-----------|----------|
| ... | High/Med/Low | High/Med/Low | High/Med/Low | Global / Regional |
```

### Rule 5: Language in Reports

- Always output the main report in the user's conversation language
- Preserve original review quotes in their source language
- If translating review quotes for analysis, keep originals alongside translations

## Platform-Specific Notes

### Amazon
- Reviews are purchase-verified by default (filter available)
- Rating system: 1-5 stars
- Rich metadata: Variation, Color, Size, Style

### Walmart
- Generally fewer reviews than Amazon US
- Users more price-sensitive
- Less variation data available

### Home Depot
- Tool and home improvement focused
- Reviews often mention specific job applications
- Pro vs. DIY user distinction is critical

### Reddit
- Not a retail platform — use for qualitative insights
- Honest, unfiltered opinions
- Good for discovering modification/alternative use cases
- Search subreddits relevant to the product category
