import type { Note } from '../types/database';
import { INITIAL_PUBLIC_NOTES } from '../data/seedNotes';

const sampleIds = new Set(INITIAL_PUBLIC_NOTES.map((note) => note.id));

// These bundled examples have no database row or real author inbox.
export const isSampleNote = (id: string): boolean => sampleIds.has(id);

// Only a successful, empty public query gets samples. Keep real letters intact
// and never persist examples to Supabase or the writer's private library.
export const publicNotesOrSamples = (notes: Note[]): Note[] =>
  notes.length > 0
    ? notes
    : INITIAL_PUBLIC_NOTES.map((note) => ({ ...note, allow_responses: false }));
