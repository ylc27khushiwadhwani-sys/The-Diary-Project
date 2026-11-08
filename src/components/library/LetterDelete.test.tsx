import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParchmentLetter } from "./ParchmentLetter";
import { KeepsakeBox } from "../bookshelf/KeepsakeBox";
import type { Note } from "../../types/database";

const makeNote = (id: string, title: string): Note => ({
  id,
  user_id: "u1",
  shelf_id: null,
  title,
  content: `${title} body`,
  prompt_id: null,
  is_locked: false,
  passcode_hash: null,
  is_public: false,
  allow_responses: false,
  moderation_status: "clean",
  report_count: 0,
  published_at: null,
  created_at: "2026-11-08T00:00:00Z",
  tags: [],
});

describe("Own-letter delete affordance", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ParchmentLetter shows the delete button without needing hover", () => {
    render(
      <ParchmentLetter
        note={makeNote("n1", "For the porch swing")}
        isUnlocked={true}
        onOpen={() => {}}
        onDelete={() => {}}
        mode="shelf"
      />,
    );
    const btn = screen.getByRole("button", { name: /delete this letter/i });
    expect(btn).toBeTruthy();
    // The affordance must be visible on touch devices: no hover-gated opacity.
    expect(btn.className).not.toContain("opacity-0");
  });

  it("ParchmentLetter deletes only after confirmation", () => {
    const onDelete = vi.fn();
    render(
      <ParchmentLetter
        note={makeNote("n1", "For the porch swing")}
        isUnlocked={true}
        onOpen={() => {}}
        onDelete={onDelete}
        mode="shelf"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete this letter/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("ParchmentLetter keeps the letter when the writer cancels", () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const onDelete = vi.fn();
    render(
      <ParchmentLetter
        note={makeNote("n1", "For the porch swing")}
        isUnlocked={true}
        onOpen={() => {}}
        onDelete={onDelete}
        mode="shelf"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete this letter/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("KeepsakeBox offers delete per letter and opens letters independently", () => {
    const onDelete = vi.fn();
    const onOpen = vi.fn();
    render(
      <KeepsakeBox
        notes={[makeNote("n1", "First"), makeNote("n2", "Second")]}
        onOpen={onOpen}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Delete letter: Second" }),
    );
    expect(onDelete).toHaveBeenCalledWith("n2");
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open letter: First" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("KeepsakeBox hides delete entirely when no handler is provided", () => {
    render(
      <KeepsakeBox notes={[makeNote("n1", "First")]} onOpen={() => {}} />,
    );
    expect(screen.queryByRole("button", { name: /delete letter/i })).toBeNull();
  });
});
