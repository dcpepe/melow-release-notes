"use client";

import { useEffect, useRef, useState } from "react";

const DIGITS = "0123456789";
const REPEATS = 4;
const LINE_HEIGHT = 1.15; // em

function SingleDigit({
  target,
  delay,
}: {
  target: number;
  delay: number;
}) {
  const colRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const allDigits = Array.from({ length: REPEATS }, () => DIGITS).join("");
  const offset = (REPEATS - 1) * 10 + target;

  return (
    <span
      className="inline-block overflow-hidden relative"
      style={{ height: `${LINE_HEIGHT}em`, lineHeight: `${LINE_HEIGHT}em` }}
    >
      <span
        ref={colRef}
        className="inline-flex flex-col"
        style={{
          transform: animated
            ? `translateY(-${offset * LINE_HEIGHT}em)`
            : "translateY(0)",
          transition: animated
            ? `transform 1.85s cubic-bezier(.19, 1, .22, 1)`
            : "none",
          lineHeight: `${LINE_HEIGHT}em`,
        }}
      >
        {allDigits.split("").map((d, i) => (
          <span key={i} className="tabular-nums">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function DigitReel({
  value,
  prefix = "",
  className = "",
}: {
  value: string;
  prefix?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`}>
      {prefix && <span>{prefix}</span>}
      {value.split("").map((char, i) => {
        const digit = parseInt(char, 10);
        if (isNaN(digit)) {
          return <span key={i}>{char}</span>;
        }
        return <SingleDigit key={`${value}-${i}`} target={digit} delay={i * 90} />;
      })}
    </span>
  );
}
