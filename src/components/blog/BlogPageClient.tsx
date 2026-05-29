"use client";

import { useState, useMemo } from "react";
import type { BlogPost } from "@/types/content";
import BlogFilters from "@/components/blog/BlogFilters";
import BlogList from "@/components/blog/BlogList";

interface BlogPageClientProps {
  posts: BlogPost[];
  allTags: string[];
}

export default function BlogPageClient({ posts, allTags }: BlogPageClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = posts;

    if (activeTag) {
      result = result.filter((p) => p.tags.includes(activeTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.summary?.toLowerCase().includes(q) ?? false)
      );
    }

    return result;
  }, [posts, activeTag, searchQuery]);

  return (
    <>
      <BlogFilters
        allTags={allTags}
        activeTag={activeTag}
        searchQuery={searchQuery}
        onTagChange={setActiveTag}
        onSearchChange={setSearchQuery}
      />

      <div className="mt-10">
        <BlogList posts={filtered} />
      </div>
    </>
  );
}
