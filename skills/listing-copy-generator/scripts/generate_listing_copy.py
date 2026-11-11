from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path

import pandas as pd


TITLE_LIMIT_DEFAULT = 75
HIGHLIGHT_LIMIT_DEFAULT = 125
BACKEND_LIMIT_DEFAULT = 250
ASIN_PATTERN = re.compile(r"\bB0[A-Z0-9]{8}\b")
MARKETING_BANNED_TERMS = {"best", "premium", "amazing", "discount", "sale"}
STOPWORD_TERMS = {
    "for",
    "with",
    "and",
    "the",
    "a",
    "an",
    "to",
    "of",
    "by",
    "in",
}

COLUMN_ALIASES = {
    "asin": ["ASIN", "asin"],
    "parent_asin": ["父ASIN", "Parent ASIN", "parent_asin", "ParentASIN"],
    "name": ["品名", "Product Name", "Name", "name"],
    "title": ["标题", "Title", "title"],
    "color": ["具体颜色", "颜色分类", "Color", "color", "Color Name"],
    "size": ["尺寸规格", "Size", "size", "Specification"],
    "length": ["卷装长度", "单个长度", "Length", "length"],
    "ratio": ["收缩比", "Ratio", "Shrink Ratio", "Spec Ratio"],
    "material": ["材质", "Material", "material"],
    "package": ["包装方式", "Package Type", "Package", "Packaging", "package"],
    "quantity": ["套装数量", "Pack Count", "Quantity", "Qty", "quantity"],
}

KEYWORD_ALIASES = {
    "keyword": ["关键词", "Keyword", "Search Term"],
    "priority": ["优先级", "Priority", "Tier"],
    "intent": ["搜索意图", "Search Intent", "Intent"],
    "need": ["用户需求", "Need", "User Need"],
    "scene": ["使用场景", "Scene", "Use Case"],
    "pain": ["对应痛点", "Pain Point", "Pain"],
    "driver": ["购买驱动", "Purchase Driver", "Driver"],
}


@dataclass
class Variant:
    asin: str
    parent_asin: str
    name: str
    current_title: str
    color: str
    size: str
    length: str
    ratio: str
    material: str
    package_type: str
    quantity: str


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tables: list[list[list[str]]] = []
        self._in_table = False
        self._in_row = False
        self._in_cell = False
        self._cell_tag: str | None = None
        self._current_table: list[list[str]] = []
        self._current_row: list[str] = []
        self._cell_chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "table":
            self._in_table = True
            self._current_table = []
            return
        if tag == "tr" and self._in_table:
            self._in_row = True
            self._current_row = []
            return
        if tag in {"th", "td"} and self._in_row:
            self._in_cell = True
            self._cell_tag = tag
            self._cell_chunks = []
            return
        if tag == "br" and self._in_cell:
            self._cell_chunks.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"th", "td"} and self._in_cell and tag == self._cell_tag:
            self._current_row.append(normalize_space("".join(self._cell_chunks)))
            self._in_cell = False
            self._cell_tag = None
            self._cell_chunks = []
            return
        if tag == "tr" and self._in_row:
            if any(self._current_row):
                self._current_table.append(self._current_row)
            self._in_row = False
            self._current_row = []
            return
        if tag == "table" and self._in_table:
            self.tables.append(self._current_table)
            self._in_table = False
            self._current_table = []

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._cell_chunks.append(data)


def normalize_space(value: str) -> str:
    return " ".join(str(value).replace("\xa0", " ").split())


def safe_text(value) -> str:
    if value is None or (hasattr(pd, "isna") and pd.isna(value)):
        return ""
    text = normalize_space(value)
    return text.strip("-_,;: ")


def title_case_phrase(text: str) -> str:
    return " ".join(part.capitalize() if part.islower() else part for part in normalize_space(text).split())


def parse_html_tables(path: Path) -> list[list[list[str]]]:
    parser = TableParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.tables


