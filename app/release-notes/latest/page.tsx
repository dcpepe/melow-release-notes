import { redirect } from "next/navigation";
import { getLatestRelease } from "@/lib/releases";

export const dynamic = "force-dynamic";

export default async function LatestReleasePage() {
  const latest = await getLatestRelease();
  if (!latest) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary">No releases yet.</p>
      </div>
    );
  }
  redirect(`/release-notes/${latest.slug}`);
}
