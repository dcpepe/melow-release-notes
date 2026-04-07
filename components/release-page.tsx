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
  const versionParts = release.version;

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <span className="text-xs text-text-tertiary">
          Reading this in another browser?
        </span>
        <a
          href="https://melow.ai"
          className="text-xs font-medium text-gold px-4 py-1.5 rounded-full border border-gold/30 hover:bg-gold/10 transition-colors"
        >
          Try Mila
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-12 pb-24">
        {/* Metadata row */}
        <div className="grid grid-cols-4 gap-4 text-xs text-text-tertiary uppercase tracking-wider mb-8">
          <div>
            <div className="mb-1">Date</div>
            <div className="text-text-secondary text-sm normal-case tracking-normal tabular-nums">
              {formattedDate}
            </div>
          </div>
          <div>
            <div className="mb-1">Location</div>
            <div className="text-text-secondary text-sm normal-case tracking-normal">
              Madrid
            </div>
          </div>
          <div>
            <div className="mb-1">Issue No.</div>
            <div className="text-text-secondary text-sm normal-case tracking-normal">
              <DigitReel value={issueStr} prefix="#" />
            </div>
          </div>
          <div>
            <div className="mb-1">App Version</div>
            <div className="text-text-secondary text-sm normal-case tracking-normal">
              <DigitReel value={versionParts} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-8" />

        {/* Wordmark row */}
        <div className="flex items-baseline gap-4 mb-6">
          <h1 className="font-serif text-2xl italic text-text-primary">
            Melow Weekly
          </h1>
          <div className="flex gap-3 text-xs text-text-tertiary uppercase tracking-wider">
            <span>New features</span>
            <span>Every week</span>
          </div>
        </div>

        {/* Headline */}
        <h2
          className="font-serif text-[4rem] leading-[1.05] tracking-tight text-text-primary mb-4"
          style={{ letterSpacing: "-0.02em" }}
        >
          {release.headline}
          <span className="text-gold">.</span>
        </h2>

        {/* Summary */}
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          {release.summary}
        </p>

        {/* Tags */}
        <div className="flex gap-2 mb-12">
          {release.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-gold-muted px-2.5 py-1 rounded-full border border-gold/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-12" />

        {/* MDX body */}
        <div className="prose">{children}</div>

        {/* Divider */}
        <div className="border-t border-border mt-16 mb-12" />

        {/* Past Issues */}
        {pastReleases.length > 0 && (
          <PastIssues releases={pastReleases} />
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center">
          <a
            href="/release-notes/latest"
            className="text-sm text-gold hover:text-gold-muted transition-colors"
          >
            View all release notes
          </a>
          <div className="mt-4 text-xs text-text-tertiary">Melow</div>
        </footer>
      </main>
    </div>
  );
}
