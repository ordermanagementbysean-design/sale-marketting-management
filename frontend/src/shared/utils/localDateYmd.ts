/** Today's calendar date in local timezone as `YYYY-MM-DD` (for `<input type="date">`). */
export function localTodayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** True if `ymd` (YYYY-MM-DD) is strictly before today's local date. */
export function isYmdBeforeLocalToday(ymd: string): boolean {
  const a = ymd.slice(0, 10);
  return a < localTodayYmd();
}

function parseLocalYmd(ymd: string): Date {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Inclusive calendar-day count from `startYmd` through `endYmd` (both `YYYY-MM-DD`, local calendar). */
export function inclusiveDaysBetweenYmd(startYmd: string, endYmd: string): number {
  const s = parseLocalYmd(startYmd);
  const e = parseLocalYmd(endYmd);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
  if (diff < 0) return 0;
  return diff + 1;
}

/**
 * Whole calendar days completed after `startYmd` through `min(today, end)` (local dates).
 * Same calendar day as start → 0; the next calendar day → 1; etc. (no credit until that day is passed).
 * Before start → 0; after end → same count as at `end` (capped at period end).
 */
export function salePeriodDaysPastYmd(
  startYmd: string,
  endYmd: string,
  todayYmd: string = localTodayYmd()
): number {
  const start = startYmd.slice(0, 10);
  const end = endYmd.slice(0, 10);
  const today = todayYmd.slice(0, 10);
  if (today < start) return 0;
  const cap = today < end ? today : end;
  const s = parseLocalYmd(start);
  const c = parseLocalYmd(cap);
  if (Number.isNaN(s.getTime()) || Number.isNaN(c.getTime())) return 0;
  const diff = Math.round((c.getTime() - s.getTime()) / 86400000);
  return Math.max(0, diff);
}
