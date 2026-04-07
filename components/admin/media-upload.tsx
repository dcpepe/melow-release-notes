"use client";

import { useState, useCallback } from "react";
import { upload } from "@vercel/blob/client";

interface MediaUploadProps {
  onUploaded: (result: { url: string; filename: string; type: "Video" | "Gif" | "Screenshot" | "Audio" }) => void;
  mediaSuggestion?: string;
}

function getMediaType(filename: string): "Video" | "Gif" | "Screenshot" | "Audio" {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "mp4" || ext === "webm" || ext === "mov") return "Video";
  if (ext === "gif") return "Gif";
  if (ext === "mp3") return "Audio";
  return "Screenshot";
}

export default function MediaUpload({ onUploaded, mediaSuggestion }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: ({ percentage }) => {
          setProgress(percentage);
        },
      });

      setUploading(false);
      setProgress(100);

      onUploaded({
        url: blob.url,
        filename: file.name,
        type: getMediaType(file.name),
      });
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }, [onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*,image/*,audio/mpeg";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={uploading ? undefined : handleClick}
      className={`border border-dashed rounded-lg p-6 text-center transition-colors ${
        uploading ? "border-gold/40" : "border-border cursor-pointer hover:border-gold/40"
      }`}
    >
      {uploading ? (
        <div>
          <p className="text-sm text-gold mb-3">Uploading... {Math.round(progress)}%</p>
          <div className="w-full bg-bg rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : error ? (
        <div>
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <p className="text-xs text-text-tertiary">Click to try again</p>
        </div>
      ) : (
        <>
          {mediaSuggestion && (
            <p className="text-sm text-gold mb-3">
              Suggestion: {mediaSuggestion}
            </p>
          )}
          <p className="text-sm text-text-tertiary mb-1">
            Drop a video, GIF, image, or audio file here
          </p>
          <p className="text-xs text-text-tertiary">
            or click to browse (up to 100MB)
          </p>
        </>
      )}
    </div>
  );
}
