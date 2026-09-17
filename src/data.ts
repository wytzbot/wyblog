import type { Blog, DiagnosisSummary, Plugin } from "./types";

export const demoBlog: Blog = {
  id: "demo-blog",
  name: "Your Blogger Site",
  url: "https://example.blogspot.com",
  posts: 246,
  pages: 18
};

export const demoDiagnosis: DiagnosisSummary = {
  seoScore: 84,
  brokenLinks: 7,
  seoIssues: 12,
  pagesChecked: 18,
  postsChecked: 246,
  critical: [
    "7 links returned errors during the latest site scan.",
    "2 affected pages need attention."
  ],
  seo: [
    "8 posts need stronger search descriptions.",
    "4 images are missing useful alt text."
  ],
  good: [
    "HTTPS detected.",
    "Most post URLs are valid.",
    "Blog title is configured."
  ]
};

export const plugins: Plugin[] = [
  { id: "seo", name: "SEO Toolkit", description: "Site-wide SEO checks, metadata helpers and health insights.", category: "SEO", installed: true },
  { id: "toc", name: "Table of Contents", description: "Generate clean in-post navigation for long articles.", category: "Content" },
  { id: "related", name: "Related Posts", description: "Add contextual related-post sections to your Blogger theme.", category: "Content" },
  { id: "reading", name: "Reading Progress", description: "Show a lightweight progress indicator on articles.", category: "UX" },
  { id: "dark", name: "Dark Mode", description: "Give visitors a comfortable dark reading option.", category: "UX" },
  { id: "share", name: "Social Share", description: "Add compact share actions to posts.", category: "Growth" },
  { id: "push", name: "Push Notifications", description: "Notify subscribers when new posts are published.", category: "Growth", installed: true },
  { id: "advanced-push", name: "Advanced Push", description: "Scheduling, segmentation and delivery insights.", category: "Growth", pro: true },
  { id: "analytics", name: "Analytics", description: "Bring useful blog performance signals into WyBlog.", category: "Analytics", pro: true },
  { id: "ai-seo", name: "AI SEO", description: "Generate compact SEO recommendations from deterministic findings.", category: "AI", pro: true }
];