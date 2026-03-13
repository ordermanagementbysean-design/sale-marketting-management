import type { TemplateConfig } from "../types";

export const productShowcaseTemplate: TemplateConfig = {
  id: "product_showcase",
  name: "Product Showcase Landing",
  structure: ["hero", "product_info", "problem", "benefits", "product_demo", "features", "reviews", "guarantee", "cta", "footer"],
  sections: [
    {
      id: "hero",
      type: "hero_section",
      layout: "two-column",
      label: "Hero",
      required: true,
      settings: { textAlign: "left", overlay: 0.35 },
      fields: [
        { key: "hero_title", label: "Title", type: "text", required: true, defaultValue: "Amazing Product That Solves Your Problem" },
        { key: "hero_subtitle", label: "Subtitle", type: "textarea", required: false, defaultValue: "Discover why thousands of customers love this product." },
        { key: "hero_ctaText", label: "CTA text", type: "text", required: false, defaultValue: "Buy Now" },
        { key: "hero_ctaLink", label: "CTA link (empty = no redirect)", type: "text", required: false, placeholder: "#order" },
        { key: "hero_bgImage", label: "Background image URL", type: "image", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80" },
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
        { key: "product_name", label: "Product name", type: "text", required: true, defaultValue: "Amazing Product That Solves Your Problem" },
        { key: "product_description", label: "Product description", type: "textarea", required: false, defaultValue: "Discover why thousands of customers love this product. Built to last and easy to use." },
        { key: "product_info_media_style", label: "Cách hiển thị ảnh", type: "text", required: false, defaultValue: "carousel", options: ["thumbnail", "gallery", "carousel"] },
        { key: "product_thumbnail", label: "Ảnh chính (tùy chọn)", type: "image", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1526170375885-4d5ec527a969?w=800&q=80" },
        {
          key: "product_info_images",
          label: "List image",
          type: "image_list",
          required: false,
          values: [
            "https://images.unsplash.com/photo-1526170375885-4d5ec527a969?w=800&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
          ],
        },
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
      settings: { benefitsFieldKey: "benefits" },
      fields: [
        { key: "benefits_heading", label: "Section heading", type: "text", required: false, defaultValue: "Benefits" },
        {
          key: "benefits",
          label: "Benefits (mỗi dòng một ý)",
          type: "string_list",
          required: false,
          values: [
            "Saves you time and effort every single day",
            "Proven results backed by real customer reviews",
            "Risk-free with our money-back guarantee",
          ],
        },
      ],
    },
    {
      id: "product_demo",
      type: "product_demo",
      label: "Product demo",
      required: false,
      fields: [
        { key: "demo_heading", label: "Section heading", type: "text", required: false, defaultValue: "See It In Action" },
        { key: "demo_image", label: "Demo image/video URL", type: "url", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1526170375885-4d5ec527a969?w=800&q=80" },
      ],
    },
    {
      id: "features",
      type: "features_grid",
      label: "Features",
      required: false,
      settings: { columns: 2, iconSize: "sm", featuresFieldKey: "features" },
      fields: [
        { key: "features_heading", label: "Heading", type: "text", required: false, defaultValue: "Features" },
        {
          key: "features",
          label: "Features (icon, title, desc)",
          type: "object_list",
          required: false,
          listItemKeys: ["icon", "title", "desc"],
          values: [
            { icon: "✓", title: "Easy to Use", desc: "Set up in minutes. No complicated instructions—just unpack and enjoy." },
            { icon: "✓", title: "Built to Last", desc: "Durable design and premium materials mean it works day after day, year after year." },
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
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "4.8" },
        { key: "reviews_heading", label: "Title", type: "text", required: false, defaultValue: "What People Say" },
        { key: "review_layout", label: "Cách hiển thị", type: "text", required: false, defaultValue: "list", options: ["list", "slider"] },
        {
          key: "reviews",
          label: "Reviews (rating, comment, author)",
          type: "object_list",
          required: false,
          listItemKeys: ["rating", "comment", "author"],
          values: [
            { rating: "5", comment: "This product changed how I do things. I wish I had found it sooner. Worth every penny.", author: "Alex T." },
            { rating: "4.5", comment: "Simple, effective, and exactly as described. Customer service was great too. 5 stars.", author: "Maria L." },
          ],
        },
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
        { key: "cta_link", label: "Button link (empty = no redirect)", type: "text", required: false, placeholder: "#order" },
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
