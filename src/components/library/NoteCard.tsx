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

  return (
    <>
      <ParchmentLetter
        note={note}
        shelf={shelf}
        isUnlocked={isUnlocked}
        onOpen={handleCardClick}
        onDelete={() => onDelete(note.id)}
        mode="shelf"
        showActions={false}
      />

      <PasscodeModal
        isOpen={isPasscodeModalOpen}
        passcodeHash={note.passcode_hash}
        onSuccess={handleUnlockSuccess}
        onClose={() => setIsPasscodeModalOpen(false)}
      />
    </>
  );
};
