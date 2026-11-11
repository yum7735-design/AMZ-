# SellerSprite MCP Workflow

## Tool Names

The SellerSprite MCP tools are available under two possible prefixes (check which one is registered):
- `mcp__sellersprite-mcp__*`
- `mcp__fcaee738-*__*` (UUID-based prefix)

Use ToolSearch to find the actual tool names: `query: "keyword_miner", max_results: 5`.

## API Call Sequence

### 1. keyword_miner

Purpose: Get ~200 related keywords from a seed keyword.

Parameters:
- `keyword`: The seed keyword (e.g., "heat shrink tubing")
- `marketplace`: "US" (default)

Key response fields per keyword:
| Field | Description | Use in scoring |
|-------|-------------|----------------|
| `keyword` | The keyword text | Primary key |
| `searches` | Monthly search volume | Search volume score (25pts) |
| `purchases` | Monthly purchases from this keyword | Purchase score (20pts) |
| `purchaseRate` | purchases / searches | Conversion indicator |
| `spr` | Sales Per Review — sales needed for page 1 | Competition score |
| `products` | Number of competing products | Market density |
| `supplyDemandRatio` | searches / products (roughly) | Competition score |
| `monopolyClickRate` | Top 3 ASIN click concentration | Market opportunity |
| `bid` | Suggested PPC bid ($) | Ad cost reference |
| `titleDensity` | How many top results have keyword in title | SEO competition |
| `relevancy` | Relevancy score to seed keyword (0-100) | Filtering |

Some keywords at the tail may have `null` for searches/purchases — still include them, they have SPR/products data.

### 2. traffic_keyword

Purpose: Get actual traffic-driving keywords for a specific ASIN.

Parameters:
- `asin`: The ASIN to look up
- `marketplace`: "US"

Call this for each of the 5 representative ASINs. Key response fields:
| Field | Description |
|-------|-------------|
| `keyword` | Traffic keyword |
| `searches` | Monthly search volume |
| `purchases` | Monthly purchases |
| `purchaseRate` | Conversion rate |
| `rankPosition` | ASIN's organic rank for this keyword |
| `trafficPercentage` | What % of ASIN's total traffic comes from this keyword |
| `spr`, `products`, `supplyDemandRatio`, `monopolyClickRate`, `bid` | Same as keyword_miner |

Traffic keywords with `trafficPercentage > 0.01` are the ASIN's primary traffic drivers.

### 3. traffic_extend

Purpose: Discover additional related keywords beyond keyword_miner.

Parameters:
- `keyword`: Seed keyword
- `marketplace`: "US"
- `page`: Page number (default 1)

Returns ~50 keywords per page with a `total` count. If total > 50, consider fetching more pages for completeness — but page 1 captures the most relevant ones.

Key response fields: same structure as keyword_miner.

## Data Handling Tips

- MCP results can be large (200+ keyword objects). Hardcode them as JavaScript arrays in the build script rather than trying to pipe them through multiple tool calls.
- Deduplicate across MCP sources: the same keyword may appear in keyword_miner, traffic_keyword, and traffic_extend. The `addToPool` merge logic handles this — later sources update market data fields.
- Some traffic_keyword results may include keywords irrelevant to your product line (e.g., a generic "wire" keyword appearing for a wire connector ASIN). Don't filter these out manually — the scoring system will naturally rank irrelevant keywords low.
