import { NextResponse } from "next/server";
import { getAllReleases, saveRelease } from "@/lib/releases";

export const dynamic = "force-dynamic";

export async function GET() {
  const releases = await getAllReleases();
  return NextResponse.json(releases);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { issue, version, date, headline, summary, tags, slug, content } = body;

  const targetSlug = slug || "draft";

  await saveRelease(targetSlug, {
    meta: {
      issue,
      version,
      date,
      headline,
      summary,
      tags: tags || [],
      slug: targetSlug,
    },
    content: content || "## New section\n\nWrite your content here.\n",
  });

  return NextResponse.json({ slug: targetSlug });
}
