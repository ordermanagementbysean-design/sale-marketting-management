/**
 * Operating total in cost modal & status report: cost entry count × operating cost per entry on the period.
 * Rounded to 2 decimals (aligned with Laravel round(..., 2)).
 */
export function operatingCostTotalDisplay(
  costEntryCount: number,
  operatingCostPerEntry: number
): number {
  const n = Math.max(0, Math.floor(Number(costEntryCount)) || 0);
  const per = Number(operatingCostPerEntry);
  const p = Number.isFinite(per) ? per : 0;
  return Math.round(n * p * 100) / 100;
}
