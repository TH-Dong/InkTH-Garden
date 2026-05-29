import type { KnowledgePost } from "@/types/content";

interface ArticlePageProps {
  post: KnowledgePost;
  html: string;
}

export default function ArticlePage({ post, html }: ArticlePageProps) {
  return (
    <div>
      <header className="mb-8">
        <p className="text-sm text-muted">
          {post.category} / {post.subcategory}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-2 text-muted-strong">{post.summary}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
          <time>{post.date}</time>
          {post.updated && post.updated !== post.date && (
            <span>Updated {post.updated}</span>
          )}
          {post.tags.map((tag) => (
            <span key={tag} className="text-accent-muted">#{tag}</span>
          ))}
        </div>
      </header>

      <article
        className="prose prose-knowledge"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
