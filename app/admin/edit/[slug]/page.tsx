"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { parseSections, serializeSections, Section } from "@/lib/sections";
import RichEditor from "@/components/admin/rich-editor";
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
  const [generating, setGenerating] = useState(false);
  const [genSteps, setGenSteps] = useState<string[]>([]);

  useEffect(() => {
    if (isNew) {
      const raw = sessionStorage.getItem("melowDraft");
      if (raw) {
        const draft = JSON.parse(raw);
        setMeta({ ...draft.meta, slug: draft.meta.slug || "draft" });
        setEditSlug(draft.meta.slug || "draft");

        if (draft.sections && draft.sections.length > 0) {
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
        }
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

  async function generateFromLinear() {
    setGenerating(true);
    setGenSteps(["Starting generation..."]);

    try {
      const res = await fetch("/api/releases/draft", { method: "POST" });
      const reader = res.body?.getReader();
      if (!reader) {
        setGenSteps((prev) => [...prev, "Failed to connect to server."]);
        setGenerating(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/);
          if (!match) continue;

          try {
            const event = JSON.parse(match[1]);

            if (event.type === "step") {
              setGenSteps((prev) => [...prev, event.message]);
            }

            if (event.type === "error") {
              setGenSteps((prev) => [...prev, `Error: ${event.message}`]);
            }

            if (event.type === "done" && event.draft) {
              const draft = event.draft;
              setMeta((prev) => ({
                ...prev,
                headline: draft.meta.headline || prev.headline,
                summary: draft.meta.summary || prev.summary,
                tags: draft.meta.tags || prev.tags,
              }));
              setEditSlug(draft.meta.slug || editSlug);

              if (draft.sections && draft.sections.length > 0) {
                const newSections: Section[] = draft.sections.map(
                  (s: { heading: string; body: string; mediaSuggestion?: string; sourceUrl?: string }, i: number) => ({
                    id: `s_gen_${Date.now()}_${i}`,
                    heading: s.heading,
                    body: s.body,
                    media: undefined,
                    mediaSuggestion: s.mediaSuggestion || undefined,
                    sourceUrl: s.sourceUrl || undefined,
                  })
                );
                setSections(newSections);
              }
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch {
      setGenSteps((prev) => [...prev, "Connection failed. Check your API keys in Vercel settings."]);
    }

    setGenerating(false);
  }

  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);

    const targetSlug = editSlug || "draft";
    const content = serializeSections(sections);

    if (isNewDraft) {
      await fetch("/api/releases", {
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

        {showPreview ? (
          /* Preview mode */
          <div className="rounded-lg p-8" style={{ background: "#161616", border: "0.5px solid rgba(201, 162, 75, 0.15)" }}>
            <p className="font-serif italic text-xl text-text-primary mb-6">Melow Weekly</p>
            <p className="text-[13px] text-text-tertiary mb-8 tabular-nums">
              {meta.date} | Issue #{String(meta.issue).padStart(3, "0")} | v{meta.version}
            </p>
            <h1 className="font-serif text-4xl text-text-primary mb-4" style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {meta.headline || "Untitled"}<span className="text-gold">.</span>
            </h1>
            <p className="text-text-secondary mb-10">{meta.summary}</p>
            <div className="prose">
              {sections.map((s) => (
                <div key={s.id} className="mb-8">
                  {s.heading && <h2>{s.heading}</h2>}
                  {s.body.split("\n").map((line, i) => {
                    if (line.startsWith("- ")) return <li key={i}>{line.slice(2)}</li>;
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
            {/* Generate from Linear button */}
            {sections.length === 0 && !generating && (
              <div
                className="mb-6 p-6 rounded-lg text-center"
                style={{ background: "#161616", border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
              >
                <p className="text-sm text-text-secondary mb-4">
                  Pull shipped tickets from Linear and auto-generate your release notes with AI.
                </p>
                <button
                  onClick={generateFromLinear}
                  className="text-sm text-bg bg-gold px-5 py-2 rounded hover:opacity-90 transition-opacity"
                >
                  Generate from Linear
                </button>
                <p className="text-xs text-text-tertiary mt-3">
                  Or add sections manually below.
                </p>
              </div>
            )}

            {/* Generation log */}
            {genSteps.length > 0 && (
              <div
                className="mb-6 p-4 rounded-lg"
                style={{ background: "rgba(201, 162, 75, 0.08)", border: "0.5px solid rgba(201, 162, 75, 0.2)" }}
              >
                <div className="space-y-1.5">
                  {genSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {i === genSteps.length - 1 && generating ? (
                        <div
                          className="w-3 h-3 border-[1.5px] border-gold border-t-transparent rounded-full shrink-0 mt-0.5"
                          style={{ animation: "spin 0.8s linear infinite" }}
                        />
                      ) : (
                        <span className="text-gold text-xs mt-0.5 shrink-0">
                          {step.startsWith("Error") ? "x" : "\u2713"}
                        </span>
                      )}
                      <p className={`text-xs ${step.startsWith("Error") ? "text-red-400" : "text-text-secondary"}`}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
                {!generating && genSteps.length > 0 && (
                  <button
                    onClick={() => setGenSteps([])}
                    className="text-xs text-text-tertiary hover:text-text-primary mt-3 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}

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
                    placeholder="AI will generate this, or type your own"
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-lg font-serif focus:outline-none focus:border-gold"
                    style={{ letterSpacing: "-0.01em" }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-tertiary uppercase tracking-wide mb-1.5">Summary</label>
                  <textarea
                    value={meta.summary}
                    onChange={(e) => setMeta({ ...meta, summary: e.target.value })}
                    placeholder="AI will generate this, or type your own"
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

            {/* Generate button when sections exist */}
            {sections.length > 0 && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={generateFromLinear}
                  disabled={generating}
                  className="text-xs text-text-tertiary hover:text-gold px-3 py-1.5 rounded border border-border hover:border-gold/30 transition-colors disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Regenerate from Linear"}
                </button>
              </div>
            )}

            {/* Sections */}
            <div className="space-y-4 mb-6">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="rounded-lg p-6"
                  style={{ background: "#161616", border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
                >
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

                  <input
                    value={section.heading}
                    onChange={(e) => updateSection(index, { heading: e.target.value })}
                    placeholder="Section heading"
                    className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary font-serif text-lg mb-3 focus:outline-none focus:border-gold"
                  />

                  <div className="mb-3">
                    <RichEditor
                      value={section.body}
                      onChange={(val) => updateSection(index, { body: val })}
                      placeholder="Write your section content..."
                    />
                  </div>

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

            <button
              onClick={addSection}
              className="w-full py-3 text-sm text-text-tertiary hover:text-gold border border-dashed border-border hover:border-gold/40 rounded-lg transition-colors"
            >
              + Add section
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
