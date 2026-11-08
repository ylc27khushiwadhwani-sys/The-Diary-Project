import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Note } from "../../types/database";
import { BookReaderView } from "./BookReaderView";

interface BookReaderModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onRespond?: (note: Note) => void;
  /** Reading-room flow: called when the reader finishes the last page. */
  onFinished?: (note: Note) => void;
  /** Public letters: report for safety review (3 reports auto-hide). */
  onReport?: (note: Note) => void;
}

// Classic modal presentation of the reader (shelf/aisle contexts). The
// Grand Library instead reads inside the scene via BookReaderView.
export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  note,
  isOpen,
  onClose,
  onRespond,
  onFinished,
  onReport,
}) => {
  if (!isOpen || !note) return null;
  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
        />
        <motion.div
          initial={{ opacity: 0, rotateY: -72, y: 18 }}
          animate={{ opacity: 1, rotateY: 0, y: 0 }}
          exit={{ opacity: 0, rotateY: -72, y: 18 }}
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
          style={{ transformOrigin: "left center" }}
          className="relative z-10 w-full min-w-0 max-w-2xl sm:max-w-4xl my-auto text-left perspective-1000"
          onClick={(e) => e.stopPropagation()}
        >
          <BookReaderView
            note={note}
            onClose={onClose}
            onRespond={onRespond}
            onFinished={onFinished}
            onReport={onReport}
          />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
};
