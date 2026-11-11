# Alexa Questions Scraper

从 Amazon 商品详情页 **"Looking for specific info?"** 模块抓取买家高频问题，自动回填飞书表格。

---

## 一、首次安装（做一次，约 5 分钟）

```bash
cd alexa-questions-scraper
npm install
npx playwright install chromium
```

---

## 二、导入 Amazon Cookie（做一次，约 1 年后失效）

### 方式 A：Chrome 导出（推荐）

```
1. Chrome 登录 www.amazon.com
2. F12 → Application → 左侧 Cookies → 点 www.amazon.com
3. 全选所有行 → Ctrl+C
4. 项目目录新建 cookies_raw.txt → 粘贴保存
5. node cli.mjs import
```

看到 `at-main: (present)` 即成功。

### 方式 B：自动登录

```bash
node cli.mjs login
```

弹浏览器 → 手动登录 Amazon → 回车保存。

---

## 三、日常使用

### 飞书批量自动化（日常）

```
1. 飞书表「ASIN」列填入要查的 ASIN
2. 双击 run.bat
3. 完事
```

- 已有「回填日期」的记录自动跳过
- 新 ASIN 只填 ASIN 列，跑一次自动回填

### 单次抓取（偶尔查几个）

```bash
node cli.mjs scrape B0873Y19T7
node cli.mjs scrape --file asins.txt
```

结果在 `output/`：JSON + CSV。

---

## 四、常见问题

| 问题 | 解决 |
|------|------|
| 0 questions | Cookie 过期，重新执行**第二步** |
| 卡住/崩溃 | 重跑一次 |
| Blocked | 脚本自动暂停 5 分钟冷却 |
| 飞书失败 | 检查 ASIN 字段名是否还是 `ASIN` |

## 五、Cookie 过期

过期后重新执行**第二步**，Chrome 会自动续期，无需重新登录。
