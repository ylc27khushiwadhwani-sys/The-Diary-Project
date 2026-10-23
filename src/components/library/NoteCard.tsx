import React, { useState } from 'react';
import { Note, Shelf } from '../../types/database';
import { PasscodeModal } from './PasscodeModal';
import { ParchmentLetter } from './ParchmentLetter';

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
