import React, { useState } from 'react';
import { BookOpen, Feather, Mail, KeyRound, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Note, Shelf, Prompt } from '../types/database';
import { ShelfManager } from '../components/library/ShelfManager';
import { PromptSelector } from '../components/library/PromptSelector';
import { NoteCard } from '../components/library/NoteCard';
import { NoteEditor } from '../components/editor/NoteEditor';
import { AuthorInbox } from '../components/library/AuthorInbox';
import { WaxSeal } from '../components/library/WaxSeal';
import { useCancellableLoad } from '../hooks/useCancellableLoad';
import { DEMO_NOTES_KEY, loadNotes, searchNotes } from '../services/notes';
import { downloadNotesExport } from '../services/export';

const DEMO_SHELVES_KEY = 'unsent_library_demo_shelves';

const loadShelves = async (userId: string): Promise<Shelf[] | null> => {
  if (!isSupabaseConfigured) {
    const saved = localStorage.getItem(DEMO_SHELVES_KEY);
    if (saved) return JSON.parse(saved) as Shelf[];
    const defaultShelves: Shelf[] = [
      { id: 'shelf-1', user_id: userId, name: 'Unspoken Words', icon: 'feather', created_at: new Date().toISOString() },
      { id: 'shelf-2', user_id: userId, name: 'Letters Never Sent', icon: 'bookmark', created_at: new Date().toISOString() },
      { id: 'shelf-3', user_id: userId, name: 'Grief & Healing', icon: 'heart', created_at: new Date().toISOString() },
    ];
    localStorage.setItem(DEMO_SHELVES_KEY, JSON.stringify(defaultShelves));
    return defaultShelves;
  }

  const { data } = await supabase
    .from('shelves')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return data ? (data as Shelf[]) : null;
};

