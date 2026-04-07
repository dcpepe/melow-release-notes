"use client";

import { useState } from "react";

export default function Video({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  const [playing, setPlaying] = useState(true);

  const handleClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <figure className="my-8">
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onClick={handleClick}
        className="w-full rounded-lg cursor-pointer"
        style={{ border: "0.5px solid rgba(201, 162, 75, 0.15)" }}
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-gold-muted">{caption}</figcaption>
      )}
    </figure>
  );
}
