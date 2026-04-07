import fs from "fs";
import path from "path";

const RELEASES_DIR = path.join(process.cwd(), "content", "releases");
const PUBLIC_RELEASES_DIR = path.join(process.cwd(), "public", "releases");

const MEDIA_EXTENSIONS = [".mp4", ".gif", ".png", ".jpg", ".jpeg", ".webp", ".webm", ".svg"];

function main() {
  if (!fs.existsSync(RELEASES_DIR)) {
    console.log("No releases directory found, skipping asset copy.");
    return;
  }

  // Clean existing public releases
  if (fs.existsSync(PUBLIC_RELEASES_DIR)) {
    fs.rmSync(PUBLIC_RELEASES_DIR, { recursive: true });
  }

  const folders = fs
    .readdirSync(RELEASES_DIR)
    .filter((f) => fs.statSync(path.join(RELEASES_DIR, f)).isDirectory());

  let copied = 0;

  for (const folder of folders) {
    const slug = folder.replace(/^\d+-/, "");
    const srcDir = path.join(RELEASES_DIR, folder);
    const destDir = path.join(PUBLIC_RELEASES_DIR, slug);

    const files = fs.readdirSync(srcDir);
    const mediaFiles = files.filter((f) =>
      MEDIA_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    if (mediaFiles.length === 0) continue;

    fs.mkdirSync(destDir, { recursive: true });

    for (const file of mediaFiles) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      copied++;
    }
  }

  console.log(`Copied ${copied} media files to public/releases/`);
}

main();
