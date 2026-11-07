import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Globe,
  EyeOff,
  Folder,
} from "lucide-react";
import { Note, Shelf } from "../../types/database";
import { LockNoteToggle } from "./LockNoteToggle";
import { ShareModal } from "../library/ShareModal";
import { screenNoteContent } from "../../services/moderation";
import { HelplineModal } from "../safety/HelplineModal";
import { OpenBookCard } from "../bookshelf/OpenBookCard";
import { getLetterStyle, withLetterStyle, LETTER_FONTS } from "../../utils/letterStyle";
import {
  getUnsealDate,
  visibleTags,
  withUnsealTag,
  daysUntilUnseal,
  formatUnsealDate,
} from "../../utils/unseal";

interface NoteEditorProps {
  note: Partial<Note> | null;
  shelves: Shelf[];
  onSave: (noteData: Partial<Note>) => Promise<void>;
  onClose: () => void;
  /** Future-self ritual: date seal required, private always, tagged. */
  futureSelf?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  shelves,
  onSave,
  onClose,
  futureSelf = false,
}) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [shelfId, setShelfId] = useState<string | null>(note?.shelf_id || null);
  const [isLocked, setIsLocked] = useState(note?.is_locked || false);
  const [passcodeHash, setPasscodeHash] = useState<string | null>(
    note?.passcode_hash || null,
  );
  const [isPublic, setIsPublic] = useState(note?.is_public || false);
  const [allowResponses, setAllowResponses] = useState(
    note?.allow_responses ?? true,
  );
  const [letterStyle, setLetterStyle] = useState(() => getLetterStyle(note?.tags));
  const [composeTab, setComposeTab] = useState<"write" | "preview">("write");
  const [tags, setTags] = useState<string[]>(
    visibleTags(note?.tags).map((tag) => tag.toLowerCase()),
  );
  const [tagDraft, setTagDraft] = useState("");
  const [todayIso] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [unsealOn, setUnsealOn] = useState<string>(() => {
    const existing = getUnsealDate(note?.tags);
    if (existing) return existing;
    if (!futureSelf) return "";
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [saving, setSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);
  const [screenNotice, setScreenNotice] = useState<string | null>(null);

  // Tag chips: comma or Enter commits the draft, Backspace on an empty input
  // pops the last chip. Storage is normalized lowercase so dedup and matching
  // are case-insensitive; re-adding an existing tag is a no-op.
  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  };

  const handleTagInput = (value: string) => {
    if (!value.includes(",")) {
      setTagDraft(value);
      return;
    }
    const segments = value.split(",");
    segments.slice(0, -1).forEach((segment) => addTag(segment));
    setTagDraft(segments[segments.length - 1]);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagDraft);
      setTagDraft("");
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleManualSave = async () => {
    if (!content.trim()) return;
    if (futureSelf && !unsealOn) return;
    setSaving(true);
    setScreenNotice(null);
    // Anything that would be public is screened first - Save is not a way
    // around the release check.
    if (isPublic && !futureSelf) {
      const verdict = await screenNoteContent(content, `${title} ${letterStyle.from}`);
      if (!verdict.allowed) {
        setSaving(false);
        setIsPublic(false);
        if (verdict.categories.self_harm) {
          setIsHelplineOpen(true);
          setScreenNotice(
            "This letter was not made public. It reads as though you may be hurting - free, confidential helplines are available. You can still keep it private: press Save again.",
          );
        } else if (verdict.categories.pii) {
          setScreenNotice(
            "This letter was not made public because it contains contact details or links. Remove them to share it, or press Save again to keep it private.",
          );
        } else {
          setScreenNotice(
            "This letter was not made public because it contains abusive or threatening language. Edit it to share it, or press Save again to keep it private.",
          );
        }
        return;
      }
    }
    const sealedTags = withUnsealTag(withLetterStyle(tags, letterStyle), unsealOn || null);
    await onSave({
      id: note?.id,
      title: title.trim() || null,
      content,
      shelf_id: shelfId,
      is_locked: isLocked,
      passcode_hash: passcodeHash,
      is_public: futureSelf ? false : isPublic,
      allow_responses: futureSelf ? false : allowResponses,
      prompt_id: note?.prompt_id || null,
      tags: futureSelf
        ? [...sealedTags.filter((t) => t !== "futureself"), "futureself"]
        : sealedTags,
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
      tags: withUnsealTag(withLetterStyle(tags, letterStyle), unsealOn || null),
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
      tags: withUnsealTag(withLetterStyle(tags, letterStyle), unsealOn || null),
    });
  };

  const letterPreview = (<aside className="gc-preview" aria-label="Live letter preview" aria-live="off"><OpenBookCard note={{...note, id: note?.id || "preview", title, content: content || "Your words will appear here...", tags: withLetterStyle(tags, letterStyle)} as Note} onOpen={() => {}} /><p>Preview of your book. Updates as you write. Your full letter is kept intact.</p>
        <article className="gc-full-preview" aria-label="Full letter preview" style={{fontFamily: LETTER_FONTS[letterStyle.font].family}}>
          <h2>To: {title || "whoever needs this"}</h2>
          <p>{content || "Your words will appear here..."}</p>
          <footer>- {letterStyle.from || "anonymous"}</footer>
        </article>
      </aside>);

  return (
    <div className="garden-composer animate-fade-in">
      <button type="button" onClick={onClose} className="gc-back">← Back to your Study</button>
      <div className="gc-tabs" role="tablist" aria-label="Letter view">
        <button type="button" role="tab" aria-selected={composeTab === "write"} onClick={() => setComposeTab("write")}>✎ Write</button>
        <button type="button" role="tab" aria-selected={composeTab === "preview"} onClick={() => setComposeTab("preview")}>◉ Preview</button>
      </div>
      <div className={`gc-compose-layout ${composeTab === "write" ? "is-writing" : "is-previewing"}`}>
        {letterPreview}
      {composeTab === "write" ? <div className="gc-fields">
        <label htmlFor="letter-to">To</label>
        <p>Who is this letter for?</p>
        <input id="letter-to" value={title} onChange={e => setTitle(e.target.value)} placeholder={futureSelf ? "To the me who opens this..." : "A title for what remained unspoken..."} />
        <label htmlFor="letter-from">From</label>
        <p>Leave blank to sign anonymously. A pen name is welcome.</p>
        <input id="letter-from" value={letterStyle.from} onChange={e => setLetterStyle({...letterStyle, from: e.target.value})} maxLength={80} placeholder="Your pen name (optional)" />
        <label htmlFor="letter-message">Your message</label>
        <p>What do you want to say?</p>
        <textarea id="letter-message" value={content} onChange={e => setContent(e.target.value)} placeholder="Write what you have carried in silence. No judgment reaches this shelf..." style={{fontFamily: LETTER_FONTS[letterStyle.font].family}} />
        <div className="gc-count">{content.length} characters</div>
        <fieldset><legend>Handwriting</legend><p>The handwriting on your letter.</p>
          <div className="gc-fonts">{LETTER_FONTS.map((font, index) => <button type="button" key={font.name} aria-label={font.name} aria-pressed={letterStyle.font === index} onClick={() => setLetterStyle({...letterStyle, font: index})} style={{fontFamily: font.family}}>A little of what my heart carries...</button>)}</div>
        </fieldset>
      </div> : null}
      </div>
      <details className="gc-options"><summary>Shelf, privacy and sharing options</summary>
      {/* Desk Action Topbar */}
      <div className="bg-wood-900/90 border border-amber-900/40 rounded-t-2xl p-4 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md shadow-2xl">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-serif text-amber-200/80 hover:text-amber-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Return to Shelves</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Shelf Selector */}
          <div className="flex items-center gap-1.5 bg-wood-950/80 border border-amber-800/40 rounded-lg px-3 py-1.5 shadow-wood-inset">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={shelfId || ""}
              onChange={(e) => setShelfId(e.target.value || null)}
              className="text-xs bg-transparent text-amber-100 font-serif focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-wood-900 text-amber-100">
                Unsorted Shelf
              </option>
              {shelves.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  className="bg-wood-900 text-amber-100"
                >
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

          {/* Date seal: the letter waits until a day you choose */}
          <div className="date-seal-box" data-testid="date-seal">
            <label
              className="flex items-center gap-2 text-xs font-serif font-semibold text-amber-200/90"
              htmlFor="unseal-date"
            >
              <span aria-hidden="true">&#128367;</span>
              <span>
                {futureSelf
                  ? "Choose the morning your future self opens it"
                  : "Let this letter wait until a date"}
              </span>
            </label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                id="unseal-date"
                type="date"
                min={todayIso}
                value={unsealOn}
                onChange={(e) => setUnsealOn(e.target.value)}
                className="px-2 py-1 rounded-md bg-wood-950/80 border border-amber-800/40 text-xs text-amber-100 font-mono"
              />
              {unsealOn && (
                <button
                  type="button"
                  onClick={() => setUnsealOn("")}
                  className="text-[11px] font-serif text-amber-300/80 underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] font-body italic leading-snug text-muted max-w-xs">
              {unsealOn
                ? `It stays sealed on the shelf, with a countdown, and opens for everyone on ${formatUnsealDate(unsealOn)} (${daysUntilUnseal(unsealOn)} days from now).`
                : "Pick a birthday, an anniversary or a someday. Until that morning the letter shows only a sealed envelope and a countdown. After it, anyone can read it. It hides the letter on this site; it is not encryption."}
            </p>
          </div>

          {/* Public Sharing Toggle (future-self letters never go public) */}
          {futureSelf ? null : isPublic ? (
            <button
              onClick={handleUnpublish}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/40 text-amber-300 hover:bg-amber-900/60 border border-amber-700/50 rounded-lg text-xs font-serif transition cursor-pointer"
              title="Remove letter from the public library"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Published (Make Private)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsShareModalOpen(true)}
              disabled={!content.trim() || isLocked}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-wood-800 hover:bg-wood-700 text-amber-200 border border-amber-600/40 rounded-lg text-xs font-serif transition disabled:opacity-40 cursor-pointer"
              title={
                isLocked
                  ? "Unlock before sharing"
                  : "Publish to the Grand Library archive"
              }
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Release to Grand Library</span>
            </button>
          )}

          {/* Save & Seal Button */}
          <button
            onClick={handleManualSave}
            disabled={saving || !content.trim() || (futureSelf && !unsealOn)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-lg text-xs font-serif font-bold shadow-candle border border-red-500/30 transition disabled:opacity-40 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {saving
                ? "Sealing..."
                : futureSelf
                  ? "Seal for the Future"
                  : "Seal & Store"}
            </span>
          </button>
        </div>
      </div>

      </details>
      <div className="gc-tags">
        {tags.map(tag => <button key={tag} type="button" aria-label={`Remove tag ${tag}`} onClick={() => setTags(prev => prev.filter(t => t !== tag))}><span>{tag}</span> ×</button>)}
        <input aria-label="Add tags" placeholder="Add tags, comma or Enter to seal..." value={tagDraft} onChange={e => handleTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
      </div>
      {screenNotice && <p role="alert" className="gc-notice">{screenNotice}</p>}
      <p className="gc-disclosure">Public letters are checked by automated rules, not human review. Private letters stay private unless you choose to share them.</p>
      <div className="gc-save"><button type="button" disabled={saving || !content.trim() || (futureSelf && !unsealOn)} onClick={handleManualSave}>{saving ? "Saving..." : futureSelf ? "Seal for the Future" : isPublic ? "Save changes" : "Save letter privately"}</button>
      {!futureSelf && !isPublic && <button type="button" disabled={!content.trim() || isLocked} onClick={() => setIsShareModalOpen(true)}>Share to the Grand Library</button>}</div>

      {/* Sharing and Safety Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        noteTitle={`${title} ${letterStyle.from}`}
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
