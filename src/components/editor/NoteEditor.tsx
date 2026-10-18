import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Globe, EyeOff, Sparkles, Folder } from 'lucide-react';
import { Note, Shelf } from '../../types/database';
import { LockNoteToggle } from './LockNoteToggle';
import { ShareModal } from '../library/ShareModal';
import { HelplineModal } from '../safety/HelplineModal';

interface NoteEditorProps {
  note: Partial<Note> | null;
  shelves: Shelf[];
  onSave: (noteData: Partial<Note>) => Promise<void>;
  onClose: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  shelves,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [shelfId, setShelfId] = useState<string | null>(note?.shelf_id || null);
  const [isLocked, setIsLocked] = useState(note?.is_locked || false);
  const [passcodeHash, setPasscodeHash] = useState<string | null>(note?.passcode_hash || null);
  const [isPublic, setIsPublic] = useState(note?.is_public || false);
  const [allowResponses, setAllowResponses] = useState(note?.allow_responses ?? true);

  const [saving, setSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setShelfId(note.shelf_id || null);
      setIsLocked(note.is_locked || false);
      setPasscodeHash(note.passcode_hash || null);
      setIsPublic(note.is_public || false);
      setAllowResponses(note.allow_responses ?? true);
    }
  }, [note]);

  const handleManualSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onSave({
      id: note?.id,
      title: title.trim() || null,
      content,
      shelf_id: shelfId,
      is_locked: isLocked,
      passcode_hash: passcodeHash,
      is_public: isPublic,
      allow_responses: allowResponses,
      prompt_id: note?.prompt_id || null,
    });
    setSaving(false);
  };

  const handleShareConfirmed = async (allowResponsesVal: boolean) => {
    setIsPublic(true);
    setAllowResponses(allowResponsesVal);
    await onSave({
      id: note?.id,
      title: title.trim() || null,
      content,
      shelf_id: shelfId,
      is_locked: false, // public notes cannot be locked
      passcode_hash: null,
      is_public: true,
      allow_responses: allowResponsesVal,
      prompt_id: note?.prompt_id || null,
      published_at: new Date().toISOString(),
    });
  };

  const handleUnpublish = async () => {
    setIsPublic(false);
    await onSave({
      id: note?.id,
      title: title.trim() || null,
      content,
      shelf_id: shelfId,
      is_locked: isLocked,
      passcode_hash: passcodeHash,
      is_public: false,
      allow_responses: allowResponses,
    });
  };

  return (
    <div className="bg-white border border-parchment-300 rounded-2xl shadow-sm overflow-hidden animate-fade-in flex flex-col min-h-[620px]">
      {/* Editor Top Navigation Bar */}
      <div className="px-5 py-3 border-b border-parchment-200 flex items-center justify-between bg-parchment-50/80">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2.5">
          {/* Shelf Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-parchment-300 rounded-lg px-2.5 py-1">
            <Folder className="w-3.5 h-3.5 text-sage-700" />
            <select
              value={shelfId || ''}
              onChange={(e) => setShelfId(e.target.value || null)}
              className="text-xs bg-transparent text-ink-900 focus:outline-none cursor-pointer"
            >
              <option value="">No Shelf (Unsorted)</option>
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Passcode Lock Toggle */}
          {!isPublic && (
            <LockNoteToggle
              isLocked={isLocked}
              onLockChange={(locked, hash) => {
                setIsLocked(locked);
                setPasscodeHash(hash);
              }}
            />
          )}

          {/* Public Sharing / Unpublishing Toggle */}
          {isPublic ? (
            <button
              onClick={handleUnpublish}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-100 text-sage-800 hover:bg-sage-200 border border-sage-200 rounded-lg text-xs font-medium transition"
              title="Click to remove note from the public library"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Published (Make Private)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsShareModalOpen(true)}
              disabled={!content.trim() || isLocked}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 hover:bg-ink-800 text-white rounded-lg text-xs font-medium transition disabled:opacity-40"
              title={isLocked ? "Unlock note before sharing" : "Share this note to public feed"}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Share to Library</span>
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleManualSave}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sage-700 hover:bg-sage-800 text-white rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Editor Canvas Area */}
      <div className="flex-1 p-6 md:p-10 max-w-3xl mx-auto w-full flex flex-col">
        {note?.prompt_id && (
          <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-sage-50 text-sage-700 text-xs rounded-lg border border-sage-100 self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prompt: {note.prompt_id}</span>
          </div>
        )}

        <input
          type="text"
          placeholder="An unspoken title (optional)..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full font-serif text-2xl md:text-3xl font-medium text-ink-900 placeholder:text-parchment-400 focus:outline-none mb-6 bg-transparent"
        />

        <textarea
          placeholder="Pour out what you never said out loud..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full font-serif text-base md:text-lg text-ink-800 leading-relaxed placeholder:text-parchment-400 focus:outline-none resize-none bg-transparent"
        />
      </div>

      {/* Sharing and Safety Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        noteTitle={title}
        noteContent={content}
        onSuccess={handleShareConfirmed}
        onSelfHarmFlagged={() => setIsHelplineOpen(true)}
        onClose={() => setIsShareModalOpen(false)}
      />

      <HelplineModal
        isOpen={isHelplineOpen}
        onClose={() => setIsHelplineOpen(false)}
      />
    </div>
  );
};
