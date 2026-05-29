import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost } from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blogs");

/** Effective sort date: prefer updated, fall back to date */
function sortDate(post: BlogPost): string {
  return post.updated ?? post.date;
}

function parsePost(filePath: string): BlogPost {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, ".md");

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    updated: data.updated,
    tags: data.tags ?? [],
    summary: data.summary,
    draft: data.draft ?? false,
    content,
  };
}

/** Get all blog posts, sorted by updated/date descending */
export function getAllBlogs(): BlogPost[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parsePost(path.join(CONTENT_DIR, f)))
    .filter((p) => !p.draft)
    .sort((a, b) => (sortDate(b) > sortDate(a) ? 1 : -1));
}

/** Get a single blog post by slug */
export function getBlogBySlug(slug: string): BlogPost | undefined {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;
  const post = parsePost(filePath);
  return post.draft ? undefined : post;
}

/** Get all unique tags across all blog posts */
export function getAllBlogTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllBlogs()) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

/** Get prev/next posts based on the sorted blog list */
export function getAdjacentBlogs(slug: string): { prev?: BlogPost; next?: BlogPost } {
  const all = getAllBlogs();
  const idx = all.findIndex((p) => p.slug === slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? all[idx - 1] : undefined,
    next: idx < all.length - 1 ? all[idx + 1] : undefined,
  };
}