def records_from_table(table: list[list[str]]) -> list[dict[str, str]]:
    if not table:
        return []
    header = [normalize_space(cell) for cell in table[0]]
    records: list[dict[str, str]] = []
    for row in table[1:]:
        padded = row + [""] * max(0, len(header) - len(row))
        records.append({header[i]: normalize_space(padded[i]) for i in range(len(header))})
    return records


def first_matching_column(df: pd.DataFrame, aliases: list[str]) -> str:
    for alias in aliases:
        if alias in df.columns:
            return alias
    raise KeyError(f"Missing expected column. Tried: {aliases}")


def find_optional_column(df: pd.DataFrame, aliases: list[str]) -> str | None:
    for alias in aliases:
        if alias in df.columns:
            return alias
    return None


def extract_parent_asin(needs_map_path: Path) -> str | None:
    html = needs_map_path.read_text(encoding="utf-8")
    matches = ASIN_PATTERN.findall(html)
    return matches[0] if matches else None


def resolve_parent_asin(df: pd.DataFrame, parent_asin_col: str, asin_col: str, candidate: str | None) -> str:
    if candidate:
        parent_matches = df[df[parent_asin_col].astype(str).eq(candidate)]
        if not parent_matches.empty:
            return candidate
        child_matches = df[df[asin_col].astype(str).eq(candidate)]
        if not child_matches.empty:
            return safe_text(child_matches.iloc[0][parent_asin_col])

    parents = sorted({safe_text(value) for value in df[parent_asin_col].tolist() if safe_text(value)})
    if len(parents) == 1:
        return parents[0]
    raise ValueError("Unable to determine a single parent ASIN. Pass --parent-asin explicitly.")


def load_variants(product_path: Path, parent_asin: str) -> list[Variant]:
    df = pd.read_excel(product_path)
    asin_col = first_matching_column(df, COLUMN_ALIASES["asin"])
    parent_col = first_matching_column(df, COLUMN_ALIASES["parent_asin"])
    name_col = first_matching_column(df, COLUMN_ALIASES["name"])
    title_col = first_matching_column(df, COLUMN_ALIASES["title"])

    color_col = find_optional_column(df, COLUMN_ALIASES["color"])
    size_col = find_optional_column(df, COLUMN_ALIASES["size"])
    length_col = find_optional_column(df, COLUMN_ALIASES["length"])
    ratio_col = find_optional_column(df, COLUMN_ALIASES["ratio"])
    material_col = find_optional_column(df, COLUMN_ALIASES["material"])
    package_col = find_optional_column(df, COLUMN_ALIASES["package"])
    quantity_col = find_optional_column(df, COLUMN_ALIASES["quantity"])

    variants_df = df[df[parent_col].astype(str).eq(parent_asin)].copy()
    if variants_df.empty:
        raise ValueError(f"No variants found for parent ASIN {parent_asin}.")

    variants: list[Variant] = []
    for _, row in variants_df.iterrows():
        variants.append(
            Variant(
                asin=safe_text(row[asin_col]),
                parent_asin=safe_text(row[parent_col]),
                name=safe_text(row[name_col]),
                current_title=safe_text(row[title_col]),
                color=safe_text(row[color_col]) if color_col else "",
                size=safe_text(row[size_col]) if size_col else "",
                length=safe_text(row[length_col]) if length_col else "",
                ratio=safe_text(row[ratio_col]).replace("：", ":") if ratio_col else "",
                material=safe_text(row[material_col]) if material_col else "",
                package_type=safe_text(row[package_col]) if package_col else "",
                quantity=safe_text(row[quantity_col]) if quantity_col else "",
            )
        )
    return variants


def detect_field(row: dict[str, str], field: str) -> str:
    for alias in KEYWORD_ALIASES[field]:
        if alias in row:
            return safe_text(row.get(alias))
    return ""


def pick_keyword_rows(demand_matrix_path: Path) -> list[dict[str, str]]:
    for table in parse_html_tables(demand_matrix_path):
        records = records_from_table(table)
        if not records:
            continue
        if any(alias in records[0] for alias in KEYWORD_ALIASES["keyword"]):
            return records
    return []


