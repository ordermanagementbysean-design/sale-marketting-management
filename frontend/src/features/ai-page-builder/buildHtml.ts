import type { TemplateConfig, FieldStyle } from "./types";
import type { FormValues } from "./types";
import { normalizeDateForCountdown, normalizeTimeForCountdown } from "./utils";

const INLINE_STYLE_KEYS: Record<string, string> = {
  fontSize: "font-size",
  fontWeight: "font-weight",
  color: "color",
  textAlign: "text-align",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
};

function getFieldStyleAttrs(
  section: TemplateConfig["sections"][0],
  fieldKey: string
): { className: string; styleAttr: string } {
  const field = section.fields.find((f) => f.key === fieldKey);
  const style = field?.style as FieldStyle | undefined;
  if (!style || typeof style !== "object") return { className: "", styleAttr: "" };
  const className = (style.className ?? "").trim();
  const parts: string[] = [];
  for (const [k, v] of Object.entries(style)) {
    if (k === "className" || v === undefined || v === "") continue;
    const cssKey = INLINE_STYLE_KEYS[k] ?? k.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
    parts.push(`${cssKey}:${String(v).trim()}`);
  }
  return { className, styleAttr: parts.join("; ") };
}

/** Bọc nội dung với class + style của field (nếu có). */
function wrapWithFieldStyle(
  innerHtml: string,
  section: TemplateConfig["sections"][0],
  fieldKey: string
): string {
  const { className, styleAttr } = getFieldStyleAttrs(section, fieldKey);
  if (!className && !styleAttr) return innerHtml;
  const classAttr = className ? ` class="${escapeHtml(className)}"` : "";
  const styleAttrStr = styleAttr ? ` style="${escapeHtml(styleAttr)}"` : "";
  return `<span${classAttr}${styleAttrStr}>${innerHtml}</span>`;
}

/** Tailwind v4 Play CDN — script processes document and applies utility styles. */
const TAILWIND_CDN =
  "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";

