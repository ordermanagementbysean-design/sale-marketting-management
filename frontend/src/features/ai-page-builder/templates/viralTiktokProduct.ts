import type { TemplateConfig } from "../types";

export const viralTiktokProductTemplate: TemplateConfig = {
  id: "viral_tiktok_product",
  name: "Viral TikTok Product Page",
  structure: ["hero", "product_info", "ugc_reviews", "benefits", "demo_clips", "reviews", "cta"],
  sections: [
    {
      id: "hero",
      type: "hero_section",
      layout: "centered",
      label: "Video hero",
      required: true,
      settings: { textAlign: "center", overlay: 0.3 },
      fields: [
        { key: "hero_title", label: "Title", type: "text", required: true, defaultValue: "The Product Everyone Is Talking About" },
        { key: "hero_subtitle", label: "Subtitle", type: "textarea", required: false },
        { key: "hero_ctaText", label: "CTA text", type: "text", required: false, defaultValue: "Get Yours Now" },
        { key: "hero_ctaLink", label: "CTA link (empty = no redirect)", type: "text", required: false, placeholder: "#order" },
        { key: "hero_video", label: "Hero video URL", type: "video", required: false, placeholder: "https://..." },
      ],
    },
    {
      id: "product_info",
      type: "product_info",
      label: "Product info",
      required: true,
      settings: {
        productInfoMediaStyle: "carousel",
        productInfoImagesFieldKey: "product_info_images",
        carouselMode: "slide",
        carouselIndicators: true,
        carouselControls: true,
        carouselDuration: "700",
        carouselEase: "ease-in-out",
      },
      fields: [
        { key: "product_name", label: "Product name", type: "text", required: true, defaultValue: "The Product Everyone Is Talking About" },
        { key: "product_description", label: "Product description", type: "textarea", required: false, defaultValue: "Viral on TikTok and Instagram. Instant results that look great on camera. Affordable and ships fast." },
        { key: "product_info_media_style", label: "Cách hiển thị ảnh", type: "text", required: false, defaultValue: "carousel", options: ["thumbnail", "gallery", "carousel"] },
        { key: "product_thumbnail", label: "Ảnh chính (tùy chọn)", type: "image", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80" },
        {
          key: "product_info_images",
          label: "List image",
          type: "image_list",
          required: false,
          values: [
            "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
          ],
        },
      ],
    },
    {
      id: "ugc_reviews",
      type: "ugc_reviews",
      label: "UGC reviews",
      required: false,
      settings: { ugcImagesFieldKey: "ugc_images" },
      fields: [
        { key: "ugc_heading", label: "Section heading", type: "text", required: false, defaultValue: "Going Viral" },
        {
          key: "ugc_images",
          label: "List ảnh / video UGC",
          type: "image_list",
          required: false,
          values: [],
        },
        { key: "ugc_quote", label: "Highlight quote", type: "textarea", required: false, defaultValue: "I can't believe how many people are asking where I got this. You need to try it!" },
      ],
    },
    {
      id: "benefits",
      type: "benefits",
      label: "Benefits",
      required: false,
      settings: { benefitsFieldKey: "benefits" },
      fields: [
        { key: "benefits_heading", label: "Section heading", type: "text", required: false, defaultValue: "Why It's Trending" },
        {
          key: "benefits",
          label: "Benefits (mỗi dòng một ý)",
          type: "string_list",
          required: false,
          values: [
            "Viral on TikTok and Instagram—creators love it",
            "Instant results that look great on camera",
            "Affordable and ships fast so you can join the trend",
          ],
        },
      ],
    },
    {
      id: "demo_clips",
      type: "demo_clips",
      label: "Demo clips",
      required: false,
      settings: { demoClipsFieldKey: "demo_clips" },
      fields: [
        { key: "demo_heading", label: "Section heading", type: "text", required: false, defaultValue: "See It In Action" },
        {
          key: "demo_clips",
          label: "List video demo",
          type: "image_list",
          required: false,
          values: [
            "https://www.w3schools.com/html/mov_bbb.mp4",
            "https://www.w3schools.com/html/movie.mp4",
          ],
        },
      ],
    },
    {
      id: "reviews",
      type: "review_list",
      label: "Reviews",
      required: false,
      settings: { layout: "slider", showStars: true, reviewsFieldKey: "reviews", layoutFieldKey: "review_layout" },
      fields: [
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "4.9" },
        { key: "reviews_heading", label: "Title", type: "text", required: false, defaultValue: "What People Say" },
        { key: "review_layout", label: "Cách hiển thị", type: "text", required: false, defaultValue: "slider", options: ["list", "slider"] },
        {
          key: "reviews",
          label: "Reviews (rating, comment, author)",
          type: "object_list",
          required: false,
          listItemKeys: ["rating", "comment", "author"],
          values: [
            { rating: "5", comment: "Saw this all over my FYP and had to get it. Did not disappoint. Already ordered a second one!", author: "@viral_fan" },
            { rating: "5", comment: "My followers keep asking for the link. This thing is legit and the price is crazy good.", author: "@creator_life" },
          ],
        },
      ],
    },
    {
      id: "cta",
      type: "cta",
      label: "CTA",
      required: true,
      fields: [
        { key: "cta_heading", label: "CTA heading", type: "text", required: true, defaultValue: "Join the Hype" },
        { key: "cta_button", label: "Button text", type: "text", required: true, defaultValue: "Get Yours Now" },
        { key: "cta_link", label: "Button link (empty = no redirect)", type: "text", required: false, placeholder: "#order" },
      ],
    },
  ],
};
