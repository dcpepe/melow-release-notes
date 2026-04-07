"use client";

import { motion } from "framer-motion";
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function ReleasePage({
  release,
  pastReleases,
  children,
  isPreview,
}: {
  release: ReleaseData;
  pastReleases: PastRelease[];
  children: React.ReactNode;
  isPreview?: boolean;
}) {
  const formattedDate = new Date(release.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const issueStr = String(release.issue).padStart(3, "0");

  return (
    <div className="min-h-screen bg-bg">
      {/* Preview banner */}
      {isPreview && (
        <div className="bg-gold/10 text-gold text-center py-2 text-sm" style={{ borderBottom: "0.5px solid rgba(201, 162, 75, 0.3)" }}>
          Internal preview. Not published yet.
        </div>
      )}

      {/* Header bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/80" style={{ borderBottom: "0.5px solid rgba(201, 162, 75, 0.08)" }}>
        <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-serif italic text-base text-text-primary">Melow Weekly</span>
          <div className="flex items-center gap-6">
            <span className="text-[12px] text-text-tertiary tabular-nums hidden sm:block">
              Issue #{issueStr}
            </span>
            <a
              href="https://melow.ai"
              className="text-[11px] font-medium text-gold px-3.5 py-1.5 rounded-full transition-all hover:bg-gold/10"
              style={{ border: "0.5px solid rgba(201, 162, 75, 0.3)" }}
            >
              Try Mila
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6">
        {/* Hero section */}
        <motion.section
          className="pt-16 sm:pt-24 pb-16"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Metadata row */}
          <motion.div
            variants={fadeUp}
            custom={0}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-10"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-[13px] text-text-secondary">{formattedDate}</span>
            </div>
            <div className="text-[13px] text-text-tertiary tabular-nums">
              Issue <DigitReel value={issueStr} prefix="#" />
            </div>
            <div className="text-[13px] text-text-tertiary tabular-nums">
              v<DigitReel value={release.version} />
            </div>
            {release.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-gold-muted px-2.5 py-0.5"
                style={{ border: "0.5px solid rgba(201, 162, 75, 0.2)", borderRadius: "100px" }}
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-serif text-text-primary mb-8"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              fontWeight: 400,
            }}
          >
            {release.headline}
            <span className="text-gold">.</span>
          </motion.h1>

          {/* Summary */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-[1.125rem] text-text-secondary leading-[1.75] max-w-[600px]"
          >
            {release.summary}
          </motion.p>
        </motion.section>

        {/* Divider */}
        <div style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.1)" }} />

        {/* Content */}
        <motion.article
          className="prose py-16 max-w-[680px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {children}
        </motion.article>

        {/* Divider */}
        <div style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.1)" }} />

        {/* Past Issues */}
        {pastReleases.length > 0 && (
          <section className="py-16">
            <PastIssues releases={pastReleases} />
          </section>
        )}

        {/* Footer */}
        <footer className="py-12 text-center" style={{ borderTop: "0.5px solid rgba(201, 162, 75, 0.06)" }}>
          <a
            href="https://melow.ai"
            className="text-[13px] text-gold hover:text-text-primary transition-colors"
          >
            Try Mila
          </a>
          <div className="mt-3 text-[11px] text-text-tertiary tracking-[0.15em] uppercase">
            Melow
          </div>
        </footer>
      </main>
    </div>
  );
}
