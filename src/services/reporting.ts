import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Note } from '../types/database';

const DEMO_REPORTS_KEY = 'unsent_library_demo_reports';
const DEMO_PUBLIC_NOTES_KEY = 'unsent_library_demo_public_notes';

interface DemoReport {
  noteId: string;
  reason: string;
  reporterId?: string;
  created_at: string;
}

export async function submitNoteReport(
  noteId: string,
  reason: string,
  reporterId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const rawReports = localStorage.getItem(DEMO_REPORTS_KEY);
    const reports: DemoReport[] = rawReports ? JSON.parse(rawReports) : [];
    reports.push({ noteId, reason, reporterId, created_at: new Date().toISOString() });
    localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(reports));

    // Check count for note
    const count = reports.filter((r) => r.noteId === noteId).length;
    if (count >= 3) {
      // Auto-hide in local public notes
      const rawNotes = localStorage.getItem(DEMO_PUBLIC_NOTES_KEY);
      if (rawNotes) {
        const publicNotes: Note[] = JSON.parse(rawNotes);
        const updated = publicNotes.map<Note>((n) =>
          n.id === noteId ? { ...n, moderation_status: 'flagged_hidden' } : n
        );
        localStorage.setItem(DEMO_PUBLIC_NOTES_KEY, JSON.stringify(updated));
      }
    }
    return { success: true };
  }

  const { error } = await supabase.from('note_reports').insert([
    {
      note_id: noteId,
      reporter_id: reporterId || null,
      reason,
    },
  ]);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
