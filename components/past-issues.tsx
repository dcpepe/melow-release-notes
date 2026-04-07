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
      <h3 className="text-[13px] text-text-tertiary mb-6">
        Past issues
      </h3>
      <div>
        {releases.map((r) => {
          const formattedDate = new Date(r.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <Link
              key={r.slug}
              href={`/release-notes/${r.slug}`}
              className="group flex items-baseline justify-between py-3 transition-colors"
              style={{
                borderBottom: "0.5px solid rgba(201, 162, 75, 0.08)",
              }}
            >
              <span className="text-[15px] text-text-secondary group-hover:text-text-primary transition-colors">
                {r.headline}
              </span>
              <span className="text-[13px] text-text-tertiary tabular-nums shrink-0 ml-4">
                {formattedDate}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
