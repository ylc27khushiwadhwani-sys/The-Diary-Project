import React, { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, Feather, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Note, Shelf, Prompt } from '../types/database';
import { ShelfManager } from '../components/library/ShelfManager';
import { PromptSelector } from '../components/library/PromptSelector';
import { NoteCard } from '../components/library/NoteCard';
import { NoteEditor } from '../components/editor/NoteEditor';
import { AuthorInbox } from '../components/library/AuthorInbox';

const DEMO_NOTES_KEY = 'unsent_library_demo_notes';
const DEMO_SHELVES_KEY = 'unsent_library_demo_shelves';

export const LibraryPage: React.FC = () => {
  const { user, profile, loginAsGuestDemo } = useAuth();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [activeEditingNote, setActiveEditingNote] = useState<Partial<Note> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Shelves
  const fetchShelves = useCallback(async () => {
    if (!user) return;
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem(DEMO_SHELVES_KEY);
      if (saved) {
        setShelves(JSON.parse(saved));
      } else {
        const defaultShelves: Shelf[] = [
          { id: 'shelf-1', user_id: user.id, name: 'Unspoken Words', icon: 'feather', created_at: new Date().toISOString() },
          { id: 'shelf-2', user_id: user.id, name: 'Letters Never Sent', icon: 'bookmark', created_at: new Date().toISOString() },
          { id: 'shelf-3', user_id: user.id, name: 'Grief & Healing', icon: 'heart', created_at: new Date().toISOString() },
        ];
        setShelves(defaultShelves);
        localStorage.setItem(DEMO_SHELVES_KEY, JSON.stringify(defaultShelves));
      }
      return;
    }

    const { data } = await supabase
      .from('shelves')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (data) setShelves(data);
  }, [user]);

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    if (!user) return;
    if (!isSupabaseConfigured) {
      const saved = localStorage.getItem(DEMO_NOTES_KEY);
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        const sampleNotes: Note[] = [
          {
            id: 'sample-1',
            user_id: user.id,
            shelf_id: 'shelf-1',
            title: 'The words left on the platform',
            content: 'I watched the train pull away, and my hands stayed in my pockets. Everything I planned to say felt too heavy to carry through the station air.',
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
        setNotes(sampleNotes);
        localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(sampleNotes));
      }
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('notes')
      .select('*, shelves(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setNotes(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchShelves();
      fetchNotes();
    } else {
      setLoading(false);
    }
  }, [user, fetchShelves, fetchNotes]);

  // Create Shelf
  const handleCreateShelf = async (name: string, icon: string) => {
    if (!user) return;
    const newShelf: Shelf = {
      id: isSupabaseConfigured ? undefined as any : 'shelf-' + Date.now(),
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

  // Delete Shelf
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

  // Save Note
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

  // Delete Note
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
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-medium text-ink-900 mb-3">Your Private Library</h2>
        <p className="text-sm text-ink-500 max-w-md mx-auto mb-6 leading-relaxed">
          A locked sanctuary where you can carry your thoughts in quiet honesty. Sign in with email or start writing as an anonymous guest.
        </p>
        <button
          onClick={loginAsGuestDemo}
          className="px-6 py-3 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-sm font-medium transition shadow-md"
        >
          Open Sanctuary as Guest
        </button>
      </div>
    );
  }

  if (isEditorOpen) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <NoteEditor
          note={activeEditingNote}
          shelves={shelves}
          onSave={handleSaveNote}
          onClose={() => setIsEditorOpen(false)}
        />
      </div>
    );
  }

  const filteredNotes = selectedShelfId
    ? notes.filter((n) => n.shelf_id === selectedShelfId)
    : notes;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-parchment-200">
        <div>
          <h1 className="font-serif text-3xl font-medium text-ink-900">
            {profile?.pen_name ? `${profile.pen_name}'s Library` : 'Your Private Library'}
          </h1>
          <p className="text-xs text-ink-100 mt-1">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'letter' : 'letters'} resting on these shelves
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsInboxOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-parchment-200/80 hover:bg-parchment-300 text-ink-900 border border-parchment-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            <Mail className="w-4 h-4 text-sage-700" />
            <span>Letters in Response</span>
          </button>
          <button
            onClick={handleCreateNewBlank}
            className="flex items-center gap-2 px-5 py-2.5 bg-ink-900 hover:bg-ink-800 text-white rounded-xl text-xs font-medium transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write an Unsent Letter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Shelves Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 border border-parchment-200 rounded-2xl p-4 shadow-2xs sticky top-24">
            <ShelfManager
              shelves={shelves}
              selectedShelfId={selectedShelfId}
              onSelectShelf={setSelectedShelfId}
              onCreateShelf={handleCreateShelf}
              onDeleteShelf={handleDeleteShelf}
            />
          </div>
        </div>

        {/* Right Columns: Prompts & Notes Listing */}
        <div className="lg:col-span-3 space-y-6">
          <PromptSelector onSelectPrompt={handleStartFromPrompt} />

          {loading ? (
            <div className="py-12 text-center text-xs text-ink-100">Opening library shelves...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-16 bg-white/50 border border-dashed border-parchment-300 rounded-2xl p-8">
              <Feather className="w-8 h-8 text-parchment-400 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-medium text-ink-900 mb-1">This shelf is empty</h3>
              <p className="text-xs text-ink-100 max-w-sm mx-auto mb-4">
                No unsent letters here yet. Pick a prompt above or begin writing with an open heart.
              </p>
              <button
                onClick={handleCreateNewBlank}
                className="px-4 py-2 bg-parchment-200 hover:bg-parchment-300 text-ink-900 rounded-lg text-xs font-medium transition"
              >
                Write First Letter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
