import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "audio/mpeg",
            "audio/mp3",
            "image/gif",
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/svg+xml",
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json(
      { error: `Upload failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }
}
