import Link from "next/link";
import type { Reading } from "@/types/content";

interface ReadingCardProps {
  reading: Reading;
}

export default function ReadingCard({ reading }: ReadingCardProps) {
  const noteHref =
    reading.noteLink?.trim() || (reading.content.trim() ? `/readings/${reading.slug}` : "");

  const inner = (
    <>
      {/* Cover area */}
      <div className="aspect-[3/4] w-full overflow-hidden bg-accent-light/50">
        {reading.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reading.cover}
            alt={reading.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3">
            <span className="text-center text-xs font-medium leading-snug text-muted">
              {reading.title}
            </span>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="px-3.5 py-3">
        <h2 className="text-[0.83rem] font-medium leading-snug text-foreground">
          {reading.title}
        </h2>
        <p className="mt-1 text-[11px] text-muted">{reading.author}</p>
        {reading.comment && (
          <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-muted-strong">
            {reading.comment}
          </p>
        )}
        {reading.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {reading.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-accent-light px-1.5 py-0.5 text-[10px] text-accent-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const cardClass =
    "group flex h-full max-w-[12.75rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-elegant hover:-translate-y-0.5 hover:border-accent-muted";

  if (noteHref) {
    return (
      <Link href={noteHref} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}
