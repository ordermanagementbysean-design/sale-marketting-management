/** Field type for manual form inputs */
export type FieldType = "text" | "textarea" | "number" | "url" | "image" | "video" | "image_list" | "string_list" | "object_list";

/**
 * Tuỳ chỉnh style cho output của field (HTML preview và optional form UI).
 * - className: Tailwind hoặc custom CSS class áp cho wrapper/element
 * - Các key còn lại map sang inline style (camelCase → kebab-case)
 */
export interface FieldStyle {
  /** CSS class (Tailwind hoặc custom) */
  className?: string;
  /** Inline: font-size */
  fontSize?: string;
  /** Inline: font-weight */
  fontWeight?: string;
  /** Inline: color */
  color?: string;
  /** Inline: text-align */
  textAlign?: "left" | "center" | "right";
  /** Inline: line-height */
  lineHeight?: string;
  /** Inline: letter-spacing */
  letterSpacing?: string;
  /** Các thuộc tính CSS khác (sẽ merge vào style) */
  [key: string]: string | undefined;
}

/**
 * Single form field config for a section.
 * - required: true  → bắt buộc (validation, hiển thị dấu *)
 * - required: false hoặc undefined → optional (có thể để trống, dùng defaultValue)
 * - style: tuỳ chỉnh hiển thị khi render HTML và có thể áp cho input form
 */
export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  /** Bắt buộc phải nhập (true) hay optional (false). Mặc định false. */
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  /**
   * Danh sách mặc định: string[] (image_list, string_list) hoặc Record<string, string>[] (object_list).
   * image_list/string_list: form default = values.join("\n").
   * object_list: form default = JSON.stringify(values).
   */
  values?: string[] | Record<string, string>[];
  /**
   * Nếu có: render dropdown (Select) thay vì text input.
   * Dùng cho "Cách hiển thị ảnh" (thumbnail | gallery | carousel) hoặc "Cách hiển thị" (grid).
   */
  options?: string[];
  /**
   * Cho type "object_list": tên các key trong mỗi phần tử (vd: ["icon", "title", "desc"]).
   * Value lưu dạng JSON array of objects.
   */
  listItemKeys?: string[];
  /** Tuỳ chỉnh style cho field (output HTML + form) */
  style?: FieldStyle;
}

/**
 * Layout/Settings theo bảng block:
 * - hero_section: textAlign (left|center), overlay (0-1)
 * - features_grid: columns, iconSize, featuresFieldKey (key field JSON array { icon, title, desc })
 * - product_viral: viralBulletsFieldKey (key field danh sách text, newline-separated)
 * - image_gallery: style (grid|slider), aspectRatio, layoutMaxWidth, sliderSlideMinWidth, imagesFieldKey, displayStyleFieldKey (key field chọn grid|slider, nếu có thì ưu tiên value form)
 * - review_list: layout, layoutFieldKey (key field chọn list|slider), showStars, layoutMaxWidth, sliderSlideMinWidth, reviewsFieldKey
 * - product_info: productInfoMediaStyle, productInfoImagesFieldKey (key field danh sách ảnh, mặc định product_gallery_images), layoutMaxWidth, layoutMediaWidth, layoutAspectRatio; ảnh lấy từ field có key = productInfoImagesFieldKey (values hoặc textarea) hoặc fallback product_thumbnail + product_image_1..4; khi carousel: carouselMode, carouselIndicators, carouselControls, carouselDuration, carouselEase
 * - accordion_faq/faq: expandFirst, style, faqItemsFieldKey (key field JSON array { q, a })
 * - order_form: buttonColor (hex), fields (array of strings)
 *
 * Layout dùng chung (template tuỳ chỉnh độ rộng/cao):
 * - layoutMaxWidth: class Tailwind (vd: max-w-5xl, max-w-4xl)
 * - layoutMediaWidth: class width cho khối ảnh (vd: w-full sm:w-72)
 * - layoutAspectRatio: "1/1" | "16/9" | "4/3"
 * - sliderSlideMinWidth: min-width mỗi slide (vd: 280px, 300px) khi dùng slider
 * - order_form: buttonColor, backgroundColor (section background, hex), fields?, inputBackgroundColor?, inputTextColor?, inputBorderColor?, buttonTextColor?
 */
export type SectionSettings = Record<string, string | number | boolean | string[]>;

/**
 * Section definition: id (Block ID), type, settings (layout), and which fields to show in manual mode.
 * - required: true  → section bắt buộc có trong page (ví dụ: hero, cta)
 * - required: false hoặc undefined → section optional (có thể ẩn/bỏ)
 */
export interface SectionConfig {
  id: string;
  type: string;
  layout?: "centered" | "two-column";
  /** Thuộc tính Layout/Settings theo từng loại block */
  settings?: SectionSettings;
  label: string;
  /** Section có bắt buộc xuất hiện trên page không. Mặc định true cho hero/cta, false cho các block phụ. */
  required?: boolean;
  fields: FieldConfig[];
}

/** Template id (từ template config; thêm file template mới thì id tự có, không cần sửa type). */
export type TemplateId = string;

/** Full template config: id, name, structure list, section configs */
export interface TemplateConfig {
  id: string;
  name: string;
  structure: string[];
  sections: SectionConfig[];
}

/** Values entered by user (key-value per field key) */
export type FormValues = Record<string, string | number>;
