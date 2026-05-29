import fs from "fs";
import path from "path";
import type { KnowledgeTreeNode } from "@/types/content";
import { getAllKnowledgePosts } from "./knowledges";

const CONTENT_DIR = path.join(process.cwd(), "src/content/knowledges");

function slugify(s: string): string {
  return s.replace(/\s+/g, "-").toLowerCase();
}

/** Build the knowledge category tree from the directory structure */
export function getKnowledgeTree(): KnowledgeTreeNode[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const posts = getAllKnowledgePosts();
  const topDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  return topDirs.map((topDir) => {
    const topPath = slugify(topDir.name);
    const topFull = path.join(CONTENT_DIR, topDir.name);

    const subDirs = fs.existsSync(topFull)
      ? fs
          .readdirSync(topFull, { withFileTypes: true })
          .filter((d) => d.isDirectory())
      : [];

    const children: KnowledgeTreeNode[] = subDirs.map((subDir) => {
      const subPath = `${topPath}/${slugify(subDir.name)}`;
      const subPostCount = posts.filter((p) =>
        p.slug.startsWith(subPath + "/")
      ).length;

      return {
        name: subDir.name,
        path: subPath,
        children: [],
        postCount: subPostCount,
      };
    });

    const topPostCount = posts.filter((p) =>
      p.slug.startsWith(topPath + "/")
    ).length;

    return {
      name: topDir.name,
      path: topPath,
      children,
      postCount: topPostCount,
    };
  });
}
