import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GrandLibraryBooks } from "./GrandLibraryBooks";
import type { Note } from "../../types/database";

const makeNote = (id: string, title: string, prompt_id: string | null = null): Note => ({
  id,
  user_id: "u1",
  shelf_id: null,
  title,
  content: `${title} body`,
  prompt_id,
  is_locked: false,
  passcode_hash: null,
  is_public: true,
  allow_responses: true,
  moderation_status: "clean",
  report_count: 0,
  published_at: "2026-11-01T00:00:00.000Z",
  created_at: "2026-11-01T00:00:00.000Z",
  profiles: { id: "u1", pen_name: "Test Heron", avatar_color: "#d4a373", created_at: "" },
});

describe("Grand Library books", () => {
  it("stands every letter on the desk as a book and opens one on click", () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    render(
      <GrandLibraryBooks
        notes={[makeNote("n1", "For October"), makeNote("n2", "Blue Mugs")]}
        onOpen={onOpen}
        onChoose={vi.fn()}
        onRandom={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Open letter: For October" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open letter: Blue Mugs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "read in random order" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open letter: For October" }));
    expect(onOpen).not.toHaveBeenCalled(); // waits for the pull-out beat
    vi.advanceTimersByTime(800);
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "n1" }));
    vi.useRealTimers();
  });

  it("filters the desk by shelf section", () => {
    render(
      <GrandLibraryBooks
        notes={[makeNote("n1", "I miss you"), makeNote("n2", "Plain note")]}
        onOpen={vi.fn()}
        onChoose={vi.fn()}
        onRandom={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "To Someone I Miss" }));
    expect(screen.getByRole("button", { name: "Open letter: I miss you" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open letter: Plain note" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "All Shelves" }));
    expect(screen.getByRole("button", { name: "Open letter: Plain note" })).toBeInTheDocument();
  });
});
