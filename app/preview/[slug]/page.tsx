import { notFound } from "next/navigation";
import { getAllReleases, getReleaseBySlug } from "@/lib/releases";
import ReleasePage from "@/components/release-page";
import MDXContent from "@/components/mdx-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) return { title: "Preview Not Found" };
  return {
    title: `[Preview] ${release.meta.headline} - Melow Weekly #${release.meta.issue}`,
    description: release.meta.summary,
  };
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) notFound();

  const allReleases = await getAllReleases();
  const pastReleases = allReleases
    .filter((r) => r.issue !== release.meta.issue)
    .slice(0, 10)
    .map((r) => ({
      issue: r.issue,
      version: r.version,
      date: r.date,
      headline: r.headline,
      slug: r.slug,
    }));

  const processedContent = release.content.replace(
    /^\*\*(.+?)\*\*$/gm,
    "$1"
  );

  return (
    <ReleasePage release={{ ...release.meta }} pastReleases={pastReleases} isPreview>
      <MDXContent source={processedContent} />
    </ReleasePage>
  );
}
