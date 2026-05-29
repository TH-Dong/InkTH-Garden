import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const prettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark-dimmed",
  },
  keepBackground: false,
  defaultLang: {
    block: "plaintext",
  },
  tokensMap: {
    fn: "entity.name.function",
    kw: "keyword",
    str: "string",
    type: "entity.name.type",
    var: "variable.other",
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeKatex)
  .use(rehypePrettyCode, prettyCodeOptions)
  .use(rehypeStringify, { allowDangerousHtml: true });

/**
 * Normalize block math for remark-math compatibility.
 * Finds all $$...$$ pairs and re-emits them in canonical format.
 */
function normalizeBlockMath(md: string): string {
  const codeBlocks: string[] = [];
  let processed = md.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
    const cleaned = formula
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l !== "")
      .join("\n");

    if (cleaned === "") return "";
    return `\n\n$$\n${cleaned}\n$$\n\n`;
  });

  processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_match, idx: string) => {
    return codeBlocks[parseInt(idx)];
  });

  processed = processed.replace(/\n{3,}/g, "\n\n");
  return processed;
}

/**
 * Keep display math attached to the list item when the source is written like:
 * - text$$...$$
 *
 * Without this, normalization splits the math out of the list and creates
 * excessive whitespace between the bullet text and the formula.
 */
function normalizeListItemBlockMath(md: string): string {
  return md.replace(
    /^(\s*(?:[-+*]|\d+\.)\s+.+?)\n\n\$\$\n([\s\S]*?)\n\$\$(?=\n|$)/gm,
    (_match, prefix: string, formula: string) => {
      const indent = prefix.match(/^\s*/)?.[0] ?? "";
      const blockIndent = `${indent}    `;
      const normalizedFormula = formula
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .map((line) => `${blockIndent}${line}`)
        .join("\n");

      return [
        prefix.trimEnd(),
        "",
        `${blockIndent}$$`,
        normalizedFormula,
        `${blockIndent}$$`,
      ].join("\n");
    },
  );
}

/**
 * Convert Obsidian image embeds to HTML img tags.
 *
 * Supports:
 *   ![[image.png]]          → no size
 *   ![[image.png|400]]      → width=400
 *   ![[image.png|400x300]]  → width=400
 *
 * Images are resolved to /images/knowledges/<slug-directory>/
 * where slug-directory is derived from the article's category path.
 */
function convertObsidianImages(md: string, imageBasePath: string): string {
  return md.replace(/!\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
    const parts = inner.split("|");
    const filename = parts[0].trim();
    const sizeStr = parts[1]?.trim();

    let widthAttr = "";
    if (sizeStr) {
      // "400" or "400x300" — we only use width
      const width = sizeStr.split("x")[0];
      if (/^\d+$/.test(width)) {
        widthAttr = ` width="${width}"`;
      }
    }

    const src = `${imageBasePath}/${filename}`;
    return `<img src="${src}" alt="${filename}"${widthAttr} />`;
  });
}

/**
 * Derive the image base path from a content slug.
 *
 * Knowledge posts live under nested directories, so we use the directory path:
 *   "cs/machine-learning/05-线性回归" -> "/images/knowledges/cs/machine-learning"
 *
 * Blogs and readings use the article slug itself:
 *   "blogs/modelMerging" -> "/images/blogs/modelMerging"
 *   "readings/ddia" -> "/images/readings/ddia"
 */
function getImageBasePath(slug?: string): string {
  if (!slug) return "/images";

  const parts = slug.split("/");
  const [contentType, ...rest] = parts;

  if (contentType === "blogs" || contentType === "readings") {
    return `/images/${contentType}/${rest.join("/")}`;
  }

  // Knowledge articles use their parent directory as the image bucket.
  const dirPath = parts.slice(0, -1).join("/");
  return `/images/knowledges/${dirPath}`;
}

/**
 * Convert Obsidian ==highlight== syntax to HTML <mark> tags.
 * Protects code blocks and inline code from conversion.
 */
function convertHighlights(md: string): string {
  // Protect code blocks
  const codeBlocks: string[] = [];
  let processed = md.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__HIGHLIGHT_CB_${codeBlocks.length - 1}__`;
  });

  // Protect inline code
  const inlineCodes: string[] = [];
  processed = processed.replace(/`[^`]+`/g, (match) => {
    inlineCodes.push(match);
    return `__HIGHLIGHT_IC_${inlineCodes.length - 1}__`;
  });

  // Convert ==text== to <mark>text</mark>
  processed = processed.replace(/==([^=]+)==/g, "<mark>$1</mark>");

  // Restore inline code
  processed = processed.replace(/__HIGHLIGHT_IC_(\d+)__/g, (_match, idx: string) => {
    return inlineCodes[parseInt(idx)];
  });

  // Restore code blocks
  processed = processed.replace(/__HIGHLIGHT_CB_(\d+)__/g, (_match, idx: string) => {
    return codeBlocks[parseInt(idx)];
  });

  return processed;
}

/** Convert raw markdown string to HTML string */
export async function renderMarkdown(
  markdown: string,
  slug?: string,
): Promise<string> {
  const imageBasePath = getImageBasePath(slug);
  let content = convertObsidianImages(markdown, imageBasePath);
  content = normalizeBlockMath(content);
  content = normalizeListItemBlockMath(content);
  content = convertHighlights(content);
  const result = await processor.process(content);
  return String(result);
}
