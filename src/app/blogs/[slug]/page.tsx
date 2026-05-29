import { notFound } from "next/navigation";
import { getAllBlogs, getBlogBySlug, getAdjacentBlogs } from "@/lib/content/blogs";
import { getAllKnowledgePosts } from "@/lib/content/knowledges";
import { getRelatedBlogs, getRelatedKnowledgeForBlog } from "@/lib/content/related";
import { renderMarkdown } from "@/lib/markdown/render";
import { extractToc } from "@/lib/toc/extractToc";
import ArticleToc from "@/components/article/ArticleToc";
import ReadingProgress from "@/components/article/ReadingProgress";
import BlogArticle from "@/components/blog/BlogArticle";
import BlogNav from "@/components/blog/BlogNav";
import RelatedContent from "@/components/blog/RelatedContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllBlogs().map((post) => ({ slug: post.slug }));
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) notFound();

  const html = await renderMarkdown(post.content, `blogs/${post.slug}`);
  const toc = extractToc(html);
  const { prev, next } = getAdjacentBlogs(slug);
  const relatedBlogs = getRelatedBlogs(post, getAllBlogs(), 2);
  const relatedKnowledge = getRelatedKnowledgeForBlog(post, getAllKnowledgePosts(), 2);

  return (
    <div className="page-container py-16">
      <ReadingProgress />

      <div className="mx-auto xl:grid xl:max-w-5xl xl:grid-cols-[minmax(0,42rem)_12rem] xl:gap-12">
        <div className="min-w-0">
          <div className="mx-auto max-w-2xl xl:max-w-none">
            <BlogArticle post={post} html={html} />
            <RelatedContent
              relatedBlogs={relatedBlogs}
              relatedKnowledge={relatedKnowledge}
            />
            <BlogNav prev={prev} next={next} />
          </div>
        </div>
        <ArticleToc items={toc} updated={post.updated} />
      </div>
    </div>
  );
}
