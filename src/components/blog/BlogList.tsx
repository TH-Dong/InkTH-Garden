import Link from "next/link";
import type { BlogPost } from "@/types/content";

interface BlogListProps {
  posts: BlogPost[];
}

export default function BlogList({ posts }: BlogListProps) {
  if (posts.length === 0) {
    return <p className="mt-8 text-muted">No posts found.</p>;
  }

  return (
    <ul className="space-y-8">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`/blogs/${post.slug}`} className="group block">
            <h2 className="text-lg font-medium text-foreground group-hover:text-accent">
              {post.title}
            </h2>
            {post.summary && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-strong">
                {post.summary}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
              <time>{post.updated ?? post.date}</time>
              {post.tags.map((tag) => (
                <span key={tag} className="text-accent-muted">#{tag}</span>
              ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
