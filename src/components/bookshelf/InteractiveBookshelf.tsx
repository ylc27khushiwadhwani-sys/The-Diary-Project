import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Feather } from "lucide-react";
import { Note } from "../../types/database";
import { BookItem } from "./BookItem";
import { KeepsakeBox } from "./KeepsakeBox";
import { BookReaderModal } from "./BookReaderModal";
import promptsData from "../../data/prompts.json";

interface InteractiveBookshelfProps {
  notes: Note[];
  onWriteClick: () => void;
  onRespondLetter: (note: Note) => void;
}

// Shelf sections as filter tabs. Labels are kept to 3-4 words so the
// header row stays compact instead of printing long joined prompt titles.
const SHELF_SECTIONS = [
  { id: "all", label: "All Shelves", category: "All" },
  { id: "miss", label: "To Someone I Miss", category: "Nostalgia" },
  { id: "sorry", label: "Things I'm Sorry For", category: "Forgiveness" },
  { id: "wish", label: "Wish I Had Said It", category: "Truth" },
  { id: "left", label: "For The One Left", category: "Closure" },
  { id: "swallowed", label: "Words I Swallowed", category: "Vulnerability" },
  { id: "younger", label: "Letter To Younger Me", category: "Self" },
  { id: "2am", label: "2AM Thoughts", category: "Late Night" },
  { id: "unsaid", label: "Couldn\u2019t Say To You", category: "Unspoken" },
  { id: "memories", label: "Memories & Reflections", category: "Memory" },
  { id: "hope", label: "Hope & Dreams", category: "Hope" },
  { id: "misc", label: "Miscellaneous", category: "Misc" },
];

// Keyword fallbacks for notes whose prompt_id doesn't map to a section
const SECTION_KEYWORDS: Record<string, string[]> = {
  sorry: ["sorry", "apolog"],
  miss: ["miss", "remember"],
  left: ["left", "goodbye"],
  swallowed: ["quiet", "swallow", "smile"],
  younger: ["young", "child", "past"],
  unsaid: ["couldn't say", "unsaid"],
  "2am": ["2am", "late night"],
  memories: ["memory"],
  hope: ["hope"],
  misc: ["misc"],
};

const matchesSection = (note: Note, sectionId: string): boolean => {
  if (sectionId === "all") return true;

  const section = SHELF_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return true;

  const prompt = promptsData.find((p) => p.id === note.prompt_id);
  if (
    prompt &&
    prompt.category.toLowerCase() === section.category.toLowerCase()
  ) {
    return true;
  }

  const text = `${note.title || ""} ${note.content}`.toLowerCase();
  const keywords = SECTION_KEYWORDS[sectionId] || [];
  return keywords.some((kw) => text.includes(kw));
};

// Slim spines pack tightly; this many per shelf ledge before stacking a new one
const BOOKS_PER_SHELF = 14;

