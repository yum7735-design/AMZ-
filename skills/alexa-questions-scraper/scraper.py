"""
Amazon Alexa AI "Looking for specific info?" 问题抓取器
从商品页的 Nile widget 提取 Alexa 推荐问题列表
"""

from __future__ import annotations

import asyncio
import json
import random
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Page, Browser, BrowserContext

# ── paths ──────────────────────────────────────────────────────────────
PROJECT_DIR = Path(__file__).parent
COOKIES_DIR = PROJECT_DIR / "cookies"
OUTPUT_DIR = PROJECT_DIR / "output"
COOKIES_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# ── 反检测设置 ────────────────────────────────────────────────────────
USER_AGENTS = [
    # Chrome Win
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    # Chrome Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    # Edge Win
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    # Firefox Win
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    # Safari Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
]

# ASIN 间隔 (模拟真人浏览节奏)
DELAY_BETWEEN_ASINS = (5.0, 15.0)

# 每批最多处理数量 (防止同 IP 连续请求过多)
MAX_BATCH_SIZE = 20

# 被封后冷却时间 (秒)
BLOCK_COOLDOWN = 300  # 5 minutes

# 随机 Viewport
VIEWPORTS = [
    {"width": 1920, "height": 1080},
    {"width": 1536, "height": 864},
    {"width": 1440, "height": 900},
    {"width": 1366, "height": 768},
    {"width": 1680, "height": 1050},
]


# ═══════════════════════════════════════════════════════════════════════
# Data models
# ═══════════════════════════════════════════════════════════════════════

@dataclass
class ASINResult:
    """单个 ASIN 的抓取结果"""
    asin: str
    title: str = ""
    questions: list[str] = field(default_factory=list)
    error: str = ""
    scraped_at: str = ""


# ═══════════════════════════════════════════════════════════════════════
# Core scraper
# ═══════════════════════════════════════════════════════════════════════

class AlexaQuestionScraper:
    """抓取 Amazon Alexa AI Nile widget 的问题列表"""

    def __init__(self, cookie_file: Path):
        self.cookie_file = cookie_file
        self.playwright = None
        self.browser: Optional[Browser] = None

    async def start(self) -> BrowserContext:
        """启动浏览器并加载 Cookie"""
        self.playwright = await async_playwright().start()

        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--incognito",
            ],
        )

        context = await self.browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport=random.choice(VIEWPORTS),
            locale="en-US",
            timezone_id="America/New_York",
            device_scale_factor=random.choice([1, 2]),
        )

        # 注入 stealth
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
        """)

        # 加载 Cookie
        if self.cookie_file.exists():
            try:
                cookies = json.loads(self.cookie_file.read_text())
                await context.add_cookies(cookies)
                print(f"  [cookies] loaded {len(cookies)} cookies")
            except Exception:
                print("  [cookies] load failed, running without login")

        return context

    async def scrape_asin(self, asin: str, context: BrowserContext) -> ASINResult:
        """抓取单个 ASIN 的 Alexa 问题列表"""
        result = ASINResult(asin=asin, scraped_at=datetime.now().isoformat())

        page: Optional[Page] = None
        try:
            page = await context.new_page()
            url = f"https://www.amazon.com/dp/{asin}"
            print(f"  -> {url}")

            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

            # ── 模拟真人不规则滚动 ──
            scroll_passes = random.randint(6, 14)
            for i in range(scroll_passes):
                delta = random.randint(200, 700)
                await page.mouse.wheel(0, delta)
                await asyncio.sleep(random.uniform(0.3, 1.0))
            await asyncio.sleep(random.uniform(1.5, 3.0))

            # ── 偶尔"看评价"长停顿 ──
            if random.random() < 0.3:
                pause = random.uniform(3.0, 8.0)
                print(f"  ... browsing (pausing {pause:.0f}s)")
                await asyncio.sleep(pause)

            # ── 检查拦截 ──
            content = await page.content()
            if "Robot Check" in content:
                result.error = "Blocked by Amazon (captcha)"
                return result

            # ── 提取 ──
            try:
                title_el = await page.query_selector("#productTitle")
                if title_el:
                    result.title = (await title_el.inner_text()).strip()
            except Exception:
                pass

            result.questions = await self._extract_questions(page)

            print(f"  -> {len(result.questions)} questions found")

        except Exception as e:
            result.error = str(e)
            print(f"  -> ERROR: {e}")

        finally:
            if page:
                await page.close()

        return result

    async def _extract_questions(self, page: Page) -> list[str]:
        """从 Nile widget 提取问题"""
        questions = []

        # 方法1: 从默认 pills 容器提取
        pills_container = await page.query_selector(
            "#dpx-rex-nile-inline-default-pills-container"
        )
        if pills_container:
            inputs = await pills_container.query_selector_all("input[value]")
            for inp in inputs:
                q = (await inp.get_attribute("value") or "").strip()
                if q and q not in questions:
                    questions.append(q)

        # 方法2: 如果方法1没找到，搜索整个页面
        if not questions:
            inputs = await page.query_selector_all(
                '[class*="dpx-rex-nile"] input[value], '
                '[class*="nile"] input[value]'
            )
            for inp in inputs:
                q = (await inp.get_attribute("value") or "").strip()
                if q and q not in questions:
                    questions.append(q)

        return questions

    async def close(self):
        """关闭浏览器"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()


