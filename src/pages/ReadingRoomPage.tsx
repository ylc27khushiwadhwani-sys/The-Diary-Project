import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Feather, Flame } from "lucide-react";
import { Note } from "../types/database";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { usePublicNotes } from "../hooks/usePublicNotes";
import { registerVisit } from "../lib/visits";
import { currentHallHour, HALL_LABELS } from "../lib/timeOfDay";
import { isCandleLit, lightCandle } from "../lib/candles";
import { readingGreeting, completionLine } from "../lib/librarian";
import { isDateSealed } from "../utils/unseal";
import { isSampleNote } from "../services/publicFeed";
import { Librarian } from "../components/library/Librarian";
import { BookItem } from "../components/bookshelf/BookItem";
import { BookReaderModal } from "../components/bookshelf/BookReaderModal";
import { ResponseComposer } from "../components/feed/ResponseComposer";
import { ReportModal } from "../components/feed/ReportModal";
import { SignInModal } from "../components/auth/SignInModal";
import { CandleFlame } from "../components/cinematic/CandleFlame";
import { WhisperWall } from "../components/library/WhisperWall";

interface ReadingRoomPageProps {
  onEnterLibrary: () => void;
  onOpenStudy: () => void;
}

/**
 * The Reading Room: a letter the Librarian left out for you, a small shelf
 * to wander, and the Librarian. The whole Grand Library is one door away,
 * never a grid dumped on arrival.
 */
export const ReadingRoomPage: React.FC<ReadingRoomPageProps> = ({
  onEnterLibrary,
  onOpenStudy,
}) => {
  const { user } = useAuth();
  const { notes, loading, refetch } = usePublicNotes();
  const [visits] = useState(() => registerVisit());
  const [hourLabel] = useState(() => HALL_LABELS[currentHallHour()]);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [finishedNote, setFinishedNote] = useState<Note | null>(null);
  const [respondingNote, setRespondingNote] = useState<Note | null>(null);
  const [reportingNote, setReportingNote] = useState<Note | null>(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Letters you can actually open today (date-sealed ones are still waiting)
  const readable = useMemo(
    () => notes.filter((n) => !isDateSealed(n)),
    [notes],
  );

  // A small shelf to wander - every reader picks their own, nothing is
  // singled out or pushed.
  const todaysShelf = useMemo(() => readable.slice(0, 7), [readable]);

  const handleStartResponse = (note: Note) => {
    if (isSupabaseConfigured && isSampleNote(note.id)) return;
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }
    setRespondingNote(note);
  };

  return (
    <div className="relative min-h-screen text-amber-100">
      <div className="candle-glow absolute inset-0 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 sm:py-14">
        {/* The Librarian greets by visit count and hour */}
        <Librarian
          line={readingGreeting(visits, hourLabel)}
          className="justify-center mb-10"
        />

        {loading ? (
          <div role="status" className="text-center py-20">
            <Feather className="w-6 h-6 text-gold/60 mx-auto mb-3 animate-pulse" />
            <p className="font-body text-sm text-muted italic">
              Opening the Reading Room...
            </p>
          </div>
        ) : (
          <>
            {/* A small shelf to wander - not the whole library */}
            {todaysShelf.length > 0 && (
              <section className="mb-12">
                <p className="text-center font-body text-xs text-muted italic mb-4">
                  A few spines resting on the shelf. Touch a book to unroll its
                  letter.
                </p>
                <div className="relative rounded-xl wood-panel border border-hairline px-4 pt-8 pb-0 shadow-[0_14px_34px_rgba(0,0,0,0.85)] max-w-2xl mx-auto">
                  <div className="relative flex items-end justify-center gap-[3px] min-h-[136px] pb-1">
                    {todaysShelf.map((note, idx) => (
                      <BookItem
                        key={note.id}
                        note={note}
                        index={idx}
                        onOpen={(opened) => setSelectedNote(opened)}
                      />
                    ))}
                  </div>
                  <div className="wood-shelf-ledge h-4 rounded-b-md relative z-20" />
                </div>
              </section>
            )}

            {/* The door to the whole library */}
            <div className="text-center space-y-4">
              <button
                type="button"
                onClick={onEnterLibrary}
                className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-card/70 hover:bg-card px-8 py-3.5 font-serif text-base text-gold-light transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Wander the whole Grand Library</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="font-body text-xs text-muted italic">
                Carrying something yourself?{" "}
                <button
                  type="button"
                  onClick={onOpenStudy}
                  className="text-gold underline underline-offset-4 hover:text-gold-light transition cursor-pointer"
                >
                  Your desk is in the Study
                </button>
                .
              </p>
            </div>

            {/* The whisper wall: one line, no letter, no seal */}
            <WhisperWall />
          </>
        )}
      </div>

      {/* Reader */}
      <BookReaderModal
        note={selectedNote}
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        onRespond={(n) => {
          setSelectedNote(null);
          handleStartResponse(n);
        }}
        onFinished={(n) => {
          setSelectedNote(null);
          setFinishedNote(n);
        }}
        onReport={
          selectedNote && !isSampleNote(selectedNote.id)
            ? (n) => setReportingNote(n)
            : undefined
        }
      />

      {/* Completion ceremony */}
      <AnimatePresence>
        {finishedNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setFinishedNote(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 18 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="ceremony-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ceremony-flame">
                <CandleFlame size={2.6} />
              </div>
              <p className="font-serif italic text-xl sm:text-2xl text-cream text-center leading-relaxed mb-6">
                {completionLine}
              </p>
              <div className="flex flex-col items-center gap-3">
                {!isCandleLit(finishedNote.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      lightCandle(finishedNote.id);
                      setFinishedNote(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-wax-crimson hover:bg-wax-crimsonBright px-6 py-2.5 font-serif text-sm text-amber-50 font-semibold shadow-candle border border-red-500/30 transition cursor-pointer"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Light a candle for it</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFinishedNote(null)}
                  className="font-body text-xs text-muted hover:text-amber-100 underline underline-offset-4 transition cursor-pointer"
                >
                  Rest a moment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Respond */}
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

      {/* Report */}
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

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
};
