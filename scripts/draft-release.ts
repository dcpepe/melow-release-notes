import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fetchCompletedTickets, groupTicketsByLabel } from "../lib/linear";
import { rewriteTicket } from "../lib/rewrite";

const RELEASES_DIR = path.join(process.cwd(), "content", "releases");

function getExistingReleases() {
  if (!fs.existsSync(RELEASES_DIR)) return [];

  return fs
    .readdirSync(RELEASES_DIR)
    .filter((f) => fs.statSync(path.join(RELEASES_DIR, f)).isDirectory())
    .map((folder) => {
      const mdxPath = path.join(RELEASES_DIR, folder, "index.mdx");
      if (!fs.existsSync(mdxPath)) return null;
      const raw = fs.readFileSync(mdxPath, "utf-8");
      const { data } = matter(raw);
      return { folder, ...data } as {
        folder: string;
        issue: number;
        version: string;
        date: string;
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.issue - a!.issue) as Array<{
    folder: string;
    issue: number;
    version: string;
    date: string;
  }>;
}

function bumpVersion(version: string): string {
  const parts = version.split(".");
  const patch = parseInt(parts[2] || "0", 10) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

async function main() {
  console.log("Drafting new release...\n");

  const existing = getExistingReleases();
  const latestIssue = existing.length > 0 ? existing[0].issue : 0;
  const nextIssue = latestIssue + 1;
  const sinceDate = existing.length > 0 ? existing[0].date : "2025-01-01";
  const nextVersion = existing.length > 0 ? bumpVersion(existing[0].version) : "1.0.0";

  console.log(`Next issue: #${nextIssue}`);
  console.log(`Fetching tickets completed since: ${sinceDate}\n`);

  const tickets = await fetchCompletedTickets(sinceDate);
  console.log(`Found ${tickets.length} completed tickets.\n`);

  const groups = groupTicketsByLabel(tickets);

  const today = new Date().toISOString().split("T")[0];
  const folderName = `${String(nextIssue).padStart(3, "0")}-draft`;
  const folderPath = path.join(RELEASES_DIR, folderName);
  fs.mkdirSync(folderPath, { recursive: true });

  // Build MDX content
  let mdx = "";

  // Linear ticket references as comments
  mdx += `{/* Source Linear tickets:\n`;
  for (const ticket of tickets) {
    mdx += `   - ${ticket.id}: ${ticket.title} (${ticket.url})\n`;
  }
  mdx += `*/}\n\n`;

  // Feature sections
  for (const [label, groupTickets] of Object.entries(groups)) {
    if (label === "Fixes") continue;
    if (groupTickets.length === 0) continue;

    for (const ticket of groupTickets) {
      console.log(`Rewriting: ${ticket.title}...`);
      const rewritten = await rewriteTicket(ticket.title, ticket.description || "");

      mdx += `## TODO: Section headline\n\n`;
      mdx += `${rewritten}\n\n`;
      mdx += `<Video src="./TODO.mp4" caption="TODO: Add caption" />\n\n`;
    }
  }

  // Fixes section
  const fixes = groups["Fixes"] || [];
  if (fixes.length > 0) {
    mdx += `## Also shipped\n\n`;
    for (const ticket of fixes) {
      console.log(`Rewriting fix: ${ticket.title}...`);
      const rewritten = await rewriteTicket(ticket.title, ticket.description || "");
      mdx += `- ${rewritten}\n`;
    }
    mdx += "\n";
  }

  // Build frontmatter
  const frontmatter = {
    issue: nextIssue,
    version: nextVersion,
    date: today,
    headline: "TODO: Write headline",
    summary: "TODO: Write summary",
    tags: [...new Set(tickets.flatMap((t) => t.labels).filter((l) => ["AI Brain", "Mila", "Platform"].includes(l)))],
  };

  const fullContent = matter.stringify(mdx, frontmatter);
  const outputPath = path.join(folderPath, "index.mdx");
  fs.writeFileSync(outputPath, fullContent, "utf-8");

  console.log(`\nDraft written to: content/releases/${folderName}/index.mdx`);
  console.log(`Next steps:`);
  console.log(`  1. Edit the headline and summary in the frontmatter`);
  console.log(`  2. Rewrite section headlines`);
  console.log(`  3. Drop in media files (videos, gifs, screenshots)`);
  console.log(`  4. Rename the folder to its final slug`);
  console.log(`  5. Run npm run dev to preview`);
}

main().catch((err) => {
  console.error("Error drafting release:", err);
  process.exit(1);
});
