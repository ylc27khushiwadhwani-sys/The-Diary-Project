import React from "react";
import { Note } from "../../types/database";

const COVERS = [
  "#7a3b3b",
  "#3b5a4a",
  "#4a4a72",
  "#7a5a2e",
  "#5a3b5e",
  "#2e5a5a",
  "#7a4632",
];

interface OpenBookItemProps {
  note: Note;
  index: number;
  onOpen: (note: Note) => void;
}

/**
 * A book lying open on the shelf after "Read the letters" is pressed (her
 * facing-pages reference): the coloured cover peeks out underneath, two
 * cream pages face up with a shadowed centre crease, and the letter's title
 * sits on the right page in hand ink. Touching it opens the reader.
 */
export const OpenBookItem: React.FC<OpenBookItemProps> = ({
  note,
  index,
  onOpen,
}) => (
  <button
    type="button"
    className="open-book"
    style={{
      animationDelay: `${index * 0.08}s`,
      ["--ob-cover" as string]: COVERS[index % COVERS.length],
    }}
    onClick={() => onOpen(note)}
    aria-label={`Read "${note.title || "Untitled letter"}"`}
  >
    <span className="ob-cover" aria-hidden="true" />
    <span className="ob-pages" aria-hidden="true">
      <span className="ob-page ob-left" />
      <span className="ob-page ob-right" />
    </span>
    <span className="ob-title font-garden">{note.title || "Untitled"}</span>
  </button>
);
