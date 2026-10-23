import React, { useState } from 'react';
import { BookOpen, Sparkles, Feather } from 'lucide-react';
import { Note } from '../../types/database';
import { BookItem } from './BookItem';
import { BookReaderModal } from './BookReaderModal';
import promptsData from '../../data/prompts.json';

interface InteractiveBookshelfProps {
  notes: Note[];
  onWriteClick: () => void;
  onRespondLetter: (note: Note) => void;
}

// The core thematic sections from thediaryproject.lovable.app
const SHELF_SECTIONS = [
  { id: 'all', label: 'All Shelves', category: 'All' },
  { id: 'miss', label: 'To someone I miss', category: 'Nostalgia' },
  { id: 'sorry', label: "Things I'm sorry for", category: 'Forgiveness' },
  { id: 'wish', label: "What I wish I'd said", category: 'Truth' },
  { id: 'left', label: 'To the one who left', category: 'Closure' },
  { id: 'swallowed', label: 'Things I swallowed to keep the peace', category: 'Vulnerability' },
  { id: 'younger', label: 'Dear younger me', category: 'Self' },
];

export const InteractiveBookshelf: React.FC<InteractiveBookshelfProps> = ({
  notes,
  onWriteClick,
  onRespondLetter,
}) => {
  const [activeSectionId, setActiveSectionId] = useState('all');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const activeSection = SHELF_SECTIONS.find((s) => s.id === activeSectionId) || SHELF_SECTIONS[0];

  // Filter notes belonging to the selected shelf section
  const sectionNotes = notes.filter((n) => {
    if (activeSection.id === 'all') return true;

    // Check if the note is attached to a prompt in this category
    const prompt = promptsData.find((p) => p.id === n.prompt_id);
    if (prompt && prompt.category.toLowerCase() === activeSection.category.toLowerCase()) {
      return true;
    }

    // Match keywords in note title or content
    const text = `${n.title || ''} ${n.content}`.toLowerCase();
    if (activeSection.id === 'sorry' && (text.includes('sorry') || text.includes('apolog'))) return true;
    if (activeSection.id === 'miss' && (text.includes('miss') || text.includes('remember'))) return true;
    if (activeSection.id === 'left' && (text.includes('left') || text.includes('goodbye'))) return true;
    if (activeSection.id === 'swallowed' && (text.includes('quiet') || text.includes('swallow') || text.includes('smile'))) return true;
    if (activeSection.id === 'younger' && (text.includes('young') || text.includes('child') || text.includes('past'))) return true;

    return false;
  });

  return (
    <section className="relative w-full max-w-5xl mx-auto px-4 py-8">
      {/* Bookshelf Section Header & Tabs */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-gold" />
          <span className="label-caps">The Library Shelves</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-amber-100 font-normal tracking-tight">
          Touch any book to unroll its letter
        </h2>
        <p className="font-body text-sm text-[#9e9488] max-w-md mx-auto mt-2 italic">
          Every volume rests in silence upon these shelves. Click open a book to read what someone carried in quiet.
        </p>
      </div>

      {/* Shelf Sections Horizontal Scroll / Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none justify-start sm:justify-center">
        {SHELF_SECTIONS.map((sec) => {
          const isActive = activeSectionId === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`px-4 py-2 rounded-full text-xs font-serif transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gold text-wood-950 font-semibold shadow-candle scale-105'
                  : 'bg-card/90 text-amber-200/70 hover:text-amber-100 hover:bg-wood-800 border border-hairline'
              }`}
            >
              {sec.id === 'all' && <Sparkles className="w-3 h-3 inline mr-1 text-gold-dark" />}
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* The Visual Wooden Bookshelf Frame */}
      <div className="relative rounded-2xl bg-[#14100c] border border-hairline p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Soft Background Bookcase Gradient & Ambient Glow */}
        <div className="absolute inset-0 bg-radial-[at_50%_0%] from-gold/10 via-transparent to-black/60 pointer-events-none" />

        {/* Shelf Ledge Header Information */}
        <div className="relative z-10 flex items-center justify-between pb-3 mb-8 border-b border-hairline">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles className="w-4 h-4" />
            <span className="font-serif italic text-lg sm:text-xl text-amber-100">
              Shelf: "{activeSection.label}"
            </span>
          </div>
          <span className="label-caps text-[10px] text-muted-foreground">
            {sectionNotes.length} {sectionNotes.length === 1 ? 'Volume' : 'Volumes'} on Shelf
          </span>
        </div>

        {/* The Books on the Wooden Shelf */}
        {sectionNotes.length === 0 ? (
          <div className="relative z-10 text-center py-20 px-4">
            <Feather className="w-10 h-10 text-gold/40 mx-auto mb-3" />
            <h3 className="font-serif text-2xl text-amber-100 font-normal">This shelf is currently quiet</h3>
            <p className="font-body text-sm text-[#9e9488] max-w-sm mx-auto mt-2 italic">
              No unsent letters have been placed in this section yet. You can be the first to shelve a letter here.
            </p>
            <button
              onClick={onWriteClick}
              className="mt-6 px-6 py-2.5 rounded-full bg-gold text-wood-950 font-serif text-sm font-semibold hover:bg-gold-light transition shadow-candle cursor-pointer inline-flex items-center gap-2"
            >
              <Feather className="w-4 h-4" />
              <span>Write the First Letter</span>
            </button>
          </div>
        ) : (
          <div className="relative z-10">
            {/* Shelf Row 1 */}
            <div className="flex items-end gap-3 sm:gap-5 overflow-x-auto pb-0 pt-6 px-2 scrollbar-none justify-start sm:justify-center min-h-[260px]">
              {sectionNotes.map((note, index) => (
                <BookItem
                  key={note.id}
                  note={note}
                  index={index}
                  onOpen={(opened) => setSelectedNote(opened)}
                />
              ))}
            </div>

            {/* Wooden Shelf Ledge Plank */}
            <div className="wood-shelf-ledge h-5 w-full rounded-b-md relative z-20" />
            <div className="h-4 bg-gradient-to-b from-black/60 to-transparent w-full" />
          </div>
        )}
      </div>

      {/* Book Reader Modal when a book is touched open */}
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
