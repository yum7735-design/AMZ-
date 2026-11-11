#!/usr/bin/env python3
"""
从飞书表读取 ASIN → 抓取 Alexa 问题 → 回填飞书

流程:
  1. 读取飞书表中所有记录
  2. 跳过 ASIN 为空 或 已有「回填日期」的记录
  3. 对每条有效 ASIN 用 Playwright 抓取 Alexa 问题
  4. 问题写入「问题1」「问题2」...字段，回填日期写入「回填日期」

飞书表信息:
  Base: https://<tenant>.feishu.cn/base/<base_token>
  Table: <FEISHU_TABLE_ID>

用法:
  python run_feishu.py           # 跑全部未回填的
  python run_feishu.py --dry-run # 只看不写
  python run_feishu.py --limit 3 # 只跑前3个
"""

import argparse
import asyncio
import json
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

from scraper import AlexaQuestionScraper, COOKIES_DIR

sys.stdout.reconfigure(encoding='utf-8')

# ═══════════════════════════════════════════════════════════════════════
# Feishu config
# ═══════════════════════════════════════════════════════════════════════
APP_ID = os.environ.get("FEISHU_APP_ID", "")
APP_SECRET = os.environ.get("FEISHU_APP_SECRET", "")
BASE_TOKEN = os.environ.get("FEISHU_BASE_TOKEN", "")
TABLE_ID = os.environ.get("FEISHU_TABLE_ID", "")

FIELD_ASIN = 'ASIN'
FIELD_BACKFILL_DATE = '回填日期'
FIELD_QUESTION_PREFIX = '问题'

# ═══════════════════════════════════════════════════════════════════════
# Feishu API helpers
# ═══════════════════════════════════════════════════════════════════════

def feishu_token():
    req = urllib.request.Request(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        data=json.dumps({'app_id': APP_ID, 'app_secret': APP_SECRET}).encode(),
        headers={'Content-Type': 'application/json; charset=utf-8'},
        method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())['tenant_access_token']


def feishu_get(token, path):
    url = f'https://open.feishu.cn/open-apis/bitable/v1/apps/{BASE_TOKEN}/{path}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def feishu_post(token, path, body):
    url = f'https://open.feishu.cn/open-apis/bitable/v1/apps/{BASE_TOKEN}/{path}'
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json; charset=utf-8',
        },
        method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def feishu_put(token, path, body):
    url = f'https://open.feishu.cn/open-apis/bitable/v1/apps/{BASE_TOKEN}/{path}'
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json; charset=utf-8',
        },
        method='PUT')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def get_all_records(token):
    """获取表内所有记录"""
    all_records = []
    page_token = None
    while True:
        path = f'tables/{TABLE_ID}/records?page_size=100'
        if page_token:
            path += f'&page_token={page_token}'
        data = feishu_get(token, path)
        items = data.get('data', {}).get('items', [])
        all_records.extend(items)
        if not data.get('data', {}).get('has_more'):
            break
        page_token = data.get('data', {}).get('page_token', '')
    return all_records


def get_fields(token):
    """获取表内所有字段 {field_name: field_id}"""
    data = feishu_get(token, f'tables/{TABLE_ID}/fields')
    items = data.get('data', {}).get('items', [])
    return {f['field_name']: f['field_id'] for f in items}


def create_field(token, field_name: str) -> bool:
    """创建文本字段"""
    result = feishu_post(token, f'tables/{TABLE_ID}/fields', {
        'field_name': field_name,
        'type': 1,  # Text
    })
    if result.get('code') == 0:
        print(f'  [+] Created field: {field_name}')
        return True
    else:
        print(f'  [!] Failed to create field "{field_name}": {result.get("msg")}')
        return False


def update_record(token, record_id: str, fields: dict) -> bool:
    """更新一条记录的字段"""
    result = feishu_put(token, f'tables/{TABLE_ID}/records/{record_id}', {'fields': fields})
    return result.get('code') == 0


# ═══════════════════════════════════════════════════════════════════════
# Main logic
# ═══════════════════════════════════════════════════════════════════════

async def scrape_questions(asins: list[str]) -> dict[str, list[str]]:
    """批量抓取 ASIN 的 Alexa 问题，返回 {asin: [q1, q2, ...]}"""
    scraper = AlexaQuestionScraper(cookie_file=COOKIES_DIR / "amazon_cookies.json")
    result = {}

    try:
        context = await scraper.start()

        for asin in asins:
            print(f'\n  Scraping {asin}...')
            try:
                r = await scraper.scrape_asin(asin, context)
                result[asin] = r.questions
                print(f'  -> {len(r.questions)} questions: {r.questions}')
            except Exception as e:
                print(f'  -> ERROR: {e}')
                result[asin] = []

    finally:
        await scraper.close()

    return result


