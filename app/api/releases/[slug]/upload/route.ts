import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RELEASES_DIR = path.join(process.cwd(), "content", "releases");

function findFolder(slug: string): string | null {
  if (!fs.existsSync(RELEASES_DIR)) return null;
  const folders = fs.readdirSync(RELEASES_DIR);
  return folders.find((f) => f.replace(/^\d+-/, "") === slug) || null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const folder = findFolder(slug);
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const folderPath = path.join(RELEASES_DIR, folder);
  const filePath = path.join(folderPath, file.name);
  fs.writeFileSync(filePath, buffer);

  // Also copy to public for immediate serving
  const publicDir = path.join(process.cwd(), "public", "releases", slug);
  fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(filePath, path.join(publicDir, file.name));

  return NextResponse.json({
    filename: file.name,
    src: `./${file.name}`,
    publicUrl: `/releases/${slug}/${file.name}`,
  });
}
