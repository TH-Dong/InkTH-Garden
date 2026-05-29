import Link from "next/link";
import { getAllKnowledgePosts } from "@/lib/content/knowledges";
import { getKnowledgeTree } from "@/lib/content/knowledgeTree";

export default function KnowledgesPage() {
  const tree = getKnowledgeTree();
  const posts = getAllKnowledgePosts();

  return (
    <div className="min-w-0 flex-1 px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Knowledges
      </h1>
      <p className="mt-2 text-sm text-muted">
        {posts.length} notes across {tree.length} categories.
      </p>

      <div className="mt-10 space-y-10">
        {tree.map((cat) => (
          <section key={cat.path}>
            <Link
              href={`/knowledges/${cat.path}`}
              className="text-lg font-medium text-foreground hover:text-accent"
            >
              {cat.name}
            </Link>
            <p className="mt-1 text-sm text-muted">
              {cat.postCount} {cat.postCount === 1 ? "note" : "notes"}
            </p>

            {cat.children.length > 0 && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {cat.children.map((sub) => (
                  <li key={sub.path}>
                    <Link
                      href={`/knowledges/${sub.path}`}
                      className="group block rounded-md border border-border-subtle bg-surface-elevated px-4 py-3 transition-colors hover:border-border hover:bg-surface-soft/70"
                    >
                      <span className="text-sm font-medium text-muted-strong group-hover:text-foreground">
                        {sub.name}
                      </span>
                      <span className="ml-2 text-xs text-muted">
                        {sub.postCount}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