function getVal(values: FormValues, key: string): string {
  const v = values[key];
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

/**
 * Parse chuỗi nhiều URL (cách nhau bằng dấu phẩy hoặc xuống dòng) thành mảng.
 * Dùng cho product_gallery_images, gallery_images, before_after_images, ...
 */
function parseImagesList(value: string): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parse JSON array of objects; trả về [] nếu invalid. */
function parseJsonList<T = Record<string, string>>(value: string): T[] {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Map aspect ratio string (1/1, 16/9, 4/3) sang Tailwind class */
function getAspectRatioClass(ratio: string): string {
  if (ratio === "16/9") return "aspect-video";
  if (ratio === "4/3") return "aspect-[4/3]";
  return "aspect-square";
}

/**
 * Layout dimensions từ section.settings — template quyết định độ rộng/cao.
 * Settings: layoutMaxWidth, layoutMediaWidth, layoutAspectRatio (hoặc aspectRatio).
 */
function getLayoutSettings(section: TemplateConfig["sections"][0]): {
  maxWidth: string;
  mediaWidth: string;
  aspectRatio: string;
  aspectClass: string;
} {
  const maxWidth = (section.settings?.layoutMaxWidth as string) || "max-w-5xl";
  const mediaWidth = (section.settings?.layoutMediaWidth as string) || "w-full sm:w-72";
  const aspectRatio = (section.settings?.layoutAspectRatio as string) || (section.settings?.aspectRatio as string) || "1/1";
  return { maxWidth, mediaWidth, aspectRatio, aspectClass: getAspectRatioClass(aspectRatio) };
}

export interface SliderOptions {
  /** Class cho wrapper ngoài (vd: overflow-hidden rounded-xl shadow-lg) */
  wrapperClass?: string;
  /** Tailwind aspect class (aspect-square, aspect-video, ...) — bỏ qua nếu không cần tỉ lệ cố định */
  aspectClass?: string;
  /** true = mỗi slide full width (1 slide 1 viewport); false = card slider */
  slideFullWidth?: boolean;
  /** Khi slideFullWidth false: min-width mỗi slide (vd: min-w-[280px], min-w-[300px]) */
  slideMinWidth?: string;
  /** Gap giữa các slide (vd: gap-4, gap-6) */
  gap?: string;
}

/**
 * Tuỳ chỉnh carousel theo Flowbite: https://flowbite.com/docs/components/carousel/
 * - mode: "slide" = tự động cycle, "static" = chỉ đổi khi bấm
 * - indicators: hiển thị chấm tròn dưới
 * - controls: hiển thị nút Prev/Next
 * - duration / ease: animation (duration-700 ease-in-out, duration-200 ease-linear, ...)
 */
export interface FlowbiteCarouselOptions {
  /** data-carousel: "slide" | "static" */
  mode?: "slide" | "static";
  /** Hiển thị indicators (dots) */
  indicators?: boolean;
  /** Hiển thị nút Prev/Next */
  controls?: boolean;
  /** Tailwind duration class (vd: "700", "200") */
  duration?: string;
  /** Tailwind ease class (vd: "ease-in-out", "ease-linear") */
  ease?: string;
  /** Aspect class cho wrapper (aspect-square, aspect-video, ...) */
  aspectClass?: string;
  /** Class width wrapper ngoài (vd: w-full sm:w-72) */
  mediaWidth?: string;
}

const FLOWBITE_CDN = "https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.js";

/** SVG mũi tên trái cho nút Prev (Flowbite carousel) */
const CAROUSEL_PREV_SVG =
  '<svg class="w-5 h-5 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 19-7-7 7-7"/></svg>';
/** SVG mũi tên phải cho nút Next */
const CAROUSEL_NEXT_SVG =
  '<svg class="w-5 h-5 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg>';

/**
 * Tạo HTML carousel theo Flowbite (data-carousel, data-carousel-item, data-carousel-prev/next, data-carousel-slide-to).
 * Cần load Flowbite JS để carousel hoạt động.
 */
export function buildFlowbiteCarouselHtml(
  carouselId: string,
  imageUrls: string[],
  altText: string,
  options: FlowbiteCarouselOptions = {}
): string {
  if (imageUrls.length === 0) return "";
  const {
    mode = "slide",
    indicators = true,
    controls = true,
    duration = "700",
    ease = "ease-in-out",
    aspectClass = "aspect-square",
    mediaWidth = "w-full",
  } = options;
  const durationClass = `duration-${duration}`;
  const itemClass = `absolute inset-0 hidden ${durationClass} ${ease}`.trim();
  const itemsHtml = imageUrls
    .map(
      (src, i) =>
        `<div class="${itemClass}" data-carousel-item${i === 0 ? '="active"' : ""}>
          <img src="${escapeHtml(src)}" alt="${escapeHtml(altText)}" class="absolute block w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
        </div>`
    )
    .join("\n    ");
  const indicatorsHtml =
    indicators && imageUrls.length > 1
      ? `<div class="absolute z-30 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3 rtl:space-x-reverse">
    ${imageUrls
      .map(
        (_, i) =>
          `<button type="button" class="w-3 h-3 rounded-full bg-white/50 hover:bg-white focus:bg-white focus:outline-none" aria-label="Slide ${i + 1}" data-carousel-slide-to="${i}"${i === 0 ? ' aria-current="true"' : ""}></button>`
      )
      .join("\n    ")}
  </div>`
      : "";
  const controlsHtml =
    controls && imageUrls.length > 1
      ? `
  <button type="button" class="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev>
    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 group-hover:bg-white/50 group-focus:ring-4 group-focus:ring-white group-focus:outline-none">${CAROUSEL_PREV_SVG}<span class="sr-only">Previous</span></span>
  </button>
  <button type="button" class="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next>
    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 group-hover:bg-white/50 group-focus:ring-4 group-focus:ring-white group-focus:outline-none">${CAROUSEL_NEXT_SVG}<span class="sr-only">Next</span></span>
  </button>`
      : "";
  return `<div class="flex-shrink-0 ${mediaWidth}">
  <div id="${escapeHtml(carouselId)}" class="relative w-full" data-carousel="${mode}">
    <div class="relative overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 ${aspectClass}">
    ${itemsHtml}
    </div>
    ${indicatorsHtml}
    ${controlsHtml}
  </div>
</div>`;
}

/**
 * Generate HTML cho slider dùng chung (overflow-x, snap).
 * @param slides Mảng HTML string của từng slide
 * @param options Tuỳ chỉnh wrapper, tỉ lệ, kích thước slide
 */
export function buildSliderHtml(slides: string[], options: SliderOptions = {}): string {
  if (slides.length === 0) return "";
  const {
    wrapperClass = "",
    aspectClass = "",
    slideFullWidth = true,
    slideMinWidth = "min-w-[280px]",
    gap = "",
  } = options;
  const trackClass = `flex overflow-x-auto snap-x snap-mandatory ${aspectClass} ${gap}`.trim();
  const slideClass = slideFullWidth
    ? "min-w-full flex-shrink-0 snap-center"
    : `${slideMinWidth} snap-center flex-shrink-0`;
  const slideHtml = slides.map((s) => `<div class="${slideClass}">${s}</div>`).join("");
  const inner = `<div class="${trackClass}">${slideHtml}</div>`;
  return wrapperClass ? `<div class="${wrapperClass}">${inner}</div>` : inner;
}

/** Star path for SVG (no fill - we set it per use) */
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
/** Yellow (filled), white/light gray (chưa rating) - dễ phân biệt */
const STAR_FILL = "#eab308";
const STAR_EMPTY = "#e5e7eb";

function singleStarSvg(fill: string, size = "1.25rem"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}" width="${size}" height="${size}" style="display:block;vertical-align:middle;"><path d="${STAR_PATH}"/></svg>`;
}

/** Wrapper cố định cho mỗi ô sao — đồng bộ với half-star, tránh Tailwind/SVG lệch dòng. */
function starCellWrapper(innerHtml: string, size = "1.25rem"): string {
  return `<span style="display:flex;align-items:center;justify-content:center;width:${size};height:${size};min-width:${size};max-width:${size};flex-shrink:0;box-sizing:border-box;">${innerHtml}</span>`;
}

/**
 * Rule: phần lẻ >= 0.5 thì tô 1/2 sao. VD: 4.7 → 4 full + 1/2; 2.4 → 2 full, không nửa sao.
 */
function getStarCounts(value: number): { full: number; half: boolean } {
  const v = Math.min(5, Math.max(0, Number(value) || 0));
  const full = Math.floor(v);
  const half = (v % 1) >= 0.5;
  return { full, half };
}

/**
 * Build 5 sao (full/half/empty) — dùng chung cho tổng và từng user.
 * Rule: phần lẻ >= 0.5 → 1 nửa sao. VD 4.9 → 4 vàng, 1 nửa, 0 trắng.
 */
function buildFiveStarsHtml(rating: number, starSize = "1.25rem"): string {
  const value = Math.min(5, Math.max(0, Number(rating) || 0));
  const { full, half } = getStarCounts(value);
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push(starCellWrapper(singleStarSvg(STAR_FILL, starSize), starSize));
    else if (i === full && half) stars.push(starCellWrapper(halfStarInnerHtml(starSize), starSize));
    else stars.push(starCellWrapper(singleStarSvg(STAR_EMPTY, starSize), starSize));
  }
  return `<span style="display:inline-flex;gap:0.125rem;align-items:center;flex-shrink:0;flex-wrap:nowrap;min-width:min-content;">${stars.join("")}</span>`;
}

/** Rating tổng: label + cùng cách hiển thị 5 sao như từng user. */
function buildStarRatingHtml(rating: number, label: string): string {
  return `
    <div class="flex items-center justify-center gap-2 mb-6" style="flex-wrap:nowrap;">
      <span class="font-bold text-gray-800" style="flex-shrink:0;">${escapeHtml(label)}</span>
      ${buildFiveStarsHtml(rating)}
    </div>`;
}

/**
 * Nội dung 1 ô nửa sao (vàng trái, trắng phải). Được bọc bởi starCellWrapper như các sao khác.
 */
function halfStarInnerHtml(size = "1.25rem"): string {
  const starYellow = singleStarSvg(STAR_FILL, size);
  const starWhite = singleStarSvg(STAR_EMPTY, size);
  return `<span style="position:relative;display:block;width:100%;height:100%;"><span style="position:absolute;inset:0;">${starWhite}</span><span style="position:absolute;left:0;top:0;overflow:hidden;width:50%;height:100%;">${starYellow}</span></span>`;
}

/** Rating từng user: dùng chung buildFiveStarsHtml, bọc trong 1 dòng không rớt. */
function buildStarRatingOnlyHtml(rating: number): string {
  return buildFiveStarsHtml(rating);
}

function getSetting<T>(section: TemplateConfig["sections"][0], key: string, fallback: T): T {
  const v = section.settings?.[key];
  if (v === undefined || v === null) return fallback;
  return v as T;
}

