"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
    <div>
      <h3 className="text-[11px] text-text-tertiary uppercase tracking-[0.15em] mb-8">
        Past issues
      </h3>
      <div className="grid gap-0">
        {releases.map((r, i) => {
          const formattedDate = new Date(r.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return (
            <motion.div
              key={r.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                href={`/release-notes/${r.slug}`}
                className="group grid grid-cols-[1fr_auto] items-baseline py-4 transition-colors"
                style={{
                  borderBottom: "0.5px solid rgba(201, 162, 75, 0.06)",
                }}
              >
                <div className="flex items-baseline gap-4 min-w-0">
                  <span className="text-[12px] text-text-tertiary tabular-nums shrink-0">
                    #{String(r.issue).padStart(3, "0")}
                  </span>
                  <span className="text-[15px] text-text-secondary group-hover:text-text-primary transition-colors truncate">
                    {r.headline}
                  </span>
                </div>
                <span className="text-[12px] text-text-tertiary tabular-nums ml-6 shrink-0">
                  {formattedDate}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
