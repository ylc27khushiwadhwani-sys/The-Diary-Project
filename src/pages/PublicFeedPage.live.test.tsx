import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PublicFeedPage } from "./PublicFeedPage";
import { INITIAL_PUBLIC_NOTES, PUBLIC_FEED_DEMO_KEY } from "../data/seedNotes";

vi.mock("../components/library/GrandLibraryBooks", async (importOriginal) => {
  const actual=await importOriginal<typeof import("../components/library/GrandLibraryBooks")>();
  return {GrandLibraryBooks:(props:React.ComponentProps<typeof actual.GrandLibraryBooks>)=><><actual.GrandLibraryBooks {...props}/><button onClick={()=>props.onChoose("all")}>Open test archive</button></>};
});

const { from, range } = vi.hoisted(() => ({ from: vi.fn(), range: vi.fn() }));
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
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  from.mockReturnValue(query);
  range.mockResolvedValue({ data: [], error: null });
});

describe("configured public feed sample fallback", () => {
  it("shows all 28 samples for a successful empty query, without persisting them", async () => {
    render(<PublicFeedPage />);
    fireEvent.click(screen.getByRole("button", {name:"Open test archive"}));
    expect(
      await screen.findByText(/28 sample letters rest/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /All Shelves28/ }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(PUBLIC_FEED_DEMO_KEY)).toBeNull();
    expect(from.mock.calls).toEqual([["notes"]]);
  });

  it("random reading from the room excludes private, sealed, locked and unclean letters", async () => {
    const base=INITIAL_PUBLIC_NOTES[0];
    range.mockResolvedValue({data:[
      {...base,id:"eligible",title:"Eligible public letter"},
      {...base,id:"private",is_public:false,title:"Private sentinel"},
      {...base,id:"locked",is_locked:true,title:"Locked sentinel"},
      {...base,id:"sealed",tags:["unseal:2999-01-01"],title:"Sealed sentinel"},
      {...base,id:"unclean",moderation_status:"flagged",title:"Unclean sentinel"},
    ],error:null});
    render(<PublicFeedPage/>);
    const random=screen.getByRole("button",{name:"read in random order"});
    await waitFor(()=>expect(random).not.toBeDisabled());
    expect(screen.queryByRole("button",{name:"All Shelves"})).not.toBeInTheDocument();
    fireEvent.click(random);
    expect(await screen.findByText("Volume retrieved from the shelf")).toBeInTheDocument();
    expect(document.querySelector("article.reader-open-volume")?.textContent).toContain("Eligible public letter");
  });

  it("keeps real public letters without mixing in samples", async () => {
    range.mockResolvedValue({
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
    fireEvent.click(screen.getByRole("button", {name:"Open test archive"}));
    expect(await screen.findByText("A real public letter")).toBeInTheDocument();
    expect(screen.queryByText(/sample letters rest/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(INITIAL_PUBLIC_NOTES[1].title!),
    ).not.toBeInTheDocument();
  });

  it("does not disguise a database failure with sample content", async () => {
    range.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
    render(<PublicFeedPage />);
    fireEvent.click(screen.getByRole("button", {name:"Open test archive"}));
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
    fireEvent.click(screen.getByRole("button", {name:"Open test archive"}));
    expect(
      await screen.findByText(/28 sample letters rest/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Stale browser-only note"),
    ).not.toBeInTheDocument();
  });

  it("opens sample parchment read-only without requesting response rows for a fake ID", async () => {
    render(<PublicFeedPage />);
    fireEvent.click(screen.getByRole("button", {name:"Open test archive"}));
    fireEvent.click(await screen.findByText(INITIAL_PUBLIC_NOTES[0].title!));
    expect(
      await screen.findByText("Volume retrieved from the shelf"),
    ).toBeInTheDocument();
    expect(document.querySelector("article.reader-open-volume")).not.toBeNull();
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

describe("grand library passcode gate", () => {
  it("a locked public book opens into the wax-seal passcode gate, never the letter", async () => {
    const base=INITIAL_PUBLIC_NOTES[0];
    range.mockResolvedValue({data:[
      {...base,id:"open-letter",title:"Open public letter"},
      {...base,id:"locked",is_locked:true,passcode_hash:"salt$hash",title:"Locked sentinel"},
    ],error:null});
    render(<PublicFeedPage/>);
    const lockedBook=await screen.findByRole("button",{name:"Open letter: Locked sentinel"});
    fireEvent.click(lockedBook);
    expect(await screen.findByText(/sealed with a secret passcode/i,undefined,{timeout:4000})).toBeInTheDocument();
    expect(screen.getByRole("button",{name:/Break Wax Seal with Passcode/i})).toBeInTheDocument();
    expect(screen.queryByText(base.content||"__no_letter_body__")).not.toBeInTheDocument();
  });
});
