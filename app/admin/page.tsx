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
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");

  useEffect(() => {
    fetch("/api/releases")
      .then((r) => r.json())
      .then((data) => {
        setReleases(data);
        setLoading(false);
      });
  }, []);

  async function handleNewRelease() {
    setGenerating(true);
    setGenStatus("Fetching shipped tickets from Linear...");

    try {
      const res = await fetch("/api/releases/draft", { method: "POST" });
      const result = await res.json();

      if (result.error) {
        setGenStatus(result.error);
        setTimeout(() => {
          window.location.href = `/admin/edit/${result.slug}`;
        }, 2000);
        return;
      }

      setGenStatus(
        `Done. ${result.ticketCount} tickets rewritten. Headline: "${result.headline}"`
      );

      setTimeout(() => {
        window.location.href = `/admin/edit/${result.slug}`;
      }, 1500);
    } catch (err) {
      setGenStatus("Something went wrong. Check your API keys.");
      setGenerating(false);
    }
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
            disabled={generating}
            className="text-sm text-bg bg-gold px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {generating ? "Generating..." : "New Release"}
          </button>
        </div>

        {/* Generation status */}
        {genStatus && (
          <div
            className="mb-8 p-5 rounded-lg"
            style={{
              background: "#161616",
              border: "0.5px solid rgba(201, 162, 75, 0.15)",
            }}
          >
            <div className="flex items-start gap-3">
              {generating && (
                <div
                  className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full shrink-0 mt-0.5"
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
              )}
              <div>
                <p className="text-sm text-text-secondary">{genStatus}</p>
                {generating && (
                  <p className="text-xs text-text-tertiary mt-2">
                    Pulling tickets from Linear, rewriting each one with Claude,
                    generating headline and summary. This takes 15-30 seconds.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Releases list */}
        {loading ? (
          <p className="text-text-tertiary text-sm">Loading...</p>
        ) : releases.length === 0 ? (
          <p className="text-text-tertiary text-sm">
            No releases yet. Click "New Release" to pull tickets from Linear and
            generate your first draft.
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

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
