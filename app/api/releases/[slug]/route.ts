import { NextResponse } from "next/server";
import { getReleaseBySlug, saveRelease, deleteRelease } from "@/lib/releases";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    meta: release.meta,
    content: release.content,
    mediaFiles: [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { meta, content, newSlug } = body;

  const targetSlug = newSlug || slug;

  await saveRelease(targetSlug, {
    meta: { ...meta, slug: targetSlug },
    content,
  });

  // If slug changed, delete the old one
  if (newSlug && newSlug !== slug) {
    await deleteRelease(slug);
  }

  return NextResponse.json({ slug: targetSlug });
}
