import type { TemplateConfig } from "../types";

export const viralTiktokProductTemplate: TemplateConfig = {
  id: "viral_tiktok_product",
  name: "Viral TikTok Product Page",
  structure: ["video_hero", "ugc_reviews", "benefits", "demo_clips", "testimonials", "cta"],
  sections: [
    {
      id: "video_hero",
      type: "hero",
      layout: "centered",
      label: "Video hero",
      required: true,
      fields: [
        { key: "hero_heading", label: "Heading", type: "text", required: true, defaultValue: "The Product Everyone Is Talking About" },
        { key: "hero_button_text", label: "Button text", type: "text", required: false, defaultValue: "Get Yours Now" },
        { key: "hero_video", label: "Hero video URL", type: "video", required: false, placeholder: "https://..." },
      ],
    },
    {
      id: "ugc_reviews",
      type: "ugc_reviews",
      label: "UGC reviews",
      required: false,
      fields: [
        { key: "ugc_heading", label: "Section heading", type: "text", required: false, defaultValue: "Going Viral" },
        { key: "ugc_video_1", label: "UGC video 1 URL", type: "video", required: false, placeholder: "https://..." },
        { key: "ugc_video_2", label: "UGC video 2 URL", type: "video", required: false, placeholder: "https://..." },
        { key: "ugc_quote", label: "Highlight quote", type: "textarea", required: false, defaultValue: "I can't believe how many people are asking where I got this. You need to try it!" },
      ],
    },
    {
      id: "benefits",
      type: "benefits",
      label: "Benefits",
      required: false,
      fields: [
        { key: "benefits_heading", label: "Section heading", type: "text", required: false, defaultValue: "Why It's Trending" },
        { key: "benefit_1", label: "Benefit 1", type: "text", required: false, defaultValue: "Viral on TikTok and Instagram—creators love it" },
        { key: "benefit_2", label: "Benefit 2", type: "text", required: false, defaultValue: "Instant results that look great on camera" },
        { key: "benefit_3", label: "Benefit 3", type: "text", required: false, defaultValue: "Affordable and ships fast so you can join the trend" },
      ],
    },
    {
      id: "demo_clips",
      type: "demo_clips",
      label: "Demo clips",
      required: false,
      fields: [
        { key: "demo_heading", label: "Section heading", type: "text", required: false, defaultValue: "See It In Action" },
        { key: "demo_video_1", label: "Demo video 1 URL", type: "video", required: false, placeholder: "https://..." },
        { key: "demo_video_2", label: "Demo video 2 URL", type: "video", required: false, placeholder: "https://..." },
      ],
    },
    {
      id: "testimonials",
      type: "testimonials",
      label: "Testimonials",
      required: false,
      fields: [
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "4.9" },
        { key: "testimonials_heading", label: "Section heading", type: "text", required: false, defaultValue: "What People Say" },
        { key: "review_1_rating", label: "Review 1 rating (0–5)", type: "text", required: false, defaultValue: "5" },
        { key: "testimonial_1", label: "Testimonial 1", type: "textarea", required: false, defaultValue: "Saw this all over my FYP and had to get it. Did not disappoint. Already ordered a second one!" },
        { key: "testimonial_1_author", label: "Author 1", type: "text", required: false, defaultValue: "@viral_fan" },
        { key: "review_2_rating", label: "Review 2 rating (0–5)", type: "text", required: false, defaultValue: "5" },
        { key: "testimonial_2", label: "Testimonial 2", type: "textarea", required: false, defaultValue: "My followers keep asking for the link. This thing is legit and the price is crazy good." },
        { key: "testimonial_2_author", label: "Author 2", type: "text", required: false, defaultValue: "@creator_life" },
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
      ],
    },
  ],
};
