import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Feather, Search, SlidersHorizontal } from "lucide-react";
import { Note } from "../types/database";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { InteractiveBookshelf } from "../components/bookshelf/InteractiveBookshelf";
import { InkText } from "../components/cinematic/InkText";
import { GrandHallBackdrop } from "../components/library/GrandHallBackdrop";
import { CandleLanternIcon } from "../components/common/CandleLanternIcon";
import { LibraryCard } from "../components/library/LibraryCard";
import { ResponseComposer } from "../components/feed/ResponseComposer";
import { ReportModal } from "../components/feed/ReportModal";
import { SignInModal } from "../components/auth/SignInModal";
import { NoteEditor } from "../components/editor/NoteEditor";
import { useCancellableLoad } from "../hooks/useCancellableLoad";
import { INITIAL_PUBLIC_NOTES, PUBLIC_FEED_DEMO_KEY } from "../data/seedNotes";
import { isSampleNote, publicNotesOrSamples } from "../services/publicFeed";

const DEMO_NOTES_KEY = PUBLIC_FEED_DEMO_KEY;

export const PublicFeedPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Modals
  const [respondingNote, setRespondingNote] = useState<Note | null>(null);
  const [reportingNote, setReportingNote] = useState<Note | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Discovery control (KTD8): free-text search over title/content/pen name
  // plus a latest/oldest sort, applied to the same list InteractiveBookshelf
  // renders so it narrows (never conflicts with) its shelf-section browsing.
  const [feedSearch, setFeedSearch] = useState("");
  const [feedSort, setFeedSort] = useState<"latest" | "oldest">("latest");

  const loadPublicNotes = async (): Promise<Note[] | null> => {
    if (!isSupabaseConfigured) {
      const raw = localStorage.getItem(DEMO_NOTES_KEY);
      let localNotes: Note[] = raw ? JSON.parse(raw) : [];

      if (localNotes.length === 0) {
        localStorage.setItem(
          DEMO_NOTES_KEY,
          JSON.stringify(INITIAL_PUBLIC_NOTES),
        );
        localNotes = INITIAL_PUBLIC_NOTES;
      }

      return localNotes.filter(
        (n) => n.is_public && n.moderation_status === "clean",
      );
    }

    const { data, error } = await supabase
      .from("notes")
      .select("*, profiles:user_id(id, pen_name, avatar_color)")
      .eq("is_public", true)
      .eq("moderation_status", "clean")
      .order("published_at", { ascending: false });

    if (error || !data) return null;
    return publicNotesOrSamples(data as Note[]);
  };

  // Initial load runs under the shared cancellation guard; every refresh below
  // goes through refetch() so it shares the same guard.
  const { loading, refetch } = useCancellableLoad(
    loadPublicNotes,
    [],
    setNotes,
  );

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
      const { data } = await supabase
        .from("notes")
        .insert([{ ...newNoteData, user_id: user.id }])
        .select()
        .single();
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
      {/* 1. Hero Section (Design & Aesthetic from thediaryproject.lovable.app) */}
      <section className="relative flex min-h-[82vh] items-center justify-center overflow-hidden px-6 py-20 text-center">
        {/* Candle Glow Ambient Gradient */}
        <div className="candle-glow absolute inset-0" />
        <GrandHallBackdrop />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Hanging Candle Lantern Icon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <CandleLanternIcon className="h-28 w-14 text-gold mb-3" />
          </motion.div>

          {/* Subtitle Badge */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="label-caps mt-2 text-gold/90"
          >
            Anonymous Literary Sanctuary
          </motion.p>

          {/* Main Hero Header */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-4 text-5xl sm:text-7xl font-serif tracking-tight text-[#f3ece0] [text-shadow:0_0_38px_rgba(212,163,115,0.35)]"
          >
            <InkText
              text="Say what you couldn't say."
              startDelay={0.6}
              perLetter={0.05}
            />
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mx-auto mt-6 max-w-lg font-body text-base sm:text-lg text-[#9e9488] leading-relaxed italic"
          >
            An anonymous library for the things you carry and never told anyone.
            Write them down. Shelve them. Be known by no one.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => setIsEditorOpen(true)}
              className="rounded-full bg-gold hover:bg-gold-light px-8 py-3.5 font-serif text-lg text-wood-950 font-semibold shadow-candle transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <Feather className="w-5 h-5" />
              <span>Write an Unsent Letter</span>
            </button>

            <a
              href="#bookshelf"
              className="rounded-full border border-hairline bg-card/80 hover:bg-wood-850 px-8 py-3.5 font-serif text-lg text-amber-100 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              Browse the Bookshelf
            </a>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("paper-vault:open-box"));
                document
                  .getElementById("bookshelf")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-red-400/30 bg-wax-crimson/80 hover:bg-wax-crimson px-8 py-3.5 font-serif text-lg text-amber-50 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              Open the Keepsake Box
            </button>
          </motion.div>

          {/* First-visit guidance: what this place is and how to begin */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mx-auto mt-6 max-w-md font-body text-sm text-[#9e9488] italic leading-relaxed"
          >
            No account is needed to read. Touch any book below to unroll its
            letter, or write one of your own - you will appear only as a pen
            name.
          </motion.p>
        </div>
      </section>

      {/* 2. Poetic Quote Divider */}
      <section className="px-6 py-20 border-y border-hairline/60 bg-wood-950/40">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-serif text-3xl leading-snug sm:text-4xl text-[#f3ece0]">
            Some things are too heavy to carry and too hard to say. So they sit
            in your chest.{" "}
            <em className="text-gold not-italic">
              Here, they can sit on a shelf instead.
            </em>
          </p>
        </div>
      </section>

      {/* 3. The Interactive Bookshelf (Letters are opened by touching a book) */}
      <div id="bookshelf" className="scroll-mt-16 py-10">
        {!loading && visibleNotes.length > 0 && (
          <p className="text-center font-body text-xs text-[#9e9488] italic mb-4">
            {isSupabaseConfigured &&
            notes.length > 0 &&
            notes.every((note) => isSampleNote(note.id))
              ? `${visibleNotes.length} sample letters rest on these shelves. Explore them while the community begins writing.`
              : `${visibleNotes.length} ${visibleNotes.length === 1 ? "letter rests" : "letters rest"} on these shelves, each left by an anonymous pen name.`}
          </p>
        )}
        {/* Search + sort control: lives above the bookshelf and narrows what it renders */}
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
              aria-label="Sort letters by date"
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
        ) : (
          <InteractiveBookshelf
            notes={visibleNotes}
            onWriteClick={() => setIsEditorOpen(true)}
            onRespondLetter={handleStartResponse}
          />
        )}
      </div>

      {/* 4. Library Card & Sample Letter Quote Section (Clean and focused, four rooms removed) */}
      <section className="px-6 py-24 border-t border-hairline bg-wood-950/40">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Library Card */}
          <div className="text-center md:text-left">
            <span className="label-caps block mb-2">Anonymous Identity</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#f3ece0] mb-4">
              Your identity belongs to you alone
            </h2>
            <p className="font-body text-base text-[#9e9488] leading-relaxed mb-6 italic">
              When you enter the library, you receive an anonymous pseudonym.
              Nobody sees your email, location, or personal details.
            </p>
            <LibraryCard
              penName={profile?.pen_name || "Quiet Heron"}
              avatarColor="#d4a373"
              className="mx-auto md:mx-0"
            />
          </div>

          {/* Sample Unsent Parchment Note from the shelf */}
          <div>
            <p className="label-caps mb-4 text-center">From a shelf, someday</p>
            <div className="letter-frame parchment-sheet letter-deckle rotate-[0.6deg] p-8 sm:p-12 pl-10 sm:pl-14 text-wood-950 relative">
              <div className="letter-ribbon" />
              <div className="letter-stamps">
                <span className="letter-stamp" />
              </div>
              <div className="letter-botanical" />
              <blockquote className="font-serif text-2xl sm:text-3xl italic leading-relaxed text-wood-950">
                "To the friend I stopped calling:
                <br />
                <br />
                I'm not angry anymore. I just didn't know how to say I missed
                you."
              </blockquote>
              <div className="mt-8 text-right font-serif text-lg text-wood-800">
                — Quiet Heron
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Sign In Modal if guest tries to respond */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
};
