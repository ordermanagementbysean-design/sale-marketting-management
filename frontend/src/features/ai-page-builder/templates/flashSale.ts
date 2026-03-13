import type { TemplateConfig } from "../types";

export const flashSaleTemplate: TemplateConfig = {
  id: "flash_sale",
  name: "Flash Sale Landing",
  structure: ["hero", "product_info", "discount_banner", "countdown", "features", "reviews", "cta"],
  sections: [
    {
      id: "hero",
      type: "hero_section",
      layout: "centered",
      label: "Hero",
      required: true,
      settings: { textAlign: "center", overlay: 0.5 },
      fields: [
        { key: "hero_title", label: "Title", type: "text", required: true, defaultValue: "50% OFF Today Only" },
        { key: "hero_subtitle", label: "Subtitle", type: "textarea", required: false, defaultValue: "Limited-time flash sale ending soon." },
        { key: "hero_ctaText", label: "CTA text", type: "text", required: false, defaultValue: "Claim Discount" },
        { key: "hero_ctaLink", label: "CTA link (empty = no redirect)", type: "text", required: false, placeholder: "#order" },
        { key: "hero_bgImage", label: "Background image URL", type: "image", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80" },
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
        { key: "product_name", label: "Product name", type: "text", required: true, defaultValue: "Flash Sale Product" },
        { key: "product_description", label: "Product description", type: "textarea", required: false, defaultValue: "Limited-time flash sale. Don't miss out on this deal." },
        { key: "product_info_media_style", label: "Cách hiển thị ảnh", type: "text", required: false, defaultValue: "carousel", options: ["thumbnail", "gallery", "carousel"] },
        { key: "product_thumbnail", label: "Ảnh chính (tùy chọn)", type: "image", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80" },
        {
          key: "product_info_images",
          label: "List image",
          type: "image_list",
          required: false,
          values: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
          ],
        },
      ],
    },
    {
      id: "discount_banner",
      type: "discount_banner",
      label: "Discount banner",
      required: true,
      fields: [
        { key: "discount_label", label: "Discount label", type: "text", required: true, defaultValue: "50% OFF" },
        { key: "discount_code", label: "Discount code", type: "text", required: false, defaultValue: "FLASH50" },
        { key: "discount_note", label: "Banner note", type: "textarea", required: false, defaultValue: "Use code at checkout. Limited stock. Offer ends at midnight." },
      ],
    },
    {
      id: "countdown",
      type: "countdown",
      label: "Countdown",
      required: false,
      fields: [
        { key: "countdown_heading", label: "Countdown heading", type: "text", required: false, defaultValue: "Sale ends in" },
        { key: "countdown_end_date", label: "End date (YYYY-MM-DD)", type: "text", required: true, defaultValue: "2025-12-31" },
        { key: "countdown_end_time", label: "End time (HH:mm)", type: "text", required: true, defaultValue: "23:59" },
      ],
    },
    {
      id: "features",
      type: "features_grid",
      label: "Features",
      required: false,
      settings: { columns: 2, iconSize: "sm", featuresFieldKey: "features" },
      fields: [
        { key: "features_heading", label: "Heading", type: "text", required: false, defaultValue: "Deal Highlights" },
        {
          key: "features",
          label: "Features (icon, title, desc)",
          type: "object_list",
          required: false,
          listItemKeys: ["icon", "title", "desc"],
          values: [
            { icon: "⚡", title: "Today only", desc: "This flash sale price is available for a limited time. Don't miss out." },
            { icon: "✓", title: "Free shipping", desc: "Free standard shipping on all flash sale orders. No minimum." },
          ],
        },
      ],
    },
    {
      id: "reviews",
      type: "review_list",
      label: "Reviews",
      required: false,
      settings: { layout: "list", showStars: true, reviewsFieldKey: "reviews", layoutFieldKey: "review_layout" },
      fields: [
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "3.9" },
        { key: "reviews_heading", label: "Title", type: "text", required: false, defaultValue: "Customer Reviews" },
        { key: "review_layout", label: "Cách hiển thị", type: "text", required: false, defaultValue: "list", options: ["list", "slider"] },
        {
          key: "reviews",
          label: "Reviews (rating, comment, author)",
          type: "object_list",
          required: false,
          listItemKeys: ["rating", "comment", "author"],
          values: [
            { rating: "4", comment: "Grabbed it during the last flash sale. Amazing quality for the price. So glad I didn't wait.", author: "Jess L." },
            { rating: "5", comment: "Best deal I've seen. Fast shipping and exactly as described. 10/10.", author: "Mike R." },
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
        { key: "cta_heading", label: "CTA heading", type: "text", required: true, defaultValue: "Claim Your Discount" },
        { key: "cta_button", label: "Button text", type: "text", required: true, defaultValue: "Shop Now" },
        { key: "cta_link", label: "Button link (empty = no redirect)", type: "text", required: false, placeholder: "#order" },
      ],
    },
  ],
};
