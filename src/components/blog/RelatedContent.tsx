import Link from "next/link";
import type { BlogPost, KnowledgePost } from "@/types/content";

interface RelatedContentProps {
  relatedBlogs: BlogPost[];
  relatedKnowledge: KnowledgePost[];
}

function RelatedGroup({
  title,
  eyebrow,
  items,
  getHref,
}: {
  title: string;
  eyebrow: string;
  items: Array<BlogPost | KnowledgePost>;
  getHref: (item: BlogPost | KnowledgePost) => string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-[1.4rem] border border-border-subtle bg-surface-elevated/75 p-5 shadow-[var(--shadow-soft)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-accent-muted">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-xl text-foreground">
        {title}
      </h2>

      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={getHref(item)} className="group block">
              <h3 className="text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                {item.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <time>{item.updated ?? item.date}</time>
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-accent-muted">
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function RelatedContent({
  relatedBlogs,
  relatedKnowledge,
}: RelatedContentProps) {
  if (relatedBlogs.length === 0 && relatedKnowledge.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-border-subtle pt-8">
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-accent-muted">
          Continue Reading
        </p>
        <h2 className="mt-2 font-serif text-2xl text-foreground">
          Related posts and notes
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-strong">
          A few nearby threads from the same cluster of ideas.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <RelatedGroup
          title="Related posts"
          eyebrow="Blogs"
          items={relatedBlogs}
          getHref={(item) => `/blogs/${item.slug}`}
        />
        <RelatedGroup
          title="Related notes"
          eyebrow="Knowledges"
          items={relatedKnowledge}
          getHref={(item) => `/knowledges/${item.slug}`}
        />
      </div>
    </section>
  );
}
