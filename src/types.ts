export type Plan = "free" | "pro";

export interface Blog {
  id: string;
  name: string;
  url: string;
  posts: number;
  pages: number;
}

export interface DiagnosisSummary {
  seoScore: number;
  brokenLinks: number;
  seoIssues: number;
  pagesChecked: number;
  postsChecked: number;
  critical: string[];
  seo: string[];
  good: string[];
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  pro?: boolean;
  installed?: boolean;
  snippet: string;
  instructions: string[];
  requirements?: string[];
}