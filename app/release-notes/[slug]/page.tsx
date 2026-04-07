import { notFound } from "next/navigation";
import { getAllReleases, getReleaseBySlug } from "@/lib/releases";
import ReleasePage from "@/components/release-page";
import MDXContent from "@/components/mdx-content";

export async function generateStaticParams() {
  const releases = getAllReleases();
  return releases.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const release = getReleaseBySlug(slug);
  if (!release) return { title: "Not Found" };
  return {
    title: `${release.meta.headline} - Melow Weekly #${release.meta.issue}`,
    description: release.meta.summary,
  };
}

export default async function ReleaseSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const release = getReleaseBySlug(slug);
  if (!release) notFound();

  const allReleases = getAllReleases();
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

  // Rewrite relative media paths to public paths
  let processedContent = release.content.replace(
    /src="\.\/([^"]+)"/g,
    `src="/releases/${slug}/$1"`
  );

  // Clean up stray markdown bold/italic that MDX doesn't render
  processedContent = processedContent.replace(
    /^\*\*(.+?)\*\*$/gm,
    "$1"
  );

  return (
    <ReleasePage release={{ ...release.meta }} pastReleases={pastReleases}>
      <MDXContent source={processedContent} />
    </ReleasePage>
  );
}
