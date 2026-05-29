import Link from "next/link";

interface EntryCardProps {
  title: string;
  description: string;
  href: string;
}

export default function EntryCard({ title, description, href }: EntryCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-40 flex-col justify-between rounded-[1.35rem] border border-border-subtle/80 bg-surface-elevated/80 px-5 py-5 transition-elegant hover:-translate-y-0.5 hover:border-accent/20 hover:bg-accent-light/25"
    >
      <h3 className="font-serif text-[1.35rem] leading-[1.08] font-medium text-foreground transition-elegant group-hover:text-accent">
        {title}
        <span className="ml-3 inline-block text-accent/55 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-accent">
          &rarr;
        </span>
      </h3>
      <p className="mt-4 max-w-[24ch] text-[0.92rem] leading-relaxed text-foreground/65">
        {description}
      </p>
    </Link>
  );
}