/** Build one section's HTML by type and layout (Block ID + Type theo bảng thông số) */
function buildSectionHtml(
  section: TemplateConfig["sections"][0],
  values: FormValues
): string {
  const id = section.id;
  const type = section.type;
  const layout = section.layout ?? "centered";
  const comment = `<!-- SECTION: ${type} (id: ${id}) -->`;

  const headingKeys = section.fields.filter((f) => f.key.endsWith("_heading"));
  const headingKey = headingKeys[0]?.key ?? "";
  const getHeading = () => (headingKey ? getVal(values, headingKey) : "");
  const heading = getHeading();
  const headingHtml = heading ? (headingKey ? wrapWithFieldStyle(escapeHtml(heading), section, headingKey) : escapeHtml(heading)) : "";

  const block = (content: string, className = "") =>
    `<div class="section-${type} ${className}" data-section-id="${id}">${content}</div>`;

  switch (type) {
    case "hero_section":
    case "hero": {
      const textAlign = getSetting(section, "textAlign", layout === "two-column" ? "left" : "center") as string;
      const overlay = Math.min(1, Math.max(0, Number(getSetting(section, "overlay", 0.5))));
      const title = getVal(values, "hero_title") || getVal(values, "hero_heading") || getVal(values, "product_name");
      const subtitle = getVal(values, "hero_subtitle") || getVal(values, "hero_text") || getVal(values, "product_description");
      const ctaText = getVal(values, "hero_ctaText") || getVal(values, "hero_button_text");
      const heroCtaLink = getVal(values, "hero_ctaLink");
      const bgImage = getVal(values, "hero_bgImage") || getVal(values, "hero_image") || getVal(values, "product_thumbnail");
      const video = getVal(values, "hero_video");
      const isLeft = textAlign === "left";
      const bgStyle = bgImage
        ? `background-image:url(${escapeHtml(bgImage)});background-size:cover;background-position:center;`
        : "";
      const overlayStyle = `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay}))`;
      const mediaHtml = video
        ? `<video class="w-full max-w-md rounded-lg shadow-xl" controls src="${escapeHtml(video)}"></video>`
        : bgImage
          ? ""
          : "";
      const titleHtml = wrapWithFieldStyle(escapeHtml(title) || "Headline", section, "hero_title");
      const subtitleHtml = subtitle ? wrapWithFieldStyle(escapeHtml(subtitle), section, "hero_subtitle") : "";
      const ctaHtml = ctaText ? wrapWithFieldStyle(escapeHtml(ctaText), section, "hero_ctaText") : "";
      const heroVariant = getSetting(section, "heroVariant", "") as string;
      const isHotTrendHero = heroVariant === "hot_trend";
      const ctaClass = isHotTrendHero
        ? "inline-block mt-8 bg-red-500 hover:bg-red-600 px-8 py-4 rounded-lg text-lg font-semibold"
        : "inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700";
      const heroCtaEl = ctaText
        ? heroCtaLink
          ? `<a href="${escapeHtml(heroCtaLink)}" class="${ctaClass} text-white">${ctaHtml}</a>`
          : `<span class="${ctaClass} text-white cursor-default">${ctaHtml}</span>`
        : "";
      const innerContent = `
        <h1 class="text-4xl md:text-5xl font-bold mb-4 ${isHotTrendHero ? "text-white" : "text-gray-900"}">${titleHtml}</h1>
        ${subtitle ? `<p class="text-xl mb-6 ${isHotTrendHero ? "opacity-90 text-white" : "text-gray-600"}">${subtitleHtml}</p>` : ""}
        ${heroCtaEl}`;
      const content = isHotTrendHero && !bgImage
        ? `
        <div class="bg-gradient-to-r from-black to-gray-800 text-white py-24">
          <div class="max-w-6xl mx-auto px-6 text-center">
            ${innerContent}
          </div>
        </div>`
        : bgImage
        ? `
        <div class="relative min-h-[24rem] flex items-center px-4 py-16" style="${bgStyle}">
          <div class="absolute inset-0" style="background:${overlayStyle};"></div>
          <div class="container mx-auto relative z-10 flex flex-wrap items-center gap-12">
            <div class="${isLeft ? "text-left" : "text-center w-full"} max-w-2xl ${isLeft ? "" : "mx-auto"} text-white">
              ${innerContent.replace(/text-gray-900/g, "text-white").replace(/text-gray-600/g, "text-gray-200")}
            </div>
            ${video ? `<div class="flex-1 min-w-[280px]">${mediaHtml}</div>` : ""}
          </div>
        </div>`
        : `
        <div class="container mx-auto px-4 py-16 ${isLeft ? "text-left" : "text-center"}">
          ${layout === "two-column" && mediaHtml ? `<div class="flex flex-wrap items-center gap-12"><div class="flex-1 min-w-[280px]">${mediaHtml}</div><div class="flex-1 min-w-[280px]">${innerContent}</div></div>` : layout === "two-column" && !mediaHtml ? `<div class="flex flex-wrap items-center gap-12"><div class="flex-1">${innerContent}</div></div>` : innerContent}
        </div>`;
      return comment + block(content, bgImage || isHotTrendHero ? "" : "bg-gray-50");
    }

    case "product_viral": {
      const viralImageFieldKey = (getSetting(section, "viralImageFieldKey", "") as string) || "viral_image";
      const viralImage = getVal(values, viralImageFieldKey) || getVal(values, "viral_product_image");
      const viralHeading = getVal(values, "viral_heading");
      const viralBulletsFieldKey = (getSetting(section, "viralBulletsFieldKey", "") as string) || "";
      const bullets = viralBulletsFieldKey ? parseImagesList(getVal(values, viralBulletsFieldKey)) : [];
      const price = getVal(values, "viral_price");
      const viralCta = getVal(values, "viral_ctaText");
      const viralCtaLink = getVal(values, "viral_ctaLink");
      const viralCtaEl = viralCta
        ? viralCtaLink
          ? `<a href="${escapeHtml(viralCtaLink)}" class="inline-block mt-8 bg-red-500 hover:bg-red-600 px-8 py-4 rounded-xl text-white font-semibold text-base shadow-lg shadow-red-500/25 transition">${escapeHtml(viralCta)}</a>`
          : `<span class="inline-block mt-8 bg-red-500 px-8 py-4 rounded-xl text-white font-semibold text-base shadow-lg shadow-red-500/25 cursor-default">${escapeHtml(viralCta)}</span>`
        : "";
      const bulletsHtml = bullets.length
        ? `<div class="space-y-4 mt-6"><p class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Điểm nổi bật</p><ul class="space-y-3">${bullets.map((t) => `<li class="flex items-center gap-3 text-gray-800"><span class="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">✓</span><span class="text-base">${escapeHtml(t)}</span></li>`).join("")}</ul></div>`
        : "";
      const priceHtml = price ? `<div class="mt-8 inline-block px-5 py-3 bg-red-50 border border-red-200 rounded-xl"><span class="text-2xl md:text-3xl font-bold text-red-600">${escapeHtml(price)}</span></div>` : "";
      const viralImagePlaceholder = `<div class="rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 w-full aspect-square flex items-center justify-center" style="background:#374151"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" class="w-1/2 h-1/2 opacity-60" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"><path d="M20 60 L20 35 L45 15 L70 35 L70 60 Z"/><path d="M55 25 L55 15 L70 25 L70 35 Z"/><circle cx="85" cy="22" r="8"/></svg></div>`;
      const viralMediaHtml = viralImage
        ? `<div class="rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5"><img class="w-full aspect-square object-cover" src="${escapeHtml(viralImage)}" alt="" /></div>`
        : viralImagePlaceholder;
      const content = `
        <div class="max-w-6xl mx-auto px-6 py-16 md:py-20 bg-gray-50/80">
          <div class="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            ${viralMediaHtml}
            <div class="md:py-2">
              ${viralHeading ? `<h2 class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">${escapeHtml(viralHeading)}</h2>` : ""}
              ${bulletsHtml}
              ${priceHtml}
              ${viralCtaEl}
            </div>
          </div>
        </div>`;
      return comment + block(content);
    }

    case "product_info": {
      const layout = getLayoutSettings(section);
      const productName = getVal(values, "product_name");
      const productDescription = getVal(values, "product_description");
      const productThumbnail = getVal(values, "product_thumbnail");
      const nameHtml = productName ? wrapWithFieldStyle(escapeHtml(productName), section, "product_name") : "";
      const descHtml = productDescription ? wrapWithFieldStyle(escapeHtml(productDescription).replace(/\n/g, "<br/>"), section, "product_description") : "";
      const mediaStyleRaw = getVal(values, "product_info_media_style") || (getSetting(section, "productInfoMediaStyle", "thumbnail") as string) || "thumbnail";
      const mediaStyle = (["thumbnail", "gallery", "slider", "carousel"].includes(mediaStyleRaw) ? mediaStyleRaw : "thumbnail") as "thumbnail" | "gallery" | "slider" | "carousel";
      const productImagesFieldKey = (getSetting(section, "productInfoImagesFieldKey", "product_gallery_images") as string) || "product_gallery_images";
      const galleryImages = parseImagesList(getVal(values, productImagesFieldKey));
      const firstImage = productThumbnail || galleryImages[0] || "";
      const useSingleImage = mediaStyle === "thumbnail" || (mediaStyle !== "carousel" && galleryImages.length <= 1) || (mediaStyle === "carousel" && galleryImages.length < 1);
      const altText = escapeHtml(productName) || "Product";
      const singleImageHtml = firstImage
        ? `<div class="flex-shrink-0 ${layout.mediaWidth}"><img class="w-full rounded-xl shadow-lg object-cover ${layout.aspectClass} ring-1 ring-black/5" src="${escapeHtml(firstImage)}" alt="${altText}" /></div>`
        : "";
      const carouselOptions: FlowbiteCarouselOptions = {
        mode: (getSetting(section, "carouselMode", "slide") as "slide" | "static") || "slide",
        indicators: getSetting(section, "carouselIndicators", true) as boolean,
        controls: getSetting(section, "carouselControls", true) as boolean,
        duration: String(getSetting(section, "carouselDuration", "700")),
        ease: (getSetting(section, "carouselEase", "ease-in-out") as string) === "ease-linear" ? "ease-linear" : "ease-in-out",
        aspectClass: layout.aspectClass,
        mediaWidth: layout.mediaWidth,
      };
      const galleryOrSliderOrCarouselHtml =
        galleryImages.length >= 2
          ? mediaStyle === "gallery"
            ? `<div class="flex-shrink-0 ${layout.mediaWidth}"><div class="grid grid-cols-2 gap-2 rounded-xl overflow-hidden ${layout.aspectClass}">${galleryImages.slice(0, 4).map((src) => `<img class="w-full h-full object-cover" src="${escapeHtml(src)}" alt="${altText}" />`).join("")}</div></div>`
            : mediaStyle === "carousel"
              ? buildFlowbiteCarouselHtml(`carousel-product-info-${id}`, galleryImages, productName || "Product", carouselOptions)
              : `<div class="flex-shrink-0 ${layout.mediaWidth} overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5">${buildSliderHtml(galleryImages.map((src) => `<img class="w-full h-full object-cover" src="${escapeHtml(src)}" alt="${altText}" />`), { wrapperClass: "", aspectClass: layout.aspectClass, slideFullWidth: true })}</div>`
          : singleImageHtml;
      const mediaBlockHtml = useSingleImage ? singleImageHtml : galleryOrSliderOrCarouselHtml;
      const content = `
        <div class="container mx-auto px-6 py-12 md:py-14">
          <div class="${layout.maxWidth} mx-auto flex flex-wrap items-start gap-10">
            ${mediaBlockHtml}
            <div class="flex-1 min-w-0 pt-1">
              ${productName ? `<h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">${nameHtml}</h2>` : ""}
              ${productDescription ? `<div class="text-lg text-gray-600 leading-relaxed">${descHtml}</div>` : ""}
            </div>
          </div>
        </div>`;
      return comment + block(content, "bg-white border-b border-gray-100");
    }

    case "image_gallery":
    case "product_images": {
      const layout = getLayoutSettings(section);
      const displayStyleFieldKey = getSetting(section, "displayStyleFieldKey", "") as string;
      const galleryStyle = (displayStyleFieldKey && getVal(values, displayStyleFieldKey))
        ? getVal(values, displayStyleFieldKey)
        : (getSetting(section, "style", "grid") as string);
      const imagesFieldKey = (getSetting(section, "imagesFieldKey", "gallery_images") as string) || "gallery_images";
      const imgs = parseImagesList(getVal(values, imagesFieldKey));
      const slideMinWidth = (getSetting(section, "sliderSlideMinWidth", "280px") as string).replace(/^(\d+)$/, "$1px");
      const galleryContent =
        galleryStyle === "slider"
          ? buildSliderHtml(
              imgs.map((src) => `<div class="${layout.aspectClass} rounded-lg overflow-hidden"><img class="w-full h-full object-cover" src="${escapeHtml(src)}" alt="" /></div>`),
              { slideFullWidth: false, slideMinWidth: `min-w-[${slideMinWidth}]`, gap: "gap-4" }
            )
          : `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">${imgs.map((src) => `<div class="${layout.aspectClass} rounded-lg overflow-hidden"><img class="w-full h-full object-cover" src="${escapeHtml(src)}" alt="" /></div>`).join("")}</div>`;
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <div class="${layout.maxWidth} mx-auto">${galleryContent}</div>
        </div>`;
      return comment + block(content);
    }

    case "savings": {
      const savingsAmount = getVal(values, "savings_amount");
      const savingsNote = getVal(values, "savings_note");
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-4">${headingHtml}</h2>` : ""}
          ${savingsAmount ? `<p class="text-2xl font-semibold text-center text-indigo-600 mb-4">${escapeHtml(savingsAmount)}</p>` : ""}
          ${savingsNote ? `<div class="max-w-3xl mx-auto text-lg text-gray-600 text-center">${escapeHtml(savingsNote).replace(/\n/g, "<br/>")}</div>` : ""}
        </div>`;
      return comment + block(content, "bg-white");
    }

    case "problem":
    case "agitate":
    case "solution":
    case "shipping":
    case "guarantee": {
      const textKey = section.fields.find((f) => f.type === "textarea" && !f.key.endsWith("_a"))?.key ?? section.fields[1]?.key;
      const text = getVal(values, textKey);
      const imgKey = section.fields.find((f) => f.type === "image")?.key;
      const img = imgKey ? getVal(values, imgKey) : "";
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-6">${headingHtml}</h2>` : ""}
          <div class="max-w-3xl mx-auto ${img ? "flex flex-wrap gap-8 items-center" : ""}">
            ${text ? `<div class="text-lg text-gray-600">${escapeHtml(text).replace(/\n/g, "<br/>")}</div>` : ""}
            ${img ? `<img class="rounded-lg shadow-md max-w-sm" src="${escapeHtml(img)}" alt="" />` : ""}
          </div>
        </div>`;
      return comment + block(content, "bg-white");
    }

    case "benefits": {
      const benefitsFieldKey = (getSetting(section, "benefitsFieldKey", "") as string) || "";
      const benefitsRaw = benefitsFieldKey ? getVal(values, benefitsFieldKey) : "";
      const items = benefitsRaw ? benefitsRaw.split(/\n/).map((s) => s.trim()).filter(Boolean) : [];
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <ul class="max-w-2xl mx-auto space-y-4">
            ${items.map((t) => `<li class="flex items-start gap-2"><span class="text-green-500 text-xl">✓</span><span class="text-gray-700">${escapeHtml(t)}</span></li>`).join("")}
          </ul>
        </div>`;
      return comment + block(content, "bg-gray-50");
    }

    case "features_grid":
    case "features": {
      const columns = Math.min(4, Math.max(1, Number(getSetting(section, "columns", 3)) || 3)) as 1 | 2 | 3 | 4;
      const iconSize = (getSetting(section, "iconSize", "sm") as string) === "lg" ? "lg" : "sm";
      const gridCols = { 1: "grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns];
      const featuresFieldKey = (getSetting(section, "featuresFieldKey", "") as string) || "";
      const fromList = featuresFieldKey ? parseJsonList<{ icon?: string; title?: string; desc?: string }>(getVal(values, featuresFieldKey)) : [];
      const items: { icon: string; title: string; desc: string }[] = fromList
        .filter((x) => x && (x.title || (x as Record<string, string>)["title"]))
        .map((x) => ({
          icon: (x.icon ?? (x as Record<string, string>)["icon"]) || "✓",
          title: String(x.title ?? (x as Record<string, string>)["title"] ?? ""),
          desc: String(x.desc ?? (x as Record<string, string>)["desc"] ?? ""),
        }));
      const iconSizeClass = iconSize === "lg" ? "text-3xl w-12 h-12" : "text-xl w-8 h-8";
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <div class="grid grid-cols-1 ${gridCols} gap-8 max-w-5xl mx-auto">
            ${items.map((item) => {
              const iconHtml = /^https?:\/\//i.test(item.icon) ? `<img class="${iconSizeClass} object-contain rounded" src="${escapeHtml(item.icon)}" alt="" />` : `<span class="flex items-center justify-center ${iconSizeClass} rounded-full bg-indigo-100 text-indigo-600 font-bold">${escapeHtml(item.icon)}</span>`;
              return `<div class="p-4 rounded-lg border border-gray-200 text-center"><div class="flex justify-center mb-2">${iconHtml}</div><h3 class="font-semibold text-lg text-gray-900 mb-2">${escapeHtml(item.title)}</h3>${item.desc ? `<p class="text-gray-600 text-sm">${escapeHtml(item.desc).replace(/\n/g, "<br/>")}</p>` : ""}</div>`;
            }).join("")}
          </div>
        </div>`;
      return comment + block(content);
    }

    case "how_it_works": {
      const s1 = getVal(values, "step_1");
      const s2 = getVal(values, "step_2");
      const s3 = getVal(values, "step_3");
      const steps = [s1, s2, s3].filter(Boolean);
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <div class="flex flex-wrap justify-center gap-8">
            ${steps.map((s, i) => `<div class="text-center max-w-xs"><span class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold">${i + 1}</span><p class="mt-2 text-gray-700">${escapeHtml(s)}</p></div>`).join("")}
          </div>
        </div>`;
      return comment + block(content, "bg-gray-50");
    }

    case "comparison": {
      const before = getVal(values, "before_text");
      const after = getVal(values, "after_text");
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div class="p-6 rounded-lg bg-red-50 border border-red-100"><h3 class="font-semibold text-red-800 mb-2">Before</h3><p class="text-gray-700">${escapeHtml(before).replace(/\n/g, "<br/>")}</p></div>
            <div class="p-6 rounded-lg bg-green-50 border border-green-100"><h3 class="font-semibold text-green-800 mb-2">After</h3><p class="text-gray-700">${escapeHtml(after).replace(/\n/g, "<br/>")}</p></div>
          </div>
        </div>`;
      return comment + block(content);
    }

    case "review_list":
    case "reviews":
    case "testimonials": {
      const layout = getLayoutSettings(section);
      const reviewLayoutFieldKey = (getSetting(section, "layoutFieldKey", "") as string) || "";
      const reviewLayoutRaw = (reviewLayoutFieldKey && getVal(values, reviewLayoutFieldKey)) || (getSetting(section, "layout", "list") as string);
      const reviewLayout = reviewLayoutRaw === "slider" ? "slider" : "list";
      const showStars = getSetting(section, "showStars", true) as boolean;
      const ratingRaw = getVal(values, "reviews_rating");
      const ratingNum = ratingRaw ? parseFloat(String(ratingRaw).replace(",", ".")) : NaN;
      const ratingLabel = showStars && !Number.isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 5
        ? (type === "reviews" || type === "review_list" ? "Reviews" : "Rating") + " | " + (ratingNum % 1 === 0 ? ratingNum : ratingNum.toFixed(1))
        : "";
      const starRatingHtml = ratingLabel ? buildStarRatingHtml(ratingNum, ratingLabel) : "";
      const title = heading || getVal(values, "reviews_title");
      const reviewsFieldKey = (getSetting(section, "reviewsFieldKey", "") as string) || "";
      const fromReviewsList = reviewsFieldKey ? parseJsonList<{ name?: string; star?: number; rating?: number; comment?: string; text?: string }>(getVal(values, reviewsFieldKey)) : [];
      const feedbacks: { name: string; star: number; comment: string }[] = fromReviewsList
        .filter((x) => x && ((x.comment ?? (x as Record<string, string>)["comment"]) || (x.text ?? (x as Record<string, string>)["text"])))
        .map((x) => {
          const comment = String(x.comment ?? (x as Record<string, string>)["comment"] ?? x.text ?? (x as Record<string, string>)["text"] ?? "");
          const starNum = x.star ?? x.rating ?? (x as Record<string, unknown>)["rating"];
          const star = starNum != null ? Math.min(5, Math.max(0, Number(starNum) || 0)) : 0;
          const name = String(x.name ?? (x as Record<string, string>)["name"] ?? (x as Record<string, string>)["author"] ?? "");
          return { name, star, comment };
        });
      const cardHtml = (f: { name: string; star: number; comment: string }) => {
        const ratingDisplay = showStars && f.star > 0 ? `<div class="mb-3"><span class="font-semibold text-gray-800">${f.star % 1 === 0 ? f.star : f.star.toFixed(1)}</span> ${buildStarRatingOnlyHtml(f.star)}</div>` : "";
        return `<blockquote class="p-6 rounded-lg bg-gray-50 border-l-4 border-indigo-500">${ratingDisplay}<p class="text-gray-700">${escapeHtml(f.comment).replace(/\n/g, "<br/>")}</p>${f.name ? `<cite class="block mt-2 text-gray-500">— ${escapeHtml(f.name)}</cite>` : ""}</blockquote>`;
      };
      const reviewSlideMinWidth = (getSetting(section, "sliderSlideMinWidth", "300px") as string).replace(/^(\d+)$/, "$1px");
      const listContent =
        reviewLayout === "slider"
          ? buildSliderHtml(feedbacks.map(cardHtml), { slideFullWidth: false, slideMinWidth: `min-w-[${reviewSlideMinWidth}]`, gap: "gap-6" })
          : feedbacks.map(cardHtml).join("");
      const listClass = reviewLayout === "slider" ? "pb-4" : "grid md:grid-cols-2 gap-6";
      const reviewTitleHtml = title ? (headingKey ? wrapWithFieldStyle(escapeHtml(title), section, headingKey) : escapeHtml(title)) : "";
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${starRatingHtml}
          ${reviewTitleHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${reviewTitleHtml}</h2>` : ""}
          <div class="${layout.maxWidth} mx-auto"><div class="${listClass}">${listContent}</div></div>
        </div>`;
      return comment + block(content);
    }

    case "ugc":
    case "ugc_reviews": {
      const ugcImagesFieldKey = (getSetting(section, "ugcImagesFieldKey", "") as string) || "";
      const ugcUrls = ugcImagesFieldKey ? parseImagesList(getVal(values, ugcImagesFieldKey)) : [];
      const quote = getVal(values, "ugc_quote");
      const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url) || url.includes("video");
      const media = (url: string) =>
        isVideo(url)
          ? `<video class="w-full rounded-lg" controls src="${escapeHtml(url)}"></video>`
          : `<img class="w-full rounded-lg object-cover" src="${escapeHtml(url)}" alt="" />`;
      const itemsHtml = ugcUrls.map((url) => `<div class="overflow-hidden rounded-lg shadow-md">${media(url)}</div>`).join("");
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          ${quote ? `<p class="text-center text-xl text-gray-700 mb-8 max-w-2xl mx-auto">"${escapeHtml(quote)}"</p>` : ""}
          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            ${itemsHtml}
          </div>
        </div>`;
      return comment + block(content, "bg-gray-50");
    }

    case "product_demo": {
      const demoUrl = getVal(values, "demo_image");
      const isVideo = demoUrl && /\.(mp4|webm|ogg)$/i.test(demoUrl);
      const mediaHtml = demoUrl
        ? isVideo
          ? `<video class="w-full max-w-2xl mx-auto rounded-lg shadow-lg" controls src="${escapeHtml(demoUrl)}"></video>`
          : `<img class="w-full max-w-2xl mx-auto rounded-lg shadow-lg object-cover" src="${escapeHtml(demoUrl)}" alt="" />`
        : "";
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <div class="flex justify-center">${mediaHtml}</div>
        </div>`;
      return comment + block(content);
    }

    case "demo_clips": {
      const demoClipsFieldKey = (getSetting(section, "demoClipsFieldKey", "") as string) || "";
      const demoUrls = demoClipsFieldKey ? parseImagesList(getVal(values, demoClipsFieldKey)) : [];
      const videosHtml = demoUrls.map((url) => `<div class="overflow-hidden rounded-lg shadow-lg"><video class="w-full" controls src="${escapeHtml(url)}"></video></div>`).join("");
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            ${videosHtml}
          </div>
        </div>`;
      return comment + block(content);
    }

    case "accordion_faq":
    case "faq": {
      const expandFirst = getSetting(section, "expandFirst", false) as boolean;
      const faqStyle = (getSetting(section, "style", "bordered") as string) === "flat" ? "flat" : "bordered";
      const faqItemsFieldKey = (getSetting(section, "faqItemsFieldKey", "") as string) || "";
      const fromFaqList = faqItemsFieldKey ? parseJsonList<{ question?: string; q?: string; answer?: string; a?: string }>(getVal(values, faqItemsFieldKey)) : [];
      const items: { question: string; answer: string }[] = fromFaqList
        .filter((x) => x && (x.question ?? (x as Record<string, string>)["q"]))
        .map((x) => ({
          question: String(x.question ?? (x as Record<string, string>)["q"] ?? ""),
          answer: String(x.answer ?? (x as Record<string, string>)["a"] ?? ""),
        }));
      const borderClass = faqStyle === "flat" ? "border-0 border-b border-gray-200 last:border-0" : "border border-gray-200 rounded-lg";
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <div class="max-w-2xl mx-auto space-y-2">
            ${items.map((item, idx) => {
              const openAttr = expandFirst && idx === 0 ? " open" : "";
              return `<details class="${borderClass} p-4"${openAttr}><summary class="font-semibold text-gray-900 cursor-pointer list-none">${escapeHtml(item.question)}</summary>${item.answer ? `<p class="mt-2 text-gray-600">${escapeHtml(item.answer).replace(/\n/g, "<br/>")}</p>` : ""}</details>`;
            }).join("")}
          </div>
        </div>`;
      return comment + block(content, "bg-gray-50");
    }

    case "order_form": {
      const buttonColor = (getSetting(section, "buttonColor", "#4F46E5") as string) || "#4F46E5";
      const fieldsRaw = getSetting(section, "fields", ["email", "name"]) as string[];
      const fields = Array.isArray(fieldsRaw) ? fieldsRaw : ["email", "name"];
      const orderTitleVal = getVal(values, "order_title");
      const promoText = getVal(values, "order_promoText");
      const buttonText = getVal(values, "order_buttonText") || "Submit";
      const hex = (v: unknown) => (typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v) ? v : "");
      const inputBg = hex(getSetting(section, "inputBackgroundColor", ""));
      const inputText = hex(getSetting(section, "inputTextColor", ""));
      const inputBorder = hex(getSetting(section, "inputBorderColor", ""));
      const buttonTextColor = hex(getSetting(section, "buttonTextColor", ""));
      const inputStyleParts: string[] = [];
      if (inputBg) inputStyleParts.push(`background-color:${inputBg}`);
      if (inputText) inputStyleParts.push(`color:${inputText}`);
      if (inputBorder) inputStyleParts.push(`border-color:${inputBorder}`);
      const inputInlineStyle = inputStyleParts.length ? ` style="${escapeHtml(inputStyleParts.join("; "))}"` : "";
      const safeColor = hex(buttonColor) || "#4F46E5";
      const buttonStyleParts: string[] = [];
      buttonStyleParts.push(`background-color:${safeColor}`);
      if (buttonTextColor) buttonStyleParts.push(`color:${buttonTextColor}`);
      const buttonInlineStyle = ` style="${escapeHtml(buttonStyleParts.join("; "))}"`;
      const fieldLabels: Record<string, string> = { email: "Email", name: "Tên của bạn", phone: "Số điện thoại", message: "Message", address: "Địa chỉ nhận hàng" };
      // Section background: accept hex (#RRGGBB) or CSS color names (e.g. blue, seablue) from AI
      const backgroundColorRaw = getSetting(section, "backgroundColor", "") as string;
      const resolvedBg = hex(backgroundColorRaw) || (typeof backgroundColorRaw === "string" && backgroundColorRaw.trim() ? backgroundColorRaw.trim() : "");
      const isDarkOrder = !!resolvedBg;
      const orderTitleHtml = orderTitleVal ? wrapWithFieldStyle(escapeHtml(orderTitleVal), section, "order_title") : "";
      const orderPromoHtml = promoText ? wrapWithFieldStyle(escapeHtml(promoText).replace(/\n/g, "<br/>"), section, "order_promoText") : "";
      const orderBtnHtml = wrapWithFieldStyle(escapeHtml(buttonText), section, "order_buttonText");
      const wrapperClass = isDarkOrder ? "text-white py-20" : "";
      const wrapperStyle = resolvedBg ? ` style="background-color:${escapeHtml(resolvedBg)}"` : "";
      const innerClass = isDarkOrder ? "max-w-xl mx-auto px-6 text-center" : "max-w-md mx-auto rounded-xl border border-gray-200 p-6 bg-gray-50";
      const titleClass = isDarkOrder ? "text-3xl font-bold mb-4 text-white" : "text-2xl font-bold text-gray-900 mb-4";
      const promoClass = isDarkOrder ? "opacity-80 mb-10 text-gray-200" : "text-gray-600 mb-6";
      const inputClass = isDarkOrder ? "w-full p-4 rounded text-black border border-gray-300" : "w-full px-3 py-2 border border-gray-300 rounded-lg";
      const btnClass = isDarkOrder ? "w-full hover:opacity-90 p-4 rounded font-semibold text-lg" : "w-full py-3 font-semibold rounded-lg";
      const content = `
        <div class="container mx-auto px-4 py-12 ${wrapperClass}"${wrapperStyle} id="order">
          <div class="${innerClass}">
            ${orderTitleHtml ? `<h2 class="${titleClass}">${orderTitleHtml}</h2>` : ""}
            ${orderPromoHtml ? `<p class="${promoClass}">${orderPromoHtml}</p>` : ""}
            <form class="space-y-4">
              ${fields.map((f) => `<div><label class="block text-sm font-medium ${isDarkOrder ? "text-gray-300" : "text-gray-700"} mb-1">${escapeHtml(fieldLabels[f] || f)}</label><input type="${f === "email" ? "email" : "text"}" name="${escapeHtml(f)}" class="${inputClass}" placeholder="${escapeHtml(fieldLabels[f] || f)}"${inputInlineStyle} /></div>`).join("")}
              <button type="submit" class="${btnClass}"${buttonInlineStyle}>${orderBtnHtml}</button>
            </form>
          </div>
        </div>`;
      return comment + block(content);
    }

    case "bundle_pricing": {
      const b1n = getVal(values, "bundle_1_name");
      const b1p = getVal(values, "bundle_1_price");
      const b2n = getVal(values, "bundle_2_name");
      const b2p = getVal(values, "bundle_2_price");
      const best = getVal(values, "bundle_best_value");
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${headingHtml ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${headingHtml}</h2>` : ""}
          <div class="flex flex-wrap justify-center gap-6">
            ${b1n ? `<div class="p-6 rounded-xl border-2 border-gray-200 min-w-[200px] text-center"><h3 class="font-semibold text-lg">${escapeHtml(b1n)}</h3><p class="text-2xl font-bold text-indigo-600 mt-2">${escapeHtml(b1p)}</p></div>` : ""}
            ${b2n ? `<div class="p-6 rounded-xl border-2 border-indigo-500 min-w-[200px] text-center relative"><span class="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-sm rounded">${escapeHtml(best)}</span><h3 class="font-semibold text-lg">${escapeHtml(b2n)}</h3><p class="text-2xl font-bold text-indigo-600 mt-2">${escapeHtml(b2p)}</p></div>` : ""}
          </div>
        </div>`;
      return comment + block(content);
    }

    case "discount_banner": {
      const label = getVal(values, "discount_label");
      const code = getVal(values, "discount_code");
      const note = getVal(values, "discount_note");
      const content = `
        <div class="container mx-auto px-4 py-6">
          <div class="max-w-2xl mx-auto text-center py-6 px-4 rounded-xl bg-amber-100 border-2 border-amber-400">
            <p class="text-2xl font-bold text-amber-900">${escapeHtml(label)}</p>
            ${code ? `<p class="mt-2 font-mono text-lg bg-white inline-block px-4 py-2 rounded">${escapeHtml(code)}</p>` : ""}
            ${note ? `<p class="mt-2 text-amber-800">${escapeHtml(note).replace(/\n/g, "<br/>")}</p>` : ""}
          </div>
        </div>`;
      return comment + block(content);
    }

    case "countdown": {
      const countHeading = getVal(values, "countdown_heading");
      const endDateRaw = getVal(values, "countdown_end_date");
      const endTimeRaw = getVal(values, "countdown_end_time");
      const endDate = endDateRaw ? normalizeDateForCountdown(endDateRaw) : "";
      const endTime = endTimeRaw ? normalizeTimeForCountdown(endTimeRaw) : "";
      const endAttr = endDate && endTime ? ` data-end="${escapeHtml(endDate)}T${escapeHtml(endTime)}:00"` : "";
      const content = `
        <div class="container mx-auto px-4 py-8"${endAttr}>
          <div class="max-w-md mx-auto text-center">
            ${countHeading ? `<p class="text-lg font-semibold text-gray-700 mb-4">${escapeHtml(countHeading)}</p>` : ""}
            <div class="flex justify-center gap-4" id="countdown">
              <div class="bg-gray-900 text-white rounded-lg px-4 py-2 min-w-[4rem]"><span class="countdown-days text-2xl font-bold">--</span><span class="block text-xs">Days</span></div>
              <div class="bg-gray-900 text-white rounded-lg px-4 py-2 min-w-[4rem]"><span class="countdown-hours text-2xl font-bold">--</span><span class="block text-xs">Hours</span></div>
              <div class="bg-gray-900 text-white rounded-lg px-4 py-2 min-w-[4rem]"><span class="countdown-mins text-2xl font-bold">--</span><span class="block text-xs">Mins</span></div>
              <div class="bg-gray-900 text-white rounded-lg px-4 py-2 min-w-[4rem]"><span class="countdown-secs text-2xl font-bold">--</span><span class="block text-xs">Secs</span></div>
            </div>
            ${endDate && endTime ? `<p class="mt-2 text-sm text-gray-500">Ends: ${escapeHtml(endDate)} ${escapeHtml(endTime)}</p>` : ""}
          </div>
        </div>`;
      return comment + block(content, "bg-gray-100");
    }

    case "cta": {
      const ctaH = getVal(values, "cta_heading");
      const ctaBtn = getVal(values, "cta_button");
      const ctaLink = getVal(values, "cta_link");
      const ctaBtnEl = ctaBtn
        ? ctaLink
          ? `<a href="${escapeHtml(ctaLink)}" class="inline-block px-10 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700">${escapeHtml(ctaBtn)}</a>`
          : `<span class="inline-block px-10 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg cursor-default">${escapeHtml(ctaBtn)}</span>`
        : "";
      const content = `
        <div class="container mx-auto px-4 py-16 text-center" id="cta">
          ${ctaH ? `<h2 class="text-3xl font-bold text-gray-900 mb-4">${escapeHtml(ctaH)}</h2>` : ""}
          ${ctaBtnEl}
        </div>`;
      return comment + block(content, "bg-indigo-50");
    }

    case "footer": {
      const text = getVal(values, "footer_text");
      const links = getVal(values, "footer_links");
      const linkItems = links ? links.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const content = `
        <footer class="border-t border-gray-200 mt-12">
          <div class="container mx-auto px-4 py-8">
            ${text ? `<p class="text-gray-600 text-center">${escapeHtml(text).replace(/\n/g, "<br/>")}</p>` : ""}
            ${linkItems.length ? `<nav class="flex justify-center gap-6 mt-4">${linkItems.map((l) => `<a href="#" class="text-indigo-600 hover:underline">${escapeHtml(l)}</a>`).join(" ")}</nav>` : ""}
          </div>
        </footer>`;
      return comment + block(content);
    }

    case "sticky_cta": {
      const stickyText = getVal(values, "sticky_cta_text");
      const stickyLink = getVal(values, "sticky_cta_link");
      const content = stickyLink
        ? `<a href="${escapeHtml(stickyLink)}" class="block w-full py-4 text-center font-semibold bg-red-500 hover:bg-red-600 text-white">${escapeHtml(stickyText || "Mua ngay")}</a>`
        : `<div class="w-full py-4 text-center font-semibold bg-red-500 text-white">${escapeHtml(stickyText || "Mua ngay")}</div>`;
      return comment + `<div class="fixed bottom-0 left-0 right-0 z-50" data-section-id="${id}">${content}</div>`;
    }

    default:
      return comment + block(`<div class="container mx-auto px-4 py-8"><h2 class="text-2xl font-bold">${headingHtml || escapeHtml(heading)}</h2></div>`);
  }
}

