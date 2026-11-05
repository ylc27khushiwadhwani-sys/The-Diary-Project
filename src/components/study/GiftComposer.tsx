import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Eye, EyeOff, Share2, X } from "lucide-react";
import { Note } from "../../types/database";
import { useAuth } from "../../contexts/AuthContext";
import {
  giftUrl,
  GiftKind,
  GiftObject,
  GiftRecord,
  loadGiftRecords,
  saveGiftRecord,
} from "../../lib/giftLink";
import {
  GIFT_FLOWERS,
  GIFT_KEEPSAKES,
  giftItemFor,
} from "../../lib/giftCatalog";
import { GiftArt } from "../gifts/GiftArt";
import { WaxSeal } from "../library/WaxSeal";

interface GiftComposerProps {
  isOpen: boolean;
  notes: Note[];
  onClose: () => void;
}

const KINDS: { id: GiftKind; label: string; line: string }[] = [
  { id: "letter", label: "A sealed letter", line: "an envelope that opens once, for them" },
  { id: "postcard", label: "A postcard", line: "shorter, lighter, still only theirs" },
  { id: "gift", label: "A small gift", line: "the letter arrives with something folded in" },
];

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

/**
 * Dedicate one of your letters to one specific person. The sender sees
 * the whole journey before sharing - the sealed thing, the opening,
 * the letter with its gift - so they know exactly what will land.
 */