def classify_need_table(records: list[dict[str, str]]) -> str | None:
    if not records:
        return None
    headers = set(records[0].keys())
    if {"优先级", "JTBD"}.issubset(headers) or {"Priority", "JTBD"}.issubset(headers):
        return "needs"
    if "场景" in headers or "Scene" in headers or "使用场景" in headers:
        return "scenes"
    if "痛点" in headers or "Pain" in headers:
        return "pains"
    if "购买驱动" in headers or "Purchase Driver" in headers or "决策因素" in headers:
        return "drivers"
    return None


def pick_needs_map_records(needs_map_path: Path) -> dict[str, list[dict[str, str]]]:
    grouped = {"needs": [], "scenes": [], "pains": [], "drivers": []}
    for table in parse_html_tables(needs_map_path):
        records = records_from_table(table)
        table_type = classify_need_table(records)
        if table_type:
            grouped[table_type] = records
    return grouped


def normalize_priority(value: str) -> tuple[int, str]:
    text = safe_text(value).upper()
    if not text:
        return (99, "")
    match = re.search(r"P?\s*(\d+)", text)
    if match:
        return (int(match.group(1)), text)
    if "HIGH" in text:
        return (1, text)
    if "MED" in text:
        return (2, text)
    if "LOW" in text:
        return (3, text)
    return (50, text)


def tokenize_keyword(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z0-9]+", text.lower())
    return [token for token in tokens if token not in STOPWORD_TERMS]


def score_keyword_row(row: dict[str, str]) -> tuple[int, int, int, str]:
    priority_rank, priority_text = normalize_priority(detect_field(row, "priority"))
    keyword = detect_field(row, "keyword")
    intent = detect_field(row, "intent").lower()
    need = detect_field(row, "need")
    purchase_weight = 0
    if any(term in intent for term in ["buy", "purchase", "commercial", "transactional"]):
        purchase_weight = -2
    elif any(term in intent for term in ["compare", "solution", "application", "usage"]):
        purchase_weight = -1
    need_weight = -1 if need else 0
    return (priority_rank, purchase_weight, need_weight, keyword or priority_text)


def choose_core_term(keyword_rows: list[dict[str, str]], fallback_title: str, explicit_core_term: str | None) -> str:
    if explicit_core_term:
        return normalize_space(explicit_core_term)

    ranked = sorted(keyword_rows, key=score_keyword_row)
    for row in ranked:
        keyword = detect_field(row, "keyword")
        if keyword and len(tokenize_keyword(keyword)) >= 1:
            return keyword

    if fallback_title:
        cleaned = re.sub(r"^[A-Za-z0-9&+\-]+\s+", "", fallback_title).strip()
        if "," in cleaned:
            cleaned = cleaned.split(",", 1)[0].strip()
        return cleaned or "Amazon Product"
    return "Amazon Product"


def infer_product_type(variant: Variant, core_term: str) -> str:
    for candidate in [variant.package_type, variant.name, variant.current_title]:
        lowered = candidate.lower()
        for term in ["kit", "set", "assortment", "bundle", "pack", "roll", "tube", "wire", "sleeve"]:
            if term in lowered and term not in core_term.lower():
                return term
    return ""


def collect_title_attributes(variant: Variant) -> list[str]:
    attrs: list[str] = []
    if variant.material:
        attrs.append(variant.material)
    if variant.size and variant.length:
        attrs.append(f"{variant.size} x {variant.length}")
    elif variant.size:
        attrs.append(variant.size)
    elif variant.length:
        attrs.append(variant.length)
    if variant.ratio:
        attrs.append(variant.ratio)
    if variant.quantity:
        qty = variant.quantity
        if re.search(r"\d", qty) and "pc" not in qty.lower() and "count" not in qty.lower():
            qty = f"{qty} pc"
        attrs.append(qty)
    if variant.color and variant.color.lower() not in {"default", "standard", "assorted"}:
        attrs.append(variant.color)
    return dedupe_phrases(attrs)


