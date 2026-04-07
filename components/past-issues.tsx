import Link from "next/link";

interface PastRelease {
  issue: number;
  version: string;
  date: string;
  headline: string;
  slug: string;
}

export default function PastIssues({
  releases,
}: {
  releases: PastRelease[];
}) {
  return (
    <section>
      <h3 className="text-xs text-text-tertiary uppercase tracking-wider mb-6">
        Past Issues
      </h3>
      <div className="space-y-0">
        {releases.map((r) => {
          const formattedDate = new Date(r.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <Link
              key={r.slug}
              href={`/release-notes/${r.slug}`}
              className="flex items-baseline gap-4 py-3 border-b border-border hover:bg-surface/50 transition-colors -mx-3 px-3 rounded"
            >
              <span className="text-xs text-text-tertiary tabular-nums w-16 shrink-0">
                {formattedDate}
              </span>
              <span className="text-xs text-text-tertiary tabular-nums w-10 shrink-0">
                #{String(r.issue).padStart(3, "0")}
              </span>
              <span className="text-xs text-text-tertiary tabular-nums w-14 shrink-0">
                v{r.version}
              </span>
              <span className="text-sm text-text-secondary truncate">
                {r.headline}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
