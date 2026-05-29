"use client";

interface BlogFiltersProps {
  allTags: string[];
  activeTag: string | null;
  searchQuery: string;
  onTagChange: (tag: string | null) => void;
  onSearchChange: (query: string) => void;
}

export default function BlogFilters({
  allTags,
  activeTag,
  searchQuery,
  onTagChange,
  onSearchChange,
}: BlogFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search posts..."
        className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent-muted focus:outline-none focus:ring-1 focus:ring-accent-light"
      />

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTagChange(null)}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              activeTag === null
                ? "bg-accent text-white"
                : "bg-surface-soft text-muted-strong hover:bg-surface-hover"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagChange(activeTag === tag ? null : tag)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                activeTag === tag
                  ? "bg-accent text-white"
                  : "bg-surface-soft text-muted-strong hover:bg-surface-hover"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
