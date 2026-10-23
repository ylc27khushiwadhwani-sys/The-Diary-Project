import { Note } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const DEMO_NOTES_KEY = 'unsent_library_demo_notes';

export const loadNotes = async (userId: string): Promise<Note[] | null> => {
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

/**
 * Case-insensitive substring match over title, content, and tags (KTD7).
 * An empty query matches everything, so callers can compose it with their
 * existing filters as an AND.
 */
export const searchNotes = (notes: Note[], query: string): Note[] => {
  const q = query.trim().toLowerCase();
  if (!q) return notes;

  return notes.filter((note) => {
    if (note.title?.toLowerCase().includes(q)) return true;
    if (note.content.toLowerCase().includes(q)) return true;
    return (note.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
  });
};
