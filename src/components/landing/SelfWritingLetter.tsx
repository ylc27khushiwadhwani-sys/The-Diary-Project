import React, { useEffect, useState } from "react";

/**
 * The landing's quiet demonstration: a letter writing itself, line by
 * line, in ink. Excerpts come from the sample letters on the shelf.
 */
const EXCERPTS: { text: string; from: string }[] = [
  {
    text: "I still catch myself looking for your reflection in subway windows whenever the train slows between stations.",
    from: "The Subway Window in October",
  },
  {
    text: "I bought a set of blue porcelain mugs yesterday and cried in the kitchen aisle because I never once said - sit down, Mom, let me pour yours.",
    from: "The Blue Porcelain Mugs",
  },
  {
    text: "I missed the sound of your laugh in the two seconds of silence before the guitar kicked in.",
    from: "A Cassette Taped Over Twice",
  },
];

const CHAR_MS = 34;
const HOLD_MS = 3400;
const FADE_MS = 700;

export const SelfWritingLetter: React.FC = () => {
  const [excerptIdx, setExcerptIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [fading, setFading] = useState(false);

  const excerpt = EXCERPTS[excerptIdx];

  useEffect(() => {
    if (fading) {
      const t = window.setTimeout(() => {
        setExcerptIdx((i) => (i + 1) % EXCERPTS.length);
        setChars(0);
        setFading(false);
      }, FADE_MS);
      return () => window.clearTimeout(t);
    }
    if (chars < excerpt.text.length) {
      const t = window.setTimeout(() => setChars((c) => c + 1), CHAR_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setFading(true), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [chars, fading, excerpt]);

  return (
    <figure
      className={`swl-card ${fading ? "swl-fading" : ""}`}
      aria-label={`A letter being written: ${excerpt.text}`}
    >
      <span className="swl-tape" aria-hidden="true" />
      <blockquote className="swl-text" aria-hidden="true">
        {excerpt.text.slice(0, chars)}
        <span className="swl-quill" />
      </blockquote>
      <figcaption className="swl-from">
        - left on a shelf, from "{excerpt.from}"
      </figcaption>
    </figure>
  );
};
