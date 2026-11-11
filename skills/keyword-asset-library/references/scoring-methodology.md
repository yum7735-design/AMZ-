# Keyword Scoring Methodology (100-point scale)

## Score Components

### 1. Search Volume (0-25 points)
```javascript
const searches = market.searches || 0;
if (searches > 0) score += Math.min(25, Math.log10(searches) / Math.log10(150000) * 25);
```
Log scale normalized against 150,000 as ceiling. A keyword with 100K searches scores ~24, 10K scores ~19, 1K scores ~14.

### 2. Purchase Volume (0-20 points)
```javascript
const purchases = market.purchases || 0;
if (purchases > 0) score += Math.min(20, Math.log10(purchases) / Math.log10(10000) * 20);
```
Log scale normalized against 10,000. Rewards keywords where people actually buy, not just browse.

### 3. Ad Orders (0-20 points)
```javascript
const orders = ad.orders || 0;
if (orders > 0) score += Math.min(20, Math.log10(orders + 1) / Math.log10(1000) * 20);
```
Real conversion data from your own ads. This is the most trustworthy signal because it reflects YOUR product's actual performance, not market averages.

### 4. CVR (0-15 points)
```javascript
const cvr = ad.CVR || 0; // percentage value, e.g., 15 means 15%
score += Math.min(15, cvr / 100 * 50);
```
Higher conversion rate = better keyword-product fit. A 30% CVR maxes out this component.

### 5. Competition / SPR (0-10 points)
```javascript
const spr = market.spr || 1;
const sd = market.supplyDemandRatio || 0;
// Supply-demand ratio (0-5 points)
score += Math.min(5, sd / 5 * 5);
// SPR tiers (0-5 points) - lower SPR = easier to rank
if (spr <= 10) score += 5;
else if (spr <= 50) score += 3;
else score += 1;
```
SPR (Sales Per Review) indicates how many sales you need to reach page 1. Lower = easier entry.
Supply-demand ratio > 1 means demand exceeds supply — favorable market.

### 6. Brand Relevance (0-10 points, can go negative)
This is where the user's brand positioning matters:
```javascript
// User-specified bonus keywords (e.g., professional, marine, industrial)
if (bonusPattern.test(keyword)) score += 10;
// Secondary bonus (e.g., bulk, wholesale, B2B)
if (secondaryBonusPattern.test(keyword)) score += 5;
// Core product keyword with high volume gets a smaller bonus
if (corePattern.test(keyword) && searches >= 5000) score += 5;
// Penalty keywords (e.g., cheap, budget, low cost)
if (penaltyPattern.test(keyword)) score -= 15;
```

## Rating Tiers

| Grade | Score Range | Meaning |
|-------|-----------|---------|
| A+ | >= 85 | Must-win strategic keywords, top priority |
| A | 70-84 | High-value keywords, strong investment |
| B | 55-69 | Solid keywords, worth targeting |
| C | 40-54 | Niche/supplementary keywords |
| D | < 40 | Low priority, monitor only |

## Calibration Tips

The scoring formula should produce 1-5 A+ keywords (the absolute core terms), 5-20 A keywords, and a healthy spread across B/C/D. If you get 0 A+ keywords, the core keyword bonus (+5 for high-volume core terms) may need adjustment. If you get too many A+ keywords, the thresholds may be too generous.

For a brand-new product line with no ad data, the Ad Orders and CVR components will be zero for all keywords — the scoring still works but will be dominated by market data (searches, purchases, SPR). Mention this to the user.
