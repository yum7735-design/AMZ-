import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = process.env.LISTING_COPY_OUTPUT_DIR || path.resolve(__dirname, "..", "..", "outputs", "listing-copy-generator");
const outputName = process.env.LISTING_COPY_XLSX_NAME || "listing_copy_delivery.xlsx";
const fallbackName = process.env.LISTING_COPY_XLSX_FALLBACK_NAME || "listing_copy_delivery_updated.xlsx";
const outputPath = path.join(outputDir, outputName);
const fallbackOutputPath = path.join(outputDir, fallbackName);

const files = {
  title: path.join(outputDir, "title.csv"),
  itemHighlights: path.join(outputDir, "item_highlights.csv"),
  bulletPoints: path.join(outputDir, "bullet_points.csv"),
  backendSearchTerms: path.join(outputDir, "backend_search_terms.csv"),
  quality: path.join(outputDir, "quality_report.json"),
};

const workbook = Workbook.create();
const overview = workbook.worksheets.add("Overview");

function columnName(count) {
  let n = count;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function applyHeaderStyle(range) {
  range.format = {
    fill: "#8A4B2A",
    font: { bold: true, color: "#FFFFFF", name: "Aptos" },
    wrapText: true,
    verticalAlignment: "center",
    horizontalAlignment: "center",
    borders: { preset: "outside", style: "thin", color: "#CDAE92" },
  };
}

function applyBodyBorders(range) {
  range.format.borders = { preset: "all", style: "thin", color: "#E7D8C8" };
}

async function importCsvSheet(sheetName, csvPath) {
  const csvText = await fs.readFile(csvPath, "utf8");
  const importedWorkbook = await Workbook.fromCSV(csvText, { sheetName });
  const importedSheet = importedWorkbook.worksheets.getItem(sheetName);
  const used = importedSheet.getUsedRange();

  const targetSheet = workbook.worksheets.add(sheetName);
  if (used.rowCount > 0 && used.columnCount > 0) {
    targetSheet.getRange(`A1:${columnName(used.columnCount)}${used.rowCount}`).values = used.values;
  }
  return targetSheet;
}

function styleImportedSheet(sheet, widths = {}) {
  const used = sheet.getUsedRange();
  used.format.font = { name: "Aptos", size: 10, color: "#1F2328" };
  used.format.verticalAlignment = "top";
  used.format.wrapText = true;

  applyHeaderStyle(sheet.getRange(`A1:${columnName(used.columnCount)}1`));
  if (used.rowCount > 1) {
    applyBodyBorders(sheet.getRange(`A2:${columnName(used.columnCount)}${used.rowCount}`));
  }

  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  used.format.autofitColumns();
  used.format.autofitRows();

  for (const [col, width] of Object.entries(widths)) {
    sheet.getRange(`${col}:${col}`).format.columnWidth = width;
  }
}

async function buildOverview() {
  const quality = JSON.parse(await fs.readFile(files.quality, "utf8"));

  overview.getRange("A1:H1").merge();
  overview.getRange("A1").values = [["Listing Copy Delivery"]];
  overview.getRange("A1:H1").format = {
    fill: "#F1E0CF",
    font: { bold: true, size: 16, color: "#4A2A19", name: "Aptos Display" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };

  overview.getRange("A3:B8").values = [
    ["Parent ASIN", quality.parent_asin],
    ["Variant Count", quality.variant_count],
    ["Title Limit", quality.title_limit],
    ["Highlight Limit", quality.highlight_limit],
    ["Highlights / ASIN", quality.item_highlight_count ?? ""],
    ["Quality Issues", quality.issues.length ? quality.issues.join("; ") : "None"],
  ];
  overview.getRange("A3:A8").format = {
    fill: "#FAF3EB",
    font: { bold: true, color: "#4A2A19" },
  };
  applyBodyBorders(overview.getRange("A3:B8"));

  overview.getRange("D3:G8").values = [
    ["Sheet", "Purpose", "Source", "Notes"],
    ["Title", "Amazon title output", "title.csv", "Primary title table."],
    ["Item Highlights", "Short listing highlights", "item_highlights.csv", "Count should match the requested per-ASIN setting."],
    ["Bullet Points", "Five bullets per ASIN", "bullet_points.csv", "Evidence-driven benefit copy."],
    ["Backend Terms", "Supplemental search terms", "backend_search_terms.csv", "Backfill uncovered keywords."],
    ["Quality Check", "Validation summary", "quality_report.json", "QA result and limits used."],
  ];
  applyHeaderStyle(overview.getRange("D3:G3"));
  applyBodyBorders(overview.getRange("D4:G8"));

  overview.showGridLines = false;
  overview.freezePanes.freezeRows(2);
  overview.getRange("A:H").format.columnWidth = 18;
  overview.getRange("E:E").format.columnWidth = 28;
  overview.getRange("G:G").format.columnWidth = 36;
}

await buildOverview();

const titleSheet = await importCsvSheet("Title", files.title);
const itemHighlightsSheet = await importCsvSheet("Item Highlights", files.itemHighlights);
const bulletPointsSheet = await importCsvSheet("Bullet Points", files.bulletPoints);
const backendSheet = await importCsvSheet("Backend Terms", files.backendSearchTerms);

const qualitySheet = workbook.worksheets.add("Quality Check");
const quality = JSON.parse(await fs.readFile(files.quality, "utf8"));
qualitySheet.getRange("A1:B6").values = [
  ["Check", "Result"],
  ["Parent ASIN", quality.parent_asin],
  ["Variant Count", quality.variant_count],
  ["Highlights / ASIN", quality.item_highlight_count ?? ""],
  ["Rule Issues", quality.issues.length ? quality.issues.join("; ") : "None"],
  ["Status", quality.issues.length ? "Needs Review" : "Pass"],
];
applyHeaderStyle(qualitySheet.getRange("A1:B1"));
applyBodyBorders(qualitySheet.getRange("A2:B6"));
qualitySheet.showGridLines = false;
qualitySheet.freezePanes.freezeRows(1);
qualitySheet.getRange("A:A").format.columnWidth = 20;
qualitySheet.getRange("B:B").format.columnWidth = 36;

styleImportedSheet(titleSheet, { A: 16, B: 44, C: 14, D: 34 });
styleImportedSheet(itemHighlightsSheet, { A: 16, B: 54, C: 14, D: 28, E: 36 });
styleImportedSheet(bulletPointsSheet, { A: 16, B: 42, C: 42, D: 42, E: 42, F: 42 });
styleImportedSheet(backendSheet, { A: 16, B: 70, C: 14 });

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);

let savedPath = outputPath;
try {
  await output.save(outputPath);
} catch (error) {
  if (error && error.code === "EBUSY") {
    savedPath = fallbackOutputPath;
    await output.save(savedPath);
  } else {
    throw error;
  }
}

console.log(JSON.stringify({ outputPath: savedPath }));
