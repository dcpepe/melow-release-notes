import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const RELEASES_DIR = path.join(process.cwd(), "content", "releases");

function findFolder(slug: string): string | null {
  if (!fs.existsSync(RELEASES_DIR)) return null;
  const folders = fs.readdirSync(RELEASES_DIR);
  return folders.find((f) => f.replace(/^\d+-/, "") === slug) || null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const folder = findFolder(slug);
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mdxPath = path.join(RELEASES_DIR, folder, "index.mdx");
  const raw = fs.readFileSync(mdxPath, "utf-8");
  const { data, content } = matter(raw);

  // List media files in folder
  const files = fs.readdirSync(path.join(RELEASES_DIR, folder));
  const mediaFiles = files.filter((f) =>
    /\.(mp4|gif|png|jpg|jpeg|webp|webm|svg)$/i.test(f)
  );

  return NextResponse.json({
    meta: { ...data, slug },
    content,
    folder,
    mediaFiles,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { meta, content, newSlug } = body;

  const folder = findFolder(slug);
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const folderPath = path.join(RELEASES_DIR, folder);

  // Write updated MDX
  const frontmatter = {
    issue: meta.issue,
    version: meta.version,
    date: meta.date,
    headline: meta.headline,
    summary: meta.summary,
    tags: meta.tags || [],
  };

  const fullContent = matter.stringify(content, frontmatter);
  fs.writeFileSync(path.join(folderPath, "index.mdx"), fullContent, "utf-8");

  // Rename folder if slug changed
  if (newSlug && newSlug !== slug) {
    const issueNum = String(meta.issue).padStart(3, "0");
    const newFolderName = `${issueNum}-${newSlug}`;
    const newFolderPath = path.join(RELEASES_DIR, newFolderName);
    fs.renameSync(folderPath, newFolderPath);
    return NextResponse.json({ slug: newSlug, folder: newFolderName });
  }

  return NextResponse.json({ slug, folder });
}