def main():
    parser = argparse.ArgumentParser(description='飞书 ASIN → Alexa问题 → 回填')
    parser.add_argument('--dry-run', action='store_true', help='只读取不写入')
    parser.add_argument('--limit', type=int, default=0, help='限制处理条数')
    args = parser.parse_args()

    # ── 1. 认证 ──
    print('Connecting to Feishu...')
    token = feishu_token()

    # ── 2. 读记录 ──
    print('Reading records...')
    records = get_all_records(token)
    fields_map = get_fields(token)
    asin_field_id = fields_map.get(FIELD_ASIN)
    backfill_field_id = fields_map.get(FIELD_BACKFILL_DATE)

    print(f'  Records: {len(records)}')
    print(f'  Fields: {list(fields_map.keys())}')

    # ── 3. 筛选需要处理的 ──
    to_process = []  # [(record_id, asin)]
    skipped_has_date = 0
    skipped_empty_asin = 0

    for r in records:
        rid = r.get('record_id')
        fields = r.get('fields', {})

        # Get ASIN
        asin_raw = fields.get(FIELD_ASIN, '')
        if isinstance(asin_raw, list):
            # Multi-value text field
            asin_raw = asin_raw[0].get('text', '') if asin_raw else ''
        asin = str(asin_raw).strip() if asin_raw else ''

        if not asin or not asin.startswith('B0'):
            skipped_empty_asin += 1
            continue

        # Check backfill date
        backfill_date = fields.get(FIELD_BACKFILL_DATE, '')
        if backfill_date:
            skipped_has_date += 1
            continue

        to_process.append((rid, asin))

    print(f'\n  To process: {len(to_process)}')
    print(f'  Skipped (no ASIN): {skipped_empty_asin}')
    print(f'  Skipped (has date): {skipped_has_date}')

    if not to_process:
        print('\n[DONE] Nothing to process.')
        return

    if args.limit:
        to_process = to_process[:args.limit]
        print(f'  -> Limited to {args.limit}')

    # ── 4. 抓取 ──
    asins = [asin for _, asin in to_process]
    print(f'\nScraping {len(asins)} ASINs...')
    questions_map = asyncio.run(scrape_questions(asins))

    # ── 5. 确保字段存在 ──
    # 计算需要多少个问题字段
    max_q = max((len(qs) for qs in questions_map.values()), default=0)
    print(f'\nMax questions per ASIN: {max_q}')

    if max_q == 0:
        print('[DONE] No questions found for any ASIN.')
        return

    current_fields = set(fields_map.keys())

    needed_fields = []
    for i in range(1, max_q + 1):
        fname = f'{FIELD_QUESTION_PREFIX}{i}'
        if fname not in current_fields:
            needed_fields.append(fname)

    # Ensure backfill date field
    if FIELD_BACKFILL_DATE not in current_fields:
        needed_fields.append(FIELD_BACKFILL_DATE)

    if needed_fields:
        print(f'\nCreating fields: {needed_fields}')
        if not args.dry_run:
            for fname in needed_fields:
                create_field(token, fname)
                time.sleep(0.1)

    if args.dry_run:
        print('\n=== DRY RUN (no writes) ===')
        for rid, asin in to_process:
            qs = questions_map.get(asin, [])
            print(f'\n  {asin}:')
            for i, q in enumerate(qs, 1):
                print(f'    问题{i}: {q}')
            print(f'    回填日期: {datetime.now().strftime("%Y-%m-%d")}')
        return

    # ── 6. 回填 ──
    today = datetime.now().strftime('%Y-%m-%d')
    print(f'\nUpdating records...')

    ok = 0
    fail = 0
    for rid, asin in to_process:
        qs = questions_map.get(asin, [])
        update_fields = {}

        for i, q in enumerate(qs, 1):
            update_fields[f'{FIELD_QUESTION_PREFIX}{i}'] = q

        update_fields[FIELD_BACKFILL_DATE] = today

        if not update_fields:
            continue

        success = update_record(token, rid, update_fields)
        if success:
            print(f'  [OK] {asin}: {len(qs)} questions')
            ok += 1
        else:
            print(f'  [FAIL] {asin}')
            fail += 1

        time.sleep(0.15)

    print(f'\n===== Done: {ok} updated, {fail} failed =====')


if __name__ == '__main__':
    main()
