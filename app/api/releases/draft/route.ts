import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Anthropic from "@anthropic-ai/sdk";
import { fetchCompletedTickets, groupTicketsByLabel } from "@/lib/linear";
import { rewriteTicket } from "@/lib/rewrite";
import { getAllReleases } from "@/lib/releases";

const RELEASES_DIR = path.join(process.cwd(), "content", "releases");

function bumpVersion(version: string): string {
  const parts = version.split(".");
  const patch = parseInt(parts[2] || "0", 10) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

async function generateHeadlineAndSummary(
  sections: { heading: string; body: string; label: string }[]
): Promise<{ headline: string; summary: string; slug: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      headline: "What shipped this week",
      summary: "A summary of everything we shipped.",
      slug: "draft",
    };
  }

  const client = new Anthropic({ apiKey });

  const sectionList = sections
    .map((s) => `[${s.label}] ${s.heading}: ${s.body}`)
    .join("\n\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: `You write release note headlines for Melow, an AI data intelligence platform. You output valid JSON only, no markdown fences. No em dashes. Tone: confident, warm, specific.`,
    messages: [
      {
        role: "user",
        content: `Based on these features that shipped this week, generate:
1. A short, punchy headline (3-6 words, sentence case)
2. A one-sentence summary mentioning the top 2-3 features
3. A URL slug (lowercase, hyphens, 3-5 words)

Features:
${sectionList}

Respond as JSON: {"headline": "...", "summary": "...", "slug": "..."}`,
      },
    ],
  });

  try {
    const block = message.content[0];
    if (block.type === "text") {
      const parsed = JSON.parse(block.text);
      return parsed;
    }
  } catch {
    // fall through
  }

  return {
    headline: "What shipped this week",
    summary: "A summary of everything we shipped.",
    slug: "draft",
  };
}

function suggestMedia(
  heading: string,
  body: string,
  label: string
): string {
  const lower = `${heading} ${body}`.toLowerCase();

  if (lower.includes("chart") || lower.includes("visual") || lower.includes("graph")) {
    return "Record a screen capture showing the new charting/visualization in action";
  }
  if (lower.includes("speed") || lower.includes("fast") || lower.includes("performance")) {
    return "Record a before/after comparison showing the speed improvement";
  }
  if (lower.includes("ui") || lower.includes("design") || lower.includes("interface") || lower.includes("console")) {
    return "Take a screenshot of the new UI or updated interface";
  }
  if (lower.includes("mila") || lower.includes("ask") || lower.includes("answer") || lower.includes("query")) {
    return "Record a screen capture of Mila answering a question with this feature";
  }
  if (lower.includes("report") || lower.includes("alert") || lower.includes("notification") || lower.includes("drift")) {
    return "Take a screenshot of the report, alert, or notification";
  }
  if (label === "Fixes") {
    return "";
  }
  return "Record a short screen capture (15-30s) demonstrating this feature";
}

export async function POST() {
  const existing = getAllReleases();
  const latestIssue = existing.length > 0 ? existing[0].issue : 0;
  const nextIssue = latestIssue + 1;
  const sinceDate = existing.length > 0 ? existing[0].date : "2025-01-01";
  const nextVersion =
    existing.length > 0 ? bumpVersion(existing[0].version) : "1.0.0";
  const today = new Date().toISOString().split("T")[0];

  // Fetch tickets from Linear
  let tickets;
  try {
    tickets = await fetchCompletedTickets(sinceDate);
  } catch (err) {
    // If Linear fails, create an empty draft
    const folderName = `${String(nextIssue).padStart(3, "0")}-draft`;
    const folderPath = path.join(RELEASES_DIR, folderName);
    fs.mkdirSync(folderPath, { recursive: true });

    const frontmatter = {
      issue: nextIssue,
      version: nextVersion,
      date: today,
      headline: "What shipped this week",
      summary: "Write your summary here.",
      tags: [],
    };
    const content = matter.stringify(
      "## New section\n\nWrite your content here.\n",
      frontmatter
    );
    fs.writeFileSync(path.join(folderPath, "index.mdx"), content, "utf-8");

    return NextResponse.json({
      slug: "draft",
      folder: folderName,
      ticketCount: 0,
      error: `Linear fetch failed: ${err instanceof Error ? err.message : "unknown error"}. Created empty draft.`,
    });
  }

  const groups = groupTicketsByLabel(tickets);

  // Rewrite each ticket and build sections
  const rewrittenSections: {
    heading: string;
    body: string;
    label: string;
    ticketUrl: string;
    mediaSuggestion: string;
  }[] = [];

  const fixesList: { body: string; ticketUrl: string }[] = [];

  for (const [label, groupTickets] of Object.entries(groups)) {
    if (label === "Fixes") {
      for (const ticket of groupTickets) {
        const rewritten = await rewriteTicket(
          ticket.title,
          ticket.description || ""
        );
        fixesList.push({ body: rewritten, ticketUrl: ticket.url });
      }
      continue;
    }

    for (const ticket of groupTickets) {
      const rewritten = await rewriteTicket(
        ticket.title,
        ticket.description || ""
      );

      // Generate a customer-facing heading from the rewritten body
      const heading = ticket.title
        .replace(/^\[.*?\]\s*/, "")
        .replace(/^(feat|fix|chore|refactor):\s*/i, "");

      const mediaSuggestion = suggestMedia(heading, rewritten, label);

      rewrittenSections.push({
        heading,
        body: rewritten,
        label,
        ticketUrl: ticket.url,
        mediaSuggestion,
      });
    }
  }

  // Generate headline and summary from Claude
  const { headline, summary, slug } =
    await generateHeadlineAndSummary(rewrittenSections);

  // Build MDX content
  let mdx = "";

  // Feature sections
  for (const section of rewrittenSections) {
    mdx += `## ${section.heading}\n\n`;
    mdx += `${section.body}\n\n`;
    if (section.mediaSuggestion) {
      mdx += `{/* Media suggestion: ${section.mediaSuggestion} */}\n`;
      mdx += `{/* Source: ${section.ticketUrl} */}\n\n`;
    }
  }

  // Fixes section
  if (fixesList.length > 0) {
    mdx += `## Also shipped\n\n`;
    for (const fix of fixesList) {
      mdx += `- ${fix.body}\n`;
    }
    mdx += "\n";
  }

  // Determine tags
  const tags = [
    ...new Set(
      tickets
        .flatMap((t) => t.labels)
        .filter((l) => ["AI Brain", "Mila", "Platform"].includes(l))
    ),
  ];

  // Write to disk
  const folderName = `${String(nextIssue).padStart(3, "0")}-${slug}`;
  const folderPath = path.join(RELEASES_DIR, folderName);
  fs.mkdirSync(folderPath, { recursive: true });

  const frontmatter = {
    issue: nextIssue,
    version: nextVersion,
    date: today,
    headline,
    summary,
    tags,
  };

  const fullContent = matter.stringify(mdx, frontmatter);
  fs.writeFileSync(path.join(folderPath, "index.mdx"), fullContent, "utf-8");

  // Build media suggestions for the UI
  const mediaSuggestions = rewrittenSections
    .filter((s) => s.mediaSuggestion)
    .map((s) => ({
      section: s.heading,
      suggestion: s.mediaSuggestion,
    }));

  return NextResponse.json({
    slug,
    folder: folderName,
    ticketCount: tickets.length,
    headline,
    summary,
    mediaSuggestions,
  });
}