# ═══════════════════════════════════════════════════════════════════════
# Runner
# ═══════════════════════════════════════════════════════════════════════

async def run_scrape(asins: list[str]) -> list[ASINResult]:
    """
    主入口：批量抓取 ASIN 的 Alexa 问题

    Args:
        asins: ASIN 列表 (超过 MAX_BATCH_SIZE 会截断警告)
    """
    if len(asins) > MAX_BATCH_SIZE:
        print(f"  [!] {len(asins)} ASINs requested, max {MAX_BATCH_SIZE} per batch.")
        print(f"  Run again for the next batch after the cooldown.")

    batch = asins[:MAX_BATCH_SIZE]
    scraper = AlexaQuestionScraper(cookie_file=COOKIES_DIR / "amazon_cookies.json")
    results: list[ASINResult] = []
    consecutive_blocks = 0

    try:
        context = await scraper.start()

        for i, asin in enumerate(batch):
            if i > 0:
                delay = random.uniform(*DELAY_BETWEEN_ASINS)
                print(f"  ... waiting {delay:.1f}s between ASINs ...")
                await asyncio.sleep(delay)

            result = await scraper.scrape_asin(asin, context)
            results.append(result)

            # ── 被封后冷却 ──
            if result.error and "Blocked" in result.error:
                consecutive_blocks += 1
                if consecutive_blocks >= 2:
                    print(f"\n  [!] {consecutive_blocks} consecutive blocks!")
                    print(f"  Cooling down for {BLOCK_COOLDOWN}s...")
                    await asyncio.sleep(BLOCK_COOLDOWN)
                    consecutive_blocks = 0
            else:
                consecutive_blocks = 0

    finally:
        await scraper.close()

    return results


def export_results(results: list[ASINResult], output_prefix: str = "alexa_questions"):
    """导出到 JSON 和 CSV"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # JSON
    json_path = OUTPUT_DIR / f"{output_prefix}_{timestamp}.json"
    json_data = [asdict(r) for r in results]
    json_path.write_text(
        json.dumps(json_data, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\n[JSON] {json_path}")

    # CSV (每个问题一行)
    csv_path = OUTPUT_DIR / f"{output_prefix}_{timestamp}.csv"
    import csv
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["ASIN", "商品标题", "Alexa问题", "抓取时间"])
        for r in results:
            if r.questions:
                for q in r.questions:
                    writer.writerow([r.asin, r.title, q, r.scraped_at])
            else:
                writer.writerow([r.asin, r.title, "", r.scraped_at])

    print(f"[CSV]  {csv_path}")
    return json_path, csv_path


async def interactive_login():
    """打开有头浏览器（无痕模式 + stealth），手动登录 Amazon，保存 Cookie"""
    cookie_file = COOKIES_DIR / "amazon_cookies.json"

    playwright = await async_playwright().start()
    try:
        browser = await playwright.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-gpu",
                "--incognito",
            ],
        )
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
            no_viewport=True,
        )
        # 注入 stealth
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
        """)
        page = await context.new_page()
        await page.goto("https://www.amazon.com/gp/sign-in.html", wait_until="domcontentloaded")

        print("\n[AUTH] Please login in the browser window...")
        print("After login, press Enter here to save cookies...")
        input()

        cookies = await context.cookies()
        COOKIES_DIR.mkdir(exist_ok=True)
        cookie_file.write_text(json.dumps(cookies, indent=2))
        print(f"[OK] {len(cookies)} cookies saved to {cookie_file}")

    finally:
        await browser.close()
        await playwright.stop()


def print_summary(results: list[ASINResult]):
    """打印汇总"""
    total_q = 0
    print(f"\n{'='*60}")
    print(f"  Alexa Questions Summary")
    print(f"{'='*60}")
    for r in results:
        status = "[OK]" if not r.error else f"[FAIL] {r.error[:30]}"
        print(f"  {r.asin:<14} {len(r.questions):>4} questions  {status}")
        for q in r.questions:
            print(f"    - {q}")
        total_q += len(r.questions)
    print(f"  {'-'*50}")
    print(f"  Total: {len(results)} ASINs, {total_q} questions")
    print(f"{'='*60}\n")
