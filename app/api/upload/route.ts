import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join("/tmp", "melow-uploads");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const id = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.name);
    const storedName = `${id}${ext}`;

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, storedName), buffer);

    return NextResponse.json({
      filename: file.name,
      storedName,
      src: `./${file.name}`,
      previewUrl: `/api/upload/${storedName}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Upload failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }
}
