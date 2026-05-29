import { notFound } from "next/navigation";
import {
  getAllKnowledgePosts,
  getKnowledgeBySlug,
  getPostsByCategory,
  getAdjacentPosts,
} from "@/lib/content/knowledges";
import { renderMarkdown } from "@/lib/markdown/render";
import { extractToc } from "@/lib/toc/extractToc";
import CategoryPage from "@/components/knowledge/CategoryPage";
import ArticlePage from "@/components/knowledge/ArticlePage";
import ArticleNav from "@/components/knowledge/ArticleNav";
import ArticleToc from "@/components/article/ArticleToc";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  const posts = getAllKnowledgePosts();

  // Collect all unique category prefixes (e.g. "cs", "cs/algorithm")
  const categoryPaths = new Set<string>();
  for (const post of posts) {
    const parts = post.slug.split("/");
    // Add each prefix level: "cs", "cs/algorithm"
    for (let i = 1; i < parts.length; i++) {
      categoryPaths.add(parts.slice(0, i).join("/"));
    }
  }

  const params: { slug: string[] }[] = [];

  // Category paths
  for (const cp of categoryPaths) {
    params.push({ slug: cp.split("/") });
  }

  // Article paths
  for (const post of posts) {
    params.push({ slug: post.slug.split("/") });
  }

  return params;
}

export default async function KnowledgeSlugPage({ params }: Props) {
  const { slug } = await params;
  const slugStr = slug.map(decodeURIComponent).join("/");

  // Try article first
  const post = getKnowledgeBySlug(slugStr);

  if (post) {
    const html = await renderMarkdown(post.content, post.slug);
    const toc = extractToc(html);
    const { prev, next } = getAdjacentPosts(slugStr);

    return (
      <>
        <div className="min-w-0 flex-1 px-0 md:px-6 lg:px-8">
          <ArticlePage post={post} html={html} />
          <ArticleNav prev={prev} next={next} />
        </div>
        <ArticleToc items={toc} updated={post.updated} />
      </>
    );
  }

  // Try category
  const categoryPosts = getPostsByCategory(slugStr);
  if (categoryPosts.length > 0) {
    return (
      <div className="min-w-0 flex-1 px-0 md:px-6 lg:px-8">
        <CategoryPage categoryPath={slugStr} posts={categoryPosts} />
      </div>
    );
  }

  // Check if this is a valid category directory even with no posts
  const allPosts = getAllKnowledgePosts();
  const isValidPrefix = allPosts.some((p) =>
    p.slug.startsWith(slugStr + "/")
  );

  if (isValidPrefix) {
    return (
      <div className="min-w-0 flex-1 px-0 md:px-6 lg:px-8">
        <CategoryPage categoryPath={slugStr} posts={[]} />
      </div>
    );
  }

  notFound();
}
