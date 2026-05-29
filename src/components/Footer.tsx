const footerLinks = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Email", href: "mailto:hello@example.com" },
  { label: "RSS", href: "/rss.xml" },
  { label: "About", href: "/about" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="page-container flex items-center justify-between py-8">
        <span className="text-sm text-muted">
          &copy; {new Date().getFullYear()} InkTH&apos;s Garden
        </span>

        <ul className="flex items-center gap-5">
          {footerLinks.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-sm text-muted transition-colors hover:text-accent"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
