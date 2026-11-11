#!/usr/bin/env python3
"""Render a Markdown VOC needs-map report into styled HTML."""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "section"


def apply_inline(text: str) -> str:
    escaped = html.escape(text)
    return re.sub(
        r"`([^`]+)`",
        lambda match: f"<code>{html.escape(match.group(1))}</code>",
        escaped,
    )


def parse_sections(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for line in lines:
        if line.startswith("## "):
            current = line[3:].strip()
            sections[current] = []
        elif current is not None:
            sections[current].append(line)
    return sections


def build_html(markdown_text: str, title_override: str | None = None) -> str:
    lines = markdown_text.splitlines()
    report_title = title_override or next(
        (line[2:].strip() for line in lines if line.startswith("# ")),
        "VOC Needs Map",
    )
    sections = parse_sections(lines)
    core_lines = [line.strip() for line in sections.get("Core Judgment", []) if line.strip()]
    hero_summary = core_lines[0] if core_lines else report_title

    section_titles = [
        line[3:].strip()
        for line in lines
        if line.startswith("## ") and line[3:].strip() != "Core Judgment"
    ]
    section_ids = {title: slugify(title) for title in section_titles}

    parts: list[str] = []
    parts.append(
        f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{html.escape(report_title)}</title>
<style>
:root {{
  --bg: #f4efe6;
  --paper: rgba(255, 252, 247, 0.96);
  --ink: #1f2328;
  --muted: #5e6a74;
  --line: #dacbb7;
  --accent: #8e4b27;
  --accent-soft: #f2e4d3;
  --accent-wash: #fbf3e8;
  --shadow: 0 22px 60px rgba(85, 55, 24, 0.10);
}}
* {{ box-sizing: border-box; }}
html {{ scroll-behavior: smooth; }}
body {{
  margin: 0;
  font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at 10% 10%, rgba(232, 194, 142, 0.18) 0, transparent 28%),
    radial-gradient(circle at 90% 0%, rgba(197, 123, 66, 0.18) 0, transparent 24%),
    linear-gradient(180deg, #f9f5ee 0%, #f4efe6 100%);
  line-height: 1.72;
}}
a {{ color: inherit; }}
.page {{ max-width: 1380px; margin: 0 auto; padding: 28px 20px 56px; }}
.hero {{
  background: linear-gradient(135deg, #fff8ee 0%, #f3e2ce 100%);
  border: 1px solid rgba(218, 203, 183, 0.9);
  border-radius: 28px;
  padding: 34px 36px 30px;
  box-shadow: var(--shadow);
}}
.hero-kicker {{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(197, 123, 66, 0.26);
  padding: 7px 12px;
  border-radius: 999px;
}}
.hero h1 {{ margin: 16px 0 10px; font-size: 38px; line-height: 1.15; max-width: 880px; }}
.hero p {{ margin: 0; max-width: 900px; color: var(--muted); font-size: 16px; }}
.layout {{ display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 24px; margin-top: 24px; align-items: start; }}
.sidebar {{ position: sticky; top: 18px; }}
.toc, .fact-panel {{
  background: var(--paper);
  border: 1px solid rgba(218, 203, 183, 0.95);
  border-radius: 22px;
  box-shadow: 0 14px 38px rgba(85, 55, 24, 0.08);
}}
.toc {{ padding: 20px 18px; }}
.toc h2, .fact-panel h3 {{ margin: 0 0 14px; font-size: 18px; }}
.toc a {{
  display: block;
  text-decoration: none;
  color: #46372a;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 4px;
}}
.toc a:hover {{ background: var(--accent-wash); }}
.fact-panel {{ margin-top: 14px; padding: 18px; }}
.fact-panel p {{ margin: 10px 0; color: #2c2017; }}
.content {{ min-width: 0; }}
.section {{
  background: var(--paper);
  border: 1px solid rgba(218, 203, 183, 0.95);
  border-radius: 24px;
  padding: 24px 24px 16px;
  box-shadow: 0 14px 38px rgba(85, 55, 24, 0.08);
  margin-bottom: 18px;
}}
.section h2 {{
  margin: 0 0 14px;
  font-size: 25px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}}
.section h3 {{ margin-top: 18px; margin-bottom: 8px; font-size: 19px; }}
p {{ margin: 10px 0 14px; }}
ul, ol {{ margin: 10px 0 14px 22px; padding: 0; }}
li {{ margin: 7px 0; }}
code {{
  background: var(--accent-soft);
  color: #6f3d20;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.95em;
}}
.table-wrap {{
  overflow-x: auto;
  margin: 14px 0 20px;
  border: 1px solid rgba(218, 203, 183, 0.95);
  border-radius: 16px;
}}
table {{ width: 100%; border-collapse: collapse; background: white; }}
thead th {{ background: #f3e6d6; color: #442718; }}
th, td {{ border: 1px solid var(--line); padding: 11px 12px; text-align: left; vertical-align: top; min-width: 120px; }}
.callout {{
  background: linear-gradient(180deg, #fff8ee 0%, #fbf2e7 100%);
  border: 1px solid rgba(197, 123, 66, 0.24);
  border-radius: 18px;
  padding: 16px 18px;
  margin: 14px 0 18px;
}}
.callout .title {{ font-weight: 700; color: var(--accent); margin-bottom: 6px; }}
.footer {{ text-align: center; color: var(--muted); font-size: 13px; padding: 10px 0 0; }}
@media (max-width: 1080px) {{
  .layout {{ grid-template-columns: 1fr; }}
  .sidebar {{ position: static; }}
}}
@media (max-width: 700px) {{
  .page {{ padding: 14px 10px 32px; }}
  .hero {{ padding: 22px 18px; border-radius: 22px; }}
  .hero h1 {{ font-size: 28px; }}
  .section {{ padding: 18px 14px 10px; border-radius: 18px; }}
  .section h2 {{ font-size: 22px; }}
}}
</style>
</head>
<body>
<div class="page">
  <section class="hero">
    <div class="hero-kicker">VOC Needs Map</div>
    <h1>{html.escape(report_title)}</h1>
    <p>{html.escape(hero_summary)}</p>
  </section>
  <div class="layout">
    <aside class="sidebar">
      <nav class="toc">
        <h2>目录导航</h2>
        <a href="#core-judgment">核心判断</a>
"""
    )

    for title in section_titles:
        parts.append(f'        <a href="#{section_ids[title]}">{html.escape(title)}</a>')

    parts.append(
        """      </nav>
      <section class="fact-panel">
        <h3>报告说明</h3>
        <p>本页由 Markdown 需求地图自动渲染为 HTML，适合汇报、复核和继续编辑。</p>
      </section>
    </aside>
    <main class="content">
"""
    )

    in_ul = False
    in_ol = False
    in_table = False
    current_table: list[list[str]] = []
    current_section_open = False
    in_core = False
    first_core_line = False

    def close_lists() -> None:
        nonlocal in_ul, in_ol
        if in_ul:
            parts.append("</ul>")
            in_ul = False
        if in_ol:
            parts.append("</ol>")
            in_ol = False

    def flush_table() -> None:
        nonlocal in_table, current_table
        if not in_table or not current_table:
            in_table = False
            current_table = []
            return
        header = current_table[0]
        body = []
        for row in current_table[1:]:
            stripped = [cell.replace(":", "").replace("-", "").strip() for cell in row]
            if stripped and all(cell == "" for cell in stripped):
                continue
            body.append(row)
        parts.append('<div class="table-wrap"><table>')
        parts.append("<thead><tr>" + "".join(f"<th>{apply_inline(cell)}</th>" for cell in header) + "</tr></thead>")
        if body:
            parts.append("<tbody>")
            for row in body:
                parts.append("<tr>" + "".join(f"<td>{apply_inline(cell)}</td>" for cell in row) + "</tr>")
            parts.append("</tbody>")
        parts.append("</table></div>")
        in_table = False
        current_table = []

    for raw_line in lines:
        stripped = raw_line.strip()

        if stripped.startswith("|") and stripped.endswith("|"):
            close_lists()
            current_table.append([cell.strip() for cell in stripped.strip("|").split("|")])
            in_table = True
            continue
        flush_table()

        if not stripped:
            close_lists()
            continue
        if stripped.startswith("# "):
            continue
        if stripped.startswith("## "):
            close_lists()
            title = stripped[3:].strip()
            if current_section_open:
                parts.append("</section>")
            section_id = "core-judgment" if title == "Core Judgment" else section_ids[title]
            parts.append(f'<section class="section" id="{section_id}"><h2>{html.escape("核心判断" if title == "Core Judgment" else title)}</h2>')
            current_section_open = True
            in_core = title == "Core Judgment"
            first_core_line = in_core
            continue
        if stripped.startswith("### "):
            close_lists()
            parts.append(f"<h3>{html.escape(stripped[4:].strip())}</h3>")
            continue
        if re.match(r"^\d+\.\s+", stripped):
            if not in_ol:
                close_lists()
                parts.append("<ol>")
                in_ol = True
            parts.append(f'<li>{apply_inline(re.sub(r"^\d+\.\s+", "", stripped))}</li>')
            continue
        if stripped.startswith("- "):
            if not in_ul:
                close_lists()
                parts.append("<ul>")
                in_ul = True
            parts.append(f"<li>{apply_inline(stripped[2:])}</li>")
            continue

        close_lists()
        if in_core and first_core_line:
            parts.append(f'<div class="callout"><div class="title">一句话判断</div><div>{apply_inline(stripped)}</div></div>')
            first_core_line = False
        else:
            parts.append(f"<p>{apply_inline(stripped)}</p>")

    flush_table()
    close_lists()
    if current_section_open:
        parts.append("</section>")

    parts.append(
        """      <div class="footer">Generated from Markdown by render_needs_map_html.py.</div>
    </main>
  </div>
</div>
</body>
</html>
"""
    )
    return "\n".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser(description="Render a Markdown needs-map report to HTML.")
    parser.add_argument("markdown_path", help="Path to the Markdown report.")
    parser.add_argument(
        "--output",
        dest="output_path",
        help="Path to the HTML output. Defaults to the Markdown filename with .html.",
    )
    parser.add_argument(
        "--title",
        dest="title_override",
        help="Optional HTML title override.",
    )
    args = parser.parse_args()

    markdown_path = Path(args.markdown_path)
    output_path = Path(args.output_path) if args.output_path else markdown_path.with_suffix(".html")

    html_text = build_html(markdown_path.read_text(encoding="utf-8"), args.title_override)
    output_path.write_text(html_text, encoding="utf-8")
    print(output_path)


if __name__ == "__main__":
    main()
