/**
 * 月度经营复盘 - 数据提取 + HTML报告生成
 * 从飞书Open API读取月复盘表和超龄库存表，生成自包含HTML报告
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// --- Config ---
const APP_ID = process.env.FEISHU_APP_ID || '';
const APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || '';
const MAIN_TABLE = process.env.FEISHU_MAIN_TABLE_ID || '';
const AGING_TABLE = process.env.FEISHU_AGING_TABLE_ID || '';
function cliArg(name) {
  const exact = process.argv.find(v => v.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const lastCompletedMonth = new Date();
lastCompletedMonth.setMonth(lastCompletedMonth.getMonth() - 1);
const TARGET_YEAR = Number(cliArg('--year') || process.env.MONTHLY_REVIEW_YEAR || lastCompletedMonth.getFullYear());
const TARGET_MONTH = Number(cliArg('--month') || process.env.MONTHLY_REVIEW_MONTH || lastCompletedMonth.getMonth() + 1);
const OUTPUT_DIR = cliArg('--out-dir') || process.env.MONTHLY_REVIEW_OUT_DIR || path.join(process.cwd(), 'ops-reports');
const EXCLUDED_PRODUCT_LINES = new Set(['电气箱']);

// --- API Helpers ---
function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({ hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(data); req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { Authorization: `Bearer ${token}` } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); }
    ).on('error', reject);
  });
}

async function getToken() {
  const r = await post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', { app_id: APP_ID, app_secret: APP_SECRET });
  return r.tenant_access_token;
}

async function fetchAllRecords(token, tableId, pageSize = 200) {
  let all = [], pageToken = null;
  while (true) {
    let url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${tableId}/records?page_size=${pageSize}`;
    if (pageToken) url += `&page_token=${pageToken}`;
    const r = await get(url, token);
    if (r.code !== 0) throw new Error(`API error ${r.code}: ${r.msg}`);
    all.push(...(r.data.items || []));
    process.stdout.write(`  ${all.length}/${r.data.total}\r`);
    if (!r.data.has_more) break;
    pageToken = r.data.page_token;
  }
  console.log(`  Fetched ${all.length} records`);
  return all;
}

// --- Data extraction helpers ---
function ev(v) { // extract value
  if (v == null) return null;
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    if (typeof v[0] === 'object' && v[0].text != null) return v[0].text;
    return v[0];
  }
  if (typeof v === 'object' && v.text != null) return v.text;
  return v;
}

function num(v) { const n = parseFloat(ev(v)); return isNaN(n) ? 0 : n; }
function txt(v) { const t = ev(v); return t == null ? '' : String(t); }
function pct(n, d) { return d === 0 ? 0 : n / d; }
function fmtPct(v) { return (v * 100).toFixed(1) + '%'; }
function fmtUSD(v) { return '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function fmtInt(v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function momPct(cur, prev) { return prev === 0 ? (cur > 0 ? 1 : 0) : (cur - prev) / Math.abs(prev); }
function momClass(v) { return v > 0.001 ? 'metric-up' : v < -0.001 ? 'metric-down' : 'metric-stable'; }
function momArrow(v) { return v > 0.001 ? '↑' : v < -0.001 ? '↓' : '→'; }
function momSpan(v) { return `<span class="${momClass(v)}">${momArrow(v)}${fmtPct(Math.abs(v))}</span>`; }

// --- Main ---
async function main() {
  console.log('Getting token...');
  const token = await getToken();

  console.log('Fetching 月复盘 records...');
  const allRecords = await fetchAllRecords(token, MAIN_TABLE, 500);

  // Parse records
  const parsed = allRecords.map(r => {
    const f = r.fields;
    return {
      id: r.record_id,
      year: num(f['年']), month: num(f['月']),
      asin: txt(f['ASIN']), parentAsin: txt(f['父ASIN']),
      parentName: txt(f['父ASIN品名']), name: txt(f['品名']),
      productLine: txt(f['产品线']), positioning: txt(f['产品定位']),
      lifecycle: txt(f['生命周期']), sellStatus: txt(f['卖/不卖']),
      visitors: num(f['访客']), orders: num(f['订单量']), units: num(f['销量']),
      revenue: num(f['销售额']), profit: num(f['毛利润']),
      adSpend: num(f['广告花费']), adOrders: num(f['广告订单量']),
      adClicks: num(f['广告点击']), adRevenue: num(f['广告销售额']),
      returns: num(f['退货量']), inventory: num(f['FBA可售库存']),
      rating: num(f['评分']), reviews: num(f['评论数']),
      rankText: txt(f['小类排名']),
      inboundFee: num(f['入库配置费']), storageFee: num(f['仓储费']),
      cogs: num(f['采购成本']), promoCost: num(f['促销成本']), refundAmt: num(f['退款金额']),
      // Pre-computed formulas
      convRate: num(f['转化']), marginRate: num(f['毛利率']),
      adRatio: num(f['广花比']), cpc: num(f['CPC']), adCvr: num(f['广告CVR']),
      acos: num(f['广告ACOS']), returnRate: num(f['退货率']),
      invMonths: num(f['可售库存预计售卖月']),
      cogsRatio: num(f['采购占比']), storageRatio: num(f['仓储费占比']),
      inboundRatio: num(f['入库配置费占比']), promoRatio: num(f['促销占比']), refundRatio: num(f['退款占比']),
      revenueMom: num(f['销售额环比']), profitMom: num(f['毛利润环比']),
    };
  });

  // Repair a malformed product-line label from the same parent's clean historical records.
  // Feishu occasionally stores the Unicode replacement character (�) in a lookup value.
  const cleanLineByParent = new Map();
  for (const r of parsed) {
    if (r.parentAsin && r.productLine && !r.productLine.includes('�')) cleanLineByParent.set(r.parentAsin, r.productLine);
  }
  for (const r of parsed) {
    if (r.productLine.includes('�')) r.productLine = cleanLineByParent.get(r.parentAsin) || '未分类（产品线数据异常）';
  }

  // The parent lookup can occasionally be blank in one monthly row. Recover it from another
  // month of the same child ASIN before aggregation, rather than treating the child as a parent.
  const parentByChildAsin = new Map();
  for (const r of parsed) {
    if (r.asin && r.parentAsin && r.parentAsin !== r.asin) parentByChildAsin.set(r.asin, r.parentAsin);
  }
  for (const r of parsed) {
    if (!r.parentAsin && parentByChildAsin.has(r.asin)) r.parentAsin = parentByChildAsin.get(r.asin);
  }

  // Suppress only fully dormant records in detail views. Any sales, cost, traffic, or inventory
  // signal keeps the product visible; Layer 1 remains based on the complete raw dataset.
  function hasReportableData(r) {
    const materialMoney = [r.revenue, r.profit, r.adSpend, r.cogs, r.storageFee, r.inboundFee,
      r.promoCost, r.refundAmt].some(v => Math.abs(v || 0) >= 1);
    return materialMoney || [r.orders, r.units, r.visitors, r.inventory].some(v => Math.abs(v || 0) > 0.000001);
  }

  // Group by month
  const byMonth = {};
  for (const r of parsed) {
    const key = `${r.year}-${String(r.month).padStart(2,'0')}`;
    (byMonth[key] = byMonth[key] || []).push(r);
  }
  console.log('Records per month:', Object.fromEntries(Object.entries(byMonth).map(([k,v]) => [k, v.length])));

  // Define 6-month range
  const months6 = [];
  for (let i = 5; i >= 0; i--) {
    let y = TARGET_YEAR, m = TARGET_MONTH - i;
    while (m <= 0) { m += 12; y--; }
    months6.push(`${y}-${String(m).padStart(2,'0')}`);
  }
  console.log('6-month range:', months6);

  const curKey = months6[5], prevKey = months6[4];
  const curData = byMonth[curKey] || [];
  const prevData = byMonth[prevKey] || [];

  if (curData.length === 0) { console.error(`No data for ${curKey}!`); process.exit(1); }
  console.log(`Current month: ${curKey} (${curData.length} records), Previous: ${prevKey} (${prevData.length} records)`);

  // --- Layer 1: 整体月环比 (ALL products) ---
  function agg(records) {
    const a = { count: records.length, revenue: 0, profit: 0, adSpend: 0, adClicks: 0, adOrders: 0, adRevenue: 0,
      orders: 0, visitors: 0, units: 0, returns: 0, cogs: 0, storageFee: 0, inboundFee: 0, promoCost: 0, refundAmt: 0,
      ratingSum: 0, ratingCount: 0, reviews: 0, inventory: 0 };
    for (const r of records) {
      a.revenue += r.revenue; a.profit += r.profit; a.adSpend += r.adSpend;
      a.adClicks += r.adClicks; a.adOrders += r.adOrders; a.adRevenue += r.adRevenue;
      a.orders += r.orders; a.visitors += r.visitors; a.units += r.units;
      a.returns += r.returns; a.cogs += r.cogs; a.storageFee += r.storageFee;
      a.inboundFee += r.inboundFee; a.promoCost += r.promoCost; a.refundAmt += r.refundAmt;
      if (r.rating > 0) { a.ratingSum += r.rating; a.ratingCount++; }
      a.reviews += r.reviews; a.inventory += r.inventory;
    }
    a.marginRate = pct(a.profit, a.revenue);
    a.convRate = pct(a.orders, a.visitors);
    a.adRatio = pct(a.adSpend, a.revenue);
    a.cpc = pct(a.adSpend, a.adClicks);
    a.adCvr = pct(a.adOrders, a.adClicks);
    a.returnRate = pct(a.returns, a.units);
    a.avgRating = a.ratingCount > 0 ? a.ratingSum / a.ratingCount : 0;
    return a;
  }

  const curAgg = agg(curData);
  const prevAgg = agg(prevData);

  // 6-month trend
  const trend6 = months6.map(k => ({ month: k, ...agg(byMonth[k] || []) }));

  // --- Layer 2: 产品线 ---
  function groupBy(records, key) {
    const g = {};
    for (const r of records) { const k = r[key] || '未分类'; (g[k] = g[k] || []).push(r); }
    return g;
  }

  const curDisplayData = curData.filter(r => hasReportableData(r) && !EXCLUDED_PRODUCT_LINES.has(r.productLine));
  const prevDisplayData = prevData.filter(r => hasReportableData(r) && !EXCLUDED_PRODUCT_LINES.has(r.productLine));
  const curByLine = groupBy(curDisplayData, 'productLine');
  const prevByLine = groupBy(prevDisplayData, 'productLine');

  // --- Layer 3: 按定位分类 ---
  const curByPos = groupBy(curData.filter(r => r.sellStatus === '卖'), 'positioning');
  const prevByPos = groupBy(prevData.filter(r => r.sellStatus === '卖'), 'positioning');

  // --- Layer 4: Anomaly detection at parent ASIN level ---
  function groupByParent(records) {
    const g = {};
    for (const r of records) {
      const k = r.parentAsin || r.asin;
      (g[k] = g[k] || []).push(r);
    }
    return g;
  }
  function aggParent(records) {
    const a = agg(records);
    a.parentAsin = records[0].parentAsin || records[0].asin;
    a.parentName = records[0].parentName || records[0].name;
    a.productLine = records[0].productLine;
    a.positioning = records[0].positioning;
    a.lifecycle = records[0].lifecycle;
    a.sellStatus = records[0].sellStatus;
    // Pick representative child for ranking
    const ranked = records.filter(r => r.rankText).sort((a,b) => b.revenue - a.revenue);
    a.rankText = ranked.length > 0 ? ranked[0].rankText : '';
    a.rating = records.reduce((best, r) => r.rating > 0 ? r : best, records[0]).rating;
    a.reviews = records.reduce((s, r) => s + r.reviews, 0);
    a.invMonths = records[0].invMonths;
    return a;
  }

  const curParentGroups = groupByParent(curData);
  const curParentsAll = Object.values(curParentGroups).map(aggParent);
  const curParents = curParentsAll.filter(p =>
    curParentGroups[p.parentAsin].some(r => r.sellStatus === '卖') && hasReportableData(p));
  const prevParentMap = {};
  for (const recs of Object.values(groupByParent(prevData))) {
    const a = aggParent(recs);
    prevParentMap[a.parentAsin] = a;
  }

  // Detect anomalies
  const anomalies = [];
  for (const cur of curParents) {
    const prev = prevParentMap[cur.parentAsin];
    if (!prev) continue;
    const revMom = momPct(cur.revenue, prev.revenue);
    const profitMom = momPct(cur.profit, prev.profit);
    const issues = [];
    let severity = 'normal';

    if (revMom < -0.15) issues.push({ type: '销售额下滑', value: revMom });
    if (profitMom < -0.15) issues.push({ type: '利润下滑', value: profitMom });
    if (cur.profit < 0) issues.push({ type: '利润为负', value: cur.profit });

    if (issues.length >= 2 || (cur.profit < 0 && revMom < -0.05)) severity = 'critical';
    else if (issues.length === 1) severity = 'red';
    else if (revMom < -0.10 || profitMom < -0.10) { severity = 'yellow'; issues.push({ type: '接近阈值', value: Math.min(revMom, profitMom) }); }

    if (severity !== 'normal') {
      anomalies.push({ ...cur, prevRevenue: prev.revenue, prevProfit: prev.profit, revMom, profitMom, issues, severity });
    }
  }
  anomalies.sort((a, b) => { const order = { critical: 0, red: 1, yellow: 2 }; return (order[a.severity] || 3) - (order[b.severity] || 3); });

  const sevCounts = { critical: anomalies.filter(a => a.severity === 'critical').length,
    red: anomalies.filter(a => a.severity === 'red').length,
    yellow: anomalies.filter(a => a.severity === 'yellow').length };
  console.log(`Anomalies: ${sevCounts.critical} critical, ${sevCounts.red} red, ${sevCounts.yellow} yellow`);

  // --- Aging inventory ---
  console.log('Fetching aging inventory...');
  const agingRecords = await fetchAllRecords(token, AGING_TABLE, 500);
  const agingByAsin = {};
  for (const r of agingRecords) {
    const f = r.fields;
    const asin = txt(f['asin']);
    if (!asin) continue;
    const tier = txt(f['surcharge-age-tier']) || '';
    const qty = num(f['qty-charged']);
    const amt = num(f['amount-charged']);
    if (!agingByAsin[asin]) agingByAsin[asin] = { asin, tiers: [], totalQty: 0, totalAmt: 0 };
    agingByAsin[asin].tiers.push(tier);
    agingByAsin[asin].totalQty += qty;
    agingByAsin[asin].totalAmt += amt;
    agingByAsin[asin].worstTier = tier; // last one seen; could sort
  }
  console.log(`Aging inventory: ${Object.keys(agingByAsin).length} ASINs`);

  // --- Inventory health ---
  const invHealth = { danger: [], healthy: [], excess: [] };
  for (const p of curParents) {
    if (p.invMonths < 1) invHealth.danger.push(p);
    else if (p.invMonths > 6) invHealth.excess.push(p);
    else invHealth.healthy.push(p);
  }

  // --- Generate HTML Report ---
  console.log('Generating HTML report...');

  const monthLabel = m => { const [y, mo] = m.split('-'); return `${parseInt(mo)}月`; };
  const curLabel = monthLabel(curKey);

  function trendRow(label, getter, formatter) {
    const vals = trend6.map(t => getter(t));
    const curVal = vals[5], prevVal = vals[4];
    const mom = momPct(curVal, prevVal);
    // Determine trend direction
    let ups = 0, downs = 0;
    for (let i = 1; i < vals.length; i++) { if (vals[i] > vals[i-1]) ups++; else if (vals[i] < vals[i-1]) downs++; }
    const trendDir = ups >= 4 ? '持续增长' : downs >= 4 ? '持续下滑' : ups > downs ? '波动上升' : downs > ups ? '波动下降' : '基本持平';
    const trendClass = ups >= 4 ? 'trend-direction-up' : downs >= 4 ? 'trend-direction-down' : 'trend-direction-flat';

    return `<tr><td style="font-weight:600">${label}</td>${vals.map((v, i) =>
      `<td${i === 5 ? ' class="current-month"' : ''}>${formatter(v)}</td>`).join('')}
      <td>${momSpan(mom)}</td><td><span class="trend-direction ${trendClass}">${trendDir}</span></td></tr>`;
  }

  function productLineSection(lineName, curRecs, prevRecs) {
    const ca = agg(curRecs), pa = agg(prevRecs || []);
    const revMom = momPct(ca.revenue, pa.revenue);
    const profitMom = momPct(ca.profit, pa.profit);

    // Parent ASIN detail table
    const parents = Object.values(groupByParent(curRecs)).map(aggParent).sort((a,b) => b.revenue - a.revenue);
    const parentRows = parents.map(p => {
      const pp = prevParentMap[p.parentAsin];
      const rm = pp ? momPct(p.revenue, pp.revenue) : 0;
      const pm = pp ? momPct(p.profit, pp.profit) : 0;
      const agingInfo = agingByAsin[p.parentAsin] ? `<span class="aging-badge aging-${(agingByAsin[p.parentAsin].worstTier||'').split('-')[0]}">${agingByAsin[p.parentAsin].worstTier}</span>` : '';
      return `<tr><td>${p.parentAsin}</td><td>${p.parentName}</td><td>${p.positioning}</td>
        <td>${fmtUSD(p.revenue)}</td><td>${momSpan(rm)}</td>
        <td>${fmtUSD(p.profit)}</td><td>${momSpan(pm)}</td>
        <td>${fmtPct(p.marginRate)}</td><td>${fmtPct(p.adRatio)}</td>
        <td>${fmtUSD(p.cpc)}</td><td>${p.rankText}</td>
        <td>${p.rating > 0 ? p.rating.toFixed(1) : '-'}</td><td>${agingInfo}</td></tr>`;
    }).join('');

    return `<section class="product-line-section">
      <h3>产品线: <span class="pl-name">${lineName}</span></h3>
      <div class="card pl-summary"><div class="summary-grid">
        <div class="summary-item"><span class="label">ASIN数</span><span class="value">${ca.count}</span></div>
        <div class="summary-item"><span class="label">月销售额</span><span class="value">${fmtUSD(ca.revenue)} ${momSpan(revMom)}</span></div>
        <div class="summary-item"><span class="label">月毛利润</span><span class="value">${fmtUSD(ca.profit)} ${momSpan(profitMom)}</span></div>
        <div class="summary-item"><span class="label">毛利率</span><span class="value">${fmtPct(ca.marginRate)}</span></div>
        <div class="summary-item"><span class="label">广花比</span><span class="value">${fmtPct(ca.adRatio)}</span></div>
        <div class="summary-item"><span class="label">CPC</span><span class="value">${fmtUSD(ca.cpc)}</span></div>
      </div>
      ${pa.revenue > 0 ? productLineCostMini(ca, pa) : ''}
      </div>
      <table><thead><tr><th>父ASIN</th><th>品名</th><th>定位</th><th>销售额</th><th>环比</th><th>毛利润</th><th>环比</th><th>毛利率</th><th>广花比</th><th>CPC</th><th>排名</th><th>评分</th><th>超龄</th></tr></thead>
      <tbody>${parentRows}</tbody></table></section>`;
  }

  // --- Cost Analysis & Profit Attribution ---
  function costAnalysisSection() {
    const costItems = [
      { name: '采购成本', curAmt: Math.abs(curAgg.cogs), curRatio: pct(Math.abs(curAgg.cogs), curAgg.revenue), prevRatio: pct(Math.abs(prevAgg.cogs), prevAgg.revenue),
        strategy: '谈判供应商降价、优化包装降低单位成本、评估汇率影响、考虑替代供应商' },
      { name: '广告花费', curAmt: Math.abs(curAgg.adSpend), curRatio: pct(Math.abs(curAgg.adSpend), curAgg.revenue), prevRatio: pct(Math.abs(prevAgg.adSpend), prevAgg.revenue),
        strategy: '优化广告结构（降低非转化词出价）、聚焦高CVR关键词、提高自然流量占比、检查ACOS恶化的campaign' },
      { name: '仓储费', curAmt: Math.abs(curAgg.storageFee), curRatio: pct(Math.abs(curAgg.storageFee), curAgg.revenue), prevRatio: pct(Math.abs(prevAgg.storageFee), prevAgg.revenue),
        strategy: '清理超龄库存、优化补货节奏避免过度备货、评估FBA vs FBM、关注LTSF费用' },
      { name: '入库配置费', curAmt: Math.abs(curAgg.inboundFee), curRatio: pct(Math.abs(curAgg.inboundFee), curAgg.revenue), prevRatio: pct(Math.abs(prevAgg.inboundFee), prevAgg.revenue),
        strategy: '合并发货批次降低单位入库成本、选择最优入库方案' },
      { name: '促销成本', curAmt: Math.abs(curAgg.promoCost), curRatio: pct(Math.abs(curAgg.promoCost), curAgg.revenue), prevRatio: pct(Math.abs(prevAgg.promoCost), prevAgg.revenue),
        strategy: '评估促销ROI、减少低效Coupon、调整BD/LD频率、避免多重促销叠加' },
      { name: '退款金额', curAmt: Math.abs(curAgg.refundAmt), curRatio: pct(Math.abs(curAgg.refundAmt), curAgg.revenue), prevRatio: pct(Math.abs(prevAgg.refundAmt), prevAgg.revenue),
        strategy: '检查近期退货原因和差评、优化listing准确性、改进产品包装减少运输损坏' },
    ];

    // Sort by absolute change in ratio (biggest impact first)
    costItems.forEach(c => { c.ratioDelta = c.curRatio - c.prevRatio; c.absRatioDelta = Math.abs(c.ratioDelta); });
    const sorted = [...costItems].sort((a, b) => b.absRatioDelta - a.absRatioDelta);

    // Cost structure table
    const costRows = sorted.map(c => {
      const impact = c.ratioDelta > 0.002 ? '<span class="metric-down">↑恶化</span>' :
                     c.ratioDelta < -0.002 ? '<span class="metric-up">↓改善</span>' : '<span class="metric-stable">→持平</span>';
      return `<tr><td style="font-weight:600">${c.name}</td><td>${fmtUSD(c.curAmt)}</td>
        <td>${fmtPct(c.curRatio)}</td><td>${fmtPct(c.prevRatio)}</td>
        <td>${c.ratioDelta > 0 ? '+' : ''}${(c.ratioDelta * 100).toFixed(2)}pp</td><td>${impact}</td></tr>`;
    }).join('');

    const totalCostRatioCur = costItems.reduce((s, c) => s + c.curRatio, 0);
    const totalCostRatioPrev = costItems.reduce((s, c) => s + c.prevRatio, 0);

    // Profit waterfall attribution
    const revGrowth = curAgg.revenue - prevAgg.revenue;
    const revContrib = revGrowth * prevAgg.marginRate; // Revenue growth contribution at prev margin
    const waterfallItems = sorted.filter(c => Math.abs(c.ratioDelta) > 0.001).map(c => {
      const impact = -c.ratioDelta * curAgg.revenue; // Negative because cost increase = profit decrease
      return { name: c.name, ratioDelta: c.ratioDelta, impact };
    });
    const totalCostImpact = waterfallItems.reduce((s, w) => s + w.impact, 0);
    const profitDelta = curAgg.profit - prevAgg.profit;
    const explainedDelta = revContrib + totalCostImpact;
    const residual = profitDelta - explainedDelta;

    const waterfallRows = [
      `<tr style="background:var(--bg)"><td style="font-weight:700">上月毛利润</td><td></td><td style="font-weight:700">${fmtUSD(prevAgg.profit)}</td></tr>`,
      `<tr><td>${revContrib >= 0 ? '+' : '-'} 销售额变动贡献</td><td style="font-size:11px;color:var(--muted)">销售额${momArrow(revGrowth)}${fmtPct(Math.abs(momPct(curAgg.revenue, prevAgg.revenue)))}, 按上月毛利率${fmtPct(prevAgg.marginRate)}计算</td><td class="${revContrib >= 0 ? 'metric-up' : 'metric-down'}">${revContrib >= 0 ? '+' : ''}${fmtUSD(revContrib)}</td></tr>`,
      ...waterfallItems.map(w =>
        `<tr><td>${w.impact >= 0 ? '+' : '-'} ${w.name}占比${w.ratioDelta > 0 ? '上升' : '下降'}</td>
         <td style="font-size:11px;color:var(--muted)">${w.ratioDelta > 0 ? '+' : ''}${(w.ratioDelta * 100).toFixed(2)}pp</td>
         <td class="${w.impact >= 0 ? 'metric-up' : 'metric-down'}">${w.impact >= 0 ? '+' : ''}${fmtUSD(w.impact)}</td></tr>`),
      `<tr style="border-top:1px dashed var(--line)"><td>${residual >= 0 ? '+' : '-'} 其他/未拆分因素（利润桥残差）</td>
       <td style="font-size:11px;color:var(--muted)">价格、产品结构及未纳入的费用/数据边界</td>
       <td class="${residual >= 0 ? 'metric-up' : 'metric-down'}">${residual >= 0 ? '+' : ''}${fmtUSD(residual)}</td></tr>`,
      `<tr style="background:var(--bg);border-top:2px solid var(--accent)"><td style="font-weight:700">= 本月毛利润</td><td></td><td style="font-weight:700">${fmtUSD(curAgg.profit)} (${momSpan(momPct(curAgg.profit, prevAgg.profit))})</td></tr>`,
    ].join('');

    // Identify top degraded cost items for summary
    const degraded = sorted.filter(c => c.ratioDelta > 0.002);
    const materialCosts = sorted.filter(c => Math.abs(c.ratioDelta) > 0.002);
    const direction = profitDelta >= 0 ? '增加' : '减少';
    const costText = materialCosts.length > 0
      ? materialCosts.map(c => `${c.name}占比${c.ratioDelta > 0 ? '上升' : '下降'}${Math.abs(c.ratioDelta * 100).toFixed(1)}pp`).join('；')
      : '未发现占比变动超过0.2pp的成本项';
    const summaryText = `► 毛利润${direction} ${fmtUSD(Math.abs(profitDelta))}；已拆分项解释 ${fmtUSD(explainedDelta)}，残差 ${fmtUSD(residual)}。成本项：${costText}。`;

    // Strategy cards for degraded items only
    const strategyCards = degraded.map(c =>
      `<div class="card" style="border-left:3px solid var(--red);padding:12px 16px">
        <p style="font-weight:700;color:var(--red);margin-bottom:4px">${c.name}占比上升 +${(c.ratioDelta*100).toFixed(2)}pp（${fmtPct(c.prevRatio)} → ${fmtPct(c.curRatio)}）</p>
        <p style="font-size:13px"><strong>建议策略：</strong>${c.strategy}</p></div>`
    ).join('');

    return `
<h2>二、利润分析与成本结构</h2>
<div class="card">
  <h3>成本结构对比（本月 vs 上月）</h3>
  <table><thead><tr><th>成本项</th><th>本月金额</th><th>本月占比</th><th>上月占比</th><th>占比变动</th><th>影响</th></tr></thead>
  <tbody>${costRows}
  <tr style="border-top:2px solid var(--accent);font-weight:700"><td>合计成本占比</td><td></td><td>${fmtPct(totalCostRatioCur)}</td><td>${fmtPct(totalCostRatioPrev)}</td>
    <td>${(totalCostRatioCur - totalCostRatioPrev) > 0 ? '+' : ''}${((totalCostRatioCur - totalCostRatioPrev) * 100).toFixed(2)}pp</td><td></td></tr>
  <tr style="font-weight:700;color:var(--accent)"><td>毛利率</td><td>${fmtUSD(curAgg.profit)}</td><td>${fmtPct(curAgg.marginRate)}</td><td>${fmtPct(prevAgg.marginRate)}</td>
    <td>${(curAgg.marginRate - prevAgg.marginRate) > 0 ? '+' : ''}${((curAgg.marginRate - prevAgg.marginRate) * 100).toFixed(2)}pp</td>
    <td>${curAgg.marginRate < prevAgg.marginRate ? '<span class="metric-down">↓下降</span>' : '<span class="metric-up">↑提升</span>'}</td></tr>
  </tbody></table>
</div>

<div class="card">
  <h3>利润变动归因（${parseInt(curKey.split('-')[1])}月 vs ${parseInt(prevKey.split('-')[1])}月）</h3>
  <table style="max-width:700px"><thead><tr><th>项目</th><th>说明</th><th>金额影响</th></tr></thead>
  <tbody>${waterfallRows}</tbody></table>
  <p style="margin-top:12px;font-weight:600;font-size:14px;color:var(--ink)">${summaryText}</p>
</div>

${degraded.length > 0 ? `<h3>成本恶化项策略建议</h3>${strategyCards}` : ''}

<h3>成本占比6个月趋势</h3>
<div class="card">
<table>
<thead><tr><th>指标</th>${months6.map((m,i) => `<th${i===5?' class="current-month"':''}>${monthLabel(m)}</th>`).join('')}<th>环比</th><th>趋势</th></tr></thead>
<tbody>
${trendRow('毛利率', t => t.marginRate, fmtPct)}
${trendRow('采购占比', t => pct(Math.abs(t.cogs), t.revenue), fmtPct)}
${trendRow('广告占比', t => pct(Math.abs(t.adSpend), t.revenue), fmtPct)}
${trendRow('仓储费占比', t => pct(Math.abs(t.storageFee), t.revenue), fmtPct)}
${trendRow('入库配置费占比', t => pct(Math.abs(t.inboundFee), t.revenue), fmtPct)}
${trendRow('促销占比', t => pct(Math.abs(t.promoCost), t.revenue), fmtPct)}
${trendRow('退款占比', t => pct(Math.abs(t.refundAmt), t.revenue), fmtPct)}
</tbody></table></div>
`;
  }

  function productLineCostMini(ca, pa) {
    const items = [
      { name: '采购', cur: pct(Math.abs(ca.cogs), ca.revenue), prev: pct(Math.abs(pa.cogs), pa.revenue) },
      { name: '广告', cur: pct(Math.abs(ca.adSpend), ca.revenue), prev: pct(Math.abs(pa.adSpend), pa.revenue) },
      { name: '仓储', cur: pct(Math.abs(ca.storageFee), ca.revenue), prev: pct(Math.abs(pa.storageFee), pa.revenue) },
      { name: '入库配置', cur: pct(Math.abs(ca.inboundFee), ca.revenue), prev: pct(Math.abs(pa.inboundFee), pa.revenue) },
      { name: '促销', cur: pct(Math.abs(ca.promoCost), ca.revenue), prev: pct(Math.abs(pa.promoCost), pa.revenue) },
      { name: '退款', cur: pct(Math.abs(ca.refundAmt), ca.revenue), prev: pct(Math.abs(pa.refundAmt), pa.revenue) },
    ];
    const rows = items.map(c => {
      const delta = c.cur - c.prev;
      const cls = delta > 0.005 ? 'metric-down' : delta < -0.005 ? 'metric-up' : 'metric-stable';
      return `<td>${fmtPct(c.cur)}</td><td class="${cls}">${delta > 0 ? '+' : ''}${(delta*100).toFixed(1)}pp</td>`;
    }).join('');
    return `<table style="font-size:11px;margin-top:8px"><thead><tr><th></th>${items.map(c => `<th colspan="2">${c.name}</th>`).join('')}</tr>
      <tr style="color:var(--muted)"><th></th>${items.map(() => '<th>占比</th><th>变动</th>').join('')}</tr></thead>
      <tbody><tr><td style="font-weight:600">成本</td>${rows}</tr></tbody></table>`;
  }

  function profitSpecialSection() {
    const lineRows = Object.entries(curByLine)
      .map(([line, recs]) => {
        const current = agg(recs);
        const previous = agg(prevByLine[line] || []);
        const activeCount = recs.filter(r => r.sellStatus === '卖').length;
        const marginDelta = current.marginRate - previous.marginRate;
        return { line, current, previous, activeCount, marginDelta };
      })
      .sort((a, b) => b.current.profit - a.current.profit)
      .map(x => `<tr><td>${x.line}</td><td>${x.current.count}（在售${x.activeCount}）</td>
        <td>${fmtUSD(x.current.revenue)}</td><td>${fmtUSD(x.current.profit)}</td>
        <td>${momSpan(momPct(x.current.profit, x.previous.profit))}</td>
        <td>${fmtPct(x.current.marginRate)}</td><td class="${x.marginDelta < 0 ? 'metric-down' : 'metric-up'}">${x.marginDelta >= 0 ? '+' : ''}${(x.marginDelta * 100).toFixed(1)}pp</td>
        <td>${fmtUSD(x.current.profit / Math.max(x.current.count, 1))}</td></tr>`)
      .join('');

    const lineTrendRows = Object.keys(curByLine)
      .map(line => {
        const trend = months6.map(month => agg((byMonth[month] || []).filter(r => r.productLine === line)));
        return { line, trend, current: trend[5] };
      })
      .sort((a, b) => b.current.revenue - a.current.revenue)
      .map(x => {
        const series = (getter, formatter) => x.trend.map((point, index) =>
          `${monthLabel(months6[index])} ${formatter(getter(point))}`).join('<br>');
        return `<tr><td style="font-weight:600">${x.line}</td>
          <td>${series(point => point.revenue, fmtUSD)}</td>
          <td>${series(point => point.profit, fmtUSD)}</td>
          <td>${series(point => point.marginRate, fmtPct)}</td></tr>`;
      }).join('');

    const losses = curParents.filter(p => p.profit < 0).sort((a, b) => a.profit - b.profit);
    const lossRows = losses.map(p => {
      const prev = prevParentMap[p.parentAsin];
      return `<tr><td>${p.parentAsin}</td><td>${p.parentName}</td><td>${p.productLine}</td><td>${p.positioning}</td>
        <td>${fmtUSD(p.revenue)}</td><td class="metric-down">${fmtUSD(p.profit)}</td><td>${fmtUSD(prev ? prev.profit : 0)}</td>
        <td>${fmtPct(p.marginRate)}</td><td>${fmtPct(p.adRatio)}</td><td>${p.rankText || '无数据'}</td></tr>`;
    }).join('');

    const compressed = curParents.filter(p => {
      const prev = prevParentMap[p.parentAsin];
      return prev && p.revenue > 100 && (p.marginRate - prev.marginRate) < -0.02;
    }).sort((a, b) => (a.marginRate - (prevParentMap[a.parentAsin]?.marginRate || 0)) - (b.marginRate - (prevParentMap[b.parentAsin]?.marginRate || 0)));
    const compressionRows = compressed.map(p => {
      const prev = prevParentMap[p.parentAsin];
      const delta = p.marginRate - prev.marginRate;
      return `<tr><td>${p.parentAsin}</td><td>${p.parentName}</td><td>${p.productLine}</td>
        <td>${fmtUSD(p.revenue)}</td><td>${fmtPct(prev.marginRate)}</td><td>${fmtPct(p.marginRate)}</td>
        <td class="metric-down">${(delta * 100).toFixed(1)}pp</td><td>${fmtPct(p.adRatio)}</td></tr>`;
    }).join('');

    const lossAmount = losses.reduce((sum, p) => sum + p.profit, 0);
    const profitLines = Object.entries(curByLine).map(([line, recs]) => ({ line, profit: agg(recs).profit })).sort((a, b) => b.profit - a.profit);
    const leader = profitLines[0];
    const diagnosis = losses.length
      ? `本月有 ${losses.length} 个在售父ASIN亏损，合计亏损 ${fmtUSD(lossAmount)}。`
      : '本月没有在售父ASIN出现亏损。';
    const concentration = leader && curAgg.profit !== 0
      ? `利润贡献最高的产品线为 ${leader.line}，贡献 ${fmtUSD(leader.profit)}（占整体毛利润 ${fmtPct(leader.profit / curAgg.profit)}）。`
      : '利润集中度暂无有效数据。';

    return `
<h2>二-B、利润专项分析</h2>
<div class="card"><h3>产品线利润概览（有经营数据的产品，含不卖）</h3>
<table><thead><tr><th>产品线</th><th>ASIN数</th><th>销售额</th><th>毛利润</th><th>利润环比</th><th>毛利率</th><th>毛利率变动</th><th>均利润/ASIN</th></tr></thead>
<tbody>${lineRows}</tbody></table></div>
<div class="card"><h3>产品线近6个月趋势速览</h3>
<table><thead><tr><th>产品线</th><th>总销售额</th><th>总毛利润</th><th>毛利率</th></tr></thead>
<tbody>${lineTrendRows}</tbody></table></div>
<div class="card"><h3>亏损产品清单（本月毛利润为负）— ${losses.length} 个父ASIN</h3>
${lossRows ? `<table><thead><tr><th>父ASIN</th><th>品名</th><th>产品线</th><th>定位</th><th>销售额</th><th>本月利润</th><th>上月利润</th><th>毛利率</th><th>广花比</th><th>排名</th></tr></thead><tbody>${lossRows}</tbody></table>` : '<p>无</p>'}</div>
<div class="card"><h3>毛利率压缩预警（环比下降 &gt; 2pp 且销售额 &gt; $100）— ${compressed.length} 个父ASIN</h3>
${compressionRows ? `<table><thead><tr><th>父ASIN</th><th>品名</th><th>产品线</th><th>销售额</th><th>上月毛利率</th><th>本月毛利率</th><th>变动</th><th>广花比</th></tr></thead><tbody>${compressionRows}</tbody></table>` : '<p>无</p>'}</div>
<div class="card"><h3>利润结构诊断</h3><p>${diagnosis}${concentration} 毛利率压缩预警 ${compressed.length} 个父ASIN；优先结合成本结构、广告效率和退款变化定位可逆原因。</p></div>`;
  }

  function anomalyCostAnalysis(a) {
    const prev = prevParentMap[a.parentAsin];
    // Cost details are decision-useful only when gross profit actually declined.
    // Do not attach a six-cost table to sales/traffic anomalies whose profit held or improved.
    const profitDeclined = Boolean(prev) && a.profit < prev.profit - 0.005;
    if (!profitDeclined) return null;
    if (!prev || a.revenue <= 0 || prev.revenue <= 0) {
      return { label: '成本占比诊断', rootCause: '成本端暂无可比数据，不能据此判定毛利率下滑原因。', table: '' };
    }
    const costItems = [
      { name: '采购成本', key: 'cogs' },
      { name: '广告花费', key: 'adSpend' },
      { name: '仓储费', key: 'storageFee' },
      { name: '入库配置费', key: 'inboundFee' },
      { name: '促销成本', key: 'promoCost' },
      { name: '退款金额', key: 'refundAmt' },
    ].map(item => {
      const currentRatio = pct(Math.abs(a[item.key]), a.revenue);
      const previousRatio = pct(Math.abs(prev[item.key]), prev.revenue);
      const delta = currentRatio - previousRatio;
      return { ...item, currentRatio, previousRatio, delta, impact: -delta * a.revenue };
    });
    const worsening = costItems.filter(item => item.delta > 0.002).sort((a, b) => b.delta - a.delta);
    const material = costItems.filter(item => Math.abs(item.delta) > 0.002);
    const marginDelta = a.marginRate - prev.marginRate;
    const isMarginDecline = marginDelta < -0.002;
    const rootCause = isMarginDecline
      ? worsening.length > 0
        ? `成本端主因：${worsening.map(item => `${item.name}占比上升${(item.delta * 100).toFixed(2)}pp（利润影响约${fmtUSD(item.impact)}）`).join('；')}。`
        : material.length > 0
          ? '六项成本占比没有恶化，已观察到的成本变动整体利好；毛利率下滑不能归因于这六项成本，需检查售价、产品结构及未拆分费用。'
          : '六项成本占比均未出现超过0.2pp的变化，毛利率下滑不能归因于成本端，需检查售价、产品结构及未拆分费用。'
      : `毛利率未下降（${marginDelta >= 0 ? '+' : ''}${(marginDelta * 100).toFixed(2)}pp），下表仅用于成本背景诊断，不作为本异常的根因。`;
    const rows = costItems.map(item => {
      const cls = item.delta > 0.002 ? 'metric-down' : item.delta < -0.002 ? 'metric-up' : 'metric-stable';
      return `<tr><td>${item.name}</td><td>${fmtPct(item.previousRatio)}</td><td>${fmtPct(item.currentRatio)}</td>
        <td class="${cls}">${item.delta >= 0 ? '+' : ''}${(item.delta * 100).toFixed(2)}pp</td></tr>`;
    }).join('');
    return {
      label: isMarginDecline ? '成本占比根因' : '成本占比诊断',
      rootCause,
      table: `<table style="font-size:11px;max-width:680px"><thead><tr><th>成本项</th><th>上月占比</th><th>本月占比</th><th>变动</th></tr></thead><tbody>${rows}</tbody></table>`,
    };
  }

  function anomalyCard(a) {
    const sevLabel = a.severity === 'critical' ? '严重' : a.severity === 'red' ? '预警' : '关注';
    const sevBadge = `badge-${a.severity === 'critical' ? 'critical' : a.severity}`;
    const issueText = a.issues.map(i => {
      if (i.type === '销售额下滑') return `销售额环比 ${fmtPct(i.value)} (本月 ${fmtUSD(a.revenue)} vs 上月 ${fmtUSD(a.prevRevenue)})`;
      if (i.type === '利润下滑') return `毛利润环比 ${fmtPct(i.value)} (本月 ${fmtUSD(a.profit)} vs 上月 ${fmtUSD(a.prevProfit)})`;
      if (i.type === '利润为负') return `本月毛利润 ${fmtUSD(a.profit)} (亏损)`;
      return `${i.type}: ${typeof i.value === 'number' ? fmtPct(i.value) : i.value}`;
    }).join('<br>');

    // Root cause hints
    const hints = [];
    if (a.adRatio > 0.3) hints.push('广花比 ' + fmtPct(a.adRatio) + ' 偏高');
    if (a.returnRate > 0.05) hints.push('退货率 ' + fmtPct(a.returnRate) + ' 偏高');
    if (a.invMonths < 1) hints.push('库存不足 ' + a.invMonths.toFixed(1) + ' 月');
    const costAnalysis = anomalyCostAnalysis(a);

    return `<div class="card anomaly-card severity-${a.severity}">
      <div class="card-header"><span class="badge ${sevBadge}">${sevLabel}</span>
        <strong>${a.parentAsin} — ${a.parentName}</strong>
        <span class="badge badge-info">${a.productLine}</span>
        <span class="badge badge-info">${a.positioning}</span></div>
      <div class="card-body">
        <div class="anomaly-metrics"><p><strong>异常指标：</strong>${issueText}</p></div>
        ${hints.length > 0 ? `<div class="anomaly-analysis"><p><strong>辅助信号：</strong>${hints.join('；')}</p></div>` : ''}
        ${costAnalysis ? `<div class="anomaly-analysis"><p><strong>${costAnalysis.label}：</strong>${costAnalysis.rootCause}</p>${costAnalysis.table}</div>` : ''}
        <div class="anomaly-risk"><p><strong>当前状态：</strong>毛利率 ${fmtPct(a.marginRate)}，广花比 ${fmtPct(a.adRatio)}，排名 ${a.rankText || '无数据'}</p></div>
      </div></div>`;
  }

  // Inventory health section
  function invSection() {
    const dangerRows = invHealth.danger.sort((a,b) => a.invMonths - b.invMonths).slice(0, 20).map(p =>
      `<tr><td>${p.parentAsin}</td><td>${p.parentName}</td><td>${p.productLine}</td>
       <td class="metric-down">${p.invMonths.toFixed(1)}月</td><td>${fmtInt(p.inventory)}</td><td>${fmtInt(p.units)}/月</td></tr>`
    ).join('');
    const excessRows = invHealth.excess.sort((a,b) => b.invMonths - a.invMonths).slice(0, 20).map(p =>
      `<tr><td>${p.parentAsin}</td><td>${p.parentName}</td><td>${p.productLine}</td>
       <td class="metric-down">${p.invMonths.toFixed(1)}月</td><td>${fmtInt(p.inventory)}</td><td>${fmtInt(p.units)}/月</td></tr>`
    ).join('');
    return `<div class="card"><h3>断货预警 (库存 &lt; 1月) — ${invHealth.danger.length} 个父ASIN</h3>
      ${dangerRows ? `<table><thead><tr><th>父ASIN</th><th>品名</th><th>产品线</th><th>库存月数</th><th>库存</th><th>月销</th></tr></thead><tbody>${dangerRows}</tbody></table>` : '<p>无</p>'}
      </div><div class="card"><h3>滞销预警 (库存 &gt; 6月) — ${invHealth.excess.length} 个父ASIN</h3>
      ${excessRows ? `<table><thead><tr><th>父ASIN</th><th>品名</th><th>产品线</th><th>库存月数</th><th>库存</th><th>月销</th></tr></thead><tbody>${excessRows}</tbody></table>` : '<p>无</p>'}
      </div>`;
  }

  // Rating changes
  function ratingSection() {
    const ratingChanges = [];
    for (const cur of curParents) {
      const prev = prevParentMap[cur.parentAsin];
      if (!prev || cur.rating <= 0 || prev.rating <= 0) continue;
      const diff = cur.rating - prev.rating;
      if (Math.abs(diff) >= 0.1) ratingChanges.push({ ...cur, prevRating: prev.rating, ratingDiff: diff });
    }
    ratingChanges.sort((a, b) => a.ratingDiff - b.ratingDiff);
    const rows = ratingChanges.map(r =>
      `<tr><td>${r.parentAsin}</td><td>${r.parentName}</td><td>${r.productLine}</td>
       <td>${r.prevRating.toFixed(1)}</td><td>${r.rating.toFixed(1)}</td>
       <td class="${r.ratingDiff < 0 ? 'metric-down' : 'metric-up'}">${r.ratingDiff > 0 ? '+' : ''}${r.ratingDiff.toFixed(1)}</td></tr>`
    ).join('');
    return rows ? `<table><thead><tr><th>父ASIN</th><th>品名</th><th>产品线</th><th>上月评分</th><th>本月评分</th><th>变动</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>无显著评分变动</p>';
  }

  // Action recommendations
  function actionSection() {
    const actions = anomalies.filter(a => a.severity !== 'yellow').slice(0, 15).map((a, i) => {
      const priority = a.severity === 'critical' ? '紧急' : '高';
      const prClass = a.severity === 'critical' ? 'priority-urgent' : 'priority-high';
      let recommendation = '';
      let expectedOutcome = '';
      if (a.profit < 0 && a.revenue < (a.prevRevenue || 0)) {
        recommendation = '评估是否降级为清仓款或停止广告投入，止损优先';
        expectedOutcome = '下月亏损金额收窄；无法转正则完成清仓/停投决策';
      } else if (a.adRatio > 0.3) {
        recommendation = '优化广告结构：降低非转化词出价，聚焦高CVR关键词，目标广花比降至20%以下';
        expectedOutcome = '广花比降至20%以下，同时保持销售额不继续下滑';
      } else if (a.revMom < -0.2) {
        recommendation = '排查流量下降原因：检查排名变动、关键词覆盖，评估是否需要调整价格或Coupon策略';
        expectedOutcome = '两周内确认流量下滑环节并恢复核心词曝光或转化';
      } else {
        recommendation = '综合排查：检查成本结构变动（采购/仓储/促销），评估定价策略合理性';
        expectedOutcome = '确认最大成本恶化项并制定下月毛利率修复目标';
      }
      const timing = a.severity === 'critical' ? '48小时内启动' : '7天内完成诊断';
      return `<tr><td class="${prClass}">${priority}</td><td>${a.parentAsin}</td><td>${a.parentName}</td>
        <td>${a.productLine}</td><td>${a.issues.map(i=>i.type).join(', ')}</td><td>${recommendation}</td><td>${timing}</td><td>${expectedOutcome}</td></tr>`;
    }).join('');
    return `<table><thead><tr><th>优先级</th><th>父ASIN</th><th>品名</th><th>产品线</th><th>问题</th><th>建议动作</th><th>时限</th><th>预期结果</th></tr></thead><tbody>${actions}</tbody></table>`;
  }

  // --- Assemble HTML ---
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>运营月度经营复盘 ${TARGET_YEAR}年${TARGET_MONTH}月</title>
<style>
:root { --ink:#1c2430;--muted:#627084;--line:#d9e0ea;--bg:#f7f9fc;--surface:#fff;--accent:#2563eb;
  --critical:#9b2c2c;--critical-bg:#fef2f2;--red:#c0392b;--red-bg:#fef5f5;--yellow:#a85b18;--yellow-bg:#fffbeb;--green:#0b6b58;--green-bg:#f0fdf7;
  --radius:8px;--shadow:0 1px 3px rgba(0,0,0,.08);--max-width:1200px; }
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;font-size:14px}
.container{max-width:var(--max-width);margin:0 auto;padding:20px}
h1{font-size:24px;margin-bottom:4px} h2{font-size:18px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid var(--accent)} h3{font-size:15px;margin:16px 0 8px}
.subtitle{color:var(--muted);font-size:13px;margin-bottom:20px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:20px;margin-bottom:16px;box-shadow:var(--shadow)}
.card-header{display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap}
.anomaly-card{border-left:4px solid var(--line)}
.anomaly-card.severity-critical{border-left-color:var(--critical);background:var(--critical-bg)}
.anomaly-card.severity-red{border-left-color:var(--red);background:var(--red-bg)}
.anomaly-card.severity-yellow{border-left-color:var(--yellow);background:var(--yellow-bg)}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600}
.badge-critical{background:var(--critical);color:#fff} .badge-red{background:var(--red);color:#fff}
.badge-yellow{background:var(--yellow);color:#fff} .badge-green{background:var(--green);color:#fff}
.badge-info{background:var(--bg);color:var(--muted);border:1px solid var(--line)}
.summary-banner{display:flex;gap:20px;align-items:center;padding:16px 20px;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);margin-bottom:20px;flex-wrap:wrap;box-shadow:var(--shadow)}
.summary-banner .sev-count{font-size:28px;font-weight:700} .summary-banner .sev-label{font-size:12px;color:var(--muted)} .summary-banner .sev-item{text-align:center;min-width:60px}
.summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
.summary-item{text-align:center;padding:8px} .summary-item .label{display:block;font-size:11px;color:var(--muted);margin-bottom:4px} .summary-item .value{display:block;font-size:18px;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}
th{text-align:left;padding:6px 8px;border-bottom:2px solid var(--line);color:var(--muted);font-weight:600;font-size:11px;white-space:nowrap}
td{padding:6px 8px;border-bottom:1px solid var(--line)} tr:nth-child(even){background:var(--bg)} tr:hover{background:#eef2ff}
.metric-up{color:var(--green);font-weight:600} .metric-down{color:var(--red);font-weight:600} .metric-stable{color:var(--muted)}
.trend-direction{display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600}
.trend-direction-up{background:var(--green-bg);color:var(--green)} .trend-direction-down{background:var(--red-bg);color:var(--red)} .trend-direction-flat{background:var(--bg);color:var(--muted)}
.current-month{background:#eef2ff;font-weight:700}
.priority-urgent{color:var(--critical);font-weight:700} .priority-high{color:var(--red);font-weight:600}
.anomaly-metrics,.anomaly-analysis,.anomaly-risk{margin-bottom:8px}
.product-line-section{margin-bottom:24px}
.pl-name{color:var(--accent)}
.aging-badge{display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px}
.aging-301{background:var(--critical);color:#fff} .aging-271{background:var(--red);color:#fff} .aging-211{background:var(--yellow);color:#fff} .aging-181{background:#dbeafe;color:#1e40af}
footer{text-align:center;color:var(--muted);font-size:11px;padding:20px 0;border-top:1px solid var(--line);margin-top:32px}
@media print{body{font-size:12px}.card{break-inside:avoid}}
@media(max-width:768px){.summary-grid{grid-template-columns:repeat(2,1fr)}table{font-size:11px}}
</style>
</head>
<body>
<div class="container">
<h1>运营月度经营复盘</h1>
<p class="subtitle">月份: ${TARGET_YEAR}年${TARGET_MONTH}月 | 对比: ${parseInt(months6[4].split('-')[1])}月 | 趋势: ${monthLabel(months6[0])}~${curLabel} | 生成时间: ${new Date().toISOString().slice(0,10)} | 数据源: 飞书多维表格</p>

<!-- EXECUTIVE SUMMARY -->
<div class="summary-banner">
  <div class="sev-item"><div class="sev-count" style="color:var(--critical)">${sevCounts.critical}</div><div class="sev-label">严重</div></div>
  <div class="sev-item"><div class="sev-count" style="color:var(--red)">${sevCounts.red}</div><div class="sev-label">预警</div></div>
  <div class="sev-item"><div class="sev-count" style="color:var(--yellow)">${sevCounts.yellow}</div><div class="sev-label">关注</div></div>
  <div style="flex:1"></div>
  <div style="font-size:13px;color:var(--muted)">
    本月活跃ASIN: <strong>${curAgg.count}</strong> (在售${curData.filter(r=>r.sellStatus==='卖').length} / 不卖${curData.filter(r=>r.sellStatus==='不卖').length})
    ${anomalies.length > 0 ? `| 最高风险: ${anomalies[0].parentName}` : ''}
  </div>
</div>

<!-- SECTION 1: 关键指标总览 -->
<h2>一、关键指标总览（全部产品，含不卖）</h2>
<div class="card">
  <div class="summary-grid">
    <div class="summary-item"><span class="label">总销售额</span><span class="value">${fmtUSD(curAgg.revenue)} ${momSpan(momPct(curAgg.revenue, prevAgg.revenue))}</span></div>
    <div class="summary-item"><span class="label">总毛利润</span><span class="value">${fmtUSD(curAgg.profit)} ${momSpan(momPct(curAgg.profit, prevAgg.profit))}</span></div>
    <div class="summary-item"><span class="label">整体毛利率</span><span class="value">${fmtPct(curAgg.marginRate)}</span></div>
    <div class="summary-item"><span class="label">总广告花费</span><span class="value">${fmtUSD(curAgg.adSpend)} ${momSpan(momPct(curAgg.adSpend, prevAgg.adSpend))}</span></div>
    <div class="summary-item"><span class="label">整体广花比</span><span class="value">${fmtPct(curAgg.adRatio)}</span></div>
    <div class="summary-item"><span class="label">整体CPC</span><span class="value">${fmtUSD(curAgg.cpc)}</span></div>
    <div class="summary-item"><span class="label">总订单量</span><span class="value">${fmtInt(curAgg.orders)} ${momSpan(momPct(curAgg.orders, prevAgg.orders))}</span></div>
    <div class="summary-item"><span class="label">整体转化率</span><span class="value">${fmtPct(curAgg.convRate)}</span></div>
    <div class="summary-item"><span class="label">总销量</span><span class="value">${fmtInt(curAgg.units)} ${momSpan(momPct(curAgg.units, prevAgg.units))}</span></div>
  </div>
</div>

<h3>近6个月趋势</h3>
<div class="card">
<table>
<thead><tr><th>指标</th>${months6.map((m,i) => `<th${i===5?' class="current-month"':''}>${monthLabel(m)}</th>`).join('')}<th>环比</th><th>趋势</th></tr></thead>
<tbody>
${trendRow('总销售额', t => t.revenue, fmtUSD)}
${trendRow('总毛利润', t => t.profit, fmtUSD)}
${trendRow('毛利率', t => t.marginRate, fmtPct)}
${trendRow('总广告花费', t => t.adSpend, fmtUSD)}
${trendRow('广花比', t => t.adRatio, fmtPct)}
${trendRow('CPC', t => t.cpc, v => fmtUSD(v))}
${trendRow('总订单量', t => t.orders, fmtInt)}
${trendRow('转化率', t => t.convRate, fmtPct)}
</tbody></table></div>

${costAnalysisSection()}
${profitSpecialSection()}

<!-- SECTION 3: 产品线分层分析 -->
<h2>三、产品线分层分析（在售产品）</h2>
${Object.keys(curByLine).sort((a,b) => agg(curByLine[b]).revenue - agg(curByLine[a]).revenue).map(line =>
  productLineSection(line, curByLine[line], prevByLine[line] || [])
).join('')}

<!-- SECTION 3: 产品星级与库存健康 -->
<h2>四、产品星级变化</h2>
<div class="card">${ratingSection()}</div>

<h2>五、库存健康分析</h2>
${invSection()}

<!-- SECTION 4: 异常识别 -->
<h2>六、异常识别与核心问题（${anomalies.length}个异常父ASIN）</h2>
${anomalies.length > 0 ? anomalies.map(anomalyCard).join('') : '<div class="card"><p>未发现显著异常</p></div>'}

<!-- SECTION 5: 下一步动作建议 -->
<h2>七、下一步动作建议</h2>
<div class="card">${actionSection()}</div>

<footer>
  Generated by monthly-ops-review skill | 数据源: 飞书多维表格 (<FEISHU_BASE_TOKEN>) |
  阈值: 销售额/利润环比下降>15%触发预警 | 本报告仅供参考，不构成经营决策依据
</footer>
</div></body></html>`;

  // Write report
  const outDir = OUTPUT_DIR;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${TARGET_YEAR}-${String(TARGET_MONTH).padStart(2,'0')}_monthly_ops_review.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`\nReport saved to: ${outPath}`);
  console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });
