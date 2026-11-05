import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider } from "../contexts/AuthContext";
import { PublicFeedPage } from "./PublicFeedPage";
import type { Note } from "../types/database";

const PROFILE_KEY = "unsent_library_demo_profile";
const FEED_NOTES_KEY = "unsent_library_demo_notes_v2";

const demoProfile = {
  id: "demo-feed-1",
  pen_name: "Test Heron",
  avatar_color: "#d4a373",
  created_at: "2026-10-01T00:00:00.000Z",
};

const makeNote = (over: Partial<Note>): Note => ({
  id: "note-x",
  user_id: "demo-feed-1",
  shelf_id: null,
  title: null,
  content: "",
  prompt_id: null,
  is_locked: false,
  passcode_hash: null,
  is_public: true,
  allow_responses: true,
  moderation_status: "clean",
  report_count: 0,
  published_at: "2026-10-01T00:00:00.000Z",
  created_at: "2026-10-01T00:00:00.000Z",
  profiles: {
    id: "seed-user",
    pen_name: "Anonymous Writer",
    avatar_color: "#d4a373",
    created_at: "2026-10-01T00:00:00.000Z",
  },
  ...over,
});

// prompt_id stays null so InteractiveBookshelf's section filtering falls back
// to its keyword matching, which these seeds exercise deterministically.
const seededNotes: Note[] = [
  makeNote({
    id: "n1",
    title: "Letter for Mara",
    content: "I miss you every autumn morning.",
    published_at: "2026-10-03T00:00:00.000Z",
    profiles: {
      id: "seed-user-1",
      pen_name: "Silent Quill #482",
      avatar_color: "#d4a373",
      created_at: "2026-10-01T00:00:00.000Z",
    },
  }),
  makeNote({
    id: "n2",
    title: "Morning Coffee Notes",
    content: "The kitchen light stayed on all night.",
    published_at: "2026-10-01T00:00:00.000Z",
    profiles: {
      id: "seed-user-2",
      pen_name: "Velvet Sparrow #193",
      avatar_color: "#a85d66",
      created_at: "2026-10-01T00:00:00.000Z",
    },
  }),
  makeNote({
    id: "n3",
    title: "Quiet Harbor",
    content: "I miss the harbor at dusk. Remember the ferry?",
    published_at: "2026-10-02T00:00:00.000Z",
    profiles: {
      id: "seed-user-3",
      pen_name: "Amber Nomad #614",
      avatar_color: "#d4a373",
      created_at: "2026-10-01T00:00:00.000Z",
    },
  }),
];

const seed = (noteList: Note[]) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(demoProfile));
  localStorage.setItem(FEED_NOTES_KEY, JSON.stringify(noteList));
};

beforeEach(() => {
  localStorage.clear();
  seed(seededNotes);
});

afterEach(() => {
  localStorage.clear();
});

const renderFeed = () =>
  render(
    <AuthProvider>
      <PublicFeedPage />
    </AuthProvider>,
  );

const typeSearch = async (query: string) => {
  const input = await screen.findByLabelText(/search letters/i);
  fireEvent.change(input, { target: { value: query } });
};

// Exact-title matches only: the hover tooltip wraps the title in extra text,
// so exact strings pick out the rendered spine titles. Sorted into DOM order
// so the array reflects the order the bookshelf rendered them in.
const TITLES = ["Letter for Mara", "Morning Coffee Notes", "Quiet Harbor"];

const spineOrder = () => {
  const nodes = TITLES.flatMap((title) => screen.queryAllByText(title));
  nodes.sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
  return nodes.map((node) => node.textContent);
};

describe("PublicFeedPage search and sort (R7)", () => {
  it("narrows rendered letters to title, content, and pen-name matches", async () => {
    renderFeed();
    await screen.findByText("Letter for Mara");

    await typeSearch("harbor");
    expect(await screen.findByText("Quiet Harbor")).toBeInTheDocument();
    expect(screen.queryByText("Letter for Mara")).not.toBeInTheDocument();

    await typeSearch("kitchen");
    expect(await screen.findByText("Morning Coffee Notes")).toBeInTheDocument();
    expect(screen.queryByText("Quiet Harbor")).not.toBeInTheDocument();

    await typeSearch("velvet");
    expect(await screen.findByText("Morning Coffee Notes")).toBeInTheDocument();
    expect(screen.queryByText("Letter for Mara")).not.toBeInTheDocument();
  });

  it("orders rendered letters by published_at, latest first by default", async () => {
    renderFeed();
    await screen.findByText("Letter for Mara");

    expect(spineOrder()).toEqual([
      "Letter for Mara",
      "Quiet Harbor",
      "Morning Coffee Notes",
    ]);
  });

  it("switching sort to oldest reverses the rendered order", async () => {
    renderFeed();
    await screen.findByText("Letter for Mara");

    fireEvent.change(await screen.findByLabelText(/sort letters/i), {
      target: { value: "oldest" },
    });

    expect(spineOrder()).toEqual([
      "Morning Coffee Notes",
      "Quiet Harbor",
      "Letter for Mara",
    ]);
  });

  it("composes search with the bookshelf section browsing as an intersection", async () => {
    renderFeed();
    await screen.findByText("Letter for Mara");

    // "morn" matches n1 (content) and n2 (title); the section keyword
    // "miss"/"remember" matches n1 and n3. The intersection is n1 alone —
    // a union would also show n2 or n3.
    await typeSearch("morn");
    expect(await screen.findByText("Morning Coffee Notes")).toBeInTheDocument();
    expect(screen.getByText("Letter for Mara")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /to someone i miss/i }));

    expect(await screen.findByText("Letter for Mara")).toBeInTheDocument();
    expect(screen.queryByText("Morning Coffee Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("Quiet Harbor")).not.toBeInTheDocument();
  });

  it("shows a no-results message distinct from the empty bookshelf state", async () => {
    renderFeed();
    await screen.findByText("Letter for Mara");

    await typeSearch("zzzzz");

    expect(
      await screen.findByText(/no letters match your search/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/this shelf is currently quiet/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/write the first letter/i),
    ).not.toBeInTheDocument();
  });

  it("shows a loading indicator before the initial fetch resolves", async () => {
    renderFeed();

    // The demo loader resolves on a microtask, so the synchronous post-render
    // window still shows the pending state.
    expect(screen.getByRole("status")).toHaveTextContent(
      /unshelving the letters/i,
    );

    expect(await screen.findByText("Letter for Mara")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("PublicFeedPage orphaned-import check (R7)", () => {
  it("does not render any content from the deleted FeedFilter or PublicNoteCard", async () => {
    renderFeed();
    await screen.findByText("Letter for Mara");

    // FeedFilter's category taxonomy and its placeholder are gone.
    expect(
      screen.queryByPlaceholderText(/search letters by theme/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Nostalgia$/ }),
    ).not.toBeInTheDocument();
    // PublicNoteCard's expand control is gone (BookReaderModal is the only
    // letter-reading surface now).
    expect(screen.queryByText(/unroll full letter/i)).not.toBeInTheDocument();
  });
});
