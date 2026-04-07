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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/releases")
      .then((r) => r.json())
      .then((data) => {
        setReleases(data);
        setLoading(false);
      });
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const form = new FormData(e.currentTarget);
    const nextIssue = releases.length > 0 ? releases[0].issue + 1 : 1;
    const lastVersion = releases.length > 0 ? releases[0].version : "1.0.0";
    const parts = lastVersion.split(".");
    const nextVersion = `${parts[0]}.${parts[1]}.${parseInt(parts[2] || "0") + 1}`;

    const payload = {
      issue: nextIssue,
      version: nextVersion,
      date: new Date().toISOString().split("T")[0],
      headline: form.get("headline") as string,
      summary: form.get("summary") as string,
      slug: (form.get("slug") as string) || "draft",
      tags: [],
    };

    const res = await fetch("/api/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    setCreating(false);
    setShowCreate(false);
    window.location.href = `/admin/edit/${result.slug}`;
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-serif italic text-2xl text-text-primary">
            Melow Weekly Admin
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-sm text-bg bg-gold px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            New Release
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-10 p-6 rounded-lg"
            style={{ background: "#161616", border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
          >
            <h2 className="text-sm text-text-tertiary uppercase tracking-wide mb-4">Create release</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Headline</label>
                <input
                  name="headline"
                  required
                  placeholder="What shipped this week"
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Summary</label>
                <textarea
                  name="summary"
                  required
                  rows={2}
                  placeholder="One or two sentence summary"
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Slug</label>
                <input
                  name="slug"
                  required
                  placeholder="e.g. mila-learns-to-chart"
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="text-sm text-bg bg-gold px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}

        {/* Releases list */}
        {loading ? (
          <p className="text-text-tertiary text-sm">Loading...</p>
        ) : releases.length === 0 ? (
          <p className="text-text-tertiary text-sm">No releases yet. Create your first one.</p>
        ) : (
          <div>
            {releases.map((r) => (
              <Link
                key={r.slug}
                href={`/admin/edit/${r.slug}`}
                className="group flex items-center justify-between py-4 transition-colors"
                style={{ borderBottom: "0.5px solid rgba(201, 162, 75, 0.08)" }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-text-tertiary tabular-nums">
                      #{String(r.issue).padStart(3, "0")}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      v{r.version}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {r.date}
                    </span>
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
