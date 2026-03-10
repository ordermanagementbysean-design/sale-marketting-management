import type { TemplateConfig } from "./types";
import type { FormValues } from "./types";
import { normalizeDateForCountdown, normalizeTimeForCountdown } from "./utils";

const TAILWIND_CDN =
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';

function getVal(values: FormValues, key: string): string {
  const v = values[key];
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

/** Build one section's HTML by type and layout */
function buildSectionHtml(
  section: TemplateConfig["sections"][0],
  values: FormValues
): string {
  const id = section.id;
  const type = section.type;
  const layout = section.layout ?? "centered";
  const comment = `<!-- SECTION: ${type} (id: ${id}) -->`;

  const headingKeys = section.fields.filter((f) => f.key.endsWith("_heading"));
  const getHeading = () => {
    const k = headingKeys[0]?.key;
    return k ? getVal(values, k) : "";
  };
  const heading = getHeading();

  const block = (content: string, className = "") =>
    `<div class="section-${type} ${className}" data-section-id="${id}">${content}</div>`;

  switch (type) {
    case "hero": {
      const h = getVal(values, "hero_heading");
      const text = getVal(values, "hero_text");
      const btn = getVal(values, "hero_button_text");
      const img = getVal(values, "hero_image");
      const video = getVal(values, "hero_video");
      const isTwoCol = layout === "two-column";
      const mediaHtml = video
        ? `<video class="w-full max-w-md rounded-lg shadow-xl" controls src="${escapeHtml(video)}"></video>`
        : img
          ? `<img class="w-full max-w-md rounded-lg shadow-xl object-cover" src="${escapeHtml(img)}" alt="" />`
          : "";
      const content = `
        <div class="container mx-auto px-4 py-16 ${isTwoCol ? "flex flex-wrap items-center gap-12" : "text-center"}">
          ${isTwoCol && mediaHtml ? `<div class="flex-1 min-w-[280px]">${mediaHtml}</div>` : ""}
          <div class="${isTwoCol ? "flex-1 min-w-[280px]" : ""}">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">${escapeHtml(h) || "Headline"}</h1>
            ${text ? `<p class="text-xl text-gray-600 mb-6">${escapeHtml(text)}</p>` : ""}
            ${btn ? `<a href="#cta" class="inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">${escapeHtml(btn)}</a>` : ""}
          </div>
          ${isTwoCol && !mediaHtml ? "" : !isTwoCol && mediaHtml ? `<div class="mt-8 flex justify-center">${mediaHtml}</div>` : ""}
        </div>`;
      return comment + block(content, "bg-gray-50");
    }

    case "product_images": {
      const imgs = [
        getVal(values, "product_image_1"),
        getVal(values, "product_image_2"),
        getVal(values, "product_image_3"),
      ].filter(Boolean);
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${imgs.map((src) => `<img class="w-full rounded-lg shadow-md object-cover" src="${escapeHtml(src)}" alt="" />`).join("")}
          </div>
        </div>`;
      return comment + block(content);
    }

    case "savings": {
      const savingsAmount = getVal(values, "savings_amount");
      const savingsNote = getVal(values, "savings_note");
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-4">${escapeHtml(heading)}</h2>` : ""}
          ${savingsAmount ? `<p class="text-2xl font-semibold text-center text-indigo-600 mb-4">${escapeHtml(savingsAmount)}</p>` : ""}
          ${savingsNote ? `<div class="max-w-3xl mx-auto prose prose-lg text-gray-600 text-center">${escapeHtml(savingsNote).replace(/\n/g, "<br/>")}</div>` : ""}
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
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-6">${escapeHtml(heading)}</h2>` : ""}
          <div class="max-w-3xl mx-auto ${img ? "flex flex-wrap gap-8 items-center" : ""}">
            ${text ? `<div class="prose prose-lg text-gray-600">${escapeHtml(text).replace(/\n/g, "<br/>")}</div>` : ""}
            ${img ? `<img class="rounded-lg shadow-md max-w-sm" src="${escapeHtml(img)}" alt="" />` : ""}
          </div>
        </div>`;
      return comment + block(content, "bg-white");
    }

    case "benefits": {
      const b1 = getVal(values, "benefit_1");
      const b2 = getVal(values, "benefit_2");
      const b3 = getVal(values, "benefit_3");
      const items = [b1, b2, b3].filter(Boolean);
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          <ul class="max-w-2xl mx-auto space-y-4">
            ${items.map((t) => `<li class="flex items-start gap-2"><span class="text-green-500 text-xl">✓</span><span class="text-gray-700">${escapeHtml(t)}</span></li>`).join("")}
          </ul>
        </div>`;
      return comment + block(content, "bg-gray-50");
    }

    case "features": {
      const f1t = getVal(values, "feature_1_title");
      const f1d = getVal(values, "feature_1_desc");
      const f2t = getVal(values, "feature_2_title");
      const f2d = getVal(values, "feature_2_desc");
      const f3t = getVal(values, "feature_3_title");
      const f3d = getVal(values, "feature_3_desc");
      const items = [
        [f1t, f1d],
        [f2t, f2d],
        [f3t, f3d],
      ].filter(([t]) => t);
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            ${items.map(([t, d]) => `<div class="p-4 rounded-lg border border-gray-200"><h3 class="font-semibold text-lg text-gray-900 mb-2">${escapeHtml(t!)}</h3>${d ? `<p class="text-gray-600">${escapeHtml(d).replace(/\n/g, "<br/>")}</p>` : ""}</div>`).join("")}
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
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
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
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div class="p-6 rounded-lg bg-red-50 border border-red-100"><h3 class="font-semibold text-red-800 mb-2">Before</h3><p class="text-gray-700">${escapeHtml(before).replace(/\n/g, "<br/>")}</p></div>
            <div class="p-6 rounded-lg bg-green-50 border border-green-100"><h3 class="font-semibold text-green-800 mb-2">After</h3><p class="text-gray-700">${escapeHtml(after).replace(/\n/g, "<br/>")}</p></div>
          </div>
        </div>`;
      return comment + block(content);
    }

    case "reviews":
    case "testimonials": {
      const ratingRaw = getVal(values, "reviews_rating");
      const ratingNum = ratingRaw ? parseFloat(String(ratingRaw).replace(",", ".")) : NaN;
      const ratingLabel = !Number.isNaN(ratingNum) && ratingNum >= 0 && ratingNum <= 5
        ? (type === "reviews" ? "Reviews" : "Rating") + " | " + (ratingNum % 1 === 0 ? ratingNum : ratingNum.toFixed(1))
        : "";
      const starRatingHtml = ratingLabel ? buildStarRatingHtml(ratingNum, ratingLabel) : "";
      const r1 = getVal(values, "review_1_text") || getVal(values, "testimonial_1");
      const a1 = getVal(values, "review_1_author") || getVal(values, "testimonial_1_author");
      const r2 = getVal(values, "review_2_text") || getVal(values, "testimonial_2");
      const a2 = getVal(values, "review_2_author") || getVal(values, "testimonial_2_author");
      const rating1Raw = getVal(values, "review_1_rating");
      const rating2Raw = getVal(values, "review_2_rating");
      const rating1 = rating1Raw ? parseFloat(String(rating1Raw).replace(",", ".")) : NaN;
      const rating2 = rating2Raw ? parseFloat(String(rating2Raw).replace(",", ".")) : NaN;
      const rawItems: [string, string, number][] = [
        [r1, a1, Number.isNaN(rating1) || rating1 < 0 || rating1 > 5 ? 0 : rating1],
        [r2, a2, Number.isNaN(rating2) || rating2 < 0 || rating2 > 5 ? 0 : rating2],
      ];
      const items = rawItems.filter(([t]) => t) as [string, string, number][];
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${starRatingHtml}
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            ${items.map(([t, a, rating]) => {
              const ratingDisplay = rating > 0 ? `<div class="mb-3" style="min-width:0;"><span style="display:inline-flex;align-items:center;gap:0.5rem;white-space:nowrap;flex-wrap:nowrap;min-width:min-content;"><span class="font-semibold text-gray-800" style="flex-shrink:0;">${rating % 1 === 0 ? rating : rating.toFixed(1)}</span>${buildStarRatingOnlyHtml(rating)}</span></div>` : "";
              return `<blockquote class="p-6 rounded-lg bg-gray-50 border-l-4 border-indigo-500">${ratingDisplay}<p class="text-gray-700">${escapeHtml(t!).replace(/\n/g, "<br/>")}</p>${a ? `<cite class="block mt-2 text-gray-500">— ${escapeHtml(a)}</cite>` : ""}</blockquote>`;
            }).join("")}
          </div>
        </div>`;
      return comment + block(content);
    }

    case "ugc":
    case "ugc_reviews": {
      const img1 = getVal(values, "ugc_image_1") || getVal(values, "ugc_video_1");
      const img2 = getVal(values, "ugc_image_2") || getVal(values, "ugc_video_2");
      const quote = getVal(values, "ugc_quote");
      const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url) || url.includes("video");
      const media = (url: string) =>
        isVideo(url)
          ? `<video class="w-full rounded-lg" controls src="${escapeHtml(url)}"></video>`
          : `<img class="w-full rounded-lg object-cover" src="${escapeHtml(url)}" alt="" />`;
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          ${quote ? `<p class="text-center text-xl text-gray-700 mb-8 max-w-2xl mx-auto">"${escapeHtml(quote)}"</p>` : ""}
          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            ${img1 ? `<div class="overflow-hidden rounded-lg shadow-md">${media(img1)}</div>` : ""}
            ${img2 ? `<div class="overflow-hidden rounded-lg shadow-md">${media(img2)}</div>` : ""}
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
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          <div class="flex justify-center">${mediaHtml}</div>
        </div>`;
      return comment + block(content);
    }

    case "demo_clips": {
      const v1 = getVal(values, "demo_video_1");
      const v2 = getVal(values, "demo_video_2");
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            ${v1 ? `<video class="w-full rounded-lg shadow-lg" controls src="${escapeHtml(v1)}"></video>` : ""}
            ${v2 ? `<video class="w-full rounded-lg shadow-lg" controls src="${escapeHtml(v2)}"></video>` : ""}
          </div>
        </div>`;
      return comment + block(content);
    }

    case "faq": {
      const q1 = getVal(values, "faq_1_q");
      const a1 = getVal(values, "faq_1_a");
      const q2 = getVal(values, "faq_2_q");
      const a2 = getVal(values, "faq_2_a");
      const items = [
        [q1, a1],
        [q2, a2],
      ].filter(([q]) => q);
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
          <div class="max-w-2xl mx-auto space-y-4">
            ${items.map(([q, a]) => `<div class="border border-gray-200 rounded-lg p-4"><h3 class="font-semibold text-gray-900">${escapeHtml(q!)}</h3>${a ? `<p class="mt-2 text-gray-600">${escapeHtml(a).replace(/\n/g, "<br/>")}</p>` : ""}</div>`).join("")}
          </div>
        </div>`;
      return comment + block(content, "bg-gray-50");
    }

    case "bundle_pricing": {
      const b1n = getVal(values, "bundle_1_name");
      const b1p = getVal(values, "bundle_1_price");
      const b2n = getVal(values, "bundle_2_name");
      const b2p = getVal(values, "bundle_2_price");
      const best = getVal(values, "bundle_best_value");
      const content = `
        <div class="container mx-auto px-4 py-12">
          ${heading ? `<h2 class="text-3xl font-bold text-center text-gray-900 mb-8">${escapeHtml(heading)}</h2>` : ""}
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
      const content = `
        <div class="container mx-auto px-4 py-16 text-center" id="cta">
          ${ctaH ? `<h2 class="text-3xl font-bold text-gray-900 mb-4">${escapeHtml(ctaH)}</h2>` : ""}
          ${ctaBtn ? `<a href="#" class="inline-block px-10 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700">${escapeHtml(ctaBtn)}</a>` : ""}
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

    default:
      return comment + block(`<div class="container mx-auto px-4 py-8"><h2 class="text-2xl font-bold">${escapeHtml(heading)}</h2></div>`);
  }
}

/** Build full HTML document with Tailwind CDN and chatbot-friendly structure */
export function buildHtml(template: TemplateConfig, values: FormValues): string {
  const sectionsHtml = template.sections
    .map((section) => buildSectionHtml(section, values))
    .join("\n");

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
  <link href="${TAILWIND_CDN}" rel="stylesheet" />
  <!-- Template: ${template.name} (${template.id}) - Edit sections by data-section-id or .section-* classes -->
</head>
<body class="min-h-screen bg-white text-gray-900 antialiased">
  <!-- START main content - each section has data-section-id for easy chatbot editing -->
  <main>
${sectionsHtml.split("\n").map((line) => "    " + line).join("\n")}
  </main>
  <!-- END main content -->
${countdownScript}
</body>
</html>`;
}
