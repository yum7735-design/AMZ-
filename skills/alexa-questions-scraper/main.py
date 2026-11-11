#!/usr/bin/env python3
"""
Amazon Alexa "Looking for specific info?" Questions Scraper

Usage:
  python main.py login              # 首次：手动登录保存 Cookie
  python main.py scrape B0XXXXXX    # 抓取
  python main.py scrape --file asins.txt
  python main.py scrape B0X B0Y -o my_output
"""

import argparse
import asyncio
import sys
from pathlib import Path

from scraper import run_scrape, export_results, print_summary, interactive_login


def main():
    parser = argparse.ArgumentParser(description="Amazon Alexa Questions Scraper")
    sub = parser.add_subparsers(dest="command")

    # login
    sub.add_parser("login", help="Open browser to login Amazon and save cookies")

    # scrape
    s = sub.add_parser("scrape", help="Scrape Alexa questions")
    s.add_argument("asins", nargs="*", help="ASIN(s) to scrape")
    s.add_argument("--file", "-f", help="Text file with ASINs (one per line)")
    s.add_argument("--output", "-o", default="alexa_questions", help="Output prefix")

    args = parser.parse_args()

    if args.command == "login":
        asyncio.run(interactive_login())
        return

    if args.command != "scrape":
        parser.print_help()
        print("\nExamples:")
        print("  python main.py login")
        print("  python main.py scrape B0XXXXXXXX")
        print("  python main.py scrape --file asins.txt")
        sys.exit(1)

    # Collect ASINs
    asins = list(args.asins)
    if args.file:
        fp = Path(args.file)
        if not fp.exists():
            print(f"[ERROR] File not found: {args.file}")
            sys.exit(1)
        asins += [l.strip() for l in fp.read_text().splitlines() if l.strip()]

    if not asins:
        print("[ERROR] Please provide at least one ASIN")
        sys.exit(1)

    # Deduplicate
    seen = set()
    asins = [a for a in asins if not (a in seen or seen.add(a))]

    print(f"\nScraping {len(asins)} ASIN(s)...\n")

    results = asyncio.run(run_scrape(asins))

    print_summary(results)
    export_results(results, output_prefix=args.output)
    print("[DONE]")


if __name__ == "__main__":
    main()
