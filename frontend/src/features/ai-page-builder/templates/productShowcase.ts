import type { TemplateConfig } from "../types";

export const productShowcaseTemplate: TemplateConfig = {
  id: "product_showcase",
  name: "Product Showcase Landing",
  structure: ["hero", "problem", "benefits", "product_demo", "features", "testimonials", "guarantee", "cta", "footer"],
  sections: [
    {
      id: "hero_01",
      type: "hero",
      layout: "two-column",
      label: "Hero",
      required: true,
      fields: [
        { key: "hero_heading", label: "Heading", type: "text", required: true, defaultValue: "Amazing Product That Solves Your Problem" },
        { key: "hero_text", label: "Subtext", type: "textarea", required: false, defaultValue: "Discover why thousands of customers love this product." },
        { key: "hero_button_text", label: "Button text", type: "text", required: false, defaultValue: "Buy Now" },
        { key: "hero_image", label: "Hero image URL", type: "image", required: false, placeholder: "https://..." },
      ],
    },
    {
      id: "problem",
      type: "problem",
      label: "Problem",
      required: false,
      fields: [
        { key: "problem_heading", label: "Section heading", type: "text", required: false, defaultValue: "The Problem" },
        { key: "problem_text", label: "Problem description", type: "textarea", required: false, defaultValue: "You've tried other solutions that promised results but didn't deliver. Wasted time, wasted money—and the issue is still there. Sound familiar?" },
      ],
    },
    {
      id: "benefits",
      type: "benefits",
      label: "Benefits",
      required: false,
      fields: [
        { key: "benefits_heading", label: "Section heading", type: "text", required: false, defaultValue: "Benefits" },
        { key: "benefit_1", label: "Benefit 1", type: "text", required: false, defaultValue: "Saves you time and effort every single day" },
        { key: "benefit_2", label: "Benefit 2", type: "text", required: false, defaultValue: "Proven results backed by real customer reviews" },
        { key: "benefit_3", label: "Benefit 3", type: "text", required: false, defaultValue: "Risk-free with our money-back guarantee" },
      ],
    },
    {
      id: "product_demo",
      type: "product_demo",
      label: "Product demo",
      required: false,
      fields: [
        { key: "demo_heading", label: "Section heading", type: "text", required: false, defaultValue: "See It In Action" },
        { key: "demo_image", label: "Demo image/video URL", type: "url", required: false, placeholder: "https://..." },
      ],
    },
    {
      id: "features",
      type: "features",
      label: "Features",
      required: false,
      fields: [
        { key: "features_heading", label: "Section heading", type: "text", required: false, defaultValue: "Features" },
        { key: "feature_1_title", label: "Feature 1 title", type: "text", required: false, defaultValue: "Easy to Use" },
        { key: "feature_1_desc", label: "Feature 1 description", type: "textarea", required: false, defaultValue: "Set up in minutes. No complicated instructions—just unpack and enjoy." },
        { key: "feature_2_title", label: "Feature 2 title", type: "text", required: false, defaultValue: "Built to Last" },
        { key: "feature_2_desc", label: "Feature 2 description", type: "textarea", required: false, defaultValue: "Durable design and premium materials mean it works day after day, year after year." },
      ],
    },
    {
      id: "testimonials",
      type: "testimonials",
      label: "Testimonials",
      required: false,
      fields: [
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "4.8" },
        { key: "testimonials_heading", label: "Section heading", type: "text", required: false, defaultValue: "What People Say" },
        { key: "review_1_rating", label: "Review 1 rating (0–5)", type: "text", required: false, defaultValue: "5" },
        { key: "testimonial_1", label: "Testimonial 1", type: "textarea", required: false, defaultValue: "This product changed how I do things. I wish I had found it sooner. Worth every penny." },
        { key: "testimonial_1_author", label: "Author 1", type: "text", required: false, defaultValue: "Alex T." },
        { key: "review_2_rating", label: "Review 2 rating (0–5)", type: "text", required: false, defaultValue: "4.5" },
        { key: "testimonial_2", label: "Testimonial 2", type: "textarea", required: false, defaultValue: "Simple, effective, and exactly as described. Customer service was great too. 5 stars." },
        { key: "testimonial_2_author", label: "Author 2", type: "text", required: false, defaultValue: "Maria L." },
      ],
    },
    {
      id: "guarantee",
      type: "guarantee",
      label: "Guarantee",
      required: false,
      fields: [
        { key: "guarantee_heading", label: "Guarantee heading", type: "text", required: false, defaultValue: "Money-Back Guarantee" },
        { key: "guarantee_text", label: "Guarantee text", type: "textarea", required: false, defaultValue: "Try it risk-free. If you're not 100% satisfied within 30 days, return it for a full refund. No hassle, no questions asked." },
      ],
    },
    {
      id: "cta",
      type: "cta",
      label: "CTA",
      required: true,
      fields: [
        { key: "cta_heading", label: "CTA heading", type: "text", required: true, defaultValue: "Get Yours Now" },
        { key: "cta_button", label: "Button text", type: "text", required: true, defaultValue: "Buy Now" },
      ],
    },
    {
      id: "footer",
      type: "footer",
      label: "Footer",
      required: false,
      fields: [
        { key: "footer_text", label: "Footer text", type: "textarea", required: false, defaultValue: "© 2025 Your Brand. All rights reserved." },
        { key: "footer_links", label: "Footer links (comma-separated)", type: "text", required: false, defaultValue: "Privacy Policy, Terms of Service, Contact" },
      ],
    },
  ],
};
