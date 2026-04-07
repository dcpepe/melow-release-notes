"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Release {
  issue: number;
  version: string;
  date: string;
  headline: string;
  summary: string;
  slug: string;
  tags: string[];
}

export default function AdminDashboard() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/releases")
      .then((r) => r.json())
      .then((data) => {
        setReleases(data);
        setLoading(false);
      });
  }, []);

  function handleNewRelease() {
    const nextIssue = releases.length > 0 ? releases[0].issue + 1 : 1;
    const lastVersion = releases.length > 0 ? releases[0].version : "1.0.0";
    const parts = lastVersion.split(".");
    const nextVersion = `${parts[0]}.${parts[1]}.${parseInt(parts[2] || "0") + 1}`;
    const today = new Date().toISOString().split("T")[0];

    const draft = {
      meta: {
        issue: nextIssue,
        version: nextVersion,
        date: today,
        headline: "",
        summary: "",
        slug: "draft",
        tags: [],
      },
      sections: [],
    };

    sessionStorage.setItem("melowDraft", JSON.stringify(draft));
    window.location.href = "/admin/edit/new";
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-serif italic text-2xl text-text-primary">
            Melow Weekly Admin
          </h1>
          <button
            onClick={handleNewRelease}
            className="text-sm text-bg bg-gold px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            New Release
          </button>
        </div>

        {/* Releases list */}
        {loading ? (
          <p className="text-text-tertiary text-sm">Loading...</p>
        ) : releases.length === 0 ? (
          <p className="text-text-tertiary text-sm">
            No releases yet. Click "New Release" to get started.
          </p>
        ) : (
          <div>
            {releases.map((r) => (
              <Link
                key={r.slug}
                href={`/admin/edit/${r.slug}`}
                className="group flex items-center justify-between py-4 transition-colors"
                style={{
                  borderBottom: "0.5px solid rgba(201, 162, 75, 0.08)",
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-text-tertiary tabular-nums">
                      #{String(r.issue).padStart(3, "0")}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      v{r.version}
                    </span>
                    <span className="text-xs text-text-tertiary">{r.date}</span>
                  </div>
                  <p className="text-text-primary group-hover:text-gold transition-colors truncate">
                    {r.headline}
                  </p>
                  <p className="text-sm text-text-tertiary truncate mt-0.5">
                    {r.summary}
                  </p>
                </div>
                <span className="text-xs text-text-tertiary group-hover:text-gold transition-colors ml-4 shrink-0">
                  Edit
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
