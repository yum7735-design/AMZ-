#!/usr/bin/env node
/**
 * Amazon Alexa Questions Scraper CLI
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIES_DIR = join(__dirname, 'cookies');
const OUTPUT_DIR = join(__dirname, 'output');
const RAW_FILE = join(__dirname, 'cookies_raw.txt');
const COOKIE_FILE = join(COOKIES_DIR, 'amazon_cookies.json');

mkdirSync(COOKIES_DIR, { recursive: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const cmd = args[0];

const FEISHU_DEFAULTS = {
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
  baseToken: process.env.FEISHU_BASE_TOKEN || '',
  tableId: process.env.FEISHU_TABLE_ID || '',
  viewId: 'vewbtIgju6',
  asinField: 'ASIN',
  backfillField: '\u56de\u586b\u65e5\u671f',
  questionPrefix: '\u95ee\u9898',
};

function printHelp() {
  console.log(`
Amazon Alexa Questions Scraper

Commands:
  node cli.mjs login
  node cli.mjs import
  node cli.mjs scrape <ASIN...>
  node cli.mjs scrape --file asins.txt
  node cli.mjs feishu
  node cli.mjs feishu B0XXX B0YYY
  node cli.mjs feishu --dry-run

Feishu overrides:
  --app-id <id>
  --app-secret <secret>
  --base <base_token>
  --table <table_id>
  --view <view_id>
  --asin-field <field_name>
  --backfill-field <field_name>
  --question-prefix <prefix>
`);
}

function parseScrapeArgs() {
  const asins = [];
  let file = null;
  let output = 'alexa_questions';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' || args[i] === '-f') file = args[++i];
    else if (args[i] === '--output' || args[i] === '-o') output = args[++i];
    else if (i > 0 && !args[i].startsWith('-')) asins.push(args[i]);
  }
  return { asins, file, output };
}

function parseFeishuArgs() {
  let dryRun = false;
  let limit = 0;
  const asins = [];
  const config = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--limit') limit = parseInt(args[++i], 10) || 0;
    else if (args[i] === '--app-id') config.appId = args[++i];
    else if (args[i] === '--app-secret') config.appSecret = args[++i];
    else if (args[i] === '--base') config.baseToken = args[++i];
    else if (args[i] === '--table') config.tableId = args[++i];
    else if (args[i] === '--view') config.viewId = args[++i];
    else if (args[i] === '--asin-field') config.asinField = args[++i];
    else if (args[i] === '--backfill-field') config.backfillField = args[++i];
    else if (args[i] === '--question-prefix') config.questionPrefix = args[++i];
    else if (i > 0 && !args[i].startsWith('-')) asins.push(args[i]);
  }

  return { dryRun, limit, asins, config };
}

function resolveFeishuConfig(overrides) {
  return {
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
  baseToken: process.env.FEISHU_BASE_TOKEN || '',
  tableId: process.env.FEISHU_TABLE_ID || '',
    viewId: overrides.viewId || process.env.FEISHU_VIEW_ID || FEISHU_DEFAULTS.viewId,
    asinField: overrides.asinField || process.env.FEISHU_ASIN_FIELD || FEISHU_DEFAULTS.asinField,
    backfillField: overrides.backfillField || process.env.FEISHU_BACKFILL_FIELD || FEISHU_DEFAULTS.backfillField,
    questionPrefix: overrides.questionPrefix || process.env.FEISHU_QUESTION_PREFIX || FEISHU_DEFAULTS.questionPrefix,
  };
}

function normalizeAsin(value) {
  return String(value || '').trim().toUpperCase();
}

function readTextField(fields, fieldName) {
  const raw = fields?.[fieldName];
  if (Array.isArray(raw)) return raw[0]?.text || '';
  return String(raw || '').trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function cmdImport() {
  if (!existsSync(RAW_FILE)) {
    console.log('[ERROR] cookies_raw.txt not found.');
    console.log('Export from Chrome F12 -> Application -> Cookies -> amazon.com');
    console.log('Select all rows, copy, paste to cookies_raw.txt, then re-run.');
    process.exit(1);
  }

  const text = readFileSync(RAW_FILE, 'utf-8');
  const lines = text.split('\n').filter(line => line.trim());
  const isTable = lines.filter(line => line.includes('\t')).length > lines.length * 0.5;

  let cookies;
  if (isTable) {
    cookies = lines.map(line => {
      const parts = line.split('\t');
      const name = (parts[0] || '').trim();
      const value = (parts[1] || '').trim();
      const domain = (parts[2] || '.amazon.com').trim();
      const path = (parts[3] || '/').trim();

      let expires = -1;
      if (parts[4] && parts[4].trim() && parts[4].trim() !== 'Session') {
        try {
          expires = Math.floor(new Date(parts[4].trim()).getTime() / 1000);
        } catch {}
      }

      const httpOnly = !!(parts[6] && parts[6].includes('\u2713'));
      const secure = !!(parts[7] && parts[7].includes('\u2713'));
      const sameSite = (parts[8] || 'Lax').trim();

      return { name, value, domain, path, expires, httpOnly, secure, sameSite };
    }).filter(cookie => cookie.name);
  } else {
    cookies = text.split(';').map(pair => {
      const [name, ...rest] = pair.trim().split('=');
      return {
        name: (name || '').trim(),
        value: rest.join('=').trim(),
        domain: '.amazon.com',
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      };
    }).filter(cookie => cookie.name);
  }

  writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  console.log(`[OK] ${cookies.length} cookies saved to ${COOKIE_FILE}`);

  const keyNames = ['at-main', 'sess-at-main', 'session-id', 'session-token', 'ubid-main'];
  const found = cookies.filter(cookie => keyNames.includes(cookie.name));
  console.log(`Key auth cookies: ${found.map(cookie => cookie.name).join(', ')}`);
}

async function cmdScrape() {
  const { asins, file, output } = parseScrapeArgs();

  if (file) {
    if (!existsSync(file)) {
      console.log(`[ERROR] File not found: ${file}`);
      process.exit(1);
    }
    const fileContent = readFileSync(file, 'utf-8');
    asins.push(...fileContent.split('\n').map(line => line.trim()).filter(Boolean));
  }

  if (!asins.length) {
    console.log('[ERROR] Please provide at least one ASIN');
    process.exit(1);
  }

  const unique = [...new Set(asins.map(normalizeAsin).filter(Boolean))];
  console.log(`\nScraping ${unique.length} ASIN(s)...\n`);

  const { runScrape } = await import('./scraper.mjs');
  const results = await runScrape(unique);

  console.log(`\n${'='.repeat(60)}`);
  console.log('  Alexa Questions Summary');
  console.log(`${'='.repeat(60)}`);
  let total = 0;
  for (const result of results) {
    const status = result.error ? `[FAIL] ${result.error.slice(0, 30)}` : '[OK]';
    console.log(`  ${result.asin}  ${result.questions.length} questions  ${status}`);
    for (const question of result.questions) console.log(`    - ${question}`);
    total += result.questions.length;
  }
  console.log(`  ${'-'.repeat(50)}`);
  console.log(`  Total: ${results.length} ASINs, ${total} questions`);
  console.log(`${'='.repeat(60)}\n`);

  const ts = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  const jsonPath = join(OUTPUT_DIR, `${output}_${ts}.json`);
  const csvPath = join(OUTPUT_DIR, `${output}_${ts}.csv`);

  writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`[JSON] ${jsonPath}`);

  const header = 'ASIN,Title,Question,Votes,ScrapedAt\n';
  const rows = [];
  for (const result of results) {
    if (result.questions.length) {
      for (const question of result.questions) {
        rows.push(`"${result.asin}","${result.title || ''}","${question}","0","${ts}"`);
      }
    } else {
      rows.push(`"${result.asin}","${result.title || ''}","","","${ts}"`);
    }
  }
  writeFileSync(csvPath, '\ufeff' + header + rows.join('\n'), 'utf-8');
  console.log(`[CSV]  ${csvPath}`);
  console.log('[DONE]');
}

async function cmdFeishu() {
  const { dryRun, limit, asins, config: configOverrides } = parseFeishuArgs();
  const config = resolveFeishuConfig(configOverrides);
  const explicitAsins = [...new Set(asins.map(normalizeAsin).filter(Boolean))];
  const question1Field = `${config.questionPrefix}1`;

  async function feishuReq(method, path, token, body = null) {
    const https = await import('node:https');
    return new Promise((resolve, reject) => {
      const url = new URL(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseToken}/${path}`);
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(data));
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  console.log('Connecting to Feishu...');
  const https = await import('node:https');
  const tokenData = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ app_id: config.appId, app_secret: config.appSecret });
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  const token = tokenData.tenant_access_token;

  console.log('Reading records...');
  let records = [];
  let pageToken = '';
  while (true) {
    const query = new URLSearchParams({ page_size: '100' });
    if (pageToken) query.set('page_token', pageToken);
    if (config.viewId) query.set('view_id', config.viewId);
    const response = await feishuReq('GET', `tables/${config.tableId}/records?${query.toString()}`, token);
    records.push(...(response.data?.items || []));
    if (!response.data?.has_more) break;
    pageToken = response.data?.page_token || '';
  }

  const fieldsResponse = await feishuReq('GET', `tables/${config.tableId}/fields`, token);
  const fieldMap = {};
  for (const field of fieldsResponse.data?.items || []) {
    fieldMap[field.field_name] = field.field_id;
  }

  console.log(`  Records: ${records.length}`);
  console.log(`  Fields: ${Object.keys(fieldMap).join(', ')}`);
  if (config.viewId) console.log(`  View: ${config.viewId}`);

  const rows = records.map((record, index) => {
    const fields = record.fields || {};
    return {
      index: index + 1,
      rid: record.record_id,
      asin: normalizeAsin(readTextField(fields, config.asinField)),
      hasBackfill: !!fields[config.backfillField],
      hasQuestion1: !!readTextField(fields, question1Field),
    };
  });

  const assignments = [];
  if (explicitAsins.length) {
    const blankRows = rows.filter(row => !row.asin);
    const existingByAsin = new Map(rows.filter(row => row.asin).map(row => [row.asin, row]));

    for (const asin of explicitAsins) {
      const existing = existingByAsin.get(asin);
      if (existing) {
        assignments.push({ rid: existing.rid, asin, rowIndex: existing.index, action: 'update-existing' });
        continue;
      }

      const blank = blankRows.shift();
      if (blank) {
        assignments.push({ rid: blank.rid, asin, rowIndex: blank.index, action: 'fill-blank-row' });
        continue;
      }

      assignments.push({ rid: null, asin, rowIndex: null, action: 'create-row' });
    }
  } else {
    let skippedAsin = 0;
    let skippedDone = 0;
    for (const row of rows) {
      if (!row.asin || !row.asin.startsWith('B0')) {
        skippedAsin++;
        continue;
      }
      if (row.hasBackfill && row.hasQuestion1) {
        skippedDone++;
        continue;
      }
      assignments.push({ rid: row.rid, asin: row.asin, rowIndex: row.index, action: 'update-existing' });
    }

    console.log(`\n  To process: ${assignments.length}`);
    console.log(`  Skipped (no ASIN): ${skippedAsin}`);
    console.log(`  Skipped (has date): ${skippedDone}`);
  }

  if (!assignments.length) {
    console.log('\n[DONE] Nothing to process.');
    return;
  }

  const processList = limit ? assignments.slice(0, limit) : assignments;
  if (limit) console.log(`  -> Limited to ${limit}`);

  if (explicitAsins.length) {
    console.log('\n  Assignment plan:');
    for (const item of processList) {
      const location = item.rowIndex ? `row ${item.rowIndex}` : 'new row';
      console.log(`    ${item.asin} -> ${location} (${item.action})`);
    }
  }

  const scrapeList = processList.map(item => item.asin);
  const { runScrape } = await import('./scraper.mjs');
  const qMap = {};
  const batchSize = 20;

  for (let i = 0; i < scrapeList.length; i += batchSize) {
    const batch = scrapeList.slice(i, i + batchSize);
    console.log(`\nScraping batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(scrapeList.length / batchSize)} (${batch.length} ASINs)...`);
    const results = await runScrape(batch);
    for (const result of results) qMap[result.asin] = result.questions;
  }

  const maxQ = Math.max(0, ...Object.values(qMap).map(questions => questions.length));
  console.log(`\nMax questions per ASIN: ${maxQ}`);
  if (!maxQ && !explicitAsins.length) {
    console.log('[DONE] No questions found.');
    return;
  }

  const neededFields = [];
  for (let i = 1; i <= maxQ; i++) {
    const fieldName = `${config.questionPrefix}${i}`;
    if (!fieldMap[fieldName]) neededFields.push(fieldName);
  }
  if (!fieldMap[config.backfillField]) neededFields.push(config.backfillField);

  if (neededFields.length) {
    console.log(`\nCreating fields: ${neededFields.join(', ')}`);
    if (!dryRun) {
      for (const fieldName of neededFields) {
        const response = await feishuReq('POST', `tables/${config.tableId}/fields`, token, {
          field_name: fieldName,
          type: 1,
        });
        if (response.code === 0) console.log(`  [+] ${fieldName}`);
        else console.log(`  [!] ${fieldName}: ${response.msg}`);
        await sleep(150);
      }
    }
  }

  if (dryRun) {
    console.log('\n=== DRY RUN ===');
    for (const item of processList) {
      const questions = qMap[item.asin] || [];
      const location = item.rowIndex ? `row ${item.rowIndex}` : 'new row';
      console.log(`\n  ${item.asin} -> ${location} (${item.action})`);
      for (let i = 0; i < questions.length; i++) {
        console.log(`    ${config.questionPrefix}${i + 1}: ${questions[i]}`);
      }
      console.log(`    ${config.backfillField}: ${new Date().toISOString().slice(0, 10)} (timestamp)`);
    }
    return;
  }

  const today = Date.now();
  console.log('\nUpdating records...');
  let ok = 0;
  let fail = 0;
  let created = 0;

  for (const item of processList) {
    const questions = qMap[item.asin] || [];
    const fields = {
      [config.asinField]: item.asin,
      [config.backfillField]: today,
    };
    for (let i = 0; i < questions.length; i++) {
      fields[`${config.questionPrefix}${i + 1}`] = questions[i];
    }

    let response;
    if (item.rid) {
      response = await feishuReq('PUT', `tables/${config.tableId}/records/${item.rid}`, token, { fields });
      if (response.code === 0) {
        console.log(`  [OK] ${item.asin}: ${questions.length} questions -> row ${item.rowIndex}`);
        ok++;
      } else {
        console.log(`  [FAIL] ${item.asin}: ${response.msg}`);
        fail++;
      }
    } else {
      response = await feishuReq('POST', `tables/${config.tableId}/records`, token, { fields });
      if (response.code === 0) {
        console.log(`  [OK] ${item.asin}: ${questions.length} questions -> created new row`);
        ok++;
        created++;
      } else {
        console.log(`  [FAIL] ${item.asin}: ${response.msg}`);
        fail++;
      }
    }
    await sleep(150);
  }

  console.log(`\n===== Done: ${ok} updated, ${created} created, ${fail} failed =====`);
}

async function main() {
  if (cmd === 'login') {
    const { interactiveLogin } = await import('./scraper.mjs');
    await interactiveLogin();
  } else if (cmd === 'import') {
    await cmdImport();
  } else if (cmd === 'scrape') {
    await cmdScrape();
  } else if (cmd === 'feishu') {
    await cmdFeishu();
  } else {
    printHelp();
  }
}

main().catch(error => {
  console.error('FATAL:', error.message);
  process.exit(1);
});