/** Build full HTML document with Tailwind CDN and chatbot-friendly structure */
export function buildHtml(template: TemplateConfig, values: FormValues): string {
  const sectionsHtml = template.sections
    .map((section) => buildSectionHtml(section, values))
    .join("\n");

  const needsFlowbite = template.sections.some((section) => {
    if (section.type !== "product_info") return false;
    const raw = getVal(values, "product_info_media_style") || (getSetting(section, "productInfoMediaStyle", "thumbnail") as string);
    return raw === "carousel";
  });
  const flowbiteScript = needsFlowbite ? `\n  <script src="${FLOWBITE_CDN}"></script>` : "";

  const countdownScript = template.structure.includes("countdown")
    ? `
  <script>
  (function(){
    var container = document.querySelector('.section-countdown .container');
    if (!container) return;
    var endDate = container.getAttribute('data-end');
    if (!endDate) return;
    var deadline = new Date(endDate).getTime();
    function update(){
      var now = Date.now();
      var d = Math.max(0, deadline - now);
      var days = Math.floor(d/86400000);
      var hours = Math.floor((d%86400000)/3600000);
      var mins = Math.floor((d%3600000)/60000);
      var secs = Math.floor((d%60000)/1000);
      var el = document.getElementById('countdown');
      if (el) {
        var daysEl = el.querySelector('.countdown-days'); if (daysEl) daysEl.textContent = days;
        var hoursEl = el.querySelector('.countdown-hours'); if (hoursEl) hoursEl.textContent = hours;
        var minsEl = el.querySelector('.countdown-mins'); if (minsEl) minsEl.textContent = mins;
        var secsEl = el.querySelector('.countdown-secs'); if (secsEl) secsEl.textContent = secs;
      }
      if (d > 0) setTimeout(update, 1000);
    }
    update();
  })();
  </script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Landing Page</title>
  <script src="${TAILWIND_CDN}"></script>
  <!-- Template: ${template.name} (${template.id}) - Edit sections by data-section-id or .section-* classes -->
</head>
<body class="min-h-screen bg-white text-gray-900 antialiased">
  <!-- START main content - each section has data-section-id for easy chatbot editing -->
  <main>
${sectionsHtml.split("\n").map((line) => "    " + line).join("\n")}
  </main>
  <!-- END main content -->
${countdownScript}${flowbiteScript}
</body>
</html>`;
}
