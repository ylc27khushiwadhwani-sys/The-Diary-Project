import React, { useEffect, useMemo, useState } from "react";
import { hasSeenEntry, prefersReducedMotion } from "../../lib/motion";

interface InkTextProps {
  text: string;
  className?: string;
  /** Seconds before the first letter appears. */
  startDelay?: number;
  perLetter?: number;
}

/**
 * Writes a line in letter by letter with a soft ink-bleed settle. Plays only
 * on a visitor's first visit (and never under prefers-reduced-motion); on
 * return visits the heading is simply there. The full text is always in the
 * DOM via aria-label so assistive tech reads it immediately.
 */
export const InkText: React.FC<InkTextProps> = ({
  text,
  className = "",
  startDelay = 0.5,
  perLetter = 0.045,
}) => {
  // Decided once at mount: the entry sequence marks "seen" only when it ends.
  const [animate] = useState(() => !hasSeenEntry() && !prefersReducedMotion());
  const [, setDone] = useState(false);
  const letters = useMemo(() => Array.from(text.replace(/ /g, "")), [text]);

  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(
      () => setDone(true),
      (startDelay + letters.length * perLetter + 1.4) * 1000,
    );
    return () => window.clearTimeout(t);
  }, [animate, letters.length, perLetter, startDelay]);

  if (!animate) return <span className={className}>{text}</span>;

  let idx = 0;
  return (
    <span className={`${className} ink-write`} aria-label={text}>
      {text.split(" ").map((word, w, all) => (
        <React.Fragment key={w}>
          <span aria-hidden="true" className="ink-word">
            {Array.from(word).map((ch) => {
              const i = idx++;
              return (
                <span
                  key={i}
                  className="ink-letter"
                  style={{ animationDelay: `${startDelay + i * perLetter}s` }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
          {w < all.length - 1 && " "}
        </React.Fragment>
      ))}
    </span>
  );
};
