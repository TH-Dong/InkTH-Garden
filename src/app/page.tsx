import Hero from "@/components/home/Hero";
import RecentSection from "@/components/home/RecentSection";
import type { RecentItem } from "@/components/home/RecentSection";
import EntryCard from "@/components/EntryCard";
import { getAllKnowledgePosts } from "@/lib/content/knowledges";
import { getAllBlogs } from "@/lib/content/blogs";

const sections = [
  {
    title: "Knowledges",
    description: "Structured notes on CS, Math, and LLM topics.",
    href: "/knowledges",
  },
  {
    title: "Blogs",
    description: "Long-form writing on topics I find interesting.",
    href: "/blogs",
  },
  {
    title: "Projects",
    description: "A collection of things I've built.",
    href: "/projects",
  },
  {
    title: "Readings",
    description: "Books I've read with notes and reflections.",
    href: "/readings",
  },
];

function getRecentItems(limit = 5): RecentItem[] {
  const knowledgePosts = getAllKnowledgePosts().map((p) => ({
    title: p.title,
    summary: p.summary,
    date: p.updated ?? p.date,
    href: `/knowledges/${p.slug}`,
    type: "knowledge" as const,
  }));

  const blogPosts = getAllBlogs().map((p) => ({
    title: p.title,
    summary: p.summary,
    date: p.updated ?? p.date,
    href: `/blogs/${p.slug}`,
    type: "blog" as const,
  }));

  return [...knowledgePosts, ...blogPosts]
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, limit);
}

export default function Home() {
  const recentItems = getRecentItems();

  return (
    <div className="page-container">
      <Hero />

      {/* Section entries */}
      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <EntryCard key={section.href} {...section} />
        ))}
      </section>

      <RecentSection items={recentItems} />
    </div>
  );
}
