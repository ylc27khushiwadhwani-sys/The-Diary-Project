import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  MessageSquare,
  BookOpen,
  Type,
  Sparkles,
} from "lucide-react";
import { Note } from "../../types/database";
import { WaxSeal } from "../library/WaxSeal";
import { HeartSeal } from "../library/HeartSeal";
import { paginate } from "../../utils/paginate";
import { PasscodeModal } from "../library/PasscodeModal";
import { ThreadedResponses } from "../feed/ThreadedResponses";
import promptsData from "../../data/prompts.json";

interface BookReaderModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onRespond?: (note: Note) => void;
}

const BookReaderModalInner: React.FC<BookReaderModalProps> = ({
  note,
  isOpen,
  onClose,
  onRespond,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [handwritingFont, setHandwritingFont] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const mainPages = useMemo(
    () => paginate(note?.content ?? ""),
    [note?.content],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Turning a page returns the sheet to its top so the first line is visible.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pageIndex, note?.id]);

  if (!isOpen || !note) return null;

  const prompt = promptsData.find((p) => p.id === note.prompt_id);
  const authorPenName = note.profiles?.pen_name || "Anonymous Writer";

  const formattedDate = new Date(
    note.published_at || note.created_at,
  ).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isLockedNote = note.is_locked && !isUnlocked;

  // For now we treat responses as a single extra page rendered by ThreadedResponses
  const responsePage = <ThreadedResponses noteId={note.id} />;

  const pages = [...mainPages, responsePage];

  const totalPages = pages.length;

  const goPrev = () => setPageIndex((i) => Math.max(i - 1, 0));
  const goNext = () => setPageIndex((i) => Math.min(i + 1, totalPages - 1));

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal container with perspective for flip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="relative z-10 w-full min-w-0 max-w-2xl my-auto text-left perspective-1000"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3 px-2">
            <span className="font-serif italic text-gold/80 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              <span>Volume retrieved from the shelf</span>
            </span>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wood-900/90 text-amber-200 hover:text-white border border-hairline transition cursor-pointer text-xs font-serif"
            >
              <X className="w-4 h-4" />
              <span>Close & Return to Shelf</span>
            </button>
          </div>

          {isLockedNote ? (
            // Locked parchment letter
            <div className="letter-frame parchment-sheet letter-deckle p-8 sm:p-12 text-center text-wood-950 relative">
              <div className="letter-ribbon" />
              <div className="letter-stamps">
                <span className="letter-stamp" />
              </div>
              <div className="w-16 h-16 rounded-full bg-amber-900/10 border border-amber-800/30 flex items-center justify-center mx-auto mb-4">
                <HeartSeal size={44} locked />
              </div>
              <span className="label-caps block mb-2 text-wood-700">
                Confidential Volume
              </span>
              <h2 className="font-serif text-3xl font-bold text-wood-950 mb-3">
                {note.title || "Sealed Unsent Letter"}
              </h2>
              <p className="font-body text-sm text-wood-800 max-w-md mx-auto mb-6 italic leading-relaxed">
                "This book is sealed with a secret passcode for the author's
                eyes only."
              </p>
              <button
                onClick={() => setIsPasscodeModalOpen(true)}
                className="px-6 py-3 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-full font-serif text-sm font-semibold transition shadow-candle border border-red-500/30 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Break Wax Seal with Passcode</span>
              </button>
            </div>
          ) : (
            // Paginated parchment letter, turned page by page
            <article
              key={note.id}
              className="letter-frame parchment-sheet letter-deckle letter-unfold text-wood-950 relative flex flex-col max-h-[calc(100vh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden"
            >
              <div
                className="letter-liner"
                key={`liner-${note.id}`}
                aria-hidden="true"
              />
              <div
                ref={scrollRef}
                className="reader-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-hidden p-6 sm:p-10 pl-9 sm:pl-12 pt-12 pb-6"
              >
                <div className="letter-ribbon" />
                <div className="letter-stamps">
                  <span className="letter-stamp" />
                  <span className="letter-stamp stamp-green" />
                </div>
                <div className="letter-botanical" />
                {/* Header bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-amber-900/20">
                  <div className="flex items-center gap-3">
                    <WaxSeal color="crimson" size="md" icon="crest" />
                    <div>
                      <span className="label-caps block text-[10px] text-wood-700">
                        The Paper Vault
                      </span>
                      <span className="font-serif text-2xl font-normal text-wood-950 italic leading-none">
                        {authorPenName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-serif text-wood-700">
                      {formattedDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHandwritingFont(!handwritingFont)}
                      className="p-1.5 text-wood-700 hover:text-wood-950 bg-amber-900/10 rounded-lg transition cursor-pointer"
                      title={
                        handwritingFont
                          ? "Switch to Quill Handwriting"
                          : "Switch to Classic Book Print"
                      }
                    >
                      <Type className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prompt badge */}
                {prompt && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-serif italic text-amber-950 bg-amber-800/10 border border-amber-800/20 px-3 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                      <span>From the shelf: "{prompt.title}"</span>
                    </span>
                  </div>
                )}

                {/* Title */}
                {note.title && (
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-wood-950 mb-4 tracking-tight leading-snug">
                    {note.title}
                  </h2>
                )}

                {/* Page content with flip animation */}
                <div className="flex-1 flex flex-col relative min-h-[200px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pageIndex}
                      className="w-full"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div
                        className={`text-wood-950 whitespace-pre-wrap break-words select-text mb-6 ${
                          handwritingFont
                            ? "font-serif text-xl sm:text-2xl font-normal leading-relaxed"
                            : "font-hand text-2xl sm:text-[1.85rem] font-normal leading-[1.85]"
                        }`}
                      >
                        {pages[pageIndex]}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom actions */}
                <div className="pt-6 border-t border-amber-900/20">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-serif italic text-sm text-wood-700">
                      — Preserved in the archive by {authorPenName}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowResponses(!showResponses)}
                        className="inline-flex items-center gap-1.5 text-sm font-serif text-wood-800 hover:text-wood-950 font-semibold cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-amber-800" />
                        <span>
                          {showResponses ? "Hide Responses" : "Read Responses"}
                        </span>
                      </button>
                      {note.allow_responses && onRespond && (
                        <button
                          onClick={() => onRespond(note)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-full font-serif text-xs font-semibold shadow-candle border border-red-500/30 cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 text-red-200" />
                          <span>Send Response Letter</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Optional threaded responses – shown only when user toggles */}
                  {showResponses && (
                    <div className="mt-5 pt-4 border-t border-dashed border-amber-900/25">
                      <ThreadedResponses noteId={note.id} />
                    </div>
                  )}
                </div>
              </div>
              {/* Navigation controls */}
              <div className="reader-nav relative z-20 flex-none flex items-center justify-between px-6 sm:px-10 pt-3 pb-6 border-t border-amber-900/20">
                <button
                  onClick={goPrev}
                  disabled={pageIndex === 0}
                  className="px-3 py-1 rounded-full bg-wood-800/60 text-amber-100 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-wood-700">
                  Page {pageIndex + 1} of {totalPages}
                </span>
                <button
                  onClick={goNext}
                  disabled={pageIndex === totalPages - 1}
                  className="px-3 py-1 rounded-full bg-wood-800/60 text-amber-100 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </article>
          )}

          {/* Passcode Modal for breaking the seal */}
          <PasscodeModal
            isOpen={isPasscodeModalOpen}
            passcodeHash={note.passcode_hash}
            onSuccess={() => {
              setIsUnlocked(true);
              setIsPasscodeModalOpen(false);
            }}
            onClose={() => setIsPasscodeModalOpen(false)}
          />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
};

// Keyed by letter + open state so every opening starts on page 1, sealed
// state fresh, never inheriting the previous letter's page or unlock.
export const BookReaderModal: React.FC<BookReaderModalProps> = (props) => (
  <BookReaderModalInner
    key={`${props.note?.id ?? "none"}:${props.isOpen}`}
    {...props}
  />
);