export const InteractiveBookshelf: React.FC<InteractiveBookshelfProps> = ({
  notes,
  onWriteClick,
  onRespondLetter,
}) => {
  const [activeSectionId, setActiveSectionId] = useState("all");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [view, setView] = useState<"shelves" | "box">("shelves");

  useEffect(() => {
    const open = () => setView("box");
    window.addEventListener("paper-vault:open-box", open);
    return () => window.removeEventListener("paper-vault:open-box", open);
  }, []);

  // One filter pass: only the active section's notes are rendered, once
  const sectionNotes = useMemo(
    () => notes.filter((n) => matchesSection(n, activeSectionId)),
    [notes, activeSectionId],
  );

  // Pack the filtered notes into shelf ledges of at most BOOKS_PER_SHELF
  const shelves = useMemo(() => {
    const rows: Note[][] = [];
    for (let i = 0; i < sectionNotes.length; i += BOOKS_PER_SHELF) {
      rows.push(sectionNotes.slice(i, i + BOOKS_PER_SHELF));
    }
    return rows;
  }, [sectionNotes]);

  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 py-4">
      {/* Bookshelf Header */}
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <BookOpen className="w-4 h-4 text-gold" />
          <span className="label-caps">The Library Shelves</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-amber-100 font-normal tracking-tight">
          Touch any book to unroll its letter
        </h2>
      </div>

      {/* View switch: library shelves or the keepsake box */}
      <div
        className="flex items-center justify-center gap-2 mb-5"
        role="group"
        aria-label="Collection view"
      >
        {(["shelves", "box"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`px-4 py-1.5 rounded-full text-xs font-serif tracking-wide cursor-pointer border transition-all duration-200 ${
              view === v
                ? "bg-wax-crimson text-amber-50 border-red-400/40 shadow-candle"
                : "bg-card/70 text-amber-200 border-hairline hover:border-gold/60"
            }`}
          >
            {v === "shelves" ? "On the shelves" : "In the keepsake box"}
          </button>
        ))}
      </div>

      {/* Section filter tabs — short labels, interactive */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {SHELF_SECTIONS.map((sec) => {
          const count = notes.filter((n) => matchesSection(n, sec.id)).length;
          if (sec.id !== "all" && count === 0) return null;
          const isActive = activeSectionId === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSectionId(sec.id)}
              aria-pressed={isActive}
              className={`px-3 py-1.5 rounded-full text-xs font-serif tracking-wide transition-all duration-200 cursor-pointer border ${
                isActive
                  ? "bg-gold text-wood-950 border-gold shadow-candle"
                  : "bg-card/70 text-amber-200 border-hairline hover:border-gold/60 hover:text-gold-light"
              }`}
            >
              {sec.label}
              <span
                className={`ml-1.5 text-[10px] font-sans ${
                  isActive ? "text-wood-950/70" : "text-[#9e9488]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Condensed packed shelves */}
      {sectionNotes.length === 0 ? (
        <div className="text-center py-10 px-4">
          <BookOpen className="w-6 h-6 text-gold/50 mx-auto mb-3" />
          <p className="font-body text-sm text-[#9e9488] italic mb-4">
            This shelf is currently quiet.
          </p>
          <button
            type="button"
            onClick={onWriteClick}
            className="rounded-full bg-gold hover:bg-gold-light px-6 py-2 font-serif text-sm text-wood-950 font-semibold shadow-candle transition-all duration-200 hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
          >
            <Feather className="w-4 h-4" />
            Write the first letter
          </button>
        </div>
      ) : view === "box" ? (
        <KeepsakeBox notes={sectionNotes} onOpen={(n) => setSelectedNote(n)} />
      ) : (
        <div className="space-y-4">
          {shelves.map((shelf, shelfIdx) => (
            <div
              key={shelfIdx}
              className="relative rounded-xl wood-panel border border-hairline px-4 pt-8 pb-0 shadow-[0_14px_34px_rgba(0,0,0,0.85)]"
            >
              <div className="absolute inset-0 bg-radial-[at_50%_0%] from-gold/8 via-transparent to-black/50 pointer-events-none rounded-xl" />
              <div className="relative flex items-end justify-center gap-[3px] flex-wrap min-h-[136px] pb-1">
                {shelf.map((note, idx) => (
                  <BookItem
                    key={note.id}
                    note={note}
                    index={shelfIdx * BOOKS_PER_SHELF + idx}
                    onOpen={(opened) => setSelectedNote(opened)}
                  />
                ))}
              </div>
              {/* Ledge */}
              <div className="wood-shelf-ledge h-4 rounded-b-md relative z-20" />
            </div>
          ))}
        </div>
      )}

      {/* Book Reader Modal */}
      <BookReaderModal
        note={selectedNote}
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        onRespond={(n) => {
          setSelectedNote(null);
          onRespondLetter(n);
        }}
      />
    </section>
  );
};
