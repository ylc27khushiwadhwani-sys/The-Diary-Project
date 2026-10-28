import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PublicFeedPage } from "./PublicFeedPage";
import { INITIAL_PUBLIC_NOTES, PUBLIC_FEED_DEMO_KEY } from "../data/seedNotes";

const { from, order } = vi.hoisted(() => ({ from: vi.fn(), order: vi.fn() }));
vi.mock("../lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: { from },
}));
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, profile: null }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  const query = { select: vi.fn(), eq: vi.fn(), order };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  from.mockReturnValue(query);
  order.mockResolvedValue({ data: [], error: null });
});

describe("configured public feed sample fallback", () => {
  it("shows all 28 samples for a successful empty query, without persisting them", async () => {
    render(<PublicFeedPage />);
    expect(
      await screen.findByText(/28 sample letters rest/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /All Shelves28/ }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(PUBLIC_FEED_DEMO_KEY)).toBeNull();
    expect(from.mock.calls).toEqual([["notes"]]);
  });

  it("keeps real public letters without mixing in samples", async () => {
    order.mockResolvedValue({
      data: [
        {
          ...INITIAL_PUBLIC_NOTES[0],
          id: "real-note",
          title: "A real public letter",
        },
      ],
      error: null,
    });
    render(<PublicFeedPage />);
    expect(await screen.findByText("A real public letter")).toBeInTheDocument();
    expect(screen.queryByText(/sample letters rest/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(INITIAL_PUBLIC_NOTES[1].title!),
    ).not.toBeInTheDocument();
  });

  it("does not disguise a database failure with sample content", async () => {
    order.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
    render(<PublicFeedPage />);
    expect(
      await screen.findByText("This shelf is currently quiet."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/sample letters rest/)).not.toBeInTheDocument();
  });

  it("ignores stale local demo notes when a real backend is configured", async () => {
    localStorage.setItem(
      PUBLIC_FEED_DEMO_KEY,
      JSON.stringify([
        { ...INITIAL_PUBLIC_NOTES[0], title: "Stale browser-only note" },
      ]),
    );
    render(<PublicFeedPage />);
    expect(
      await screen.findByText(/28 sample letters rest/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Stale browser-only note"),
    ).not.toBeInTheDocument();
  });

  it("opens sample parchment read-only without requesting response rows for a fake ID", async () => {
    render(<PublicFeedPage />);
    fireEvent.click(await screen.findByText(INITIAL_PUBLIC_NOTES[0].title!));
    expect(
      await screen.findByText("Volume retrieved from the shelf"),
    ).toBeInTheDocument();
    expect(document.querySelector("article.parchment-sheet")).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Send Response Letter" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Read Responses" }));
    await waitFor(() =>
      expect(
        screen.getByText(/No letters in response have been pinned/),
      ).toBeInTheDocument(),
    );
    expect(from.mock.calls).toEqual([["notes"]]);
  });
});
