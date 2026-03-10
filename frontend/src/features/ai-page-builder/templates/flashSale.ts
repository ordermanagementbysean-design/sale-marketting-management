import type { TemplateConfig } from "../types";

export const flashSaleTemplate: TemplateConfig = {
  id: "flash_sale",
  name: "Flash Sale Landing",
  structure: ["hero", "discount_banner", "countdown", "features", "reviews", "cta"],
  sections: [
    {
      id: "flash_hero",
      type: "hero",
      layout: "centered",
      label: "Hero",
      required: true,
      fields: [
        { key: "hero_heading", label: "Heading", type: "text", required: true, defaultValue: "50% OFF Today Only" },
        { key: "hero_text", label: "Subtext", type: "textarea", required: false, defaultValue: "Limited-time flash sale ending soon." },
        { key: "hero_button_text", label: "Button text", type: "text", required: false, defaultValue: "Claim Discount" },
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
      type: "features",
      label: "Features",
      required: false,
      fields: [
        { key: "features_heading", label: "Section heading", type: "text", required: false, defaultValue: "Deal Highlights" },
        { key: "feature_1_title", label: "Feature 1 title", type: "text", required: false, defaultValue: "Today only" },
        { key: "feature_1_desc", label: "Feature 1 description", type: "textarea", required: false, defaultValue: "This flash sale price is available for a limited time. Don't miss out." },
        { key: "feature_2_title", label: "Feature 2 title", type: "text", required: false, defaultValue: "Free shipping" },
        { key: "feature_2_desc", label: "Feature 2 description", type: "textarea", required: false, defaultValue: "Free standard shipping on all flash sale orders. No minimum." },
      ],
    },
    {
      id: "reviews",
      type: "reviews",
      label: "Reviews",
      required: false,
      fields: [
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "3.9" },
        { key: "reviews_heading", label: "Section heading", type: "text", required: false, defaultValue: "Customer Reviews" },
        { key: "review_1_rating", label: "Review 1 rating (0–5)", type: "text", required: false, defaultValue: "4" },
        { key: "review_1_text", label: "Review 1", type: "textarea", required: false, defaultValue: "Grabbed it during the last flash sale. Amazing quality for the price. So glad I didn't wait." },
        { key: "review_1_author", label: "Review 1 author", type: "text", required: false, defaultValue: "Jess L." },
        { key: "review_2_rating", label: "Review 2 rating (0–5)", type: "text", required: false, defaultValue: "5" },
        { key: "review_2_text", label: "Review 2", type: "textarea", required: false, defaultValue: "Best deal I've seen. Fast shipping and exactly as described. 10/10." },
        { key: "review_2_author", label: "Review 2 author", type: "text", required: false, defaultValue: "Mike R." },
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
      ],
    },
  ],
};