export const LibraryPage: React.FC = () => {
  const { user, profile, loginAsGuestDemo } = useAuth();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEditingNote, setActiveEditingNote] = useState<Partial<Note> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  // Notes unlocked via passcode earlier in this session (U8 export reads this).
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [exportSummary, setExportSummary] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const { loading } = useCancellableLoad(
    () =>
      user
        ? Promise.all([loadShelves(user.id), loadNotes(user.id)])
        : Promise.resolve(null),
    [user],
    ([loadedShelves, loadedNotes]) => {
      if (loadedShelves) setShelves(loadedShelves);
      if (loadedNotes) setNotes(loadedNotes);
    }
  );

  const handleCreateShelf = async (name: string, icon: string) => {
    if (!user) return;
    const newShelf: Shelf = {
      id: isSupabaseConfigured ? (undefined as unknown as string) : 'shelf-' + Date.now(),
      user_id: user.id,
      name,
      icon,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      const updated = [...shelves, newShelf];
      setShelves(updated);
      localStorage.setItem(DEMO_SHELVES_KEY, JSON.stringify(updated));
      return;
    }

    const { data } = await supabase.from('shelves').insert([newShelf]).select().single();
    if (data) setShelves((prev) => [...prev, data]);
  };

  const handleDeleteShelf = async (shelfId: string) => {
    if (!isSupabaseConfigured) {
      const updated = shelves.filter((s) => s.id !== shelfId);
      setShelves(updated);
      localStorage.setItem(DEMO_SHELVES_KEY, JSON.stringify(updated));
      if (selectedShelfId === shelfId) setSelectedShelfId(null);
      return;
    }

    await supabase.from('shelves').delete().eq('id', shelfId);
    setShelves((prev) => prev.filter((s) => s.id !== shelfId));
    if (selectedShelfId === shelfId) setSelectedShelfId(null);
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (!user) return;
    const isNew = !noteData.id;

    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      let updatedList: Note[];
      if (isNew) {
        const newNote: Note = {
          id: 'note-' + Date.now(),
          user_id: user.id,
          shelf_id: noteData.shelf_id || null,
          title: noteData.title || null,
          content: noteData.content || '',
          prompt_id: noteData.prompt_id || null,
          is_locked: noteData.is_locked || false,
          passcode_hash: noteData.passcode_hash || null,
          is_public: noteData.is_public || false,
          allow_responses: noteData.allow_responses ?? true,
          moderation_status: noteData.moderation_status || 'clean',
          report_count: 0,
          published_at: noteData.is_public ? now : null,
          created_at: now,
          tags: noteData.tags ?? [],
          profiles: profile || undefined,
        };
        updatedList = [newNote, ...notes];
      } else {
        updatedList = notes.map((n) => (n.id === noteData.id ? ({ ...n, ...noteData } as Note) : n));
      }
      setNotes(updatedList);
      localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(updatedList));
      setIsEditorOpen(false);
      return;
    }

    if (isNew) {
      const { data } = await supabase
        .from('notes')
        .insert([{ ...noteData, user_id: user.id }])
        .select()
        .single();
      if (data) setNotes((prev) => [data, ...prev]);
    } else {
      const { data } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', noteData.id!)
        .select()
        .single();
      if (data) setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)));
    }
    setIsEditorOpen(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!isSupabaseConfigured) {
      const updated = notes.filter((n) => n.id !== noteId);
      setNotes(updated);
      localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(updated));
      return;
    }
    await supabase.from('notes').delete().eq('id', noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const handleStartFromPrompt = (prompt: Prompt) => {
    setActiveEditingNote({
      title: prompt.title,
      prompt_id: prompt.id,
      shelf_id: selectedShelfId,
      content: '',
    });
    setIsEditorOpen(true);
  };

  const handleCreateNewBlank = () => {
    setActiveEditingNote({
      shelf_id: selectedShelfId,
      content: '',
    });
    setIsEditorOpen(true);
  };

  const handleUnlockNote = (noteId: string) => {
    setUnlockedIds((prev) => new Set(prev).add(noteId));
  };

  const handleExport = () => {
    try {
      const result = downloadNotesExport(notes, unlockedIds, shelves);
      const noun = result.exportedCount === 1 ? 'note' : 'notes';
      const summary = `Exported ${result.exportedCount} ${noun}`;
      setExportSummary(
        result.skippedCount > 0
          ? `${summary}; ${result.skippedCount} locked ${
              result.skippedCount === 1 ? 'note was' : 'notes were'
            } skipped`
          : summary
      );
      setExportError(null);
    } catch (err) {
      setExportSummary(null);
      setExportError(
        err instanceof Error ? err.message : 'Export failed. Please try again.'
      );
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="letter-frame parchment-sheet letter-deckle p-8 sm:p-12 pl-10 sm:pl-14 text-wood-950 relative">
          <div className="letter-ribbon" />
          <div className="letter-stamps">
            <span className="letter-stamp" />
            <span className="letter-stamp stamp-green" />
          </div>
          <div className="letter-botanical" />

          <div className="w-16 h-16 rounded-full bg-amber-900/10 border border-amber-800/30 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <WaxSeal color="crimson" size="lg" icon="lock" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-wood-950 mb-3 tracking-tight">
            Your Private Sanctuary
          </h2>
          <p className="font-body text-base sm:text-lg text-wood-900 leading-relaxed max-w-md mx-auto mb-6 italic">
            "A candlelit chamber in the grand library, where your unsaid truths rest upon private wooden shelves, locked from all prying eyes."
          </p>
          <p className="font-body text-sm text-wood-800/80 leading-relaxed max-w-md mx-auto mb-8">
            Step in as a guest and a gentle pen name is chosen for you. Whatever you
            write stays private on this device - no account, no email, no name.
          </p>

          <button
            onClick={loginAsGuestDemo}
            className="px-6 py-3 bg-wood-900 hover:bg-wood-800 text-amber-100 rounded-full font-serif text-sm font-semibold transition shadow-candle border border-amber-600/40 cursor-pointer inline-flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-gold" />
            <span>Enter Sanctuary as Anonymous Guest</span>
          </button>

        </div>
      </div>
    );
  }

  if (isEditorOpen) {
    return (
      <NoteEditor
        note={activeEditingNote}
        shelves={shelves}
        onSave={handleSaveNote}
        onClose={() => setIsEditorOpen(false)}
      />
    );
  }

  const shelfNotes = selectedShelfId
    ? notes.filter((n) => n.shelf_id === selectedShelfId)
    : notes;
  const filteredNotes = searchNotes(shelfNotes, searchQuery);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Sanctuary Header - same card language as the reading room */}
      <div className="bg-card/80 border border-hairline rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-md shadow-parchment flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="label-caps block mb-1.5">Private Bookcase</span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#f3ece0] tracking-tight">
            {profile?.pen_name ? `${profile.pen_name}'s Sanctuary` : 'Your Private Sanctuary'}
          </h1>
          <p className="font-body text-sm text-[#9e9488] italic mt-1.5">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'letter' : 'letters'} resting upon these shelves
          </p>
          <p className="font-body text-xs text-[#9e9488]/80 italic mt-1">
            Only you can see what rests here. Choose a prompt below, or write freely.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            title="Download all of your letters as a JSON file"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-hairline bg-card/60 hover:bg-wood-850 text-[#e8dab2] font-serif text-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-gold" />
            <span>Export my notes</span>
          </button>

          <button
            onClick={() => setIsInboxOpen(true)}
            title="Gentle replies readers have left on your public letters"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-hairline bg-card/60 hover:bg-wood-850 text-[#e8dab2] font-serif text-sm transition cursor-pointer"
          >
            <Mail className="w-4 h-4 text-gold" />
            <span>Responses Inbox</span>
          </button>

          <button
            onClick={handleCreateNewBlank}
            className="flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold-light text-wood-950 rounded-full font-serif text-sm font-semibold transition shadow-candle cursor-pointer hover:-translate-y-0.5"
          >
            <Feather className="w-4 h-4" />
            <span>Write an Unsent Letter</span>
          </button>
        </div>
      </div>

      {/* Export summary / error (always shown after an export attempt) */}
      {(exportSummary || exportError) && (
        <p
          role="status"
          className={`-mt-6 mb-8 text-sm font-body italic ${
            exportError ? 'text-red-400' : 'text-gold'
          }`}
        >
          {exportError ?? exportSummary}
        </p>
      )}

      {/* Bookshelf Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Shelf Manager */}
        <div className="lg:col-span-1">
          <div className="bg-card/80 border border-hairline rounded-2xl p-5 shadow-parchment sticky top-24 backdrop-blur-sm">
            <ShelfManager
              shelves={shelves}
              selectedShelfId={selectedShelfId}
              onSelectShelf={setSelectedShelfId}
              onCreateShelf={handleCreateShelf}
              onDeleteShelf={handleDeleteShelf}
            />
          </div>
        </div>

        {/* Right Columns: Prompts & Notes Listing on Wooden Shelves */}
        <div className="lg:col-span-3 space-y-6">
          <PromptSelector onSelectPrompt={handleStartFromPrompt} />

          {/* Wooden Shelf Ledge Header */}
          <div className="wood-shelf-ledge px-5 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-serif text-[#e8dab2]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              <span>
                {selectedShelfId
                  ? shelves.find((s) => s.id === selectedShelfId)?.name || 'Custom Shelf'
                  : 'All Preserved Letters'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="search"
                placeholder="Search titles, words, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search notes"
                className="w-40 sm:w-56 bg-card/80 border border-hairline rounded-xl px-3.5 py-2 text-xs font-serif text-[#f3ece0] placeholder:text-[#9e9488]/70 focus:outline-none focus:ring-1 focus:ring-gold transition"
              />
              <span className="text-gold/80 text-[11px] whitespace-nowrap font-sans">
                {filteredNotes.length} Documents
              </span>
            </div>
          </div>

          {loading ? (
            <div role="status" className="py-16 text-center">
              <Feather className="w-6 h-6 text-gold/60 mx-auto mb-3 animate-pulse" />
              <p className="font-body text-sm text-[#9e9488] italic">
                Unlocking your private shelves...
              </p>
            </div>
          ) : filteredNotes.length === 0 && searchQuery.trim() ? (
            <div role="status" className="text-center py-16 bg-card/60 border border-dashed border-hairline rounded-2xl p-8">
              <Feather className="w-8 h-8 text-gold/50 mx-auto mb-3" />
              <h3 className="font-serif text-2xl text-[#f3ece0] mb-2">
                No letters match your search
              </h3>
              <p className="font-body text-sm text-[#9e9488] italic max-w-sm mx-auto">
                Nothing on these shelves answers "{searchQuery.trim()}". Try a
                different word or tag.
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-16 bg-card/60 border border-dashed border-hairline rounded-2xl p-8">
              <Feather className="w-10 h-10 text-gold/50 mx-auto mb-3" />
              <h3 className="font-serif text-2xl text-[#f3ece0] mb-2">This shelf is empty</h3>
              <p className="font-body text-sm text-[#9e9488] max-w-sm mx-auto mb-2 italic">
                No unsent letters rest here yet.
              </p>
              <p className="font-body text-xs text-[#9e9488]/80 max-w-sm mx-auto mb-6 italic">
                Choose a prompt above for a gentle first line, or begin with a blank parchment.
              </p>
              <button
                onClick={handleCreateNewBlank}
                className="px-6 py-2.5 bg-gold hover:bg-gold-light text-wood-950 font-serif font-semibold rounded-full text-sm transition shadow-candle cursor-pointer hover:-translate-y-0.5"
              >
                Write First Letter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  shelves={shelves}
                  unlocked={unlockedIds.has(note.id)}
                  onUnlock={handleUnlockNote}
                  onOpen={(selected) => {
                    setActiveEditingNote(selected);
                    setIsEditorOpen(true);
                  }}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthorInbox
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
      />
    </div>
  );
};
