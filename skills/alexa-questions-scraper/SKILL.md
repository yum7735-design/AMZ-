---
name: alexa-questions-scraper
description: >
  从 Amazon 商品详情页的 "Looking for specific info?" (Alexa AI Nile widget) 模块抓取买家高频问题列表。
  支持单次抓取和飞书多维表格批量自动化：读表→抓取→回填「问题1」~「问题N」+「回填日期」，下次自动跳过已回填记录。
  使用 Playwright + stealth + 无痕浏览器 + 登录Cookie 模拟真人，5-15s 随机间隔 + 随机滚动 + 长停顿 + 被封自动冷却。

  触发条件：
  - 用户提到抓取 Amazon Alexa 问题、Looking for specific info、Alexa AI 问题、买家问题
  - 用户提到飞书表回填 Alexa 问题、批量抓 ASIN 问题
  - 用户说 "抓一下这个ASIN的Alexa问题"、"把这些ASIN的Alexa问题回填飞书"
  - 用户提到 Nile widget、rufus 问题、alexa-questions-scraper
---

# Amazon Alexa 问题抓取 + 飞书回填

## 项目位置

`C:\Users\45353\.claude\skills\alexa-questions-scraper\`

## 功能概述

抓取 Amazon 商品详情页中 "Looking for specific info?" 模块（Alexa AI/Rufus Nile widget）预生成的买家热门问题，支持两种使用模式：

| 模式 | 命令 | 输入 | 输出 |
|------|------|------|------|
| 单次抓取 | `python main.py scrape <ASIN>` | 命令行 ASIN 或文件 | `output/` JSON + CSV |
| 飞书自动化 | `python run_feishu.py` | 飞书表 ASIN 字段 | 回填飞书 + 增量跳过 |

## 前置条件

### 1. 依赖安装

```bash
cd C:\Users\45353\.claude\skills\alexa-questions-scraper
pip install -r requirements.txt
playwright install chromium
```

### 2. Amazon 登录 Cookie（每次使用前检查）

Cookie 文件位置：`cookies/amazon_cookies.json`

**检查 Cookie 是否有效：**
```bash
python main.py scrape B0873Y19T7
```
如果返回 0 questions 或 Blocked，说明 Cookie 过期。

**获取新 Cookie（二选一）：**

A) **自动登录**（推荐）
```bash
python main.py login
```
打开无痕浏览器 → 手动登录 Amazon → 回车保存

B) **从 Chrome 导出**
- F12 → Application → Cookies → `amazon.com`
- 全选所有行 → Ctrl+C → 粘贴到 `cookies_raw.txt`
```bash
python import_cookies.py
```

## 使用说明

### 单次抓取

```bash
# 单个 ASIN
python main.py scrape B0873Y19T7

# 多个 ASIN
python main.py scrape B0873Y19T7 B08F3JKDD3 B08L331FB2

# 从文件批量（每行一个 ASIN）
python main.py scrape --file asins.txt

# 自定义输出前缀
python main.py scrape --file asins.txt -o my_project
```

结果输出到 `output/` 目录：
- `alexa_questions_YYYYMMDD_HHMMSS.json` — 完整结构化数据
- `alexa_questions_YYYYMMDD_HHMMSS.csv` — 扁平表格，每个问题一行

### 飞书自动化

**飞书表配置：**
- Base: `P9L2bZrXbayewqs1QbEc0LaAnhh`
- Table: `tblSlh97FgzK4wCc`
- ASIN 字段：`ASIN`（主字段，手工填入）

**运行：**
```bash
# 预览（不写入）
python run_feishu.py --dry-run

# 正式跑
python run_feishu.py

# 只跑前 N 个
python run_feishu.py --limit 5
```

**流程：**
1. 读取飞书表所有记录
2. 筛选：ASIN 非空 **且** 「回填日期」为空
3. 逐个抓取 Alexa 问题（5-15s 随机间隔 + 随机浏览停顿）
4. 自动创建缺失字段（`问题1` ~ `问题N` + `回填日期`）
5. 回填每条记录，写入当天日期
6. 下次运行自动跳过已回填记录

## 反检测策略

| 措施 | 配置 |
|------|------|
| User-Agent 池 | 8 个（Chrome/Edge/Firefox/Safari + 多版本） |
| Viewport | 5 种随机 + 随机 DPR |
| stealth JS | 隐藏 navigator.webdriver + 伪造 chrome/plugins |
| ASIN 间隔 | 5-15 秒随机 |
| 页面滚动 | 6-14 次 × 200-700px 随机 |
| 浏览停顿 | 30% 概率停 3-8 秒（模拟看评价） |
| 批量限制 | 每批最多 20 个 ASIN |
| 被封冷却 | 连续 2 次 Block → 自动暂停 5 分钟 |
| 浏览器模式 | `--incognito` + `--disable-blink-features=AutomationControlled` |

## 注意事项

- **Cookie 有效期**：通常约 1 年，过期后重新登录即可
- **不要并发**：同时只有一个 Playwright 实例在跑，避免触发风控
- **IP 限制**：同一 IP 短时间大量请求有风险，每批最多 20 个，超过需要手动分批
- **飞书 App 权限**：使用 cli_aa87ee17d33c1cc4，已授权读写该 Base
- **发给别人时**：`.gitignore` 排除了 `cookies/` 和 `output/`，使用者需自己导入 Cookie

## 项目文件

```
alexa-questions-scraper/
├── SKILL.md             # 本文件（skill 定义 + 使用说明）
├── main.py              # 单次抓取 CLI
├── run_feishu.py        # 飞书闭环脚本
├── scraper.py           # 核心引擎（Playwright + stealth + 反检测）
├── import_cookies.py    # Cookie 导入工具
├── requirements.txt     # Python 依赖
├── .gitignore           # 排除 cookies/ + output/
├── cookies/             # Amazon 登录 Cookie（每人自己生成）
└── output/              # 抓取结果 JSON + CSV
```
