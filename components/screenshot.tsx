"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function Screenshot({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.figure
      ref={ref}
      className="my-10"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <img
        src={src}
        alt={caption || ""}
        className="w-full rounded-xl"
        style={{
          border: "0.5px solid rgba(201, 162, 75, 0.12)",
          boxShadow: "0 8px 40px rgba(0, 0, 0, 0.4)",
        }}
      />
      {caption && (
        <figcaption className="mt-3 text-[13px] text-gold-muted text-center">{caption}</figcaption>
      )}
    </motion.figure>
  );
}
