import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { LibraryPage } from './LibraryPage';
import type { Note, Shelf } from '../types/database';

const PROFILE_KEY = 'unsent_library_demo_profile';
const NOTES_KEY = 'unsent_library_demo_notes';
const SHELVES_KEY = 'unsent_library_demo_shelves';

const demoProfile = {
  id: 'demo-lib-1',
  pen_name: 'Test Heron',
  avatar_color: '#d4a373',
  created_at: '2026-10-01T00:00:00.000Z',
};

const shelves: Shelf[] = [
  { id: 'shelf-a', user_id: 'demo-lib-1', name: 'Shelf A', icon: 'feather', created_at: '2026-10-01T00:00:00.000Z' },
  { id: 'shelf-b', user_id: 'demo-lib-1', name: 'Shelf B', icon: 'heart', created_at: '2026-10-01T00:00:00.000Z' },
];

const makeNote = (over: Partial<Note>): Note => ({
  id: 'note-x',
  user_id: 'demo-lib-1',
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

const seededNotes: Note[] = [
  makeNote({
    id: 'n1',
    title: 'The Subway Window',
    content: 'I watched the train pull away.',
    shelf_id: 'shelf-a',
    tags: ['grief', 'letters'],
  }),
  makeNote({
    id: 'n2',
    title: 'Morning Coffee',
    content: 'The grief sat at my kitchen table.',
    shelf_id: 'shelf-b',
    tags: [],
  }),
  makeNote({
    id: 'n3',
    title: 'Quiet Room',
    content: 'Dust drifted in the afternoon light.',
    shelf_id: 'shelf-a',
    tags: null,
  }),
];

const seed = (noteList: Note[]) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(demoProfile));
  localStorage.setItem(NOTES_KEY, JSON.stringify(noteList));
  localStorage.setItem(SHELVES_KEY, JSON.stringify(shelves));
};

const renderLibrary = () =>
  render(
    <AuthProvider>
      <LibraryPage />
    </AuthProvider>
  );

const typeSearch = async (query: string) => {
  const input = await screen.findByPlaceholderText(/search/i);
  fireEvent.change(input, { target: { value: query } });
};

