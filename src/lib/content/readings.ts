import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Reading } from "@/types/content";
import { withBasePath } from "@/lib/basePath";

const CONTENT_DIR = path.join(process.cwd(), "src/content/readings");

function parseReading(filePath: string): Reading {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, ".md");

  return {
    slug,
    title: data.title ?? slug,
    author: data.author ?? "",
    date: data.date ?? "",
    tags: data.tags ?? [],
    cover: typeof data.cover === "string" ? withBasePath(data.cover) : undefined,
    comment: data.comment,
    noteLink: data.noteLink,
    draft: data.draft ?? false,
    content,
  };
}

export function getReadingBySlug(slug: string): Reading | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const reading = parseReading(filePath);
  return reading.draft ? null : reading;
}

/** Get all readings, sorted by date descending */
export function getAllReadings(): Reading[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseReading(path.join(CONTENT_DIR, f)))
    .filter((r) => !r.draft)
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}
