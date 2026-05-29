import { getAllReadings } from "@/lib/content/readings";
import ReadingCard from "@/components/readings/ReadingCard";

export default function ReadingsPage() {
  const readings = getAllReadings();

  return (
    <div className="page-container py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Readings
      </h1>
      <p className="mt-2 text-sm text-muted">
        Books I&apos;ve read with notes and reflections.
      </p>

      {readings.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {readings.map((reading) => (
            <ReadingCard key={reading.slug} reading={reading} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-muted">No readings yet.</p>
      )}
    </div>
  );
}
