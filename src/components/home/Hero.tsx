import { Allura } from "next/font/google";

const fontScript = Allura({
  weight: "400",
  subsets: ["latin"],
});

export default function Hero() {
  return (
    <section className="max-w-4xl pb-24 pt-28 sm:pt-32">
      <h1
        className={`${fontScript.className} text-[clamp(3.5rem,7vw,6.35rem)] leading-[0.92] text-foreground`}
      >
        <span className="hero-line block" style={{ animationDelay: "80ms" }}>
          A space for reflection,
        </span>
        <span className="hero-line block" style={{ animationDelay: "230ms" }}>
          writing, and the
        </span>
        <span className="hero-line block" style={{ animationDelay: "380ms" }}>
          patient ordering of ideas.
        </span>
      </h1>
      <p
        className="hero-copy mt-8 max-w-2xl text-lg leading-relaxed text-foreground/70"
        style={{ animationDelay: "560ms" }}
      >
        Personal collection of notes on computer science, mathematics, machine learning,
        books I read, places I go, and thoughts gathered along the way.
      </p>
    </section>
  );
}
