import { notFound } from "next/navigation";
import ReadingArticle from "@/components/readings/ReadingArticle";
import { getAllReadings, getReadingBySlug } from "@/lib/content/readings";
import { renderMarkdown } from "@/lib/markdown/render";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllReadings().map((reading) => ({ slug: reading.slug }));
}

export default async function ReadingArticlePage({ params }: Props) {
  const { slug } = await params;
  const reading = getReadingBySlug(slug);

  if (!reading) notFound();

  const html = await renderMarkdown(reading.content, `readings/${reading.slug}`);

  return (
    <div className="page-container py-16">
      <ReadingArticle reading={reading} html={html} />
    </div>
  );
}
