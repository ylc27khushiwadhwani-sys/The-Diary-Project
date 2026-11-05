import React, { useMemo, useState } from "react";
import { BookOpen, Feather, Search, SlidersHorizontal } from "lucide-react";
import { Note } from "../types/database";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { PaywallModal } from "../components/payments/PaywallModal";
import { fetchQuota, isLimitError } from "../lib/payments";
import { InteractiveBookshelf } from "../components/bookshelf/InteractiveBookshelf";
import { LibraryAisles } from "../components/library/LibraryAisles";
import { BookReaderModal } from "../components/bookshelf/BookReaderModal";
import { GrandHallBackdrop } from "../components/library/GrandHallBackdrop";
import { ResponseComposer } from "../components/feed/ResponseComposer";
import { ReportModal } from "../components/feed/ReportModal";
import { SignInModal } from "../components/auth/SignInModal";
import { NoteEditor } from "../components/editor/NoteEditor";
import { usePublicNotes } from "../hooks/usePublicNotes";
import { PUBLIC_FEED_DEMO_KEY } from "../data/seedNotes";
import { isSampleNote } from "../services/publicFeed";

const DEMO_NOTES_KEY = PUBLIC_FEED_DEMO_KEY;

/**
 * The Grand Library: the whole public collection as its own tab. Two ways to
 * walk it - aisles (every section at once, shelves that scroll sideways) or
 * the single big shelf with section filters. Search and sort narrow both.
 */
