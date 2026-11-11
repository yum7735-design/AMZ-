const https = require('https');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const credPath = path.join(process.env.USERPROFILE, '.feishu-user-plugin', 'credentials.json');
const cred = JSON.parse(fs.readFileSync(credPath, 'utf8'));
const cookie = cred.profiles.default.LARK_COOKIE;

const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || '';
const HOST = process.env.FEISHU_HOST || '';

function fetchPage(tableId, viewId, offset, limit) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      tableId, viewId, offset: String(offset), limit: String(limit),
      tableID: tableId, viewID: viewId
    });
    const options = {
      hostname: HOST,
      path: `/space/api/v1/bitable/${BASE_TOKEN}/records?${params}`,
      headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0' }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code !== 0) return reject(new Error(`API error code=${json.code}: ${json.msg}`));
          const compressed = json.data.records;
          const buf = Buffer.from(compressed, 'base64');
          zlib.gunzip(buf, (err, decompressed) => {
            if (err) return reject(err);
            resolve(JSON.parse(decompressed.toString()));
          });
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function fetchAllRecords(tableId, viewId) {
  let offset = 0;
  const limit = 500;
  let allRecords = {};
  let total = null;

  while (true) {
    process.stdout.write(`  offset=${offset}...`);
    const page = await fetchPage(tableId, viewId, offset, limit);
    if (total === null) {
      total = page.tableRecordNum;
      process.stdout.write(` total=${total}`);
    }
    const recordMap = page.recordMap || {};
    const count = Object.keys(recordMap).length;
    Object.assign(allRecords, recordMap);
    console.log(` +${count} (=${Object.keys(allRecords).length})`);
    if (count === 0 || Object.keys(allRecords).length >= total) break;
    offset += count;
    await new Promise(r => setTimeout(r, 300));
  }
  return allRecords;
}

function extractVal(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    if (typeof v[0] === 'object' && v[0].text !== undefined) return v[0].text;
    return v[0];
  }
  if (typeof v === 'object') {
    if ('value' in v) {
      const inner = v.value;
      if (Array.isArray(inner)) return inner.length > 0 ? inner[0] : null;
      return inner;
    }
    if ('text' in v) return v.text;
  }
  return v;
}

function parseTable(rawRecords) {
  const results = [];
  for (const [recId, fields] of Object.entries(rawRecords)) {
    const record = { _id: recId };
    for (const [fid, wrapper] of Object.entries(fields)) {
      const rawVal = wrapper && typeof wrapper === 'object' && 'value' in wrapper ? wrapper.value : wrapper;
      record[fid] = extractVal(rawVal);
    }
    results.push(record);
  }
  return results;
}

async function main() {
  // Step 1: Discover field IDs by fetching a small sample from 源数据-月
  console.log('=== Step 1: Fetch 源数据-月 (source metrics) ===');
  const srcRecords = await fetchAllRecords('tblVhuFw1aYxqN4g', 'vewW2XpGl8');
  const srcParsed = parseTable(srcRecords);
  console.log(`  Parsed: ${srcParsed.length} records`);

  // Discover field names by checking known field IDs from weekly data-sources
  // 源数据-月 field IDs (same as weekly 源数据-周):
  const SRC_FIELD_MAP = {
    fldcDq1vIB: 'ASIN', fldtEfleVu: '周', fldfDS00Op: '周日期',
    fldw33dXI2: '访客', fldv5N26Op: '订单量', fld5JenvnQ: '销量',
    fldf0b19gy: '销售额', fldzZ3W7La: '毛利润', fldkFHCo6O: '广告花费',
    fld7CLuh5j: '广告订单量', fld8dFM8Vi: '广告点击', fldkqwzMt1: '广告销售额',
    fld9JIXkCI: '退货量', fldjkf3BFA: 'FBA可售库存', fld15666QQ: '评分',
    fld3YFeiGT: '评论数', fldaH2QBb4: '小类排名'
  };

  // Print what field IDs exist in the data
  const sampleSrc = srcParsed[0];
  const srcFieldIds = Object.keys(sampleSrc).filter(k => k !== '_id');
  console.log(`  Field IDs in source data: ${srcFieldIds.length}`);

  // Check which known IDs match
  const knownIds = srcFieldIds.filter(id => SRC_FIELD_MAP[id]);
  const unknownIds = srcFieldIds.filter(id => !SRC_FIELD_MAP[id]);
  console.log(`  Known fields: ${knownIds.map(id => SRC_FIELD_MAP[id]).join(', ')}`);
  console.log(`  Unknown field IDs: ${unknownIds.join(', ')}`);

  // Sample unknown fields to identify them
  for (const uid of unknownIds.slice(0, 15)) {
    const vals = srcParsed.slice(0, 3).map(r => r[uid]);
    console.log(`    ${uid}: ${JSON.stringify(vals)}`);
  }

  // Step 2: Fetch 源数据-月利润 (profit source)
  console.log('\n=== Step 2: Fetch 源数据-月利润 (profit data) ===');
  const profitRecords = await fetchAllRecords('tblLBGPqlJf2Gijg', 'vewORuFqag');
  const profitParsed = parseTable(profitRecords);
  console.log(`  Parsed: ${profitParsed.length} records`);

  const PROFIT_FIELD_MAP = {
    fldcDq1vIB: 'ASIN', fldtEfleVu: '周',
    fldqbdAroU: '入库配置费', fldkDWIQAm: '仓储费', fld1jLFedz: '采购成本',
    fld4HItEvg: '促销成本', flds4RB1Ex: '退款金额'
  };

  const profitSample = profitParsed[0];
  const profitFids = Object.keys(profitSample).filter(k => k !== '_id');
  const profitKnown = profitFids.filter(id => PROFIT_FIELD_MAP[id]);
  const profitUnknown = profitFids.filter(id => !PROFIT_FIELD_MAP[id]);
  console.log(`  Known: ${profitKnown.map(id => PROFIT_FIELD_MAP[id]).join(', ')}`);
  console.log(`  Unknown: ${profitUnknown.join(', ')}`);
  for (const uid of profitUnknown.slice(0, 10)) {
    const vals = profitParsed.slice(0, 3).map(r => r[uid]);
    console.log(`    ${uid}: ${JSON.stringify(vals)}`);
  }

  // Step 3: Fetch 信息 (product master)
  console.log('\n=== Step 3: Fetch 信息 (product master) ===');
  const infoRecords = await fetchAllRecords('tblAUdtIv5pdhNh3', 'vewmLQ6sya');
  const infoParsed = parseTable(infoRecords);
  console.log(`  Parsed: ${infoParsed.length} records`);

  const infoSample = infoParsed[0];
  const infoFids = Object.keys(infoSample).filter(k => k !== '_id');
  console.log(`  Field IDs: ${infoFids.length}`);
  for (const uid of infoFids.slice(0, 20)) {
    const vals = infoParsed.slice(0, 3).map(r => r[uid]);
    console.log(`    ${uid}: ${JSON.stringify(vals)}`);
  }

  // Save raw data for further processing
  const outPath = path.join(__dirname, '..', 'monthly_raw_tables.json');
  fs.writeFileSync(outPath, JSON.stringify({
    sourceMonthly: { fieldIds: srcFieldIds, sampleRecord: sampleSrc, recordCount: srcParsed.length },
    profitMonthly: { fieldIds: profitFids, sampleRecord: profitSample, recordCount: profitParsed.length },
    productInfo: { fieldIds: infoFids, sampleRecord: infoSample, recordCount: infoParsed.length }
  }, null, 2), 'utf8');

  console.log(`\nRaw table info saved to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
