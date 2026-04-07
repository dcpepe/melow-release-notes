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
      <main className="max-w-[620px] mx-auto px-6 pt-20 pb-32">
        {/* Masthead */}
        <div className="mb-16">
          <p className="font-serif italic text-xl text-text-primary mb-8">
            Melow Weekly
          </p>

          {/* Meta line */}
          <div className="flex items-center gap-3 text-[13px] text-text-tertiary mb-10 tabular-nums">
            <span>{formattedDate}</span>
            <span className="text-border">|</span>
            <span>Issue <DigitReel value={issueStr} prefix="#" /></span>
            <span className="text-border">|</span>
            <span>v<DigitReel value={release.version} /></span>
          </div>

          {/* Headline */}
          <h1
            className="font-serif text-text-primary mb-6"
            style={{
              fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            {release.headline}
            <span className="text-gold">.</span>
          </h1>

          {/* Summary */}
          <p className="text-[1.05rem] text-text-secondary leading-[1.7]" style={{ maxWidth: "540px" }}>
            {release.summary}
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.12)" }} className="mb-14" />

        {/* MDX body */}
        <article className="prose">{children}</article>

        {/* Divider */}
        <div style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.12)" }} className="mt-20 mb-14" />

        {/* Past Issues */}
        {pastReleases.length > 0 && (
          <PastIssues releases={pastReleases} />
        )}

        {/* Footer */}
        <footer className="mt-20 text-center">
          <a
            href="https://melow.ai"
            className="text-[13px] text-gold hover:text-text-primary transition-colors"
          >
            Try Mila
          </a>
          <div className="mt-4 text-[11px] text-text-tertiary tracking-wide uppercase">
            Melow
          </div>
        </footer>
      </main>
    </div>
  );
}
