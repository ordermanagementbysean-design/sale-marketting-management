import type { ProductImportApiRow } from "../types";

/**
 * XLSX template for bulk product import. Required: name, code, status.
 * Optional with same defaults as manual create when left blank: unit (cái), prices/VAT/weight 0, vat_code empty.
 *
 * - status: 0 = disabled, 1 = active (also accepts common synonyms client-side before API).
 */
export const PRODUCT_IMPORT_CSV_HEADERS = [
  "name",
  "code",
  "status",
  "unit",
  "purchase_price",
  "unit_price",
  "vat_percent",
  "vat_code",
  "weight_gram",
] as const;

export type ProductImportCsvHeader = (typeof PRODUCT_IMPORT_CSV_HEADERS)[number];

export interface ProductImportRow {
  name: string;
  code: string;
  status: 0 | 1;
  unit: string;
  purchase_price: number;
  unit_price: number;
  vat_percent: number;
  vat_code: string | null;
  weight_gram: number;
}

export type ProductImportParseResult =
  | { ok: true; rowIndex: number; row: ProductImportRow }
  | { ok: false; rowIndex: number; errors: string[] };

function trimCell(v: string | undefined): string {
  return (v ?? "").trim();
}

/**
 * Parse status from Excel cell: 0/1, or short labels (active/disabled).
 */
export function parseProductStatusCell(raw: string): 0 | 1 | string {
  const t = raw.trim().toLowerCase();
  if (t === "" || t === "status") return "status is required";
  if (t === "0" || t === "disabled" || t === "disable") return 0;
  if (t === "1" || t === "active" || t === "enabled" || t === "enable") return 1;
  const n = Number.parseInt(t, 10);
  if (n === 0 || n === 1) return n as 0 | 1;
  return "status must be 0 (disabled) or 1 (active)";
}

function parseNonNegativeNumber(raw: string, field: string): number | string {
  if (raw === "") return 0;
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return `${field} must be a non-negative number`;
  return n;
}

function parseVatPercent(raw: string): number | string {
  if (raw === "") return 0;
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 100) return "vat_percent must be between 0 and 100";
  return n;
}

function parseWeightGram(raw: string): number | string {
  if (raw === "") return 0;
  const n = Number.parseInt(raw.replace(/\s/g, "").replace(/,/g, ""), 10);
  if (!Number.isFinite(n) || n < 0) return "weight_gram must be a non-negative integer";
  return n;
}

/**
 * Map a record (keys = header names) to a validated row.
 */
export function parseProductImportRecord(
  rowIndex: number,
  record: Partial<Record<ProductImportCsvHeader, string>>
): ProductImportParseResult {
  const errors: string[] = [];

  const name = trimCell(record.name);
  if (!name) errors.push("name is required");
  if (name.length > 255) errors.push("name must be at most 255 characters");

  const code = trimCell(record.code);
  if (!code) errors.push("code is required");
  if (code.length > 100) errors.push("code must be at most 100 characters");

  const statusRaw = trimCell(String(record.status ?? ""));
  const statusParsed = parseProductStatusCell(statusRaw);
  if (typeof statusParsed === "string") {
    errors.push(statusParsed);
  }

  const unitRaw = trimCell(record.unit);
  const unit = unitRaw !== "" ? unitRaw : "cái";
  if (unit.length > 50) errors.push("unit must be at most 50 characters");

  const pp = parseNonNegativeNumber(trimCell(String(record.purchase_price ?? "")), "purchase_price");
  if (typeof pp === "string") errors.push(pp);

  const up = parseNonNegativeNumber(trimCell(String(record.unit_price ?? "")), "unit_price");
  if (typeof up === "string") errors.push(up);

  const vp = parseVatPercent(trimCell(String(record.vat_percent ?? "")));
  if (typeof vp === "string") errors.push(vp);

  const vatCodeRaw = trimCell(record.vat_code);
  if (vatCodeRaw.length > 50) errors.push("vat_code must be at most 50 characters");

  const wg = parseWeightGram(trimCell(String(record.weight_gram ?? "")));
  if (typeof wg === "string") errors.push(wg);

  if (errors.length > 0) {
    return { ok: false, rowIndex, errors };
  }

  return {
    ok: true,
    rowIndex,
    row: {
      name,
      code,
      status: statusParsed as 0 | 1,
      unit,
      purchase_price: pp as number,
      unit_price: up as number,
      vat_percent: vp as number,
      vat_code: vatCodeRaw !== "" ? vatCodeRaw : null,
      weight_gram: wg as number,
    },
  };
}

export function toProductImportApiRow(row: ProductImportRow): ProductImportApiRow {
  return {
    name: row.name,
    code: row.code,
    status: row.status,
    unit: row.unit,
    purchase_price: row.purchase_price,
    unit_price: row.unit_price,
    vat_percent: row.vat_percent,
    vat_code: row.vat_code,
    weight_gram: row.weight_gram,
  };
}
