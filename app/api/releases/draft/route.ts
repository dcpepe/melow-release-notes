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

function suggestMedia(heading: string, body: string, label: string): string {
  const lower = `${heading} ${body}`.toLowerCase();
  if (lower.includes("chart") || lower.includes("visual") || lower.includes("graph"))
    return "Record a screen capture showing the new charting/visualization in action";
  if (lower.includes("speed") || lower.includes("fast") || lower.includes("performance"))
    return "Record a before/after comparison showing the speed improvement";
  if (lower.includes("ui") || lower.includes("design") || lower.includes("interface") || lower.includes("console"))
    return "Take a screenshot of the new UI or updated interface";
  if (lower.includes("mila") || lower.includes("ask") || lower.includes("answer") || lower.includes("query"))
    return "Record a screen capture of Mila answering a question with this feature";
  if (lower.includes("report") || lower.includes("alert") || lower.includes("notification") || lower.includes("drift"))
    return "Take a screenshot of the report, alert, or notification";
  if (label === "Fixes") return "";
  return "Record a short screen capture (15-30s) demonstrating this feature";
}

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(type: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, ...data as Record<string, unknown> })}\n\n`)
        );
      }

      try {
        // Step 1: Read existing releases
        send("step", { message: "Reading existing releases..." });
        const existing = getAllReleases();
        const latestIssue = existing.length > 0 ? existing[0].issue : 0;
        const nextIssue = latestIssue + 1;
        const nextVersion = existing.length > 0 ? bumpVersion(existing[0].version) : "1.0.0";
        const today = new Date().toISOString().split("T")[0];
        // Always pull last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sinceDate = sevenDaysAgo.toISOString().split("T")[0];

        send("step", {
          message: `Found ${existing.length} existing releases. Next issue: #${nextIssue}. Fetching tickets from the past 7 days (since ${sinceDate}).`,
        });

        // Step 2: Fetch from Linear
        send("step", { message: "Connecting to Linear API..." });
        let tickets;
        try {
          tickets = await fetchCompletedTickets(sinceDate);
        } catch (err) {
          send("error", {
            message: `Linear API failed: ${err instanceof Error ? err.message : "unknown error"}. Check your LINEAR_API_KEY.`,
          });
          send("done", {
            draft: {
              meta: { issue: nextIssue, version: nextVersion, date: today, headline: "", summary: "", slug: "draft", tags: [] },
              sections: [],
            },
          });
          controller.close();
          return;
        }

        send("step", { message: `Pulled ${tickets.length} completed tickets from Linear.` });

        if (tickets.length === 0) {
          send("step", { message: "No new tickets found. Creating empty draft." });
          send("done", {
            draft: {
              meta: { issue: nextIssue, version: nextVersion, date: today, headline: "", summary: "", slug: "draft", tags: [] },
              sections: [],
            },
          });
          controller.close();
          return;
        }

        const groups = groupTicketsByLabel(tickets);

        // Step 3: Rewrite each ticket
        const rewrittenSections: {
          heading: string; body: string; label: string; ticketUrl: string; mediaSuggestion: string;
        }[] = [];
        const fixesList: { body: string; ticketUrl: string }[] = [];
        let rewriteCount = 0;
        const totalToRewrite = tickets.length;

        for (const [label, groupTickets] of Object.entries(groups)) {
          for (const ticket of groupTickets) {
            rewriteCount++;
            send("step", {
              message: `Rewriting ticket ${rewriteCount}/${totalToRewrite}: "${ticket.title}"`,
            });

            const rewritten = await rewriteTicket(ticket.title, ticket.description || "");

            if (label === "Fixes") {
              fixesList.push({ body: rewritten, ticketUrl: ticket.url });
            } else {
              const heading = ticket.title
                .replace(/^\[.*?\]\s*/, "")
                .replace(/^(feat|fix|chore|refactor):\s*/i, "");
              rewrittenSections.push({
                heading,
                body: rewritten,
                label,
                ticketUrl: ticket.url,
                mediaSuggestion: suggestMedia(heading, rewritten, label),
              });
            }
          }
        }

        send("step", { message: `All ${totalToRewrite} tickets rewritten. Generating headline and summary...` });

        // Step 4: Generate headline and summary
        let headline = "";
        let summary = "";
        let slug = "draft";

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey && rewrittenSections.length > 0) {
          const client = new Anthropic({ apiKey });
          const sectionList = rewrittenSections
            .map((s) => `[${s.label}] ${s.heading}: ${s.body}`)
            .join("\n\n");

          try {
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

            const block = message.content[0];
            if (block.type === "text") {
              const parsed = JSON.parse(block.text);
              headline = parsed.headline || "";
              summary = parsed.summary || "";
              slug = parsed.slug || "draft";
            }
          } catch (err) {
            send("step", {
              message: `Headline generation failed: ${err instanceof Error ? err.message : "unknown"}. You can write your own.`,
            });
          }
        }

        send("step", {
          message: headline
            ? `Generated headline: "${headline}"`
            : "Skipped headline generation. Write your own.",
        });

        // Step 5: Assemble final draft
        const tags = [
          ...new Set(
            tickets.flatMap((t) => t.labels).filter((l) => ["AI Brain", "Mila", "Platform"].includes(l))
          ),
        ];

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

        send("step", { message: `Done. ${rewrittenSections.length} feature sections + ${fixesList.length} fixes ready.` });

        send("done", {
          ticketCount: tickets.length,
          draft: {
            meta: { issue: nextIssue, version: nextVersion, date: today, headline, summary, slug, tags },
            sections: editorSections,
          },
        });
      } catch (err) {
        send("error", {
          message: `Unexpected error: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
