import React, { useState } from 'react';
import { Lock, Globe, Trash2, Edit3, HeartHandshake, Folder } from 'lucide-react';
import { Note, Shelf } from '../../types/database';
import { PasscodeModal } from './PasscodeModal';
import { maskText } from '../../utils/crypto';

interface NoteCardProps {
  note: Note;
  shelves: Shelf[];
  onOpen: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  shelves,
  onOpen,
  onDelete,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(!note.is_locked);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);

  const shelf = shelves.find((s) => s.id === note.shelf_id);

  const handleCardClick = () => {
    if (note.is_locked && !isUnlocked) {
      setIsPasscodeModalOpen(true);
    } else {
      onOpen(note);
    }
  };

  const handleUnlockSuccess = () => {
    setIsUnlocked(true);
    setIsPasscodeModalOpen(false);
    onOpen(note);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative cursor-pointer bg-white border border-parchment-200 hover:border-parchment-400/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between"
      >
        <div>
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              {shelf && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-parchment-200/70 text-ink-500 text-[11px] font-medium">
                  <Folder className="w-2.5 h-2.5 text-sage-600" />
                  <span>{shelf.name}</span>
                </span>
              )}
              {note.is_public && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 text-[11px] font-medium">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Public Library</span>
                </span>
              )}
              {note.moderation_status === 'held_private' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rosewood-100 text-rosewood-800 text-[11px] font-medium">
                  <HeartHandshake className="w-2.5 h-2.5" />
                  <span>Held Private (Support)</span>
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this unsent letter forever?')) {
                  onDelete(note.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-ink-100 hover:text-rosewood-600 transition"
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title or Masked Title */}
          {note.is_locked && !isUnlocked ? (
            <div className="py-2">
              <div className="flex items-center gap-2 text-rosewood-700 font-serif font-medium text-base mb-2">
                <Lock className="w-4 h-4" />
                <span>Locked Letter</span>
              </div>
              <p className="font-mono text-xs text-parchment-400 select-none tracking-widest break-all">
                {maskText(90)}
              </p>
              <div className="mt-3 text-[11px] text-rosewood-600 font-medium flex items-center gap-1">
                <span>Click to enter passcode</span>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-serif font-medium text-lg text-ink-900 group-hover:text-sage-800 transition line-clamp-1 mb-2">
                {note.title || 'Untitled Letter'}
              </h4>
              <p className="font-serif text-xs text-ink-500 leading-relaxed line-clamp-3">
                {note.content}
              </p>
            </div>
          )}
        </div>

        {/* Date and Action footer */}
        <div className="pt-4 mt-3 border-t border-parchment-100 flex items-center justify-between text-[11px] text-ink-100">
          <span>{new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="flex items-center gap-1 text-sage-700 opacity-0 group-hover:opacity-100 transition font-medium">
            <Edit3 className="w-3 h-3" />
            <span>Open</span>
          </span>
        </div>
      </div>

      <PasscodeModal
        isOpen={isPasscodeModalOpen}
        passcodeHash={note.passcode_hash}
        onSuccess={handleUnlockSuccess}
        onClose={() => setIsPasscodeModalOpen(false)}
      />
    </>
  );
};
