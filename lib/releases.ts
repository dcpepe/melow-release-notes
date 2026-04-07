import { put, list, head, del } from "@vercel/blob";

export interface ReleaseMeta {
  issue: number;
  version: string;
  date: string;
  headline: string;
  summary: string;
  tags: string[];
  slug: string;
}

export interface ReleaseData {
  meta: ReleaseMeta;
  content: string;
}

const BLOB_PREFIX = "releases/";

function blobPath(slug: string): string {
  return `${BLOB_PREFIX}${slug}.json`;
}

export async function getAllReleases(): Promise<ReleaseMeta[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const releases: ReleaseMeta[] = [];

    for (const blob of blobs) {
      try {
        const res = await fetch(blob.url);
        const data: ReleaseData = await res.json();
        releases.push(data.meta);
      } catch {
        // skip corrupt blobs
      }
    }

    return releases.sort((a, b) => b.issue - a.issue);
  } catch {
    return [];
  }
}

export async function getReleaseBySlug(slug: string): Promise<ReleaseData | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const blob = blobs.find((b) => b.pathname === blobPath(slug));
    if (!blob) return null;

    const res = await fetch(blob.url);
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveRelease(slug: string, data: ReleaseData): Promise<void> {
  // Delete old blob if exists (in case slug changed)
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const existing = blobs.find((b) => b.pathname === blobPath(slug));
    if (existing) {
      await del(existing.url);
    }
  } catch {
    // ignore
  }

  await put(blobPath(slug), JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function getLatestRelease(): Promise<ReleaseMeta | null> {
  const all = await getAllReleases();
  return all.length > 0 ? all[0] : null;
}

export async function deleteRelease(slug: string): Promise<void> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const blob = blobs.find((b) => b.pathname === blobPath(slug));
    if (blob) {
      await del(blob.url);
    }
  } catch {
    // ignore
  }
}
