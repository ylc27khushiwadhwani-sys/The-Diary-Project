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
    expect(onOpen).not.toHaveBeenCalled(); // waits for the pull-out and cover-opening beat
    vi.advanceTimersByTime(1800);
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
    // No "All Shelves" control: the whole collection is the default desk.
    expect(screen.queryByRole("button", { name: "All Shelves" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "To Someone I Miss" }));
    expect(screen.getByRole("button", { name: "Open letter: I miss you" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open letter: Plain note" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "To Someone I Miss" }));
    expect(screen.getByRole("button", { name: "Open letter: Plain note" })).toBeInTheDocument();
  });
});

describe("desk glide pause and resume", () => {
  const stubWidths = () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(2400);
  };
  const camX = (track: HTMLElement) =>
    Number(/translate3d\((-?[\d.]+)px/.exec(track.style.transform)?.[1] ?? "0");
  const renderDesk = () => {
    render(
      <GrandLibraryBooks
        notes={[makeNote("n1", "For October"), makeNote("n2", "Blue Mugs")]}
        onOpen={vi.fn()}
        onChoose={vi.fn()}
        onRandom={vi.fn()}
      />,
    );
    const stage = screen.getByRole("region", { name: /Letters standing as books/ });
    return { stage, track: stage.firstElementChild as HTMLElement };
  };

  it("keeps gliding after a touch press that the browser cancels", () => {
    vi.useFakeTimers();
    stubWidths();
    const { stage, track } = renderDesk();

    // Let the idle glide start and ease along the row.
    vi.advanceTimersByTime(9000);
    const beforeTouch = camX(track);
    vi.advanceTimersByTime(2000);
    expect(Math.abs(camX(track) - beforeTouch)).toBeGreaterThan(1); // gliding

    // A touch press begins; the browser cancels the gesture (it took over
    // scrolling) instead of firing pointerup.
    fireEvent.pointerDown(stage, { pointerType: "touch", clientX: 100 });
    vi.advanceTimersByTime(6000); // let the camera fully converge on the pre-touch spot
    const settled = camX(track);
    vi.advanceTimersByTime(3000);
    expect(Math.abs(camX(track) - settled)).toBeLessThan(0.01); // paused while touching

    fireEvent.pointerCancel(stage, { pointerType: "touch" });
    vi.advanceTimersByTime(9000); // past the 6s resume delay
    const resumed = camX(track);
    vi.advanceTimersByTime(2000);
    expect(Math.abs(camX(track) - resumed)).toBeGreaterThan(1); // gliding again
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("ends the drag when the pointer is released anywhere, even off the desk", () => {
    vi.useFakeTimers();
    stubWidths();
    const { stage, track } = renderDesk();

    vi.advanceTimersByTime(9000);
    fireEvent.pointerDown(stage, { pointerType: "touch", clientX: 100 });
    vi.advanceTimersByTime(6000);
    const settled = camX(track);
    vi.advanceTimersByTime(3000);
    expect(Math.abs(camX(track) - settled)).toBeLessThan(0.01); // paused while touching

    fireEvent.pointerUp(window); // release lands on an overlay, not the desk
    vi.advanceTimersByTime(9000);
    const resumed = camX(track);
    vi.advanceTimersByTime(2000);
    expect(Math.abs(camX(track) - resumed)).toBeGreaterThan(1); // gliding again
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});
