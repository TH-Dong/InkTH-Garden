import Link from "next/link";
import type { Reading } from "@/types/content";

interface ReadingArticleProps {
  reading: Reading;
  html: string;
}

export default function ReadingArticle({ reading, html }: ReadingArticleProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/readings"
        className="inline-block text-sm text-muted transition-colors hover:text-accent"
      >
        &larr; All readings
      </Link>

      <header className="mt-6 mb-10">
        <p className="text-sm uppercase tracking-[0.14em] text-accent-muted">
          Reading Note
        </p>
        {reading.cover && (
          <div className="mt-6 mb-8 max-w-xs overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reading.cover}
              alt={reading.title}
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
        )}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {reading.title}
        </h1>
        <p className="mt-2 text-base text-muted-strong">{reading.author}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <time>{reading.date}</time>
          {reading.tags.map((tag) => (
            <span key={tag} className="text-accent-muted">
              #{tag}
            </span>
          ))}
        </div>
        {reading.comment && (
          <p className="mt-5 max-w-2xl leading-relaxed text-muted-strong">
            {reading.comment}
          </p>
        )}
      </header>

      <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
