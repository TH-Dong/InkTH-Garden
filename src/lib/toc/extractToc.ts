import type { TocItem } from "@/types/content";

/** Extract H2 and H3 headings from rendered HTML for TOC */
export function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const regex = /<h([23])\s+id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10) as 2 | 3;
    const id = match[2];
    const headingHtml = match[3].trim();
    // Strip HTML tags from heading text
    const text = headingHtml.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    items.push({ id, text, html: headingHtml, level });
  }

  return items;
}
