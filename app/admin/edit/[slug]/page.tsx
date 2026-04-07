"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { parseSections, serializeSections, Section } from "@/lib/sections";
import Link from "next/link";

export default function EditRelease() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const isNew = slug === "new";

  const [meta, setMeta] = useState({
    issue: 0,
    version: "",
    date: "",
    headline: "",
    summary: "",
    tags: [] as string[],
    slug: "",
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isNewDraft, setIsNewDraft] = useState(false);

  useEffect(() => {
    if (isNew) {
      // Load draft from sessionStorage
      const raw = sessionStorage.getItem("melowDraft");
      if (raw) {
        const draft = JSON.parse(raw);
        setMeta({ ...draft.meta, slug: draft.meta.slug || "draft" });
        setEditSlug(draft.meta.slug || "draft");

        const parsed: Section[] = draft.sections.map(
          (s: { heading: string; body: string; mediaSuggestion?: string; sourceUrl?: string }, i: number) => ({
            id: `s_${Date.now()}_${i}`,
            heading: s.heading,
            body: s.body,
            media: undefined,
            mediaSuggestion: s.mediaSuggestion || undefined,
            sourceUrl: s.sourceUrl || undefined,
          })
        );
        setSections(parsed);
        setIsNewDraft(true);
        sessionStorage.removeItem("melowDraft");
      }
      setLoading(false);
    } else {
      fetch(`/api/releases/${slug}`)
        .then((r) => r.json())
        .then((data) => {
          setMeta({ ...data.meta, slug: data.meta.slug || slug });
          setSections(parseSections(data.content));
          setMediaFiles(data.mediaFiles || []);
          setEditSlug(data.meta.slug || slug);
          setLoading(false);
        });
    }
  }, [slug, isNew]);

  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);

    const targetSlug = editSlug || "draft";
    const content = serializeSections(sections);

    if (isNewDraft) {
      // Create new release via POST
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue: meta.issue,
          version: meta.version,
          date: meta.date,
          headline: meta.headline,
          summary: meta.summary,
          slug: targetSlug,
          tags: meta.tags,
          content,
        }),
      });
      const result = await res.json();
      setIsNewDraft(false);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.push(`/admin/edit/${targetSlug}`);
    } else {
      await fetch(`/api/releases/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: {
            issue: meta.issue,
            version: meta.version,
            date: meta.date,
            headline: meta.headline,
            summary: meta.summary,
            tags: meta.tags,
          },
          content,
          newSlug: targetSlug !== slug ? targetSlug : undefined,
        }),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (targetSlug !== slug) {
        router.push(`/admin/edit/${targetSlug}`);
      }
    }
  }, [meta, sections, slug, editSlug, router, isNewDraft]);

  async function uploadFile(file: File, sectionId?: string) {
    const targetSlug = editSlug || slug;
    setUploading(sectionId || "general");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/releases/${targetSlug}/upload`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    setUploading(null);
    setMediaFiles((prev) => [...prev, result.filename]);
    return result;
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const newSections = [...sections];
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    setSections(newSections);
  }

  function updateSection(index: number, updates: Partial<Section>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: `s_${Date.now()}`,
        heading: "New section",
        body: "Write your content here.",
        media: undefined,
      },
    ]);
  }

  async function handleMediaDrop(e: React.DragEvent, sectionIndex: number) {
    e.preventDefault();
    if (isNewDraft) {
      alert("Save the release first before uploading media.");
      return;
    }
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const result = await uploadFile(file, sections[sectionIndex].id);

    const ext = file.name.split(".").pop()?.toLowerCase();
    let type: "Video" | "Gif" | "Screenshot" = "Screenshot";
    if (ext === "mp4" || ext === "webm") type = "Video";
    if (ext === "gif") type = "Gif";

    updateSection(sectionIndex, {
      media: { type, src: result.src, caption: "" },
    });
  }

  function handleMediaFileSelect(sectionIndex: number) {
    if (isNewDraft) {
      alert("Save the release first before uploading media.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*,image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const result = await uploadFile(file, sections[sectionIndex].id);

      const ext = file.name.split(".").pop()?.toLowerCase();
      let type: "Video" | "Gif" | "Screenshot" = "Screenshot";
      if (ext === "mp4" || ext === "webm") type = "Video";
      if (ext === "gif") type = "Gif";

      updateSection(sectionIndex, {
        media: { type, src: result.src, caption: "" },
      });
    };
    input.click();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
              Back
            </Link>
            <span className="text-text-tertiary">/</span>
            <span className="text-sm text-text-secondary">
              {isNewDraft ? "New draft" : `#${String(meta.issue).padStart(3, "0")}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded border border-border transition-colors"
            >
              {showPreview ? "Editor" : "Preview"}
            </button>
            {!isNewDraft && (
              <a
                href={`/release-notes/${editSlug}`}
                target="_blank"
                className="text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded border border-border transition-colors"
              >
                View live
              </a>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="text-sm text-bg bg-gold px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved" : isNewDraft ? "Save draft" : "Save"}
            </button>
          </div>
        </div>

        {/* AI-generated banner for new drafts */}
        {isNewDraft && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{ background: "rgba(201, 162, 75, 0.08)", border: "0.5px solid rgba(201, 162, 75, 0.2)" }}
          >
            <p className="text-sm text-gold">
              This draft was generated from your Linear tickets. Edit the headline, tweak the copy, then save.
            </p>
          </div>
        )}

        {showPreview ? (
          /* Preview mode */
          <div className="rounded-lg p-8" style={{ background: "#161616", border: "0.5px solid rgba(201, 162, 75, 0.15)" }}>
            <p className="font-serif italic text-xl text-text-primary mb-6">Melow Weekly</p>
            <p className="text-[13px] text-text-tertiary mb-8 tabular-nums">
              {meta.date} | Issue #{String(meta.issue).padStart(3, "0")} | v{meta.version}
            </p>
            <h1 className="font-serif text-4xl text-text-primary mb-4" style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {meta.headline}<span className="text-gold">.</span>
            </h1>
            <p className="text-text-secondary mb-10">{meta.summary}</p>
            <div className="prose">
              {sections.map((s) => (
                <div key={s.id} className="mb-8">
                  {s.heading && <h2>{s.heading}</h2>}
                  {s.body.split("\n").map((line, i) => {
                    if (line.startsWith("- ")) {
                      return <li key={i}>{line.slice(2)}</li>;
                    }
                    if (line.trim()) return <p key={i}>{line}</p>;
                    return null;
                  })}
                  {s.media && (
                    <figure className="my-4">
                      {s.media.type === "Video" ? (
                        <video
                          src={`/releases/${editSlug}/${s.media.src.replace("./", "")}`}
                          autoPlay muted loop playsInline
                          className="w-full rounded-lg"
                          style={{ border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
                        />
                      ) : (
                        <img
                          src={`/releases/${editSlug}/${s.media.src.replace("./", "")}`}
                          alt={s.media.caption || ""}
                          className="w-full rounded-lg"
                          style={{ border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
                        />
                      )}
                      {s.media.caption && (
                        <figcaption className="mt-2 text-sm text-gold-muted">{s.media.caption}</figcaption>
                      )}
                    </figure>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Editor mode */
          <>
            {/* Meta fields */}
            <div
              className="rounded-lg p-6 mb-6"
              style={{ background: "#161616", border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-tertiary uppercase tracking-wide mb-1.5">Headline</label>
                  <input
                    value={meta.headline}
                    onChange={(e) => setMeta({ ...meta, headline: e.target.value })}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-lg font-serif focus:outline-none focus:border-gold"
                    style={{ letterSpacing: "-0.01em" }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-tertiary uppercase tracking-wide mb-1.5">Summary</label>
                  <textarea
                    value={meta.summary}
                    onChange={(e) => setMeta({ ...meta, summary: e.target.value })}
                    rows={2}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold resize-none"
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-text-tertiary uppercase tracking-wide mb-1.5">Date</label>
                    <input
                      type="date"
                      value={meta.date}
                      onChange={(e) => setMeta({ ...meta, date: e.target.value })}
                      className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary uppercase tracking-wide mb-1.5">Version</label>
                    <input
                      value={meta.version}
                      onChange={(e) => setMeta({ ...meta, version: e.target.value })}
                      className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary uppercase tracking-wide mb-1.5">Issue</label>
                    <input
                      type="number"
                      value={meta.issue}
                      onChange={(e) => setMeta({ ...meta, issue: parseInt(e.target.value) || 0 })}
                      className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-tertiary uppercase tracking-wide mb-1.5">Slug</label>
                    <input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4 mb-6">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="rounded-lg p-6"
                  style={{ background: "#161616", border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
                >
                  {/* Section controls */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-tertiary">
                        Section {index + 1}
                      </span>
                      {section.sourceUrl && (
                        <a
                          href={section.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gold/50 hover:text-gold transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Linear ticket
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSection(index, -1)}
                        disabled={index === 0}
                        className="text-text-tertiary hover:text-text-primary disabled:opacity-20 px-2 py-1 text-sm transition-colors"
                      >
                        Up
                      </button>
                      <button
                        onClick={() => moveSection(index, 1)}
                        disabled={index === sections.length - 1}
                        className="text-text-tertiary hover:text-text-primary disabled:opacity-20 px-2 py-1 text-sm transition-colors"
                      >
                        Down
                      </button>
                      <button
                        onClick={() => removeSection(index)}
                        className="text-text-tertiary hover:text-red-400 px-2 py-1 text-sm transition-colors ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Heading */}
                  <input
                    value={section.heading}
                    onChange={(e) => updateSection(index, { heading: e.target.value })}
                    placeholder="Section heading"
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary font-serif text-lg mb-3 focus:outline-none focus:border-gold"
                  />

                  {/* Body */}
                  <textarea
                    value={section.body}
                    onChange={(e) => updateSection(index, { body: e.target.value })}
                    placeholder="Section content..."
                    rows={4}
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-text-secondary text-sm mb-3 focus:outline-none focus:border-gold resize-y"
                  />

                  {/* Media */}
                  {section.media ? (
                    <div className="relative">
                      <div className="rounded-lg overflow-hidden mb-2" style={{ border: "0.5px solid rgba(201, 162, 75, 0.15)" }}>
                        {section.media.type === "Video" ? (
                          <video
                            src={`/releases/${editSlug}/${section.media.src.replace("./", "")}`}
                            autoPlay muted loop playsInline
                            className="w-full"
                          />
                        ) : (
                          <img
                            src={`/releases/${editSlug}/${section.media.src.replace("./", "")}`}
                            alt=""
                            className="w-full"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value={section.media.caption || ""}
                          onChange={(e) =>
                            updateSection(index, {
                              media: { ...section.media!, caption: e.target.value },
                            })
                          }
                          placeholder="Caption (optional)"
                          className="flex-1 bg-bg border border-border rounded px-3 py-1.5 text-text-secondary text-sm focus:outline-none focus:border-gold"
                        />
                        <button
                          onClick={() => updateSection(index, { media: undefined })}
                          className="text-xs text-text-tertiary hover:text-red-400 transition-colors px-2 py-1.5"
                        >
                          Remove media
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleMediaDrop(e, index)}
                      onClick={() => handleMediaFileSelect(index)}
                      className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-gold/40 transition-colors"
                    >
                      {uploading === section.id ? (
                        <p className="text-sm text-gold">Uploading...</p>
                      ) : (
                        <>
                          {section.mediaSuggestion && (
                            <p className="text-sm text-gold mb-3">
                              Suggestion: {section.mediaSuggestion}
                            </p>
                          )}
                          <p className="text-sm text-text-tertiary mb-1">
                            {isNewDraft ? "Save draft first, then upload media" : "Drop a video, GIF, or image here"}
                          </p>
                          {!isNewDraft && (
                            <p className="text-xs text-text-tertiary">
                              or click to browse
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add section */}
            <button
              onClick={addSection}
              className="w-full py-3 text-sm text-text-tertiary hover:text-gold border border-dashed border-border hover:border-gold/40 rounded-lg transition-colors"
            >
              + Add section
            </button>
          </>
        )}
      </div>
    </div>
  );
}
