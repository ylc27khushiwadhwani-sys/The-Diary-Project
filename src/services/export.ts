import { Note, Shelf } from '../types/database';

export interface ExportedNote {
  title: string | null;
  content: string;
  tags: string[];
  shelf: string | null;
  created_at: string;
  published_at: string | null;
}

export interface ExportResult {
  exportedCount: number;
  skippedCount: number;
}

/**
 * Build the export payload for the writer's own notes (U8). A locked note is
 * only included when its id is in `unlockedIds` — i.e. it was unlocked earlier
 * in this session; otherwise it is skipped and counted so the caller can
 * report the skips.
 */
export const buildExportPayload = (
  notes: Note[],
  unlockedIds: ReadonlySet<string>,
  shelves: Shelf[]
): { payload: ExportedNote[]; skippedCount: number } => {
  const payload: ExportedNote[] = [];
  let skippedCount = 0;

  for (const note of notes) {
    if (note.is_locked && !unlockedIds.has(note.id)) {
      skippedCount += 1;
      continue;
    }
    payload.push({
      title: note.title,
      content: note.content,
      tags: note.tags ?? [],
      shelf: shelves.find((s) => s.id === note.shelf_id)?.name ?? null,
      created_at: note.created_at,
      published_at: note.published_at,
    });
  }

  return { payload, skippedCount };
};

/**
 * Serialize the export payload to JSON and trigger a browser download.
 * Throws when the Blob/anchor download step fails so the caller can surface
 * an inline error instead of failing silently.
 */
export const downloadNotesExport = (
  notes: Note[],
  unlockedIds: ReadonlySet<string>,
  shelves: Shelf[]
): ExportResult => {
  const { payload, skippedCount } = buildExportPayload(notes, unlockedIds, shelves);
  const json = JSON.stringify(payload, null, 2);

  let blob: Blob;
  try {
    blob = new Blob([json], { type: 'application/json' });
  } catch {
    throw new Error('Could not prepare the export file. Please try again.');
  }

  let url: string | null = null;
  try {
    url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unsent-library-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    throw new Error('Your browser blocked the export download. Please try again.');
  } finally {
    if (url) URL.revokeObjectURL(url);
  }

  return { exportedCount: payload.length, skippedCount };
};
