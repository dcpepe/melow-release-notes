"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export default function Video({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  const [playing, setPlaying] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
    <motion.figure
      ref={ref}
      className="my-10"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="relative group">
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onClick={handleClick}
          className="w-full rounded-xl cursor-pointer"
          style={{
            border: "0.5px solid rgba(201, 162, 75, 0.12)",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.4)",
          }}
        />
        {/* Play/pause indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <span className="text-white text-xs">
              {playing ? "Pause" : "Play"}
            </span>
          </div>
        </div>
      </div>
      {caption && (
        <figcaption className="mt-3 text-[13px] text-gold-muted text-center">{caption}</figcaption>
      )}
    </motion.figure>
  );
}
