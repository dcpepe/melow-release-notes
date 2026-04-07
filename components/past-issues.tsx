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
      <h3 className="text-[10px] text-text-tertiary uppercase tracking-[0.15em] mb-8">
        Past Issues
      </h3>
      <div>
        {releases.map((r, i) => {
          const formattedDate = new Date(r.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <Link
              key={r.slug}
              href={`/release-notes/${r.slug}`}
              className="group flex items-baseline gap-5 py-3.5 transition-colors -mx-3 px-3"
              style={{
                borderBottom: i < releases.length - 1 ? "0.5px solid rgba(201, 162, 75, 0.08)" : "none",
              }}
            >
              <span className="text-[12px] text-text-tertiary tabular-nums w-16 shrink-0">
                {formattedDate}
              </span>
              <span className="text-[12px] text-text-tertiary tabular-nums w-12 shrink-0">
                #{String(r.issue).padStart(3, "0")}
              </span>
              <span className="text-[12px] text-text-tertiary tabular-nums w-16 shrink-0">
                v{r.version}
              </span>
              <span className="text-[14px] text-text-secondary group-hover:text-text-primary transition-colors truncate">
                {r.headline}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
