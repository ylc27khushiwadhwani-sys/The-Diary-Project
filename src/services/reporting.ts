import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEMO_REPORTS_KEY = 'unsent_library_demo_reports';
const DEMO_PUBLIC_NOTES_KEY = 'unsent_library_demo_public_notes';

export async function submitNoteReport(
  noteId: string,
  reason: string,
  reporterId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const rawReports = localStorage.getItem(DEMO_REPORTS_KEY);
    const reports = rawReports ? JSON.parse(rawReports) : [];
    reports.push({ noteId, reason, reporterId, created_at: new Date().toISOString() });
    localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(reports));

    // Check count for note
    const count = reports.filter((r: any) => r.noteId === noteId).length;
    if (count >= 3) {
      // Auto-hide in local public notes
      const rawNotes = localStorage.getItem(DEMO_PUBLIC_NOTES_KEY);
      if (rawNotes) {
        const publicNotes = JSON.parse(rawNotes);
        const updated = publicNotes.map((n: any) =>
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
