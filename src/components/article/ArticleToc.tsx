"use client";

import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/types/content";

interface ArticleTocProps {
  items: TocItem[];
  updated?: string;
}

export default function ArticleToc({ items, updated }: ArticleTocProps) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [markerLeft, setMarkerLeft] = useState(0);
  const [markerTop, setMarkerTop] = useState(0);
  const [markerWidth, setMarkerWidth] = useState(0);
  const [markerHeight, setMarkerHeight] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;

    let frameId = 0;

    const updateTocState = () => {
      const headingOffset = 144;
      const headings = items
        .map((item) => document.getElementById(item.id))
        .filter((heading): heading is HTMLElement => heading !== null);

      if (headings.length === 0) return;

      let nextActiveId = headings[0].id;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= headingOffset) {
          nextActiveId = heading.id;
        } else {
          break;
        }
      }

      const activeLink = linkRefs.current[nextActiveId];
      if (activeLink && listRef.current) {
        setMarkerLeft(activeLink.offsetLeft);
        setMarkerTop(activeLink.offsetTop);
        setMarkerWidth(activeLink.offsetWidth);
        setMarkerHeight(activeLink.offsetHeight);
      }

      const scrollRoot = document.documentElement;
      const totalScrollableHeight = scrollRoot.scrollHeight - window.innerHeight;
      const nextProgress =
        totalScrollableHeight > 0
          ? Math.min(Math.max(window.scrollY / totalScrollableHeight, 0), 1)
          : 0;

      setActiveId(nextActiveId);
      setProgress(nextProgress);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateTocState);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden w-48 shrink-0 pl-4 lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-muted">
            On this page
          </p>
          <span className="text-[11px] text-muted/70">
            {Math.round(progress * 100)}%
          </span>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute bottom-1 left-2 top-1 w-px rounded-full bg-border" />
          <div
            className="pointer-events-none absolute left-2 top-1 w-px origin-top rounded-full bg-accent/55 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ height: "calc(100% - 0.5rem)", transform: `scaleY(${progress})` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-xl bg-accent-light/80 ring-1 ring-accent/15 transition-[transform,height,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              boxShadow: "var(--shadow-soft)",
              height: markerHeight,
              left: markerLeft,
              opacity: markerHeight > 0 ? 1 : 0,
              transform: `translateY(${markerTop}px)`,
              width: markerWidth,
            }}
          />

          <ul ref={listRef} className="relative space-y-px">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  ref={(node) => {
                    linkRefs.current[item.id] = node;
                  }}
                  aria-current={item.id === activeId ? "location" : undefined}
                  className={`group relative block pr-1.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    item.level === 3 ? "py-1 pl-7.5" : "py-1.5 pl-5"
                  } ${
                    item.id === activeId
                      ? "translate-x-0.5 text-foreground"
                      : item.level === 2
                        ? "text-muted-strong hover:text-accent"
                        : "text-muted hover:text-muted-strong"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-1/2 -translate-y-1/2 rounded-full border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      item.level === 2 ? "left-[0.38rem] h-2.5 w-2.5" : "left-[0.52rem] h-[0.42rem] w-[0.42rem]"
                    } ${
                      item.id === activeId
                        ? "scale-110 border-accent/30 bg-accent shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-accent)_14%,transparent)]"
                        : "border-border bg-background group-hover:border-accent/40"
                    }`}
                  />
                  {item.level === 3 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[1rem] top-1/2 h-px w-2 -translate-y-1/2 bg-border transition-colors duration-300 group-hover:bg-accent/30"
                    />
                  )}
                  <span
                    className={`relative block origin-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                      item.level === 2
                        ? "text-[0.93rem] font-medium leading-[1.3]"
                        : "text-[0.8rem] leading-[1.35]"
                    } ${
                      item.id === activeId
                        ? item.level === 2
                          ? "scale-[1.02]"
                          : "scale-[1.015]"
                        : ""
                    }`}
                  >
                    <span
                      className="article-toc-label block"
                      dangerouslySetInnerHTML={{ __html: item.html }}
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-2 border-t border-border-subtle pt-4">
          <a
            href="#"
            className="block text-xs text-muted transition-colors duration-300 hover:text-accent motion-reduce:transition-none"
          >
            Back to top
          </a>
          {updated && (
            <p className="text-xs text-muted/70">Updated {updated}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
