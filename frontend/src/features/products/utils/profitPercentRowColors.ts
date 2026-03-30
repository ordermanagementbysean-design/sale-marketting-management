/** Frontend shape (camelCase). Source of truth is the API. */
export interface ProfitRowColorSettings {
  lowMaxPercent: number;
  reachMaxPercent: number;
  colors: {
    negative: string;
    low: string;
    reach: string;
    super: string;
  };
  labels: {
    negative: string;
    low: string;
    reach: string;
    super: string;
  };
}

/** Response / request body from GET/PUT `/api/sale-periods/profit-row-color-settings` (snake_case). */
export interface ProfitRowColorSettingsApi {
  low_max_percent: number;
  reach_max_percent: number;
  colors: {
    negative: string;
    low: string;
    reach: string;
    super: string;
  };
  labels: {
    negative: string;
    low: string;
    reach: string;
    super: string;
  };
}

export function profitRowColorSettingsFromApi(api: ProfitRowColorSettingsApi): ProfitRowColorSettings {
  return {
    lowMaxPercent: api.low_max_percent,
    reachMaxPercent: api.reach_max_percent,
    colors: { ...api.colors },
    labels: {
      negative: api.labels?.negative ?? "",
      low: api.labels?.low ?? "",
      reach: api.labels?.reach ?? "",
      super: api.labels?.super ?? "",
    },
  };
}

export function profitRowColorSettingsToApi(s: ProfitRowColorSettings): ProfitRowColorSettingsApi {
  return {
    low_max_percent: s.lowMaxPercent,
    reach_max_percent: s.reachMaxPercent,
    colors: { ...s.colors },
    labels: { ...s.labels },
  };
}

/**
 * Bands (same as row background):
 * ≤ 0 → negative; (0, lowMax] → low; (lowMax, reachMax] → reach; > reachMax → super.
 */
export function profitPercentRowBackground(
  profitToRevenuePercent: number | null,
  settings: ProfitRowColorSettings
): string | undefined {
  if (profitToRevenuePercent == null || Number.isNaN(profitToRevenuePercent)) {
    return undefined;
  }
  const { lowMaxPercent, reachMaxPercent, colors } = settings;
  if (profitToRevenuePercent <= 0) return colors.negative;
  if (profitToRevenuePercent <= lowMaxPercent) return colors.low;
  if (profitToRevenuePercent <= reachMaxPercent) return colors.reach;
  return colors.super;
}

/** Tooltip text for the profit band; same branching as {@link profitPercentRowBackground}. */
export function profitPercentBandTooltipText(
  profitToRevenuePercent: number | null,
  settings: ProfitRowColorSettings
): string | null {
  if (profitToRevenuePercent == null || Number.isNaN(profitToRevenuePercent)) {
    return null;
  }
  const { lowMaxPercent, reachMaxPercent, labels } = settings;
  if (profitToRevenuePercent <= 0) return labels.negative;
  if (profitToRevenuePercent <= lowMaxPercent) return labels.low;
  if (profitToRevenuePercent <= reachMaxPercent) return labels.reach;
  return labels.super;
}

export function validateProfitRowColorSettings(s: ProfitRowColorSettings): string | null {
  if (s.lowMaxPercent < 0 || !Number.isFinite(s.lowMaxPercent)) {
    return "lowMaxInvalid";
  }
  if (s.reachMaxPercent <= s.lowMaxPercent || !Number.isFinite(s.reachMaxPercent)) {
    return "reachMaxInvalid";
  }
  for (const hex of Object.values(s.colors)) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "colorInvalid";
  }
  for (const key of ["negative", "low", "reach", "super"] as const) {
    if (typeof s.labels[key] !== "string" || s.labels[key].trim().length === 0) {
      return "labelInvalid";
    }
  }
  return null;
}
