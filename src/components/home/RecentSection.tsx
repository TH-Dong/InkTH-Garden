import Link from "next/link";

export interface RecentItem {
  title: string;
  summary?: string;
  date: string;
  href: string;
  type: "knowledge" | "blog";
}

interface RecentSectionProps {
  items: RecentItem[];
}

export default function RecentSection({ items }: RecentSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border-subtle py-16">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Recent
      </h2>
      <p className="mt-1 text-sm text-muted">
        Latest notes and posts.
      </p>

      <ul className="mt-8 space-y-6">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group block">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-base font-medium text-foreground group-hover:text-accent">
                  {item.title}
                </h3>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded bg-accent-light px-1.5 py-0.5 text-[11px] text-accent">
                    {item.type === "knowledge" ? "note" : "blog"}
                  </span>
                  <time className="text-sm text-muted">{item.date}</time>
                </div>
              </div>
              {item.summary && (
                <p className="mt-1 text-sm leading-relaxed text-muted-strong">
                  {item.summary}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
