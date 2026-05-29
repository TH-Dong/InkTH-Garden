export interface KnowledgePost {
  slug: string;        // e.g. "cs/algorithm/divide-and-conquer"
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  summary?: string;
  draft: boolean;
  category: string;    // top-level: "CS", "Math", "LLM"
  subcategory: string; // e.g. "Algorithm", "Linear-Algebra"
  content: string;     // raw markdown body
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  summary?: string;
  draft: boolean;
  content: string;
}

export interface TocItem {
  id: string;
  text: string;
  html: string;
  level: 2 | 3;
}

export interface KnowledgeTreeNode {
  name: string;          // display name, e.g. "Algorithm"
  path: string;          // URL path segment, e.g. "cs/algorithm"
  children: KnowledgeTreeNode[];
  postCount: number;     // number of posts in this node (including children)
}

export interface Reading {
  slug: string;
  title: string;
  author: string;
  date: string;
  tags: string[];
  cover?: string;
  comment?: string;
  noteLink?: string;
  draft: boolean;
  content: string;
}
