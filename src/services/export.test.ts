import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildExportPayload, downloadNotesExport } from './export';
import type { Note, Shelf } from '../types/database';

const shelves: Shelf[] = [
  { id: 'shelf-a', user_id: 'u1', name: 'Shelf A', icon: 'feather', created_at: '2026-10-01T00:00:00.000Z' },
  { id: 'shelf-b', user_id: 'u1', name: 'Shelf B', icon: 'heart', created_at: '2026-10-01T00:00:00.000Z' },
];

const makeNote = (over: Partial<Note>): Note => ({
  id: 'note-x',
  user_id: 'u1',
  shelf_id: 'shelf-a',
  title: null,
  content: '',
  prompt_id: null,
  is_locked: false,
  passcode_hash: null,
  is_public: false,
  allow_responses: true,
  moderation_status: 'clean',
  report_count: 0,
  published_at: null,
  created_at: '2026-10-01T00:00:00.000Z',
  tags: [],
  ...over,
});

const plainNote = makeNote({ id: 'n1', title: 'The Subway Window', content: 'I watched the train pull away.', shelf_id: 'shelf-a', tags: ['grief'] });
const lockedNote = makeNote({ id: 'n2', title: 'Secret Vow', content: 'The vow I never said aloud.', is_locked: true, passcode_hash: 'salt$hash', shelf_id: 'shelf-b' });

// jsdom does not implement URL.createObjectURL/revokeObjectURL or trigger
// real downloads, so the download seam is stubbed here.
let capturedBlob: Blob | null = null;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

const readBlob = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

beforeEach(() => {
  capturedBlob = null;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    capturedBlob = blob;
    return 'blob:mock-url';
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalCreateObjectURL) URL.createObjectURL = originalCreateObjectURL;
  else delete (URL as unknown as Record<string, unknown>).createObjectURL;
  if (originalRevokeObjectURL) URL.revokeObjectURL = originalRevokeObjectURL;
  else delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
});

describe('buildExportPayload (U8)', () => {
  it('exports every note when none are locked, with title, content, tags, shelf and dates', () => {
    const { payload, skippedCount } = buildExportPayload([plainNote], new Set(), shelves);

    expect(skippedCount).toBe(0);
    expect(payload).toEqual([
      {
        title: 'The Subway Window',
        content: 'I watched the train pull away.',
        tags: ['grief'],
        shelf: 'Shelf A',
        created_at: '2026-10-01T00:00:00.000Z',
        published_at: null,
      },
    ]);
  });

  it('includes a locked note that was unlocked earlier in the session', () => {
    const { payload, skippedCount } = buildExportPayload([lockedNote], new Set(['n2']), shelves);

    expect(skippedCount).toBe(0);
    expect(payload).toHaveLength(1);
    expect(payload[0].title).toBe('Secret Vow');
    expect(payload[0].shelf).toBe('Shelf B');
  });

  it('skips locked notes that are not unlocked and counts each skip', () => {
    const otherLocked = makeNote({ id: 'n3', title: 'Second Seal', is_locked: true, shelf_id: null });
    const { payload, skippedCount } = buildExportPayload(
      [plainNote, lockedNote, otherLocked],
      new Set(),
      shelves
    );

    expect(skippedCount).toBe(2);
    expect(payload).toHaveLength(1);
    expect(payload[0].title).toBe('The Subway Window');
  });

  it('normalizes a null tag list to an empty array and resolves a missing shelf to null', () => {
    const noTagsNoShelf = makeNote({ id: 'n4', title: 'Loose Page', tags: null, shelf_id: null });
    const { payload } = buildExportPayload([noTagsNoShelf], new Set(), shelves);

    expect(payload[0].tags).toEqual([]);
    expect(payload[0].shelf).toBeNull();
  });

  it('produces a valid empty payload for an empty library', () => {
    const { payload, skippedCount } = buildExportPayload([], new Set(), shelves);

    expect(payload).toEqual([]);
    expect(skippedCount).toBe(0);
  });
});

describe('downloadNotesExport (U8)', () => {
  it('serializes the payload as a JSON blob, triggers the download, and revokes the object URL', async () => {
    const result = downloadNotesExport([plainNote], new Set(), shelves);

    expect(result).toEqual({ exportedCount: 1, skippedCount: 0 });
    expect(capturedBlob).not.toBeNull();
    expect(capturedBlob!.type).toBe('application/json');

    const parsed = JSON.parse(await readBlob(capturedBlob!));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('The Subway Window');

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('reports both the exported and the skipped counts', () => {
    const result = downloadNotesExport([plainNote, lockedNote], new Set(), shelves);

    expect(result).toEqual({ exportedCount: 1, skippedCount: 1 });
  });

  it('writes a valid empty JSON array for an empty library', async () => {
    const result = downloadNotesExport([], new Set(), shelves);

    expect(result).toEqual({ exportedCount: 0, skippedCount: 0 });
    expect(JSON.parse(await readBlob(capturedBlob!))).toEqual([]);
  });

  it('throws a friendly error instead of failing silently when the download step fails', () => {
    URL.createObjectURL = vi.fn(() => {
      throw new Error('blocked');
    });

    expect(() => downloadNotesExport([plainNote], new Set(), shelves)).toThrow(
      'Your browser blocked the export download. Please try again.'
    );
  });
});
