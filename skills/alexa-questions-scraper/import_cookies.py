#!/usr/bin/env python3
"""
从浏览器 F12 Console 导出的 Cookie 文本 → Playwright 格式
用法:
  1. 在 Amazon 页面 F12 Console 运行:
     copy(document.cookie)
     或者粘贴完整的 cookie table

  2. 把 Cookie 文本保存为 cookies_raw.txt，然后运行:
     python import_cookies.py

  或者直接:
     python import_cookies.py --stdin  (然后 Ctrl+V 粘贴, Ctrl+Z 结束)
"""
import json
import re
import sys
from pathlib import Path

COOKIES_DIR = Path(__file__).parent / "cookies"
OUTPUT = COOKIES_DIR / "amazon_cookies.json"


def parse_cookie_table(text: str) -> list[dict]:
    """
    解析 Amazon F12 Application → Cookies 面板的表格格式:
    name  value  domain  path  expires  size  httpOnly  secure  ...
    制表符分隔
    """
    cookies = []
    for line in text.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        name = parts[0].strip()
        value = parts[1].strip() if len(parts) > 1 else ""
        domain = parts[2].strip() if len(parts) > 2 else ".amazon.com"
        path = parts[3].strip() if len(parts) > 3 else "/"

        # Parse expires
        expires = -1  # session cookie
        if len(parts) > 4 and parts[4].strip():
            expires_str = parts[4].strip()
            if expires_str == "Session" or expires_str == "会话":
                expires = -1
            else:
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
                    expires = int(dt.timestamp())
                except Exception:
                    expires = -1

        # httpOnly, secure
        http_only = False
        secure = False
        if len(parts) > 5:
            http_only = "✓" in parts[5] if len(parts) > 5 else False
        if len(parts) > 6:
            secure = "✓" in parts[6] if len(parts) > 6 else False

        same_site = "Lax"
        if len(parts) > 7:
            ss = parts[7].strip()
            if ss in ("Lax", "Strict", "None"):
                same_site = ss

        cookies.append({
            "name": name,
            "value": value,
            "domain": domain,
            "path": path,
            "expires": expires,
            "httpOnly": http_only,
            "secure": secure,
            "sameSite": same_site,
        })

    return cookies


def parse_string_cookie(text: str) -> list[dict]:
    """
    解析 document.cookie 格式: "key1=val1; key2=val2"
    """
    cookies = []
    for pair in text.strip().split(";"):
        pair = pair.strip()
        if not pair or "=" not in pair:
            continue
        name, _, value = pair.partition("=")
        cookies.append({
            "name": name.strip(),
            "value": value.strip(),
            "domain": ".amazon.com",
            "path": "/",
            "expires": -1,
            "httpOnly": False,
            "secure": True,
            "sameSite": "Lax",
        })
    return cookies


def detect_format(text: str) -> str:
    """检测输入格式: 'table' 或 'string'"""
    lines = [l for l in text.strip().splitlines() if l.strip()]
    if not lines:
        return "string"
    # 如果大部分行包含制表符，就是 table 格式
    tab_lines = sum(1 for l in lines if "\t" in l)
    if tab_lines > len(lines) * 0.5:
        return "table"
    return "string"


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Import Amazon cookies from browser")
    parser.add_argument("file", nargs="?", help="Cookie text file (from F12 copy-paste)")
    parser.add_argument("--stdin", action="store_true", help="Read from stdin")
    args = parser.parse_args()

    if args.file:
        text = Path(args.file).read_text(encoding="utf-8")
    elif args.stdin:
        print("Paste cookie data (Ctrl+D or Ctrl+Z then Enter to finish):")
        text = sys.stdin.read()
    else:
        # Try default file
        raw_file = Path(__file__).parent / "cookies_raw.txt"
        if raw_file.exists():
            text = raw_file.read_text(encoding="utf-8")
        else:
            print("ERROR: No input. Use --stdin or provide a file.")
            sys.exit(1)

    fmt = detect_format(text)
    print(f"Detected format: {fmt}")

    if fmt == "table":
        cookies = parse_cookie_table(text)
    else:
        cookies = parse_string_cookie(text)

    COOKIES_DIR.mkdir(exist_ok=True)
    OUTPUT.write_text(json.dumps(cookies, indent=2, ensure_ascii=False))
    print(f"[OK] {len(cookies)} cookies saved to {OUTPUT}")
    print()
    print("Key auth cookies found:")
    for c in cookies:
        if c["name"] in ("at-main", "sess-at-main", "session-id", "ubid-main", "session-token"):
            print(f"  {c['name']}: {'*' * 20} (present)")


if __name__ == "__main__":
    main()
