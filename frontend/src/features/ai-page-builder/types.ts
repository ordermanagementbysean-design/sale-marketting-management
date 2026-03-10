/** Field type for manual form inputs */
export type FieldType = "text" | "textarea" | "number" | "url" | "image" | "video";

/**
 * Single form field config for a section.
 * - required: true  → bắt buộc (validation, hiển thị dấu *)
 * - required: false hoặc undefined → optional (có thể để trống, dùng defaultValue)
 */
export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  /** Bắt buộc phải nhập (true) hay optional (false). Mặc định false. */
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
}

/**
 * Section definition: id, type, and which fields to show in manual mode.
 * - required: true  → section bắt buộc có trong page (ví dụ: hero, cta)
 * - required: false hoặc undefined → section optional (có thể ẩn/bỏ)
 */
export interface SectionConfig {
  id: string;
  type: string;
  layout?: "centered" | "two-column";
  label: string;
  /** Section có bắt buộc xuất hiện trên page không. Mặc định true cho hero/cta, false cho các block phụ. */
  required?: boolean;
  fields: FieldConfig[];
}

/** One of the 6 template types */
export type TemplateId =
  | "long_form_product"
  | "product_showcase"
  | "problem_solution"
  | "bundle_offer"
  | "viral_tiktok_product"
  | "flash_sale";

/** Full template config: id, name, structure list, section configs */
export interface TemplateConfig {
  id: TemplateId;
  name: string;
  structure: string[];
  sections: SectionConfig[];
}

/** Values entered by user (key-value per field key) */
export type FormValues = Record<string, string | number>;
