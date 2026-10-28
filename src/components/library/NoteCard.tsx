import React, { useState } from 'react';
import { Note, Shelf } from '../../types/database';
import { PasscodeModal } from './PasscodeModal';
import { ParchmentLetter } from './ParchmentLetter';

interface NoteCardProps {
  note: Note;
  shelves: Shelf[];
  /** Whether this locked note was unlocked earlier in this session (owned by the page). */
  unlocked: boolean;
  onUnlock: (noteId: string) => void;
  onOpen: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  shelves,
  unlocked,
  onUnlock,
  onOpen,
  onDelete,
}) => {
  const isUnlocked = !note.is_locked || unlocked;
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
    onUnlock(note.id);
    setIsPasscodeModalOpen(false);
    onOpen(note);
  };

  // Deterministic little tilt + stagger per letter so each one settles onto
  // the desk slightly differently, without re-randomising on re-render.
  const seed = Array.from(note.id).reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
  const tilt = ((seed % 9) - 4) * 0.35;
  const landStyle = {
    ['--land-rot' as string]: `${tilt}deg`,
    ['--land-from' as string]: `${tilt - 3}deg`,
    ['--land-delay' as string]: `${(seed % 5) * 0.08}s`,
  } as React.CSSProperties;

  return (
    <>
      <div className="letter-stack letter-land" style={landStyle}>
      <ParchmentLetter
        note={note}
        shelf={shelf}
        isUnlocked={isUnlocked}
        onOpen={handleCardClick}
        onDelete={() => onDelete(note.id)}
        mode="shelf"
        showActions={false}
      />
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
