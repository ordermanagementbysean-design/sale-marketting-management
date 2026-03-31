import type { SalePeriodImportApiRow } from "../types";

/**
 * XLSX/CSV template for bulk sale-period import.
 *
 * - operating_cost: per cost-entry on the period (report total = this × number of cost entries).
 * - ads_run_cost: **total** ads amount for the period; split evenly across **ads_run_days** cost entries
 *   (each row in `product_sale_period_cost_entries.ads_run_cost`).
 * - ads_run_days: use 0 when ads_run_cost is 0; otherwise ≥ 1 (e.g. 4_000_000 and 2 → two entries of 2_000_000).
 */
export const SALE_PERIOD_IMPORT_CSV_HEADERS = [
  "product_code",
  "marketing_user",
  "start_at",
  "end_at",
  "forms_received",
  "real_orders",
  "purchase_cost",
  "selling_price",
  "shipping_cost",
  "fee_or_tax",
  "operating_cost",
  "ads_run_cost",
  "ads_run_days",
] as const;

export type SalePeriodImportCsvHeader = (typeof SALE_PERIOD_IMPORT_CSV_HEADERS)[number];

/** One logical row after parsing (before API). */
export interface SalePeriodImportRow {
  product_code: string;
  /** Marketing user’s name or email (resolved on the server). */
  marketing_user: string;
  start_at: string;
  end_at: string;
  forms_received: number;
  real_orders: number;
  purchase_cost: number;
  selling_price: number;
  shipping_cost: number;
  fee_or_tax: number;
  operating_cost: number;
  /** Total ads spend; split into `ads_run_days` cost entries. */
  ads_run_cost: number;
  ads_run_days: number;
}

export type SalePeriodImportParseResult =
  | { ok: true; rowIndex: number; row: SalePeriodImportRow }
  | { ok: false; rowIndex: number; errors: string[] };

/** Header line for CSV template downloads. */
export function salePeriodImportCsvHeaderLine(): string {
  return SALE_PERIOD_IMPORT_CSV_HEADERS.join(",");
}

/** Example CSV data row (no header). */
export const SALE_PERIOD_IMPORT_CSV_EXAMPLE_ROW =
  "BOM-TANG-AP,marketing@example.com,2025-03-23,2025-03-29,120,15,450000,890000,35000,6.5,0,4000000,2";

function trimCell(v: string | undefined): string {
  return (v ?? "").trim();
}

function parseNonNegativeInt(raw: string, field: string): number | string {
  if (raw === "") return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return `${field} must be a non-negative integer`;
  return n;
}

function parseNonNegativeNumber(raw: string, field: string): number | string {
  if (raw === "") return `${field} is required`;
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return `${field} must be a non-negative number`;
  return n;
}

function parseAdsTotal(raw: string): number | string {
  if (raw === "") return 0;
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return "ads_run_cost must be empty or a non-negative number";
  return n;
}

function isYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Map a record (keys = header names) to a validated row.
 */
export function parseSalePeriodImportRecord(
  rowIndex: number,
  record: Partial<Record<SalePeriodImportCsvHeader, string>>
): SalePeriodImportParseResult {
  const errors: string[] = [];

  const product_code = trimCell(record.product_code);
  if (!product_code) errors.push("product_code is required");

  const marketing_user = trimCell(record.marketing_user);
  if (!marketing_user) errors.push("marketing_user is required (name or email)");

  const start_at = trimCell(record.start_at);
  const end_at = trimCell(record.end_at);
  if (!start_at || !isYmd(start_at)) errors.push("start_at must be YYYY-MM-DD");
  if (!end_at || !isYmd(end_at)) errors.push("end_at must be YYYY-MM-DD");
  if (start_at && end_at && isYmd(start_at) && isYmd(end_at) && end_at < start_at) {
    errors.push("end_at must be on or after start_at");
  }

  const forms = parseNonNegativeInt(trimCell(String(record.forms_received ?? "")), "forms_received");
  if (typeof forms === "string") errors.push(forms);

  const orders = parseNonNegativeInt(trimCell(String(record.real_orders ?? "")), "real_orders");
  if (typeof orders === "string") errors.push(orders);

  const purchase = parseNonNegativeNumber(trimCell(String(record.purchase_cost ?? "")), "purchase_cost");
  if (typeof purchase === "string") errors.push(purchase);

  const selling = parseNonNegativeNumber(trimCell(String(record.selling_price ?? "")), "selling_price");
  if (typeof selling === "string") errors.push(selling);

  const ship = parseNonNegativeNumber(trimCell(String(record.shipping_cost ?? "")), "shipping_cost");
  if (typeof ship === "string") errors.push(ship);

  const fee = parseNonNegativeNumber(trimCell(String(record.fee_or_tax ?? "")), "fee_or_tax");
  if (typeof fee === "string") errors.push(fee);

  const opRaw = trimCell(String(record.operating_cost ?? ""));
  const op = opRaw === "" ? 0 : parseNonNegativeNumber(opRaw, "operating_cost");
  if (typeof op === "string") errors.push(op);

  const adsTotalRaw = trimCell(String(record.ads_run_cost ?? ""));
  const adsTotal = parseAdsTotal(adsTotalRaw);
  if (typeof adsTotal === "string") errors.push(adsTotal);

  const daysRaw = trimCell(String(record.ads_run_days ?? ""));
  let ads_run_days: number;
  if (typeof adsTotal === "number" && adsTotal > 0) {
    if (daysRaw === "") {
      errors.push("ads_run_days is required when ads_run_cost > 0");
      ads_run_days = 0;
    } else {
      const d = Number.parseInt(daysRaw, 10);
      if (!Number.isFinite(d) || d < 1) {
        errors.push("ads_run_days must be an integer ≥ 1 when ads_run_cost > 0");
        ads_run_days = 0;
      } else {
        ads_run_days = d;
      }
    }
  } else {
    if (daysRaw === "") {
      ads_run_days = 0;
    } else {
      const d = Number.parseInt(daysRaw, 10);
      if (!Number.isFinite(d) || d < 0) {
        errors.push("ads_run_days must be a non-negative integer");
        ads_run_days = 0;
      } else if (d > 0) {
        errors.push("ads_run_days must be 0 when ads_run_cost is 0");
        ads_run_days = 0;
      } else {
        ads_run_days = d;
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, rowIndex, errors };
  }

  return {
    ok: true,
    rowIndex,
    row: {
      product_code,
      marketing_user,
      start_at,
      end_at,
      forms_received: forms as number,
      real_orders: orders as number,
      purchase_cost: purchase as number,
      selling_price: selling as number,
      shipping_cost: ship as number,
      fee_or_tax: fee as number,
      operating_cost: op as number,
      ads_run_cost: adsTotal as number,
      ads_run_days,
    },
  };
}

/** Row shape for POST /api/sale-periods/import */
export function toSalePeriodImportApiRow(row: SalePeriodImportRow): SalePeriodImportApiRow {
  return {
    product_code: row.product_code,
    marketing_user: row.marketing_user,
    start_at: row.start_at,
    end_at: row.end_at,
    forms_received: row.forms_received,
    real_orders: row.real_orders,
    purchase_cost: row.purchase_cost,
    selling_price: row.selling_price,
    shipping_cost: row.shipping_cost,
    fee_or_tax: row.fee_or_tax,
    operating_cost: row.operating_cost,
    ads_run_cost: row.ads_run_cost,
    ads_run_days: row.ads_run_days,
  };
}
