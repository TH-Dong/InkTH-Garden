"use client";

const THEME_STORAGE_KEY = "theme-preference";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme = document.documentElement.classList.contains("dark")
          ? "light"
          : "dark";
        applyTheme(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted-strong transition-elegant hover:border-accent/30 hover:text-foreground"
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:hidden"
      >
        <path d="M11.85 2.11a6.6 6.6 0 1 0 4.04 9.63A7.2 7.2 0 0 1 11.85 2.11Z" />
      </svg>
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden dark:block"
      >
        <circle cx="9" cy="9" r="3.25" />
        <path d="M9 1.75v2.1M9 14.15v2.1M1.75 9h2.1M14.15 9h2.1M3.87 3.87l1.48 1.48M12.65 12.65l1.48 1.48M14.13 3.87l-1.48 1.48M5.35 12.65l-1.48 1.48" />
      </svg>
    </button>
  );
}
