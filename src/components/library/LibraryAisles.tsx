import React, { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { Note } from "../../types/database";
import { BookItem } from "../bookshelf/BookItem";
import { SHELF_SECTIONS, matchesSection } from "../bookshelf/InteractiveBookshelf";

interface LibraryAislesProps {
  notes: Note[];
  onOpen: (note: Note) => void;
}

/**
 * The Grand Library seen as aisles: every section at once, each aisle a
 * shelf-row that scrolls sideways. Built for the day thousands of letters
 * rest here - aisles render independently and rows scroll instead of growing
 * the page.
 */
export const LibraryAisles: React.FC<LibraryAislesProps> = ({
  notes,
  onOpen,
}) => {
  const aisles = useMemo(
    () =>
      SHELF_SECTIONS.filter((s) => s.id !== "all")
        .map((section) => ({
          section,
          books: notes.filter((n) => matchesSection(n, section.id)),
        }))
        .filter((a) => a.books.length > 0),
    [notes],
  );

  if (aisles.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <BookOpen className="w-6 h-6 text-gold/50 mx-auto mb-3" />
        <p className="font-body text-sm text-[#9e9488] italic">
          The aisles are quiet for now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Aisle index: jump straight to a section */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {aisles.map(({ section, books }) => (
          <a
            key={section.id}
            href={`#aisle-${section.id}`}
            className="px-3 py-1.5 rounded-full text-xs font-serif tracking-wide bg-card/70 text-amber-200 border border-hairline hover:border-gold/60 hover:text-gold-light transition"
          >
            {section.label}
            <span className="ml-1.5 text-[10px] font-sans text-[#9e9488]">
              {books.length}
            </span>
          </a>
        ))}
      </div>

      {aisles.map(({ section, books }) => (
        <section
          key={section.id}
          id={`aisle-${section.id}`}
          className="scroll-mt-24"
        >
          <div className="flex items-baseline justify-between px-2 mb-2">
            <h3 className="font-serif text-xl sm:text-2xl text-amber-100 tracking-tight">
              {section.label}
            </h3>
            <span className="font-body text-[11px] text-[#9e9488] italic">
              {books.length} {books.length === 1 ? "letter" : "letters"} -
              scroll the shelf sideways
            </span>
          </div>
          <div className="relative rounded-xl wood-panel border border-hairline px-4 pt-8 pb-0 shadow-[0_14px_34px_rgba(0,0,0,0.85)]">
            <div className="absolute inset-0 bg-radial-[at_50%_0%] from-gold/8 via-transparent to-black/50 pointer-events-none rounded-xl" />
            <div className="aisle-scroll relative flex items-end gap-[6px] min-h-[136px] pb-1 overflow-x-auto">
              {books.map((note, idx) => (
                <div key={note.id} className="w-9 shrink-0 flex">
                  <BookItem note={note} index={idx} onOpen={onOpen} />
                </div>
              ))}
            </div>
            <div className="wood-shelf-ledge h-4 rounded-b-md relative z-20" />
          </div>
        </section>
      ))}
    </div>
  );
};
