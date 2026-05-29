import type { BlogPost, KnowledgePost } from "@/types/content";

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{Letter}\p{Number}]+/gu) ?? []).filter(
    (token) => token.length > 1 || /[\p{Script=Han}]/u.test(token),
  );
}

function collectKeywords(item: Pick<BlogPost | KnowledgePost, "title" | "summary">): Set<string> {
  return new Set(tokenize([item.title, item.summary ?? ""].join(" ")));
}

function scoreSimilarity(
  source: Pick<BlogPost | KnowledgePost, "title" | "summary" | "tags">,
  candidate: Pick<BlogPost | KnowledgePost, "title" | "summary" | "tags">,
): number {
  const sourceTags = new Set(source.tags.map(normalizeTag));
  const candidateTags = new Set(candidate.tags.map(normalizeTag));
  const sharedTags = [...candidateTags].filter((tag) => sourceTags.has(tag)).length;

  const sourceKeywords = collectKeywords(source);
  const candidateKeywords = collectKeywords(candidate);
  const sharedKeywords = [...candidateKeywords].filter((token) => sourceKeywords.has(token)).length;

  return sharedTags * 8 + sharedKeywords * 2;
}

function compareByRecency(
  a: Pick<BlogPost | KnowledgePost, "date" | "updated">,
  b: Pick<BlogPost | KnowledgePost, "date" | "updated">,
): number {
  const aDate = a.updated ?? a.date;
  const bDate = b.updated ?? b.date;
  return bDate.localeCompare(aDate);
}

function rankRelated<T extends BlogPost | KnowledgePost>(
  source: Pick<BlogPost | KnowledgePost, "slug" | "title" | "summary" | "tags">,
  candidates: T[],
  limit: number,
): T[] {
  const scored = candidates
    .filter((candidate) => candidate.slug !== source.slug)
    .map((candidate) => ({
      candidate,
      score: scoreSimilarity(source, candidate),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return compareByRecency(a.candidate, b.candidate);
    });

  const relevant = scored.filter((entry) => entry.score > 0).slice(0, limit);
  if (relevant.length === limit) {
    return relevant.map((entry) => entry.candidate);
  }

  const usedSlugs = new Set(relevant.map((entry) => entry.candidate.slug));
  const fallback = scored
    .filter((entry) => !usedSlugs.has(entry.candidate.slug))
    .slice(0, limit - relevant.length);

  return [...relevant, ...fallback].map((entry) => entry.candidate);
}

export function getRelatedBlogs(post: BlogPost, allBlogs: BlogPost[], limit = 3): BlogPost[] {
  return rankRelated(post, allBlogs, limit);
}

export function getRelatedKnowledgeForBlog(
  post: BlogPost,
  allKnowledgePosts: KnowledgePost[],
  limit = 3,
): KnowledgePost[] {
  return rankRelated(post, allKnowledgePosts, limit);
}
