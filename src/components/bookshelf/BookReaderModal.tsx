import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, BookOpen, Type, Sparkles } from 'lucide-react';
import { Note } from '../../types/database';
import { WaxSeal } from '../library/WaxSeal';
import { PasscodeModal } from '../library/PasscodeModal';
import { ThreadedResponses } from '../feed/ThreadedResponses';
import promptsData from '../../data/prompts.json';

interface BookReaderModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onRespond?: (note: Note) => void;
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  note,
  isOpen,
  onClose,
  onRespond,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [handwritingFont, setHandwritingFont] = useState(false);
  const [showResponses, setShowResponses] = useState(false);

  if (!isOpen || !note) return null;

  const prompt = promptsData.find((p) => p.id === note.prompt_id);
  const authorPenName = note.profiles?.pen_name || 'Anonymous Writer';

  const formattedDate = new Date(note.published_at || note.created_at).toLocaleDateString(
    undefined,
    { month: 'long', day: 'numeric', year: 'numeric' }
  );

  const isLockedNote = note.is_locked && !isUnlocked;


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-2xl my-auto text-left perspective-1000"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-3 px-2">
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
            // Locked view (unchanged)
            <div className="letter-frame parchment-sheet letter-deckle p-8 sm:p-12 text-center text-wood-950 relative">
              <div className="letter-ribbon" />
              <div className="letter-stamps">
                <span className="letter-stamp" />
              </div>
              <div className="w-16 h-16 rounded-full bg-amber-900/10 border border-amber-800/30 flex items-center justify-center mx-auto mb-4">
                <WaxSeal color="crimson" size="lg" icon="lock" />
              </div>
              <span className="label-caps block mb-2 text-wood-700">Confidential Volume</span>
              <h2 className="font-serif text-3xl font-bold text-wood-950 mb-3">
                {note.title || 'Sealed Unsent Letter'}
              </h2>
              <p className="font-body text-sm text-wood-800 max-w-md mx-auto mb-6 italic leading-relaxed">
                "This book is sealed with a secret passcode for the author's eyes only."
              </p>
              <button
                onClick={() => setIsPasscodeModalOpen(true)}
                className="px-6 py-3 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-full font-serif text-sm font-semibold transition shadow-candle border border-red-500/30 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Break Wax Seal with Passcode</span>
              </button>
            </div>
          ) : (
            // Continuous scrollable keepsake letter
            <article className="letter-frame parchment-sheet letter-deckle text-wood-950 relative max-h-[85vh] flex flex-col overflow-hidden">
              <div className="letter-ribbon" />
              <div className="letter-stamps">
                <span className="letter-stamp" />
                <span className="letter-stamp stamp-green" />
              </div>
              <div className="letter-botanical" />

              {/* Rolled top edge of the scroll */}
              <div className="scroll-roll-top mx-3 mt-2 shrink-0" />

              {/* Fixed letterhead */}
              <div className="px-6 sm:px-10 pl-9 sm:pl-12 pt-4 shrink-0">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-900/20">
                  <div className="flex items-center gap-3">
                    <WaxSeal color="crimson" size="md" icon="crest" />
                    <div>
                      <span className="label-caps block text-[10px] text-wood-700">The Paper Vault</span>
                      <span className="font-serif text-2xl font-normal text-wood-950 italic leading-none">
                        {authorPenName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-serif text-wood-700">{formattedDate}</span>
                    <button
                      type="button"
                      onClick={() => setHandwritingFont(!handwritingFont)}
                      className="p-1.5 text-wood-700 hover:text-wood-950 bg-amber-900/10 rounded-lg transition cursor-pointer"
                      title={handwritingFont ? 'Switch to Quill Handwriting' : 'Switch to Classic Book Print'}
                    >
                      <Type className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {prompt && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-serif italic text-amber-950 bg-amber-800/10 border border-amber-800/20 px-3 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                      <span>From the shelf: "{prompt.title}"</span>
                    </span>
                  </div>
                )}

                {note.title && (
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-wood-950 mb-3 tracking-tight leading-snug">
                    {note.title}
                  </h2>
                )}
              </div>

              {/* The letter unrolls - one continuous scroll, however long it runs */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-10 pl-9 sm:pl-12 pb-6">
                <div
                  className={`text-wood-950 whitespace-pre-wrap select-text ${
                    handwritingFont
                      ? 'font-serif text-xl sm:text-2xl font-normal leading-relaxed'
                      : 'font-hand text-2xl sm:text-[1.85rem] font-normal leading-[1.85]'
                  }`}
                >
                  {note.content}
                </div>

                {showResponses && (
                  <div className="mt-6 pt-4 border-t border-dashed border-amber-900/25">
                    <ThreadedResponses noteId={note.id} />
                  </div>
                )}
              </div>

              {/* Rolled bottom edge of the scroll */}
              <div className="scroll-roll-bottom mx-3 shrink-0" />

              {/* Fixed footer actions - extra bottom padding so the deckled
                  torn rim erodes empty paper, not the attribution line */}
              <div className="px-6 sm:px-10 pl-9 sm:pl-12 pt-4 pb-8 shrink-0">
                <div className="pt-4 border-t border-amber-900/20 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-serif italic text-sm text-wood-700">— Preserved in the archive by {authorPenName}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowResponses(!showResponses)}
                      className="inline-flex items-center gap-1.5 text-sm font-serif text-wood-800 hover:text-wood-950 font-semibold cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-800" />
                      <span>{showResponses ? 'Hide Responses' : 'Read Responses'}</span>
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
    </AnimatePresence>
  );
};
