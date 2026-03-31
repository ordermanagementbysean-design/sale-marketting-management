import * as XLSX from "xlsx";
import {
  PRODUCT_IMPORT_CSV_HEADERS,
  parseProductImportRecord,
  type ProductImportCsvHeader,
  type ProductImportParseResult,
  type ProductImportRow,
} from "./productImportFormat";

function normalizeHeaderKey(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeCellForStatus(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "number") {
    if (value === 0 || value === 1) return String(value);
    return String(value);
  }
  return String(value).trim();
}

/** Numbers from Excel or typed strings (commas as thousands). */
function normalizeCellNumeric(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return String(value).trim();
}

function normalizeCell(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value).trim();
}

function cellStringForField(h: ProductImportCsvHeader, raw: unknown): string {
  if (h === "status") return normalizeCellForStatus(raw);
  if (
    h === "purchase_price" ||
    h === "unit_price" ||
    h === "vat_percent" ||
    h === "weight_gram"
  ) {
    return normalizeCellNumeric(raw);
  }
  return normalizeCell(raw);
}

export type ParsedProductImportSheet = {
  sheetErrors: string[];
  parseResults: ProductImportParseResult[];
  validRows: ProductImportRow[];
};

/**
 * Reads the first worksheet from an .xlsx buffer. Row 1 must contain column headers
 * matching {@link PRODUCT_IMPORT_CSV_HEADERS} (order may differ; names are normalized).
 */
export function parseProductImportXlsx(arrayBuffer: ArrayBuffer): ParsedProductImportSheet {
  const sheetErrors: string[] = [];
  const parseResults: ProductImportParseResult[] = [];
  const validRows: ProductImportRow[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  } catch {
    return { sheetErrors: ["Could not read the Excel file."], parseResults: [], validRows: [] };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { sheetErrors: ["The workbook has no sheets."], parseResults: [], validRows: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as unknown[][];

  if (!matrix.length) {
    return { sheetErrors: ["The sheet is empty."], parseResults: [], validRows: [] };
  }

  const headerRow = matrix[0].map((c) => normalizeHeaderKey(c));
  const colByField = new Map<ProductImportCsvHeader, number>();
  for (const h of PRODUCT_IMPORT_CSV_HEADERS) {
    const idx = headerRow.indexOf(h);
    if (idx >= 0) {
      colByField.set(h, idx);
    }
  }

  const missing = PRODUCT_IMPORT_CSV_HEADERS.filter((h) => !colByField.has(h));
  if (missing.length > 0) {
    sheetErrors.push(`Missing column(s): ${missing.join(", ")}`);
    return { sheetErrors, parseResults: [], validRows: [] };
  }

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const record: Partial<Record<ProductImportCsvHeader, string>> = {};
    let anyCell = false;
    for (const h of PRODUCT_IMPORT_CSV_HEADERS) {
      const col = colByField.get(h)!;
      const raw = line[col];
      const str = cellStringForField(h, raw);
      record[h] = str;
      if (str !== "") anyCell = true;
    }
    if (!anyCell) continue;

    const rowNumber = r + 1;
    const result = parseProductImportRecord(rowNumber, record);
    parseResults.push(result);
    if (result.ok) {
      validRows.push(result.row);
    }
  }

  return { sheetErrors, parseResults, validRows };
}
