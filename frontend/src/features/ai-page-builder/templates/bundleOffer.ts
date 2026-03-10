import type { TemplateConfig } from "../types";

export const bundleOfferTemplate: TemplateConfig = {
  id: "bundle_offer",
  name: "Bundle Offer Page",
  structure: ["hero", "bundle_pricing", "savings", "features", "reviews", "cta"],
  sections: [
    {
      id: "bundle_hero",
      type: "hero",
      layout: "centered",
      label: "Hero",
      required: true,
      fields: [
        { key: "hero_heading", label: "Heading", type: "text", required: true, defaultValue: "Buy More & Save More" },
        { key: "hero_text", label: "Subtext", type: "textarea", required: false, defaultValue: "Exclusive bundle discounts for a limited time." },
        { key: "hero_button_text", label: "Button text", type: "text", required: false, defaultValue: "Get Bundle Deal" },
      ],
    },
    {
      id: "bundle_pricing",
      type: "bundle_pricing",
      label: "Bundle pricing",
      required: true,
      fields: [
        { key: "bundle_heading", label: "Section heading", type: "text", required: true, defaultValue: "Choose Your Bundle" },
        { key: "bundle_1_name", label: "Bundle 1 name", type: "text", required: true, defaultValue: "Starter — 1 item" },
        { key: "bundle_1_price", label: "Bundle 1 price", type: "text", required: true, defaultValue: "$29" },
        { key: "bundle_2_name", label: "Bundle 2 name", type: "text", required: false, defaultValue: "Best Value — 3 items" },
        { key: "bundle_2_price", label: "Bundle 2 price", type: "text", required: false, defaultValue: "$69" },
        { key: "bundle_best_value", label: "Best value label", type: "text", required: false, defaultValue: "Best Value" },
      ],
    },
    {
      id: "savings",
      type: "savings",
      label: "Savings",
      required: false,
      fields: [
        { key: "savings_heading", label: "Section heading", type: "text", required: false, defaultValue: "You Save" },
        { key: "savings_amount", label: "Savings amount/text", type: "text", required: false, defaultValue: "Up to 40% when you bundle" },
        { key: "savings_note", label: "Savings note", type: "textarea", required: false, defaultValue: "Compared to buying each item separately. Limited-time bundle pricing." },
      ],
    },
    {
      id: "features",
      type: "features",
      label: "Features",
      required: false,
      fields: [
        { key: "features_heading", label: "Section heading", type: "text", defaultValue: "What's Included" },
        { key: "feature_1_title", label: "Feature 1 title", type: "text", defaultValue: "Full product set" },
        { key: "feature_1_desc", label: "Feature 1 description", type: "textarea", defaultValue: "Everything you need in one bundle—no extra purchases required." },
        { key: "feature_2_title", label: "Feature 2 title", type: "text", defaultValue: "Exclusive bundle bonus" },
        { key: "feature_2_desc", label: "Feature 2 description", type: "textarea", defaultValue: "Extra value items only available with this bundle deal." },
      ],
    },
    {
      id: "reviews",
      type: "reviews",
      label: "Reviews",
      required: false,
      fields: [
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "4.6" },
        { key: "reviews_heading", label: "Section heading", type: "text", required: false, defaultValue: "Customer Reviews" },
        { key: "review_1_rating", label: "Review 1 rating (0–5)", type: "text", required: false, defaultValue: "5" },
        { key: "review_1_text", label: "Review 1", type: "textarea", required: false, defaultValue: "The bundle was a no-brainer. Saved a lot and got more than I expected. Love it." },
        { key: "review_1_author", label: "Review 1 author", type: "text", required: false, defaultValue: "Sam D." },
        { key: "review_2_rating", label: "Review 2 rating (0–5)", type: "text", required: false, defaultValue: "4.5" },
        { key: "review_2_text", label: "Review 2", type: "textarea", required: false, defaultValue: "Best deal I've found. Quality is great across all items. Will buy again." },
        { key: "review_2_author", label: "Review 2 author", type: "text", required: false, defaultValue: "Taylor M." },
      ],
    },
    {
      id: "cta",
      type: "cta",
      label: "CTA",
      required: true,
      fields: [
        { key: "cta_heading", label: "CTA heading", type: "text", required: true, defaultValue: "Grab the Bundle" },
        { key: "cta_button", label: "Button text", type: "text", required: true, defaultValue: "Get Bundle Deal" },
      ],
    },
  ],
};
