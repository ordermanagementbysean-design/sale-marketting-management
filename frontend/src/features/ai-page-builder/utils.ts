import type { TemplateConfig, FormValues } from "./types";

/**
 * Chuẩn hóa chuỗi ngày trước khi tính countdown / ghi HTML.
 * "2026-4-20" -> "2026-04-20" để new Date() parse đúng (ISO: YYYY-MM-DD).
 */
export function normalizeDateForCountdown(dateStr: string): string {
  const s = String(dateStr ?? "").trim();
  const parts = s.split("-").filter(Boolean);
  if (parts.length !== 3) return s;
  const [y, m, d] = parts;
  const pad = (x: string) => (x.length >= 2 ? x : "0" + x);
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Chuẩn hóa chuỗi giờ trước khi tính countdown.
 * "9:59" -> "09:59" (HH:mm).
 */
export function normalizeTimeForCountdown(timeStr: string): string {
  const s = String(timeStr ?? "").trim();
  const parts = s.split(":").filter(Boolean);
  if (parts.length < 2) return s;
  const pad = (x: string) => (x.length >= 2 ? x : "0" + x);
  return `${pad(parts[0])}:${pad(parts[1])}`;
}

/**
 * Bản template không có defaultValue ở từng field (để gửi lên API, giảm token).
 */
export function templateWithoutDefaultValues(template: TemplateConfig): TemplateConfig {
  return {
    ...template,
    sections: template.sections.map((section) => ({
      ...section,
      fields: section.fields.map(({ defaultValue: _, ...field }) => field),
    })),
  };
}

/**
 * Giá trị dùng cho preview: field nào có defaultValue trong template thì dùng defaultValue,
 * còn lại dùng formValues (hoặc default từ template gốc).
 */
export function getEffectiveValuesForPreview(
  template: TemplateConfig,
  formValues: FormValues,
  baseDefaults: FormValues
): FormValues {
  const base = { ...baseDefaults, ...formValues };
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        base[field.key] = field.defaultValue;
      }
    }
  }
  return base;
}

/** Get default form values from template (all section fields) */
export function getDefaultFormValues(template: TemplateConfig): FormValues {
  const values: FormValues = {};
  for (const section of template.sections) {
    for (const field of section.fields) {
      if (field.defaultValue !== undefined) {
        values[field.key] = field.defaultValue;
      } else if (field.type === "text" || field.type === "textarea" || field.type === "url" || field.type === "image" || field.type === "video") {
        values[field.key] = "";
      } else if (field.type === "number") {
        values[field.key] = 0;
      }
    }
  }
  return values;
}
