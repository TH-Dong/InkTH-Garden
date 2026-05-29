import Link from "next/link";
import type { BlogPost } from "@/types/content";

interface BlogArticleProps {
  post: BlogPost;
  html: string;
}

export default function BlogArticle({ post, html }: BlogArticleProps) {
  return (
    <div>
      <Link
        href="/blogs"
        className="inline-block text-sm text-muted transition-colors hover:text-accent"
      >
        &larr; All posts
      </Link>

      <header className="mt-6 mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-3 text-base leading-relaxed text-muted-strong">
            {post.summary}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <time>{post.date}</time>
          {post.updated && post.updated !== post.date && (
            <span>Updated {post.updated}</span>
          )}
          {post.tags.map((tag) => (
            <span key={tag} className="text-accent-muted">#{tag}</span>
          ))}
        </div>
      </header>

      <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
