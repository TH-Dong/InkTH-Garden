import Link from "next/link";
import type { KnowledgePost } from "@/types/content";

interface ArticleNavProps {
  prev?: KnowledgePost;
  next?: KnowledgePost;
}

export default function ArticleNav({ prev, next }: ArticleNavProps) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-12 flex items-stretch gap-4 border-t border-border-subtle pt-6">
      {prev ? (
        <Link
          href={`/knowledges/${prev.slug}`}
          className="group flex-1 rounded-md border border-border bg-surface-elevated px-4 py-3 transition-colors hover:border-accent-muted"
        >
          <span className="text-xs text-muted">Previous</span>
          <p className="mt-0.5 text-sm font-medium text-muted-strong group-hover:text-accent">
            {prev.title}
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={`/knowledges/${next.slug}`}
          className="group flex-1 rounded-md border border-border bg-surface-elevated px-4 py-3 text-right transition-colors hover:border-accent-muted"
        >
          <span className="text-xs text-muted">Next</span>
          <p className="mt-0.5 text-sm font-medium text-muted-strong group-hover:text-accent">
            {next.title}
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
