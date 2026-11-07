import React from "react";
import { Note } from "../../types/database";
import { FlowerSpray } from "../common/GardenFlowers";

/**
 * An open envelope with its letter rising out of it - the gardenletters.online
 * reference Khushi sent: a kraft envelope, the opened flap folded back, a
 * textured white sheet emerging with the letter's first lines in real
 * handwriting, a spray of watercolor flowers behind, and a hand-written
 * dedication on the envelope front. Touching it opens the full reader.
 *
 * The handwriting fonts are the ones the reference site itself serves
 * (Cedarville Cursive, Reenie Beanie, Nothing You Could Do, Homemade
 * Apple), rotated per letter the way the reference varies them. Flower
 * shapes are hand-drawn here; no reference artwork is copied.
 */

const HAND_FONTS = [
  "'Cedarville Cursive', cursive",
  "'Reenie Beanie', cursive",
  "'Nothing You Could Do', cursive",
  "'Homemade Apple', cursive",
];

/** First breath of the letter, kept to what fits on the risen sheet. */
const excerptOf = (content: string): string => {
  const flat = content.replace(/\s+/g, " ").trim();
  if (flat.length <= 150) return flat;
  const cut = flat.slice(0, 150);
  return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
};

interface EnvelopeLetterProps {
  note: Note;
  index: number;
  onOpen: (note: Note) => void;
}

export const EnvelopeLetter: React.FC<EnvelopeLetterProps> = ({
  note,
  index,
  onOpen,
}) => {
  const penName = note.profiles?.pen_name?.trim() || "anonymous";
  const title = note.title?.trim();
  return (
    <button
      type="button"
      className={`env-letter env-tilt-${index % 4}`}
      style={{ animationDelay: `${index * 0.12}s` }}
      onClick={() => onOpen(note)}
      aria-label={`Read "${title || "Untitled letter"}" by ${penName}`}
    >
      <span className="env-flowers" aria-hidden="true">
        <FlowerSpray seed={index} />
      </span>
      <span className="env-envelope">
        {/* the opened flap, folded back behind the sheet */}
        <span className="env-flap" aria-hidden="true" />
        {/* the risen sheet, its foot tucked to a point inside the envelope */}
        <span
          className="env-paper"
          style={{ fontFamily: HAND_FONTS[index % HAND_FONTS.length] }}
        >
          <span className="env-excerpt">{excerptOf(note.content)}</span>
          <span className="env-sign">- {penName}</span>
        </span>
        {/* envelope front: kraft body with the V opening over the sheet */}
        <span className="env-front" aria-hidden="true" />
        <span className="env-to">
          To: {title || "whoever needs this"}
        </span>
      </span>
    </button>
  );
};
