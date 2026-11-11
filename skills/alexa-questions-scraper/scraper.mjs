/**
 * Amazon Alexa AI "Looking for specific info?" 问题抓取器
 * Playwright + stealth + 无痕浏览器
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIES_DIR = join(__dirname, 'cookies');
const COOKIE_FILE = join(COOKIES_DIR, 'amazon_cookies.json');
const OUTPUT_DIR = join(__dirname, 'output');
mkdirSync(COOKIES_DIR, { recursive: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

// ── 反检测设置 ──────────────────────────────────────────────────────
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1680, height: 1050 },
];

const DELAY_BETWEEN_ASINS = [5, 15];
const MAX_BATCH_SIZE = 20;
const BLOCK_COOLDOWN = 300; // 5 minutes
const INSTALLED_BROWSER_CANDIDATES = [
  { label: 'local Chrome', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  { label: 'local Chrome', path: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' },
  { label: 'local Edge', path: 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' },
  { label: 'local Edge', path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
];

// ── helpers ──────────────────────────────────────────────────────────
const random = (lo, hi) => lo + Math.random() * (hi - lo);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function resolveBrowserExecutable() {
  for (const candidate of INSTALLED_BROWSER_CANDIDATES) {
    if (existsSync(candidate.path)) {
      return { executablePath: candidate.path, browserLabel: candidate.label };
    }
  }

  const msDir = join(homedir(), 'AppData', 'Local', 'ms-playwright');
  if (existsSync(msDir)) {
    const dirs = readdirSync(msDir).filter(d => d.startsWith('chromium-'));
    for (const d of dirs) {
      const candidates = [
        join(msDir, d, 'chrome-win64', 'chrome.exe'),
        join(msDir, d, 'chrome-linux', 'chrome'),
        join(msDir, d, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        join(msDir, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
      ];
      for (const executablePath of candidates) {
        if (existsSync(executablePath)) {
          return { executablePath, browserLabel: 'Playwright Chromium' };
        }
      }
    }
  }

  return { executablePath: undefined, browserLabel: 'Playwright Chromium' };
}

// ── Stealth Browser ──────────────────────────────────────────────────
class StealthBrowser {
  constructor(headless = true) {
    this.headless = headless;
    this.browser = null;
    this.context = null;
  }

  async start() {
    const { executablePath, browserLabel } = resolveBrowserExecutable();
    const launchOpts = {
      headless: this.headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--incognito',
      ],
    };
    if (executablePath) launchOpts.executablePath = executablePath;
    console.log(`  [browser] using ${browserLabel}${executablePath ? `: ${executablePath}` : ''}`);

    this.browser = await chromium.launch(launchOpts);

    this.context = await this.browser.newContext({
      userAgent: pick(USER_AGENTS),
      viewport: pick(VIEWPORTS),
      locale: 'en-US',
      timezoneId: 'America/New_York',
      deviceScaleFactor: pick([1, 2]),
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'DNT': '1',
      },
    });

    // stealth injection
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
    });

    // load cookies
    this._cookiesLoaded = false;
    if (existsSync(COOKIE_FILE)) {
      try {
        const cookies = JSON.parse(readFileSync(COOKIE_FILE, 'utf-8'));
        await this.context.addCookies(cookies);
        this._cookiesLoaded = true;
        console.log(`  [cookies] loaded ${cookies.length} cookies`);
      } catch (e) {
        console.log(`  [cookies] load failed: ${e.message.slice(0,80)}`);
      }
    } else {
      console.log('  [cookies] no cookie file found');
    }

    // 全局超时 60s，防止无限挂
    this.context.setDefaultTimeout(60000);
    return this.context;
  }

  async saveCookies() {
    const cookies = await this.context.cookies();
    writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
    console.log(`  [cookies] saved ${cookies.length} cookies`);
  }

  async close() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

// ── Q&A Scraper ──────────────────────────────────────────────────────
class AlexaQuestionScraper {
  constructor(context) {
    this.context = context;
  }

  async scrapeAsin(asin) {
    console.log(`  -> https://www.amazon.com/dp/${asin}`);

    // Per-ASIN total timeout: 90s
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('ASIN_TIMEOUT')), 90000)
    );

    const doScrape = async () => {
    const page = await this.context.newPage();

    try {
      await page.goto(`https://www.amazon.com/dp/${asin}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // 模拟不规则滚动
      const scrollPasses = Math.floor(random(6, 14));
      for (let i = 0; i < scrollPasses; i++) {
        await page.mouse.wheel(0, Math.floor(random(200, 700)));
        await sleep(random(300, 1000));
      }
      await sleep(random(1500, 3000));

      // 偶尔长停顿
      if (Math.random() < 0.3) {
        const pause = Math.floor(random(3000, 8000));
        console.log(`  ... browsing (pausing ${(pause/1000).toFixed(0)}s)`);
        await sleep(pause);
      }

      // 检查拦截
      const content = await page.content();
      if (content.includes('Robot Check')) {
        return { asin, questions: [], error: 'Blocked by Amazon' };
      }

      // 取标题
      let title = '';
      try {
        const titleEl = await page.$('#productTitle');
        if (titleEl) title = (await titleEl.innerText()).trim();
      } catch {}

      // 提取问题
      const questions = await this._extractQuestions(page);

      console.log(`  -> ${questions.length} questions found`);
      return { asin, title, questions, error: '' };

    } catch (e) {
      console.log(`  -> ERROR: ${e.message}`);
      return { asin, title: '', questions: [], error: e.message };
    } finally {
      await page.close();
    }
    }; // end doScrape

    try {
      return await Promise.race([doScrape(), timeout]);
    } catch (e) {
      console.log(`  -> TIMEOUT: ${asin} (90s), skipping...`);
      return { asin, title: '', questions: [], error: 'timeout' };
    }
  }

  async _extractQuestions(page) {
    const questions = [];
    const pills = await page.$('#dpx-rex-nile-inline-default-pills-container');
    if (pills) {
      const inputs = await pills.$$('input[value]');
      for (const inp of inputs) {
        const q = ((await inp.getAttribute('value')) || '').trim();
        if (q && !questions.includes(q)) questions.push(q);
      }
    }
    // fallback: search globally
    if (!questions.length) {
      const inputs = await page.$$('[class*="nile"] input[value]');
      for (const inp of inputs) {
        const q = ((await inp.getAttribute('value')) || '').trim();
        if (q && !questions.includes(q)) questions.push(q);
      }
    }
    return questions;
  }
}

// ── Runner ────────────────────────────────────────────────────────────
export async function runScrape(asins) {
  if (asins.length > MAX_BATCH_SIZE) {
    console.log(`  [!] ${asins.length} ASINs, max ${MAX_BATCH_SIZE} per batch`);
  }
  const batch = asins.slice(0, MAX_BATCH_SIZE);

  const browser = new StealthBrowser(true);
  const results = [];
  let consecutiveBlocks = 0;

  try {
    let ctx = await browser.start();
    let scraper = new AlexaQuestionScraper(ctx);

    for (let i = 0; i < batch.length; i++) {
      if (i > 0) {
        const delay = random(...DELAY_BETWEEN_ASINS);
        console.log(`  ... waiting ${delay.toFixed(1)}s ...`);
        await sleep(delay * 1000);
      }

      const r = await scraper.scrapeAsin(batch[i]);
      results.push(r);

      if (r.error && r.error.includes('Blocked')) {
        consecutiveBlocks++;
        if (consecutiveBlocks >= 2) {
          console.log(`\n  [!] ${consecutiveBlocks} consecutive blocks!`);
          console.log(`  Cooling down for ${BLOCK_COOLDOWN}s...`);
          await sleep(BLOCK_COOLDOWN * 1000);
          consecutiveBlocks = 0;
        }
      } else if (r.error && r.error === 'timeout') {
        // Browser might be stuck, restart context
        console.log('  [!] Restarting browser after timeout...');
        await ctx.close();
        await sleep(3000);
        ctx = await browser.start();
        scraper = new AlexaQuestionScraper(ctx);
      } else {
        consecutiveBlocks = 0;
      }
    }

  } finally {
    await browser.close();
  }

  return results;
}

// ── Interactive login ─────────────────────────────────────────────────
export async function interactiveLogin() {
  const { executablePath, browserLabel } = resolveBrowserExecutable();
  const browser = await chromium.launch({
    headless: false,
    ...(executablePath ? { executablePath } : {}),
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-gpu', '--incognito'],
  });
  console.log(`[browser] using ${browserLabel}${executablePath ? `: ${executablePath}` : ''}`);

  const context = await browser.newContext({
    userAgent: pick(USER_AGENTS),
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
  });

  const page = await context.newPage();
  await page.goto('https://www.amazon.com/gp/sign-in.html', {
    waitUntil: 'domcontentloaded',
  });

  console.log('\n[AUTH] Please login in the browser window...');
  console.log('After login, press Enter here to save cookies...');

  // Wait for Enter
  await new Promise(resolve => {
    const { stdin } = process;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.once('data', () => {
      if (stdin.isTTY) stdin.setRawMode(false);
      resolve();
    });
  });

  const cookies = await context.cookies();
  mkdirSync(COOKIES_DIR, { recursive: true });
  writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  console.log(`[OK] ${cookies.length} cookies saved to ${COOKIE_FILE}`);

  await browser.close();
}