export const GiftComposer: React.FC<GiftComposerProps> = ({
  isOpen,
  notes,
  onClose,
}) => {
  const { profile } = useAuth();
  const [noteId, setNoteId] = useState<string | null>(null);
  const [kind, setKind] = useState<GiftKind>("letter");
  const [object, setObject] = useState<GiftObject>("rose");
  const [peek, setPeek] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<GiftRecord[]>(() => loadGiftRecords());

  const candidates = useMemo(
    () => notes.filter((n) => !n.is_locked).slice(0, 30),
    [notes],
  );
  const chosen = candidates.find((n) => n.id === noteId) ?? null;
  const item = giftItemFor(object);

  if (!isOpen) return null;

  const link = chosen
    ? giftUrl({
        t: chosen.title || null,
        c:
          kind === "postcard" && chosen.content.length > 600
            ? chosen.content.slice(0, 600).trimEnd() + "..."
            : chosen.content,
        f: profile?.pen_name || "Someone who couldn't say it",
        k: kind,
        g: kind === "gift" ? object : undefined,
      })
    : null;

  const remember = (url: string) => {
    if (!chosen) return;
    setHistory(
      saveGiftRecord({
        t: chosen.title || null,
        k: kind,
        g: kind === "gift" ? object : undefined,
        f: profile?.pen_name || "Someone who couldn't say it",
        at: new Date().toISOString(),
        url,
      }),
    );
  };

  const copyLink = async (url: string | null) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    remember(url);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const whatsappUrl = link
    ? `https://wa.me/?text=${encodeURIComponent(
        `I left something for you in a vault of unsent letters. It's sealed - it only opens for you: ${link}`,
      )}`
    : null;

  const excerpt = chosen
    ? chosen.content.length > 140
      ? chosen.content.slice(0, 140).trimEnd() + "..."
      : chosen.content
    : "";

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-hairline bg-wood-950/95 p-5 sm:p-6 shadow-candle"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Send a letter to one person"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-serif text-2xl text-[#fbf3e2]">
              For one person only
            </h2>
            <p className="font-body text-xs italic text-[#9e9488] mt-1">
              The letter travels inside the link. Whoever holds it, reads it.
              Nobody else - not even the library.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-[#9e9488] hover:text-amber-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <span className="label-caps block mb-2">1. Choose the letter</span>
        <div className="max-h-32 overflow-y-auto space-y-1.5 mb-5 pr-1">
          {candidates.length === 0 && (
            <p className="font-body text-xs italic text-[#9e9488] py-3">
              Write a letter first - then you can dedicate it.
            </p>
          )}
          {candidates.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNoteId(n.id)}
              aria-pressed={noteId === n.id}
              className={`w-full text-left rounded-lg border px-3.5 py-2.5 font-serif text-sm transition cursor-pointer ${
                noteId === n.id
                  ? "border-gold bg-card text-gold-light"
                  : "border-hairline bg-card/50 text-[#e8dab2] hover:border-gold/40"
              }`}
            >
              "{n.title || "Untitled Letter"}"
            </button>
          ))}
        </div>

        <span className="label-caps block mb-2">2. Choose how it arrives</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              aria-pressed={kind === k.id}
              className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                kind === k.id
                  ? "border-gold bg-card"
                  : "border-hairline bg-card/50 hover:border-gold/40"
              }`}
            >
              <span className="block font-serif text-sm text-[#f3ece0]">
                {k.label}
              </span>
              <span className="block font-body text-[10px] italic text-[#9e9488] mt-0.5">
                {k.line}
              </span>
            </button>
          ))}
        </div>

        {kind === "gift" && (
          <div className="mb-5">
            <span className="label-caps block mb-2">
              3. Fold something in - a flower
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {GIFT_FLOWERS.map((flower) => (
                <button
                  key={flower.id}
                  type="button"
                  onClick={() => setObject(flower.id)}
                  aria-pressed={object === flower.id}
                  title={flower.line}
                  className={`rounded-xl border p-2 flex flex-col items-center gap-1 transition cursor-pointer ${
                    object === flower.id
                      ? "border-gold bg-card shadow-candle"
                      : "border-hairline bg-card/50 hover:border-gold/40"
                  }`}
                >
                  <GiftArt id={flower.id} size={44} />
                  <span className="font-serif text-[11px] text-[#e8dab2] leading-tight text-center">
                    {flower.label}
                  </span>
                </button>
              ))}
            </div>
            <span className="label-caps block mb-2">or a keepsake</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {GIFT_KEEPSAKES.map((keepsake) => (
                <button
                  key={keepsake.id}
                  type="button"
                  onClick={() => setObject(keepsake.id)}
                  aria-pressed={object === keepsake.id}
                  title={keepsake.line}
                  className={`rounded-xl border p-2 flex flex-col items-center gap-1 transition cursor-pointer ${
                    object === keepsake.id
                      ? "border-gold bg-card shadow-candle"
                      : "border-hairline bg-card/50 hover:border-gold/40"
                  }`}
                >
                  <GiftArt id={keepsake.id} size={44} />
                  <span className="font-serif text-[11px] text-[#e8dab2] leading-tight text-center">
                    {keepsake.label}
                  </span>
                </button>
              ))}
            </div>
            {item && (
              <p className="font-body text-[11px] italic text-[#9e9488] mt-2 text-center">
                {item.label} - {item.line}
              </p>
            )}
          </div>
        )}

        {/* The whole journey, shown to the sender before it is shared */}
        <div className="rounded-xl border border-hairline bg-black/30 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="label-caps">What they'll receive</span>
            <button
              type="button"
              onClick={() => setPeek((v) => !v)}
              aria-pressed={peek}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 font-serif text-[11px] text-amber-200 hover:border-gold/40 transition cursor-pointer"
            >
              {peek ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {peek ? "Back to sealed" : "Peek at the opening"}
            </button>
          </div>
          <div className="gift-preview-stage">
            <AnimatePresence mode="wait">
              {!peek ? (
                <motion.div
                  key="sealed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  {kind === "postcard" ? (
                    <span className="gift-postcard-back gift-preview-card">
                      <span className="gift-postcard-lines" />
                      <WaxSeal color="crimson" size="md" icon="quill" />
                    </span>
                  ) : (
                    <span className="gift-envelope gift-preview-card">
                      <span className="lotd-flap" />
                      <span className="lotd-seal">
                        <WaxSeal color="crimson" size="md" icon="quill" />
                      </span>
                    </span>
                  )}
                  <span className="mt-3 font-body text-[11px] italic text-[#9e9488]">
                    It arrives sealed. They break the wax to read.
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="gift-letter gift-preview-letter"
                >
                  {kind === "gift" && item && (
                    <div className="gift-preview-object">
                      <GiftArt id={object} size={40} />
                      <span>with {item.label.toLowerCase()}</span>
                    </div>
                  )}
                  <p className="gift-preview-title">
                    "{chosen?.title || "Untitled Letter"}"
                  </p>
                  <p className="gift-preview-body">
                    {excerpt || "Your words land here, in your hand."}
                  </p>
                  <p className="gift-preview-from">
                    - {profile?.pen_name || "Your pen name"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Share */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <button
            type="button"
            onClick={() => copyLink(link)}
            disabled={!link}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gold hover:bg-gold-light disabled:opacity-40 px-6 py-3 font-serif text-sm font-semibold text-wood-950 shadow-candle transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "The link is yours - send it well" : "Copy the one-time link"}</span>
          </button>
          <a
            href={whatsappUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!whatsappUrl}
            onClick={() => link && remember(link)}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-gold/50 px-6 py-3 font-serif text-sm text-gold-light transition ${
              whatsappUrl
                ? "hover:bg-card cursor-pointer"
                : "opacity-40 pointer-events-none"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </a>
        </div>

        {history.length > 0 && (
          <div>
            <span className="label-caps block mb-2">Gifts you've sent</span>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {history.map((record, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg border border-hairline bg-card/40 px-3 py-2"
                >
                  {record.g && <GiftArt id={record.g} size={22} />}
                  <span className="flex-1 min-w-0 font-serif text-xs text-[#e8dab2] truncate">
                    "{record.t || "Untitled Letter"}"
                  </span>
                  <span className="font-body text-[10px] italic text-[#9e9488] shrink-0">
                    {record.k === "gift"
                      ? (giftItemFor(record.g ?? "")?.label ?? "gift")
                      : record.k}{" "}
                    · {formatWhen(record.at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyLink(record.url)}
                    aria-label="Copy this gift link again"
                    className="p-1 text-[#9e9488] hover:text-gold transition cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
