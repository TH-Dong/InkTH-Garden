"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { KnowledgeTreeNode } from "@/types/content";

interface SidebarProps {
  tree: KnowledgeTreeNode[];
}

export default function Sidebar({ tree }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-20 w-52 shrink-0 border-r border-border-subtle pr-6">
      <ul className="space-y-4">
        {tree.map((node) => (
          <SidebarCategory key={node.path} node={node} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}

function SidebarCategory({
  node,
  pathname,
}: {
  node: KnowledgeTreeNode;
  pathname: string;
}) {
  const href = `/knowledges/${node.path}`;
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <li>
      <Link
        href={href}
        className={`block text-sm font-medium ${
          isActive ? "text-accent" : "text-muted-strong hover:text-foreground"
        }`}
      >
        {node.name}
      </Link>

      {node.children.length > 0 && (
        <ul className="mt-1.5 space-y-1 border-l border-border-subtle pl-3">
          {node.children.map((child) => {
            const childHref = `/knowledges/${child.path}`;
            const childActive =
              pathname === childHref || pathname.startsWith(childHref + "/");

            return (
              <li key={child.path}>
                <Link
                  href={childHref}
                  className={`block text-sm ${
                    childActive
                      ? "font-medium text-accent"
                      : "text-muted hover:text-muted-strong"
                  }`}
                >
                  {child.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
