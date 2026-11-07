import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Feather } from "lucide-react";
import { Librarian } from "../components/library/Librarian";
import { LibraryCard } from "../components/library/LibraryCard";
import { registerVisit } from "../lib/visits";

interface DoorsPageProps {
  penName: string;
  avatarColor?: string;
  onOpen: (room: "reading" | "study") => void;
}

/**
 * The two doors. Once you're inside the library, the Librarian offers the
 * only two rooms that matter tonight: sit with someone else's words, or
 * write your own. Your library card rides along, stamped on every visit.
 */
export const DoorsPage: React.FC<DoorsPageProps> = ({
  penName,
  avatarColor,
  onOpen,
}) => {
  const [visits] = useState(() => registerVisit());
  const stamps = Math.min(visits, 12);

  return (
    <div className="relative text-amber-100">
      <div className="candle-glow absolute inset-0 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-8 pb-6 sm:pt-10 text-center">
        <Librarian
          headline
          line="Say it anyway."
          className="justify-center mb-8"
        />

        <div className="doors-row grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          <motion.button
            type="button"
            onClick={() => onOpen("reading")}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            whileHover={{ y: -5 }}
            className="door-card group"
          >
            <span className="door-plaque">
              <BookOpen className="w-4 h-4 text-gold" />
              <span className="door-name">The Reading Room</span>
            </span>
            <span className="door-desc">
              Sit with words someone else couldn't send. The Librarian left one
              out for you, still sealed.
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => onOpen("study")}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.6 }}
            whileHover={{ y: -5 }}
            className="door-card group"
          >
            <span className="door-plaque">
              <Feather className="w-4 h-4 text-gold" />
              <span className="door-name">Your Study</span>
            </span>
            <span className="door-desc">
              Write the one you're carrying. A whisper waits on the desk if you
              need somewhere to begin.
            </span>
          </motion.button>
        </div>

        <div className="doors-card">
          <LibraryCard penName={penName} avatarColor={avatarColor} />
          <div
            className="mt-3 flex items-center justify-center gap-1.5"
            aria-label={`Stamped on ${visits} ${visits === 1 ? "visit" : "visits"}`}
          >
            {Array.from({ length: stamps }).map((_, i) => (
              <span key={i} className="door-stamp" />
            ))}
            <span className="ml-2 font-body text-[11px] italic text-muted">
              {visits <= 1
                ? "First stamp. The card is yours."
                : `${visits} stamps - one for every visit`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
