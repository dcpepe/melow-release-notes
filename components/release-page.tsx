"use client";

import DigitReel from "./digit-reel";
import PastIssues from "./past-issues";

interface ReleaseData {
  issue: number;
  version: string;
  date: string;
  headline: string;
  summary: string;
  tags: string[];
  slug: string;
}

interface PastRelease {
  issue: number;
  version: string;
  date: string;
  headline: string;
  slug: string;
}

export default function ReleasePage({
  release,
  pastReleases,
  children,
}: {
  release: ReleaseData;
  pastReleases: PastRelease[];
  children: React.ReactNode;
}) {
  const formattedDate = new Date(release.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const issueStr = String(release.issue).padStart(3, "0");

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: "0.5px solid rgba(201, 162, 75, 0.15)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-tertiary tracking-wide uppercase">
            Melow
          </span>
          <span className="text-[11px] text-text-tertiary">
            /
          </span>
          <span className="text-[11px] text-text-secondary tracking-wide uppercase">
            Release Notes
          </span>
        </div>
        <a
          href="https://melow.ai"
          className="text-[11px] font-medium text-gold px-4 py-1.5 rounded-full transition-colors hover:bg-gold/10"
          style={{ border: "0.5px solid rgba(201, 162, 75, 0.3)" }}
        >
          Try Mila
        </a>
      </header>

      <main className="max-w-[680px] mx-auto px-6 pt-16 pb-32">
        {/* Metadata row */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          <div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-[0.15em] mb-2">Date</div>
            <div className="text-[13px] text-text-secondary tabular-nums">
              {formattedDate}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-[0.15em] mb-2">Location</div>
            <div className="text-[13px] text-text-secondary">
              Madrid
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-[0.15em] mb-2">Issue No.</div>
            <div className="text-[13px] text-text-secondary">
              <DigitReel value={issueStr} prefix="#" />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-[0.15em] mb-2">App Version</div>
            <div className="text-[13px] text-text-secondary">
              <DigitReel value={release.version} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.15)" }} className="mb-10" />

        {/* Wordmark row */}
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="font-serif text-[1.6rem] italic text-text-primary" style={{ letterSpacing: "-0.01em" }}>
            Melow Weekly
          </h1>
          <div className="flex gap-4">
            <span className="text-[10px] text-text-tertiary uppercase tracking-[0.15em]">New features</span>
            <span className="text-[10px] text-text-tertiary uppercase tracking-[0.15em]">Every week</span>
          </div>
        </div>

        {/* Headline */}
        <h2
          className="font-serif text-text-primary mb-6"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            fontWeight: 400,
          }}
        >
          {release.headline}
          <span className="text-gold">.</span>
        </h2>

        {/* Summary */}
        <p className="text-[1.1rem] text-text-secondary leading-[1.65] mb-5" style={{ maxWidth: "580px" }}>
          {release.summary}
        </p>

        {/* Tags */}
        <div className="flex gap-2 mb-14">
          {release.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-gold-muted px-3 py-1"
              style={{ border: "0.5px solid rgba(201, 162, 75, 0.2)", borderRadius: "100px" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.15)" }} className="mb-14" />

        {/* MDX body */}
        <div className="prose">{children}</div>

        {/* Divider before past issues */}
        <div style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.15)" }} className="mt-20 mb-14" />

        {/* Past Issues */}
        {pastReleases.length > 0 && (
          <PastIssues releases={pastReleases} />
        )}

        {/* Footer */}
        <footer className="mt-20 pt-10 text-center" style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.15)" }}>
          <a
            href="/release-notes/latest"
            className="text-[13px] text-gold hover:text-gold-muted transition-colors"
          >
            View all release notes
          </a>
          <div className="mt-6 text-[11px] text-text-tertiary uppercase tracking-[0.15em]">
            Melow
          </div>
        </footer>
      </main>
    </div>
  );
}
