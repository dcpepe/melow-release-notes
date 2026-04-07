import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllReleases } from "@/lib/releases";

const RELEASES_DIR = path.join(process.cwd(), "content", "releases");

export async function GET() {
  const releases = getAllReleases();
  return NextResponse.json(releases);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { issue, version, date, headline, summary, tags } = body;

  const slug = body.slug || "draft";
  const folderName = `${String(issue).padStart(3, "0")}-${slug}`;
  const folderPath = path.join(RELEASES_DIR, folderName);

  fs.mkdirSync(folderPath, { recursive: true });

  const frontmatter = { issue, version, date, headline, summary, tags: tags || [] };
  const content = matter.stringify(
    "## New section\n\nWrite your content here.\n",
    frontmatter
  );

  fs.writeFileSync(path.join(folderPath, "index.mdx"), content, "utf-8");

  return NextResponse.json({ slug, folder: folderName });
}
