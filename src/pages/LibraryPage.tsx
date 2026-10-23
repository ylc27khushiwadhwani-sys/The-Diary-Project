import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Feather, Mail, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Note, Shelf, Prompt } from '../types/database';
import { ShelfManager } from '../components/library/ShelfManager';
import { PromptSelector } from '../components/library/PromptSelector';
import { NoteCard } from '../components/library/NoteCard';
import { NoteEditor } from '../components/editor/NoteEditor';
import { AuthorInbox } from '../components/library/AuthorInbox';
import { WaxSeal } from '../components/library/WaxSeal';

const DEMO_NOTES_KEY = 'unsent_library_demo_notes';
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

const loadNotes = async (userId: string): Promise<Note[] | null> => {
  if (!isSupabaseConfigured) {
    const saved = localStorage.getItem(DEMO_NOTES_KEY);
    if (saved) return JSON.parse(saved) as Note[];
    const sampleNotes: Note[] = [
      {
        id: 'sample-1',
        user_id: userId,
        shelf_id: 'shelf-1',
        title: 'The words left on the platform',
        content: 'I watched the train pull away, and my hands stayed in my pockets. Everything I planned to say felt too heavy to carry through the station air. I hope the quiet didn\'t sound like I didn\'t care.',
        prompt_id: 'prompt-1',
        is_locked: false,
        passcode_hash: null,
        is_public: false,
        allow_responses: true,
        moderation_status: 'clean',
        report_count: 0,
        published_at: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];
    localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(sampleNotes));
    return sampleNotes;
  }

  const { data } = await supabase
    .from('notes')
    .select('*, shelves(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return data ? (data as Note[]) : null;
};

export const LibraryPage: React.FC = () => {
  const { user, profile, loginAsGuestDemo } = useAuth();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [activeEditingNote, setActiveEditingNote] = useState<Partial<Note> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([loadShelves(user.id), loadNotes(user.id)]).then(
      ([loadedShelves, loadedNotes]) => {
        if (cancelled) return;
        if (loadedShelves) setShelves(loadedShelves);
        if (loadedNotes) setNotes(loadedNotes);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [user]);

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

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="parchment-sheet p-8 sm:p-12 rounded-2xl shadow-parchment text-wood-950 relative overflow-hidden">
          <div className="scroll-roll-top -mx-4 -mt-6 mb-6" />

          <div className="w-16 h-16 rounded-full bg-amber-900/10 border border-amber-800/30 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <WaxSeal color="crimson" size="lg" icon="lock" />
          </div>

          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-wood-950 mb-3 tracking-tight">
            Your Private Sanctuary
          </h2>
          <p className="font-cormorant text-base sm:text-lg text-wood-900 leading-relaxed max-w-md mx-auto mb-8 italic">
            "A candlelit chamber in the grand library, where your unsaid truths rest upon private wooden shelves, locked from all prying eyes."
          </p>

          <button
            onClick={loginAsGuestDemo}
            className="px-6 py-3 bg-wood-900 hover:bg-wood-800 text-amber-100 rounded-full font-cinzel text-xs font-bold transition shadow-candle border border-amber-600/40 cursor-pointer inline-flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Enter Sanctuary as Anonymous Guest</span>
          </button>

          <div className="scroll-roll-bottom -mx-4 -mb-6 mt-8" />
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

  const filteredNotes = selectedShelfId
    ? notes.filter((n) => n.shelf_id === selectedShelfId)
    : notes;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Sanctuary Wooden Header */}
      <div className="bg-wood-900/80 border border-amber-900/40 rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <WaxSeal color="crimson" size="lg" icon="crest" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Private Bookcase
              </span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-amber-100 tracking-tight">
              {profile?.pen_name ? `${profile.pen_name}'s Sanctuary` : 'Your Private Sanctuary'}
            </h1>
            <p className="font-cormorant text-sm text-amber-200/70 italic mt-0.5">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'letter' : 'letters'} resting upon these shelves
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsInboxOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-wood-850 hover:bg-wood-800 text-amber-200 border border-amber-700/40 rounded-xl font-cinzel text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>Responses Inbox</span>
          </button>

          <button
            onClick={handleCreateNewBlank}
            className="flex items-center gap-2 px-5 py-2.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-xl font-cinzel text-xs font-bold transition shadow-candle border border-red-500/40 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Write an Unsent Letter</span>
          </button>
        </div>
      </div>

      {/* Bookshelf Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Shelf Manager */}
        <div className="lg:col-span-1">
          <div className="bg-wood-900/85 border border-amber-900/40 rounded-2xl p-5 shadow-2xl sticky top-24 backdrop-blur-sm">
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
          <div className="wood-shelf-ledge px-5 py-3 rounded-xl flex items-center justify-between text-xs font-cinzel font-bold text-amber-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>
                {selectedShelfId
                  ? shelves.find((s) => s.id === selectedShelfId)?.name || 'Custom Shelf'
                  : 'All Preserved Letters'}
              </span>
            </div>
            <span className="text-amber-400/80 text-[11px]">
              {filteredNotes.length} Documents
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs font-cinzel text-amber-300/70 italic">
              Unlocking your private shelves...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-16 bg-wood-950/60 border border-dashed border-amber-800/40 rounded-2xl p-8 backdrop-blur-sm">
              <Feather className="w-10 h-10 text-amber-500/60 mx-auto mb-3" />
              <h3 className="font-cinzel text-lg font-bold text-amber-200 mb-1">This shelf is empty</h3>
              <p className="font-cormorant text-sm text-amber-300/70 max-w-sm mx-auto mb-5 italic">
                No unsent letters rest here yet. Choose a prompt above or dip your quill into a blank parchment.
              </p>
              <button
                onClick={handleCreateNewBlank}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-wood-950 font-cinzel font-bold rounded-full text-xs transition cursor-pointer"
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
