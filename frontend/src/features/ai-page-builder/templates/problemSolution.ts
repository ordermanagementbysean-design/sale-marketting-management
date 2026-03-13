import type { TemplateConfig } from "../types";

export const problemSolutionTemplate: TemplateConfig = {
  id: "problem_solution",
  name: "Problem → Solution Landing",
  structure: ["hero", "product_info", "agitate", "solution", "how_it_works", "benefits", "reviews", "cta"],
  sections: [
    {
      id: "hero",
      type: "hero_section",
      layout: "centered",
      label: "Problem (Hero)",
      required: true,
      settings: { textAlign: "center", overlay: 0.4 },
      fields: [
        { key: "hero_title", label: "Title", type: "text", required: true, defaultValue: "Tired of Dealing With This Problem?" },
        { key: "hero_subtitle", label: "Subtitle", type: "textarea", required: false, defaultValue: "Our product provides the easiest solution." },
        { key: "hero_ctaText", label: "CTA text", type: "text", required: false, defaultValue: "See How It Works" },
        { key: "hero_ctaLink", label: "CTA link (empty = no redirect)", type: "text", required: false, placeholder: "#order" },
        { key: "hero_bgImage", label: "Background image URL", type: "image", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80" },
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
        { key: "product_name", label: "Product name", type: "text", required: true, defaultValue: "The Solution" },
        { key: "product_description", label: "Product description", type: "textarea", required: false, defaultValue: "Our product provides the easiest solution. Designed to address the root cause—not just the symptoms." },
        { key: "product_info_media_style", label: "Cách hiển thị ảnh", type: "text", required: false, defaultValue: "carousel", options: ["thumbnail", "gallery", "carousel"] },
        { key: "product_thumbnail", label: "Ảnh chính (tùy chọn)", type: "image", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80" },
        {
          key: "product_info_images",
          label: "List image",
          type: "image_list",
          required: false,
          values: [
            "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80",
            "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          ],
        },
      ],
    },
    {
      id: "agitate",
      type: "agitate",
      label: "Agitate",
      required: false,
      fields: [
        { key: "agitate_heading", label: "Section heading", type: "text", required: false, defaultValue: "It Gets Worse If You Wait" },
        { key: "agitate_text", label: "Agitate content", type: "textarea", required: false, defaultValue: "Every day you wait is another day of frustration. The problem doesn't fix itself—it often gets worse. More stress, more cost, more time lost. Stop putting it off." },
      ],
    },
    {
      id: "solution",
      type: "solution",
      label: "Solution",
      required: false,
      fields: [
        { key: "solution_heading", label: "Section heading", type: "text", required: false, defaultValue: "The Solution" },
        { key: "solution_text", label: "Solution description", type: "textarea", required: false, defaultValue: "Our solution is designed to address the root cause—not just the symptoms. Thousands of customers have already made the switch and seen real, lasting results. Simple to use, effective from day one." },
        { key: "solution_image", label: "Solution image URL", type: "image", required: false, placeholder: "https://...", defaultValue: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80" },
      ],
    },
    {
      id: "how_it_works",
      type: "how_it_works",
      label: "How it works",
      required: false,
      fields: [
        { key: "how_heading", label: "Section heading", type: "text", required: false, defaultValue: "How It Works" },
        { key: "step_1", label: "Step 1", type: "text", required: false, defaultValue: "Choose your plan and sign up in under a minute" },
        { key: "step_2", label: "Step 2", type: "text", required: false, defaultValue: "Follow our simple guide to get set up" },
        { key: "step_3", label: "Step 3", type: "text", required: false, defaultValue: "See the difference—results you can measure" },
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
            "Solves the problem at the source",
            "No learning curve—works right away",
            "Backed by a satisfaction guarantee",
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
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "4.5" },
        { key: "reviews_heading", label: "Title", type: "text", required: false, defaultValue: "What People Say" },
        { key: "review_layout", label: "Cách hiển thị", type: "text", required: false, defaultValue: "list", options: ["list", "slider"] },
        {
          key: "reviews",
          label: "Reviews (rating, comment, author)",
          type: "object_list",
          required: false,
          listItemKeys: ["rating", "comment", "author"],
          values: [
            { rating: "5", comment: "Finally, something that actually works. I was skeptical but the results speak for themselves.", author: "Chris R." },
            { rating: "4", comment: "Wish I had found this sooner. Simple solution to a problem I've had for years.", author: "Jordan P." },
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
        { key: "cta_heading", label: "CTA heading", type: "text", required: true, defaultValue: "Get the Solution" },
        { key: "cta_button", label: "Button text", type: "text", required: true, defaultValue: "Get Started" },
        { key: "cta_link", label: "Button link (empty = no redirect)", type: "text", required: false, placeholder: "#order" },
      ],
    },
  ],
};
