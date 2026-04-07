import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchCompletedTickets, groupTicketsByLabel } from "@/lib/linear";
import { rewriteTicket } from "@/lib/rewrite";
import { getAllReleases } from "@/lib/releases";

export const maxDuration = 60;

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
      return JSON.parse(block.text);
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

function suggestMedia(heading: string, body: string, label: string): string {
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
    return NextResponse.json({
      ticketCount: 0,
      error: `Linear fetch failed: ${err instanceof Error ? err.message : "unknown error"}. Check your LINEAR_API_KEY.`,
      // Return draft data so the editor can still work
      draft: {
        meta: {
          issue: nextIssue,
          version: nextVersion,
          date: today,
          headline: "What shipped this week",
          summary: "Write your summary here.",
          tags: [],
        },
        sections: [
          {
            heading: "New section",
            body: "Write your content here.",
            mediaSuggestion: "",
            sourceUrl: "",
          },
        ],
      },
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

  // Determine tags
  const tags = [
    ...new Set(
      tickets
        .flatMap((t) => t.labels)
        .filter((l) => ["AI Brain", "Mila", "Platform"].includes(l))
    ),
  ];

  // Build sections for the editor (including fixes as a section)
  const editorSections = rewrittenSections.map((s) => ({
    heading: s.heading,
    body: s.body,
    mediaSuggestion: s.mediaSuggestion,
    sourceUrl: s.ticketUrl,
  }));

  if (fixesList.length > 0) {
    editorSections.push({
      heading: "Also shipped",
      body: fixesList.map((f) => `- ${f.body}`).join("\n"),
      mediaSuggestion: "",
      sourceUrl: "",
    });
  }

  return NextResponse.json({
    ticketCount: tickets.length,
    draft: {
      meta: {
        issue: nextIssue,
        version: nextVersion,
        date: today,
        headline,
        summary,
        slug,
        tags,
      },
      sections: editorSections,
    },
  });
}
