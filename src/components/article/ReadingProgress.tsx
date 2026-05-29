"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;

    const updateProgress = () => {
      const scrollRoot = document.documentElement;
      const totalScrollableHeight = scrollRoot.scrollHeight - window.innerHeight;
      const nextProgress =
        totalScrollableHeight > 0
          ? Math.min(Math.max(window.scrollY / totalScrollableHeight, 0), 1)
          : 0;

      setProgress(nextProgress);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateProgress);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-16 z-40 h-px bg-border-subtle/70"
    >
      <div
        className="h-full origin-left bg-[linear-gradient(90deg,var(--color-accent),color-mix(in_oklch,var(--color-accent)_55%,white))] shadow-[0_0_18px_color-mix(in_oklch,var(--color-accent)_28%,transparent)] transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
