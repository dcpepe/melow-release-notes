import fs from "fs";
import path from "path";
import matter from "gray-matter";

const RELEASES_DIR = path.join(process.cwd(), "content", "releases");

export interface ReleaseMeta {
  issue: number;
  version: string;
  date: string;
  headline: string;
  summary: string;
  tags: string[];
  slug: string;
}

export function getAllReleases(): ReleaseMeta[] {
  if (!fs.existsSync(RELEASES_DIR)) return [];

  const folders = fs
    .readdirSync(RELEASES_DIR)
    .filter((f) => fs.statSync(path.join(RELEASES_DIR, f)).isDirectory());

  const releases: ReleaseMeta[] = [];

  for (const folder of folders) {
    const mdxPath = path.join(RELEASES_DIR, folder, "index.mdx");
    if (!fs.existsSync(mdxPath)) continue;

    const raw = fs.readFileSync(mdxPath, "utf-8");
    const { data } = matter(raw);

    releases.push({
      issue: data.issue,
      version: data.version,
      date: data.date,
      headline: data.headline,
      summary: data.summary || "",
      tags: data.tags || [],
      slug: folder.replace(/^\d+-/, "").replace(/^\d+-/, ""),
    });
  }

  return releases.sort((a, b) => b.issue - a.issue);
}

export function getReleaseBySlug(slug: string): { meta: ReleaseMeta; content: string } | null {
  if (!fs.existsSync(RELEASES_DIR)) return null;

  const folders = fs.readdirSync(RELEASES_DIR);
  const folder = folders.find((f) => {
    const folderSlug = f.replace(/^\d+-/, "");
    return folderSlug === slug;
  });

  if (!folder) return null;

  const mdxPath = path.join(RELEASES_DIR, folder, "index.mdx");
  if (!fs.existsSync(mdxPath)) return null;

  const raw = fs.readFileSync(mdxPath, "utf-8");
  const { data, content } = matter(raw);

  return {
    meta: {
      issue: data.issue,
      version: data.version,
      date: data.date,
      headline: data.headline,
      summary: data.summary || "",
      tags: data.tags || [],
      slug: folder.replace(/^\d+-/, ""),
    },
    content,
  };
}

export function getLatestRelease(): ReleaseMeta | null {
  const all = getAllReleases();
  return all.length > 0 ? all[0] : null;
}

export function getReleaseFolder(slug: string): string | null {
  if (!fs.existsSync(RELEASES_DIR)) return null;

  const folders = fs.readdirSync(RELEASES_DIR);
  const folder = folders.find((f) => {
    const folderSlug = f.replace(/^\d+-/, "");
    return folderSlug === slug;
  });

  return folder || null;
}
