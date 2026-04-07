import { redirect } from "next/navigation";
import { getLatestRelease } from "@/lib/releases";

export default function LatestReleasePage() {
  const latest = getLatestRelease();
  if (!latest) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary">No releases yet.</p>
      </div>
    );
  }
  redirect(`/release-notes/${latest.slug}`);
}
