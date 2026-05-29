import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { KnowledgePost } from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "src/content/knowledges");

/** Recursively find all .md files under a directory */
function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Normalize a path segment into a URL-safe slug (spaces → hyphens, lowercase) */
function slugify(segment: string): string {
  return segment
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/** Parse a single knowledge markdown file into a KnowledgePost */
function parseKnowledge(filePath: string): KnowledgePost {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const relative = path.relative(CONTENT_DIR, filePath);
  const slug = relative
    .replace(/\.md$/, "")
    .split(path.sep)
    .map(slugify)
    .join("/");

  const parts = relative.split(path.sep);
  const category = parts.length >= 2 ? parts[0] : "";
  const subcategory = parts.length >= 3 ? parts[1] : "";

  return {
    slug,
    title: data.title ?? path.basename(filePath, ".md"),
    date: data.date ?? "",
    updated: data.updated,
    tags: data.tags ?? [],
    summary: data.summary,
    draft: data.draft ?? false,
    category,
    subcategory,
    content,
  };
}

/** Get all knowledge posts, sorted by slug ascending (01, 02, 03...) */
export function getAllKnowledgePosts(): KnowledgePost[] {
  const files = getMarkdownFiles(CONTENT_DIR);
  return files
    .map(parseKnowledge)
    .filter((p) => !p.draft)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Get a single knowledge post by slug */
export function getKnowledgeBySlug(slug: string): KnowledgePost | undefined {
  const all = getAllKnowledgePosts();
  return all.find((p) => p.slug === slug);
}

/** Get posts under a category path (e.g. "cs" or "cs/machine-learning") */
export function getPostsByCategory(categoryPath: string): KnowledgePost[] {
  const prefix = slugify(categoryPath) + "/";
  return getAllKnowledgePosts().filter((p) => p.slug.startsWith(prefix));
}

/** Get prev/next posts within the same subcategory */
export function getAdjacentPosts(slug: string): { prev?: KnowledgePost; next?: KnowledgePost } {
  const post = getKnowledgeBySlug(slug);
  if (!post) return {};

  const categoryPrefix = [post.category, post.subcategory]
    .map(slugify)
    .join("/") + "/";
  const siblings = getAllKnowledgePosts().filter((p) => p.slug.startsWith(categoryPrefix));

  const idx = siblings.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? siblings[idx - 1] : undefined,
    next: idx < siblings.length - 1 ? siblings[idx + 1] : undefined,
  };
}
