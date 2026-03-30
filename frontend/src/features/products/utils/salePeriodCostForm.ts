import type { CreateProductSalePeriodCostEntryPayload } from "../types";

/** Default CP vận hành when creating a new sale period (form initial value). */
export const DEFAULT_SALE_PERIOD_OPERATING_COST = "2000000";

export type AdsOnlyCostForm = { ads: string };

export function emptyAdsOnlyCostForm(): AdsOnlyCostForm {
  return { ads: "" };
}

function parseRequiredNonNegativeMoney(s: string): number | null {
  const t = s.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** True when no ads amount was entered (skip creating a cost entry). */
export function shouldSkipCostEntryAdsOnly(f: AdsOnlyCostForm): boolean {
  return f.ads.trim() === "";
}

/** Valid payload for POST cost entry (ads only), or null if ads is missing/invalid. */
export function buildAdsOnlyCostEntryPayload(
  adsRaw: string
): CreateProductSalePeriodCostEntryPayload | null {
  const ads = parseRequiredNonNegativeMoney(adsRaw);
  if (ads === null) return null;
  return { ads_run_cost: ads };
}
