import React from "react";
import { Lock } from "lucide-react";
import { Note } from "../../types/database";
import { HeartSeal } from "../library/HeartSeal";

interface KeepsakeBoxProps {
  notes: Note[];
  onOpen: (note: Note) => void;
}

const TILTS = [-2.2, 1.4, -0.8, 2.1, -1.5, 0.9, -2.6, 1.8];

/** A wooden keepsake box of folded letters: the collection seen from above. */
export const KeepsakeBox: React.FC<KeepsakeBoxProps> = ({ notes, onOpen }) => {
  return (
    <div className="keepsake-box">
      <div className="keepsake-lid">
        <span className="label-caps">The Keepsake Box</span>
      </div>
      <div className="keepsake-tray">
        {notes.map((note, i) => {
          const tilt = TILTS[i % TILTS.length];
          const author = note.profiles?.pen_name || "Anonymous Writer";
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => onOpen(note)}
              className="keepsake-letter letter-land"
              style={
                {
                  "--land-rot": `${tilt}deg`,
                  "--land-from": `${tilt - 3}deg`,
                  "--land-delay": `${Math.min(i, 14) * 0.05}s`,
                } as React.CSSProperties
              }
              aria-label={`Open letter: ${note.title || "Untitled Letter"}`}
            >
              <span className="keepsake-twine" />
              <span className="keepsake-seal">
                <HeartSeal size={30} locked={note.is_locked} />
              </span>
              <span className="keepsake-title">
                {note.title || "Untitled Letter"}
              </span>
              <span className="keepsake-by">
                {note.is_locked && (
                  <Lock className="w-3 h-3 inline mr-1 -mt-0.5" />
                )}
                {author}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