export const PublicFeedPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { notes, loading, loadingMore, hasMore, refetch, loadMore } =
    usePublicNotes();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [browseMode, setBrowseMode] = useState<"shelf" | "aisles">("shelf");
  const [aisleNote, setAisleNote] = useState<Note | null>(null);

  // Free writers hold a fixed number of letters; the ask only appears once it is reached.
  const openWriter = async () => {
    if (isSupabaseConfigured && user) {
      const quota = await fetchQuota(user.id);
      if (quota.atLimit) {
        setPaywallOpen(true);
        return;
      }
    }
    setIsEditorOpen(true);
  };

  // Modals
  const [respondingNote, setRespondingNote] = useState<Note | null>(null);
  const [reportingNote, setReportingNote] = useState<Note | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Discovery control (KTD8): free-text search over title/content/pen name
  // plus a latest/oldest sort, applied to the same list the shelf renders so
  // it narrows (never conflicts with) section browsing.
  const [feedSearch, setFeedSearch] = useState("");
  const [feedSort, setFeedSort] = useState<"latest" | "oldest">("latest");

  const visibleNotes = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    const filtered = query
      ? notes.filter((n) =>
          [n.title ?? "", n.content ?? "", n.profiles?.pen_name ?? ""].some(
            (field) => field.toLowerCase().includes(query),
          ),
        )
        : notes;
    const byDate = (n: Note) => n.published_at || n.created_at || "";
    return [...filtered].sort((a, b) =>
      feedSort === "latest"
        ? byDate(b).localeCompare(byDate(a))
        : byDate(a).localeCompare(byDate(b)),
    );
  }, [notes, feedSearch, feedSort]);

  const handleStartResponse = (note: Note) => {
    if (isSupabaseConfigured && isSampleNote(note.id)) return;
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }
    setRespondingNote(note);
  };

  const handleSaveNewNote = async (newNoteData: Partial<Note>) => {
    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const raw = localStorage.getItem(DEMO_NOTES_KEY);
      const existing: Note[] = raw ? JSON.parse(raw) : [];
      const created: Note = {
        id: "note-" + Date.now(),
        user_id: user?.id || "guest",
        shelf_id: null,
        title: newNoteData.title || null,
        content: newNoteData.content || "",
        prompt_id: newNoteData.prompt_id || null,
        is_locked: newNoteData.is_locked || false,
        passcode_hash: newNoteData.passcode_hash || null,
        is_public: newNoteData.is_public || false,
        allow_responses: newNoteData.allow_responses ?? true,
        moderation_status: newNoteData.moderation_status || "clean",
        report_count: 0,
        published_at: newNoteData.is_public ? now : null,
        created_at: now,
        profiles: profile || undefined,
      };
      existing.unshift(created);
      localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(existing));
      setIsEditorOpen(false);
      refetch();
      return;
    }

    if (user) {
      const { data, error } = await supabase
        .from("notes")
        .insert([{ ...newNoteData, user_id: user.id }])
        .select()
        .single();
      if (isLimitError(error)) {
        setIsEditorOpen(false);
        setPaywallOpen(true);
        return;
      }
      if (data) {
        setIsEditorOpen(false);
        refetch();
      }
    }
  };

  if (isEditorOpen) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <NoteEditor
          note={{ is_public: true, allow_responses: true }}
          shelves={[]}
          onSave={handleSaveNewNote}
          onClose={() => setIsEditorOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden text-amber-100">
      <GrandHallBackdrop />
      <div id="bookshelf" className="scroll-mt-16 py-10 relative z-10">
        {/* Library header */}
        <div className="text-center mb-6 px-4">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-gold" />
            <span className="label-caps">The Grand Library</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#fbf3e2] tracking-tight">
            Every shelf, every section, every unsent thing
          </h1>
          {!loading && visibleNotes.length > 0 && (
            <p className="font-body text-xs text-[#9e9488] italic mt-2">
              {isSupabaseConfigured &&
              notes.length > 0 &&
              notes.every((note) => isSampleNote(note.id))
                ? `${visibleNotes.length} sample letters rest on these shelves. Explore them while the community begins writing.`
                : `${visibleNotes.length} ${visibleNotes.length === 1 ? "letter rests" : "letters rest"} on these shelves, each left by an anonymous pen name.`}
            </p>
          )}

          {/* Browse mode: the single shelf or the full aisles */}
          <div
            className="mt-4 inline-flex items-center gap-1 rounded-full border border-hairline bg-card/60 p-1"
            role="group"
            aria-label="How to walk the library"
          >
            {(
              [
                { id: "shelf", label: "The Big Shelf" },
                { id: "aisles", label: "Walk the Aisles" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setBrowseMode(mode.id)}
                aria-pressed={browseMode === mode.id}
                className={`px-4 py-1.5 rounded-full text-xs font-serif tracking-wide cursor-pointer transition-all duration-200 ${
                  browseMode === mode.id
                    ? "bg-gold text-wood-950 shadow-candle"
                    : "text-amber-200 hover:text-gold-light"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search + sort control */}
        <div className="mx-auto max-w-5xl px-4 mb-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              placeholder="Search letters by title, words, or pen name..."
              aria-label="Search letters"
              className="w-full pl-10 pr-4 py-2.5 bg-card/80 border border-hairline rounded-xl text-sm text-amber-100 placeholder:text-[#9e9488]/70 font-serif focus:outline-none focus:ring-1 focus:ring-gold transition"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-200 bg-card/80 border border-hairline rounded-xl px-3 py-2.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
            <select
              value={feedSort}
              onChange={(e) =>
                setFeedSort(e.target.value as "latest" | "oldest")
              }
              aria-label="Sort letters"
              className="bg-transparent text-xs font-serif text-amber-100 focus:outline-none cursor-pointer"
            >
              <option value="latest" className="bg-wood-900 text-amber-100">
                Latest archived
              </option>
              <option value="oldest" className="bg-wood-900 text-amber-100">
                Earliest archived
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div role="status" className="text-center py-20 px-4">
            <Feather className="w-6 h-6 text-gold/60 mx-auto mb-3 animate-pulse" />
            <p className="font-body text-sm text-[#9e9488] italic">
              Unshelving the letters...
            </p>
          </div>
        ) : feedSearch.trim() && visibleNotes.length === 0 ? (
          <div role="status" className="text-center py-20 px-4">
            <Feather className="w-8 h-8 text-gold/50 mx-auto mb-3" />
            <h3 className="font-serif text-2xl text-amber-100 mb-2">
              No letters match your search
            </h3>
            <p className="font-body text-sm text-[#9e9488] italic max-w-sm mx-auto">
              Try a different phrase, or search by pen name.
            </p>
          </div>
        ) : browseMode === "aisles" ? (
          <div className="mx-auto max-w-5xl px-4">
            <LibraryAisles
              notes={visibleNotes}
              onOpen={(n) => setAisleNote(n)}
            />
          </div>
        ) : (
          <InteractiveBookshelf
            notes={visibleNotes}
            onWriteClick={openWriter}
            onRespondLetter={handleStartResponse}
          />
        )}

        {/* Scale: unshelve the next page of the archive */}
        {!loading && hasMore && !feedSearch.trim() && (
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-full border border-gold/50 bg-card/70 hover:bg-card px-8 py-3 font-serif text-sm text-gold-light transition cursor-pointer disabled:opacity-50"
            >
              {loadingMore
                ? "Unshelving..."
                : "Unshelve more of the archive"}
            </button>
          </div>
        )}
      </div>

      {/* Aisle reader (the big shelf keeps its own internal reader) */}
      <BookReaderModal
        note={aisleNote}
        isOpen={!!aisleNote}
        onClose={() => setAisleNote(null)}
        onRespond={(n) => {
          setAisleNote(null);
          handleStartResponse(n);
        }}
      />

      {/* Response Composer Modal */}
      {respondingNote && (
        <ResponseComposer
          isOpen={!!respondingNote}
          targetNoteId={respondingNote.id}
          targetNoteTitle={respondingNote.title || "Untitled Letter"}
          targetPenName={
            respondingNote.profiles?.pen_name || "Anonymous Writer"
          }
          onClose={() => setRespondingNote(null)}
          onResponseSent={() => {
            setRespondingNote(null);
            refetch();
          }}
        />
      )}

      {/* Report Modal */}
      {reportingNote && (
        <ReportModal
          isOpen={!!reportingNote}
          noteId={reportingNote.id}
          onClose={() => setReportingNote(null)}
          onReportSubmitted={() => {
            refetch();
            setReportingNote(null);
          }}
        />
      )}

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />

      {/* Sign In Modal if guest tries to respond */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
};
