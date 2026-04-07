import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    // Upload to Vercel Blob for persistent storage
    const blob = await put(`releases/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      filename: file.name,
      src: `./${file.name}`,
      previewUrl: blob.url,
      blobUrl: blob.url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Upload failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }
}
