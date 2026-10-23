import React, { useState } from 'react';
import { ArrowLeft, Save, Globe, EyeOff, Sparkles, Folder, Type, Feather } from 'lucide-react';
import { Note, Shelf } from '../../types/database';
import { LockNoteToggle } from './LockNoteToggle';
import { ShareModal } from '../library/ShareModal';
import { HelplineModal } from '../safety/HelplineModal';
import { WaxSeal } from '../library/WaxSeal';

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
  const [handwritingFont, setHandwritingFont] = useState(false);

  const [saving, setSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);

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
      is_locked: false,
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
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 animate-fade-in">
      {/* Desk Action Topbar */}
      <div className="bg-wood-900/90 border border-amber-900/40 rounded-t-2xl p-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md shadow-2xl">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-cinzel text-amber-200/80 hover:text-amber-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Return to Shelves</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Shelf Selector */}
          <div className="flex items-center gap-1.5 bg-wood-950/80 border border-amber-800/40 rounded-lg px-3 py-1.5 shadow-wood-inset">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={shelfId || ''}
              onChange={(e) => setShelfId(e.target.value || null)}
              className="text-xs bg-transparent text-amber-100 font-cinzel focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-wood-900 text-amber-100">Unsorted Shelf</option>
              {shelves.map((s) => (
                <option key={s.id} value={s.id} className="bg-wood-900 text-amber-100">
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

          {/* Public Sharing Toggle */}
          {isPublic ? (
            <button
              onClick={handleUnpublish}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/40 text-amber-300 hover:bg-amber-900/60 border border-amber-700/50 rounded-lg text-xs font-cinzel transition cursor-pointer"
              title="Remove letter from the public library"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Published (Make Private)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsShareModalOpen(true)}
              disabled={!content.trim() || isLocked}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-wood-800 hover:bg-wood-700 text-amber-200 border border-amber-600/40 rounded-lg text-xs font-cinzel transition disabled:opacity-40 cursor-pointer"
              title={isLocked ? "Unlock before sharing" : "Publish to the Grand Library archive"}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Release to Grand Library</span>
            </button>
          )}

          {/* Font Toggle */}
          <button
            type="button"
            onClick={() => setHandwritingFont(!handwritingFont)}
            className="p-1.5 bg-wood-950/80 border border-amber-800/40 text-amber-300 hover:text-amber-100 rounded-lg text-xs transition cursor-pointer"
            title={handwritingFont ? "Switch to Book Print" : "Switch to Quill Cursive"}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Save & Seal Button */}
          <button
            onClick={handleManualSave}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-lg text-xs font-cinzel font-bold shadow-candle border border-red-500/30 transition disabled:opacity-40 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Sealing...' : 'Seal & Store'}</span>
          </button>
        </div>
      </div>

      {/* The Scroll Parchment Writing Canvas */}
      <div className="parchment-sheet rounded-b-2xl shadow-2xl p-6 sm:p-10 md:p-12 relative overflow-hidden min-h-[580px] flex flex-col justify-between">
        {/* Top Scroll Roll */}
        <div className="scroll-roll-top -mx-2 -mt-4 mb-6" />

        <div className="flex-1 flex flex-col">
          {/* Letterhead Header with Wax Seal */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-amber-900/25">
            <div className="flex items-center gap-3">
              <WaxSeal color={isLocked ? 'crimson' : isPublic ? 'gold' : 'crimson'} size="md" icon={isLocked ? 'lock' : 'quill'} />
              <div>
                <span className="font-cinzel text-[11px] tracking-widest uppercase text-wood-700 block font-bold">
                  The Library of Unsent Things
                </span>
                <span className="font-cormorant text-xs italic text-wood-900">
                  {isLocked ? "Eyes-Only Confidential Letter" : isPublic ? "Archived for the Sanctuary" : "Private Library Parchment"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-wood-700 text-xs font-cinzel">
              <Feather className="w-4 h-4 text-amber-900" />
              <span>Quill in Hand</span>
            </div>
          </div>

          {note?.prompt_id && (
            <div className="flex items-center gap-1.5 mb-5 px-3 py-1 bg-amber-900/10 text-wood-900 font-cinzel text-xs rounded-full border border-amber-900/20 self-start">
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
              <span>Prompt: {note.prompt_id}</span>
            </div>
          )}

          {/* Title Input */}
          <input
            type="text"
            placeholder="A title for what remained unspoken..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-cinzel text-2xl md:text-3xl font-bold text-wood-950 placeholder:text-wood-600/50 focus:outline-none mb-6 bg-transparent border-b border-amber-900/20 pb-2"
          />

          {/* Content TextArea */}
          <textarea
            placeholder="Write what you have carried in silence. No judgment reaches this shelf..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`flex-1 w-full text-wood-950 placeholder:text-wood-600/50 focus:outline-none resize-none bg-transparent ${
              handwritingFont
                ? 'font-script text-2xl md:text-3xl leading-loose font-normal'
                : 'font-cormorant text-xl md:text-2xl leading-relaxed font-medium'
            }`}
          />
        </div>

        {/* Bottom Scroll Roll */}
        <div className="scroll-roll-bottom -mx-2 -mb-4 mt-8" />
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
