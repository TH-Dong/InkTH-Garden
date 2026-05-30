import Image from "next/image";
import { withBasePath } from "@/lib/basePath";

const interests = [
  "Computer Science",
  "Mathematics",
  "Large Language Model",
  "Literature and films",
  "Travelling",
];

const contacts = [
  { label: "GitHub", href: "https://github.com/TH-Dong" },
  { label: "Email", href: "mailto:dongm4805@gmail.com" },
];

export default function AboutPage() {
  return (
    <div className="page-container py-16">
      <div className="mx-auto max-w-2xl">
        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4">
            <h1
              className="text-3xl font-bold tracking-tight text-foreground"
              style={{ fontFamily: '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif' }}
            >
              InkTH
            </h1>
          </div>

          <Image
            src={withBasePath("/avatar.png")}
            alt="Avatar"
            width={96}
            height={96}
            className="rounded-full border border-border"
            priority
          />
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            About
          </h1>
          <p className="mt-4 leading-relaxed text-muted-strong">
            I am currently a student at the School of Remote Sensing and Information Engineering, Wuhan University, majoring in Spatial Information and Digital Technology. My interests focus on the intersection of computer science, mathematics, and large language models. This site serves as a place for me to organize my learning, archive my thoughts, and share selected content publicly.
          </p>
        </section>

        {/* Interests */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Interests
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {interests.map((item) => (
              <span
                key={item}
                className="rounded-md bg-surface-soft px-3 py-1 text-sm text-muted-strong"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Why this site */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Why This Site
          </h2>
          <div className="mt-4 space-y-3 leading-relaxed text-muted-strong">
            <p>
              Learning notes tend to scatter across tools and platforms. This
              site exists to bring them together into a single, structured
              knowledge base that I can maintain over the long term.
            </p>
            <p>
              Writing things down forces clearer thinking. Making them public
              adds a layer of accountability and, hopefully, helps others along
              the way.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Contact
          </h2>
          <ul className="mt-4 space-y-2">
            {contacts.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-sm text-muted-strong transition-colors hover:text-foreground"
                >
                  {label} &rarr;
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
