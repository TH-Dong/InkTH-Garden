import Link from "next/link";
import type { KnowledgePost } from "@/types/content";

interface CategoryPageProps {
  categoryPath: string;
  posts: KnowledgePost[];
}

export default function CategoryPage({ categoryPath, posts }: CategoryPageProps) {
  // Derive display title from path, e.g. "cs/algorithm" → "CS / Algorithm"
  const parts = categoryPath.split("/");
  const displayTitle = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" / ");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {displayTitle}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {posts.length} {posts.length === 1 ? "note" : "notes"} in this category.
      </p>

      <ul className="mt-8 space-y-5">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/knowledges/${post.slug}`} className="group block">
              <h2 className="text-base font-medium text-foreground group-hover:text-accent">
                {post.title}
              </h2>
              {post.summary && (
                <p className="mt-1 text-sm leading-relaxed text-muted-strong">
                  {post.summary}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                <time>{post.updated ?? post.date}</time>
                {post.tags.map((tag) => (
                  <span key={tag} className="text-accent-muted">#{tag}</span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length === 0 && (
        <p className="mt-8 text-muted">No notes in this category yet.</p>
      )}
    </div>
  );
}