def dedupe_phrases(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        cleaned = normalize_space(value)
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        output.append(cleaned)
    return output


def fit_to_limit(base: str, extras: list[str], limit: int) -> str:
    title = base
    for extra in extras:
        candidate = f"{title}, {extra}"
        if len(candidate) <= limit:
            title = candidate
        else:
            break
    return title[:limit].rstrip(", ")


def build_title(brand_name: str, core_term: str, variant: Variant, title_limit: int) -> str:
    normalized_brand = normalize_space(brand_name)
    base_parts = [normalized_brand, title_case_phrase(core_term)]
    product_type = infer_product_type(variant, core_term)
    if product_type:
        base_parts.append(title_case_phrase(product_type))
    base = " ".join(part for part in base_parts if part)
    extras = collect_title_attributes(variant)[:3]
    return fit_to_limit(base, extras, title_limit)


def choose_primary_need(needs_records: dict[str, list[dict[str, str]]]) -> str:
    for row in needs_records["needs"]:
        for key in ["JTBD", "Need", "用户需求"]:
            if safe_text(row.get(key)):
                return safe_text(row[key])
    for row in needs_records["pains"]:
        for key in ["痛点", "Pain", "表现", "影响"]:
            if safe_text(row.get(key)):
                return f"reduce {safe_text(row[key]).lower()}"
    return "complete the job with less guesswork"


def choose_primary_scene(needs_records: dict[str, list[dict[str, str]]]) -> str:
    for row in needs_records["scenes"]:
        for key in ["场景", "Scene", "使用场景", "典型环境"]:
            if safe_text(row.get(key)):
                return safe_text(row[key])
    return "repair, install, and maintenance work"


def choose_primary_driver(needs_records: dict[str, list[dict[str, str]]], keyword_rows: list[dict[str, str]]) -> str:
    for row in needs_records["drivers"]:
        for key in ["购买驱动", "Purchase Driver", "决策因素"]:
            if safe_text(row.get(key)):
                return safe_text(row[key])
    for row in keyword_rows:
        driver = detect_field(row, "driver")
        if driver:
            return driver
    return "clear specs and better purchase confidence"


def shorten_phrase(text: str, fallback: str, limit: int) -> str:
    normalized = normalize_space(text)
    if len(normalized) <= limit:
        return normalized
    if len(fallback) <= limit:
        return fallback
    return fallback[:limit].rstrip()


def variant_descriptor(variant: Variant, core_term: str) -> str:
    pieces = [variant.size, variant.length, variant.ratio, variant.material]
    descriptor = " ".join(part for part in pieces if part)
    return normalize_space(descriptor) or variant.name or title_case_phrase(core_term)


def choose_secondary_keywords(keyword_rows: list[dict[str, str]], core_term: str, limit: int = 4) -> list[str]:
    selected: list[str] = []
    core_tokens = set(tokenize_keyword(core_term))
    for row in sorted(keyword_rows, key=score_keyword_row):
        keyword = detect_field(row, "keyword")
        if not keyword:
            continue
        tokens = set(tokenize_keyword(keyword))
        if tokens and tokens.issubset(core_tokens):
            continue
        if keyword.lower() in {item.lower() for item in selected}:
            continue
        selected.append(keyword)
        if len(selected) >= limit:
            break
    return selected


def build_item_highlights(
    variant: Variant,
    core_term: str,
    need_text: str,
    scene_text: str,
    driver_text: str,
    secondary_keywords: list[str],
    count: int,
    highlight_limit: int,
) -> list[dict[str, str]]:
    descriptor = variant_descriptor(variant, core_term)
    need_short = shorten_phrase(need_text.lower(), "complete the job with less guesswork", 42)
    scene_short = shorten_phrase(scene_text.lower(), "repair and install work", 34)
    driver_short = shorten_phrase(driver_text.lower(), "clear specs before purchase", 34)
    keyword_hint = secondary_keywords[0].lower() if secondary_keywords else core_term.lower()

    templates = [
        {
            "text": f"{descriptor} {core_term.lower()} for {scene_short}; helps shoppers {need_short}.",
            "demand": need_text,
            "keywords": keyword_hint,
        },
        {
            "text": f"Clear specs and visible variant details support {driver_short} on repeat-buy or first-time orders.",
            "demand": driver_text,
            "keywords": "; ".join(secondary_keywords[:2]) or keyword_hint,
        },
        {
            "text": f"Built for {scene_short} with concise listing cues that reduce mismatch risk before checkout.",
            "demand": "Purchase confidence and lower mismatch risk",
            "keywords": keyword_hint,
        },
    ]

    results: list[dict[str, str]] = []
    for item in templates[: max(1, count)]:
        text = normalize_space(item["text"])
        if len(text) > highlight_limit:
            text = text[:highlight_limit].rstrip(" ,;") + "."
        results.append(
            {
                "text": text,
                "demand": item["demand"],
                "keywords": item["keywords"],
            }
        )
    return results


def build_bullets(
    variant: Variant,
    core_term: str,
    need_text: str,
    scene_text: str,
    driver_text: str,
    secondary_keywords: list[str],
) -> list[str]:
    descriptor = variant_descriptor(variant, core_term)
    fit_text = shorten_phrase(scene_text.lower(), "repair, install, and maintenance work", 48)
    need_lower = shorten_phrase(need_text.lower(), "complete the job with less guesswork", 52)
    driver_lower = shorten_phrase(driver_text.lower(), "clear specs and better purchase confidence", 50)
    keyword_tail = ", ".join(secondary_keywords[:2]).lower()

    bullet_1 = (
        f"Problem it solves: {title_case_phrase(core_term)} helps shoppers {need_lower}, so the listing answers the main reason to buy."
    )
    bullet_2 = (
        f"Why this version stands out: {descriptor} keeps the most decision-critical specs visible for faster comparison and fewer wrong picks."
    )
    bullet_3 = (
        f"Where it fits: Built for {fit_text}, plus similar jobs where product fit, size match, and application clarity matter."
    )
    bullet_4 = (
        f"How it simplifies selection: The copy surfaces size, format, and use guidance early so buyers can choose with less back-and-forth."
    )
    bullet_5 = (
        f"Why it earns trust: Claims are anchored to VOC pain points, demand data, and purchase drivers like {driver_lower}"
        + (f", while naturally covering {keyword_tail}." if keyword_tail else ".")
    )
    return [bullet_1, bullet_2, bullet_3, bullet_4, bullet_5]


def build_backend_terms(keyword_rows: list[dict[str, str]], covered_text: str, max_chars: int = BACKEND_LIMIT_DEFAULT) -> str:
    terms: list[str] = []
    covered_lower = covered_text.lower()
    for row in sorted(keyword_rows, key=score_keyword_row):
        keyword = detect_field(row, "keyword")
        if not keyword or keyword.lower() in covered_lower:
            continue
        candidate = " ".join(terms + [keyword])
        if len(candidate) > max_chars:
            break
        terms.append(keyword)
    return " ".join(terms)


def frame_to_markdown(frame: pd.DataFrame) -> str:
    headers = [str(column) for column in frame.columns.tolist()]
    separator = ["---"] * len(headers)
    rows = [headers, separator]
    for _, row in frame.iterrows():
        rows.append([str(row[column]).replace("\n", "<br>") for column in frame.columns])
    return "\n".join("| " + " | ".join(row) + " |" for row in rows)


def run_quality_checks(
    frames: dict[str, pd.DataFrame],
    title_limit: int,
    highlight_limit: int,
    item_highlight_count: int,
) -> list[str]:
    issues: list[str] = []
    if not frames["title"]["Character Count"].le(title_limit).all():
        issues.append(f"One or more titles exceed the {title_limit}-character limit.")
    if not frames["item_highlights"]["Character Count"].le(highlight_limit).all():
        issues.append(f"One or more item highlights exceed the {highlight_limit}-character limit.")

    highlight_counts = frames["item_highlights"].groupby("ASIN").size()
    if not highlight_counts.empty and not highlight_counts.eq(item_highlight_count).all():
        issues.append("The item-highlight row count does not match the requested per-ASIN count.")

    for frame_name, columns in {
        "title": ["Title"],
        "item_highlights": ["Item Highlight"],
        "bullet_points": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5"],
    }.items():
        frame = frames[frame_name]
        for column in columns:
            for value in frame[column].astype(str):
                lowered = value.lower()
                found = sorted(term for term in MARKETING_BANNED_TERMS if term in lowered)
                if found:
                    issues.append(f"Banned marketing terms found in {frame_name}: {', '.join(found)}")
                    return issues
    return issues


def build_output(
    variants: list[Variant],
    keyword_rows: list[dict[str, str]],
    needs_records: dict[str, list[dict[str, str]]],
    brand_name: str,
    title_limit: int,
    highlight_limit: int,
    item_highlight_count: int,
    explicit_core_term: str | None,
) -> dict[str, pd.DataFrame]:
    fallback_title = variants[0].current_title if variants else ""
    core_term = choose_core_term(keyword_rows, fallback_title, explicit_core_term)
    secondary_keywords = choose_secondary_keywords(keyword_rows, core_term)
    need_text = choose_primary_need(needs_records)
    scene_text = choose_primary_scene(needs_records)
    driver_text = choose_primary_driver(needs_records, keyword_rows)

    title_rows: list[dict[str, str]] = []
    highlight_rows: list[dict[str, str]] = []
    bullet_rows: list[dict[str, str]] = []
    backend_rows: list[dict[str, str]] = []

    for variant in variants:
        title = build_title(brand_name, core_term, variant, title_limit)
        highlights = build_item_highlights(
            variant=variant,
            core_term=core_term,
            need_text=need_text,
            scene_text=scene_text,
            driver_text=driver_text,
            secondary_keywords=secondary_keywords,
            count=item_highlight_count,
            highlight_limit=highlight_limit,
        )
        bullets = build_bullets(
            variant=variant,
            core_term=core_term,
            need_text=need_text,
            scene_text=scene_text,
            driver_text=driver_text,
            secondary_keywords=secondary_keywords,
        )
        covered_text = " ".join([title] + [item["text"] for item in highlights] + bullets)
        backend_terms = build_backend_terms(keyword_rows, covered_text)

        coverage_parts = dedupe_phrases(
            [brand_name, core_term, variant.material, variant.size, variant.length, variant.ratio, variant.color]
        )
        title_rows.append(
            {
                "ASIN": variant.asin,
                "Title": title,
                "Character Count": len(title),
                "Keyword Coverage": "; ".join(coverage_parts),
            }
        )

        for item in highlights:
            highlight_rows.append(
                {
                    "ASIN": variant.asin,
                    "Item Highlight": item["text"],
                    "Character Count": len(item["text"]),
                    "Demand Solved": item["demand"],
                    "Keywords": item["keywords"],
                }
            )

        bullet_rows.append(
            {
                "ASIN": variant.asin,
                "Bullet 1": bullets[0],
                "Bullet 2": bullets[1],
                "Bullet 3": bullets[2],
                "Bullet 4": bullets[3],
                "Bullet 5": bullets[4],
            }
        )

        backend_rows.append(
            {
                "ASIN": variant.asin,
                "Search Terms": backend_terms,
                "Character Count": len(backend_terms),
            }
        )

    return {
        "title": pd.DataFrame(title_rows),
        "item_highlights": pd.DataFrame(highlight_rows),
        "bullet_points": pd.DataFrame(bullet_rows),
        "backend_search_terms": pd.DataFrame(backend_rows),
    }


def build_markdown(
    frames: dict[str, pd.DataFrame],
    product_path: Path,
    needs_map_path: Path,
    demand_matrix_path: Path,
    parent_asin: str,
    item_highlight_count: int,
) -> str:
    lines = [
        "# Listing Copy Generator",
        "",
        f"- Product file: `{product_path}`",
        f"- Needs map: `{needs_map_path}`",
        f"- Demand matrix: `{demand_matrix_path}`",
        f"- Parent ASIN: `{parent_asin}`",
        f"- Item highlights per ASIN: `{item_highlight_count}`",
        "",
    ]
    for heading, key in [
        ("Title", "title"),
        ("Item Highlights", "item_highlights"),
        ("Bullet Points", "bullet_points"),
        ("Backend Search Terms", "backend_search_terms"),
    ]:
        lines.append(f"## {heading}")
        lines.append("")
        lines.append(frame_to_markdown(frames[key]))
        lines.append("")
    return "\n".join(lines)


def write_outputs(outdir: Path, frames: dict[str, pd.DataFrame], markdown_text: str, quality_report: dict) -> list[Path]:
    outdir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    mapping = {
        "title": "title.csv",
        "item_highlights": "item_highlights.csv",
        "bullet_points": "bullet_points.csv",
        "backend_search_terms": "backend_search_terms.csv",
    }
    for key, filename in mapping.items():
        path = outdir / filename
        frames[key].to_csv(path, index=False, encoding="utf-8-sig")
        paths.append(path)

    markdown_path = outdir / "listing_copy_generator.md"
    markdown_path.write_text(markdown_text, encoding="utf-8")
    paths.append(markdown_path)

    quality_path = outdir / "quality_report.json"
    quality_path.write_text(json.dumps(quality_report, ensure_ascii=False, indent=2), encoding="utf-8")
    paths.append(quality_path)
    return paths


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Amazon listing copy from product, VOC, and keyword-demand inputs.")
    parser.add_argument("--product", type=Path, required=True)
    parser.add_argument("--needs-map", type=Path, required=True)
    parser.add_argument("--demand-matrix", type=Path, required=True)
    parser.add_argument("--outdir", type=Path, required=True)
    parser.add_argument("--brand-name", default="")
    parser.add_argument("--parent-asin")
    parser.add_argument("--core-term")
    parser.add_argument("--item-highlight-count", type=int, default=1)
    parser.add_argument("--title-limit", type=int, default=TITLE_LIMIT_DEFAULT)
    parser.add_argument("--highlight-limit", type=int, default=HIGHLIGHT_LIMIT_DEFAULT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    df = pd.read_excel(args.product)
    asin_col = first_matching_column(df, COLUMN_ALIASES["asin"])
    parent_col = first_matching_column(df, COLUMN_ALIASES["parent_asin"])
    parent_asin = resolve_parent_asin(
        df=df,
        parent_asin_col=parent_col,
        asin_col=asin_col,
        candidate=args.parent_asin or extract_parent_asin(args.needs_map),
    )

    variants = load_variants(args.product, parent_asin)
    keyword_rows = pick_keyword_rows(args.demand_matrix)
    needs_records = pick_needs_map_records(args.needs_map)
    highlight_count = max(1, args.item_highlight_count)
    frames = build_output(
        variants=variants,
        keyword_rows=keyword_rows,
        needs_records=needs_records,
        brand_name=args.brand_name.strip(),
        title_limit=args.title_limit,
        highlight_limit=args.highlight_limit,
        item_highlight_count=highlight_count,
        explicit_core_term=args.core_term.strip() if args.core_term else None,
    )
    issues = run_quality_checks(frames, args.title_limit, args.highlight_limit, highlight_count)
    markdown = build_markdown(frames, args.product, args.needs_map, args.demand_matrix, parent_asin, highlight_count)
    quality_report = {
        "parent_asin": parent_asin,
        "variant_count": len(variants),
        "title_limit": args.title_limit,
        "highlight_limit": args.highlight_limit,
        "item_highlight_count": highlight_count,
        "issues": issues,
    }
    paths = write_outputs(args.outdir, frames, markdown, quality_report)
    print(json.dumps({"files": [str(path) for path in paths], "issues": issues}, ensure_ascii=False))


if __name__ == "__main__":
    main()
