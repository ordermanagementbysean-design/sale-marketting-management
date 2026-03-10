import type { TemplateConfig } from "../types";

export const problemSolutionTemplate: TemplateConfig = {
  id: "problem_solution",
  name: "Problem → Solution Landing",
  structure: ["problem", "agitate", "solution", "how_it_works", "benefits", "testimonials", "cta"],
  sections: [
    {
      id: "problem_01",
      type: "hero",
      layout: "centered",
      label: "Problem (Hero)",
      required: true,
      fields: [
        { key: "hero_heading", label: "Heading", type: "text", required: true, defaultValue: "Tired of Dealing With This Problem?" },
        { key: "hero_text", label: "Subtext", type: "textarea", required: false, defaultValue: "Our product provides the easiest solution." },
        { key: "hero_button_text", label: "Button text", type: "text", required: false, defaultValue: "See How It Works" },
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
        { key: "solution_image", label: "Solution image URL", type: "image", required: false, placeholder: "https://..." },
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
      fields: [
        { key: "benefits_heading", label: "Section heading", type: "text", required: false, defaultValue: "Benefits" },
        { key: "benefit_1", label: "Benefit 1", type: "text", required: false, defaultValue: "Solves the problem at the source" },
        { key: "benefit_2", label: "Benefit 2", type: "text", required: false, defaultValue: "No learning curve—works right away" },
        { key: "benefit_3", label: "Benefit 3", type: "text", required: false, defaultValue: "Backed by a satisfaction guarantee" },
      ],
    },
    {
      id: "testimonials",
      type: "testimonials",
      label: "Testimonials",
      required: false,
      fields: [
        { key: "reviews_rating", label: "Rating (0–5)", type: "text", required: false, defaultValue: "4.5" },
        { key: "testimonials_heading", label: "Section heading", type: "text", required: false, defaultValue: "What People Say" },
        { key: "review_1_rating", label: "Review 1 rating (0–5)", type: "text", required: false, defaultValue: "5" },
        { key: "testimonial_1", label: "Testimonial 1", type: "textarea", required: false, defaultValue: "Finally, something that actually works. I was skeptical but the results speak for themselves." },
        { key: "testimonial_1_author", label: "Author 1", type: "text", required: false, defaultValue: "Chris R." },
        { key: "review_2_rating", label: "Review 2 rating (0–5)", type: "text", required: false, defaultValue: "4" },
        { key: "testimonial_2", label: "Testimonial 2", type: "textarea", required: false, defaultValue: "Wish I had found this sooner. Simple solution to a problem I've had for years." },
        { key: "testimonial_2_author", label: "Author 2", type: "text", required: false, defaultValue: "Jordan P." },
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
      ],
    },
  ],
};
