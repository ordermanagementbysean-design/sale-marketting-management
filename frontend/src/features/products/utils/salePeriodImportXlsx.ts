import * as XLSX from "xlsx";
import {
  SALE_PERIOD_IMPORT_CSV_HEADERS,
  parseSalePeriodImportRecord,
  type SalePeriodImportCsvHeader,
  type SalePeriodImportParseResult,
  type SalePeriodImportRow,
} from "./salePeriodImportFormat";

function normalizeHeaderKey(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeCellForHeader(value: unknown, header: SalePeriodImportCsvHeader): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number") {
    if (header === "start_at" || header === "end_at") {
      const du = XLSX.SSF.parse_date_code(value);
      if (du) {
        return `${du.y}-${String(du.m).padStart(2, "0")}-${String(du.d).padStart(2, "0")}`;
      }
    }
    return String(value);
  }
  return String(value).trim();
}

export type ParsedSalePeriodImportSheet = {
  sheetErrors: string[];
  parseResults: SalePeriodImportParseResult[];
  validRows: SalePeriodImportRow[];
};

/**
 * Reads the first worksheet from an .xlsx buffer. Row 1 must contain column headers
 * matching {@link SALE_PERIOD_IMPORT_CSV_HEADERS} (order may differ; names are normalized).
 */
export function parseSalePeriodImportXlsx(arrayBuffer: ArrayBuffer): ParsedSalePeriodImportSheet {
  const sheetErrors: string[] = [];
  const parseResults: SalePeriodImportParseResult[] = [];
  const validRows: SalePeriodImportRow[] = [];

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
  const colByField = new Map<SalePeriodImportCsvHeader, number>();
  for (const h of SALE_PERIOD_IMPORT_CSV_HEADERS) {
    const idx = headerRow.indexOf(h);
    if (idx >= 0) {
      colByField.set(h, idx);
    }
  }

  const missing = SALE_PERIOD_IMPORT_CSV_HEADERS.filter((h) => !colByField.has(h));
  if (missing.length > 0) {
    sheetErrors.push(`Missing column(s): ${missing.join(", ")}`);
    return { sheetErrors, parseResults: [], validRows: [] };
  }

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const record: Partial<Record<SalePeriodImportCsvHeader, string>> = {};
    let anyCell = false;
    for (const h of SALE_PERIOD_IMPORT_CSV_HEADERS) {
      const col = colByField.get(h)!;
      const raw = line[col];
      const str = normalizeCellForHeader(raw, h);
      record[h] = str;
      if (str !== "") anyCell = true;
    }
    if (!anyCell) continue;

    const rowNumber = r + 1;
    const result = parseSalePeriodImportRecord(rowNumber, record);
    parseResults.push(result);
    if (result.ok) {
      validRows.push(result.row);
    }
  }

  return { sheetErrors, parseResults, validRows };
}