describe('LibraryPage tag and keyword search (R6)', () => {
  beforeEach(() => {
    localStorage.clear();
    seed(seededNotes);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('finds a note by one of its tags', async () => {
    renderLibrary();

    await typeSearch('letters');

    expect(await screen.findByText('1 Documents')).toBeInTheDocument();
    expect(screen.getByText('The Subway Window')).toBeInTheDocument();
    expect(screen.queryByText('Morning Coffee')).not.toBeInTheDocument();
  });

  it('finds a note by content substring with no tag involved', async () => {
    renderLibrary();

    await typeSearch('kitchen');

    expect(await screen.findByText('1 Documents')).toBeInTheDocument();
    expect(screen.getByText('Morning Coffee')).toBeInTheDocument();
  });

  it('finds notes that carry no tags by title and content', async () => {
    renderLibrary();

    await typeSearch('dust');
    expect(await screen.findByText('1 Documents')).toBeInTheDocument();
    expect(screen.getByText('Quiet Room')).toBeInTheDocument();

    await typeSearch('subway');
    expect(await screen.findByText('1 Documents')).toBeInTheDocument();
    expect(screen.getByText('The Subway Window')).toBeInTheDocument();
  });

  it('shows a no-results state distinct from the empty-library state', async () => {
    renderLibrary();

    await typeSearch('zzzz');

    expect(await screen.findByText(/no letters match your search/i)).toBeInTheDocument();
    expect(screen.queryByText(/this shelf is empty/i)).not.toBeInTheDocument();
  });

  it('shows the empty-library state when there are no notes at all', async () => {
    localStorage.setItem(NOTES_KEY, JSON.stringify([]));
    renderLibrary();

    expect(await screen.findByText(/this shelf is empty/i)).toBeInTheDocument();
    expect(screen.queryByText(/no letters match your search/i)).not.toBeInTheDocument();
  });

  it('combines an active shelf filter with search as an intersection', async () => {
    renderLibrary();

    const shelfLabel = (await screen.findAllByText('Shelf A'))[0];
    fireEvent.click(shelfLabel.closest('button') ?? shelfLabel);
    await typeSearch('grief');

    // Intersection: n1 (shelf A + tag grief). The union would also include n2.
    expect(await screen.findByText('1 Documents')).toBeInTheDocument();
    expect(screen.getByText('The Subway Window')).toBeInTheDocument();
    expect(screen.queryByText('Morning Coffee')).not.toBeInTheDocument();
  });
});

describe('LibraryPage tag entry persistence in demo mode (R6)', () => {
  beforeEach(() => {
    localStorage.clear();
    seed(seededNotes);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists a tag added through the editor across a reload', async () => {
    const first = renderLibrary();

    fireEvent.click(await screen.findByText('Write an Unsent Letter'));
    const content = await screen.findByPlaceholderText(/write what you have carried/i);
    fireEvent.change(content, { target: { value: 'A new letter about hope.' } });

    const tagInput = await screen.findByPlaceholderText(/tag/i);
    fireEvent.change(tagInput, { target: { value: 'Hope,' } });
    expect(await screen.findByText('hope')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Seal & Store'));
    await screen.findByText('4 Documents');

    const stored = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '[]') as Note[];
    expect(stored[0].tags).toEqual(['hope']);

    // "Reload": a fresh mount must read the tag back from localStorage.
    first.unmount();
    renderLibrary();
    await typeSearch('hope');
    expect(await screen.findByText('1 Documents')).toBeInTheDocument();
  });
});

describe('LibraryPage private note export (U8)', () => {
  const lockedNote = makeNote({
    id: 'n4',
    title: 'Secret Vow',
    content: 'The vow I never said aloud.',
    is_locked: true,
    passcode_hash: null,
    shelf_id: 'shelf-b',
  });

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

  const clickExport = async () => {
    fireEvent.click(await screen.findByRole('button', { name: /export my notes/i }));
  };

  beforeEach(() => {
    localStorage.clear();
    seed(seededNotes);
    capturedBlob = null;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    if (originalCreateObjectURL) URL.createObjectURL = originalCreateObjectURL;
    else delete (URL as unknown as Record<string, unknown>).createObjectURL;
    if (originalRevokeObjectURL) URL.revokeObjectURL = originalRevokeObjectURL;
    else delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
  });

  it('exports the demo library with a one-line summary showing no skips', async () => {
    renderLibrary();
    await clickExport();

    expect(await screen.findByRole('status')).toHaveTextContent('Exported 3 notes');
    expect(screen.getByRole('status')).not.toHaveTextContent('skipped');

    // Demo-mode parity: the JSON mirrors the notes seeded in localStorage.
    const parsed = JSON.parse(await readBlob(capturedBlob!));
    expect(parsed.map((n: { title: string | null }) => n.title)).toEqual([
      'The Subway Window',
      'Morning Coffee',
      'Quiet Room',
    ]);
    expect(parsed[0]).toMatchObject({
      content: 'I watched the train pull away.',
      tags: ['grief', 'letters'],
      shelf: 'Shelf A',
      created_at: '2026-10-01T00:00:00.000Z',
      published_at: null,
    });
  });

  it('skips a locked note that was never unlocked and reports the skip count', async () => {
    seed([...seededNotes, lockedNote]);
    renderLibrary();
    await clickExport();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Exported 3 notes; 1 locked note was skipped'
    );

    const parsed = JSON.parse(await readBlob(capturedBlob!));
    expect(parsed).toHaveLength(3);
    expect(parsed.map((n: { title: string | null }) => n.title)).not.toContain('Secret Vow');
  });

  it('includes a note that was unlocked through the passcode modal in this session', async () => {
    seed([...seededNotes, lockedNote]);
    renderLibrary();

    // Break the seal on the locked card (hash-less demo note accepts any 4 digits).
    fireEvent.click(await screen.findByText('Secret Vow'));
    const pin = await screen.findByPlaceholderText('••••');
    fireEvent.change(pin, { target: { value: '1234' } });
    fireEvent.click(screen.getByText('Break Seal'));

    // Unlock success opens the editor; return to the shelf and export.
    fireEvent.click(await screen.findByText('Return to Shelves'));
    await clickExport();

    expect(await screen.findByRole('status')).toHaveTextContent('Exported 4 notes');
    expect(screen.getByRole('status')).not.toHaveTextContent('skipped');

    const parsed = JSON.parse(await readBlob(capturedBlob!));
    expect(parsed.map((n: { title: string | null }) => n.title)).toContain('Secret Vow');
  });

  it('shows an inline error instead of failing silently when the download step fails', async () => {
    URL.createObjectURL = vi.fn(() => {
      throw new Error('blocked');
    });
    renderLibrary();
    await clickExport();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your browser blocked the export download. Please try again.'
    );
    expect(screen.queryByText(/^Exported/)).not.toBeInTheDocument();
  });

  it('exports an empty library as a valid empty JSON array', async () => {
    seed([]);
    renderLibrary();
    await clickExport();

    expect(await screen.findByRole('status')).toHaveTextContent('Exported 0 notes');
    expect(JSON.parse(await readBlob(capturedBlob!))).toEqual([]);
  });
});
