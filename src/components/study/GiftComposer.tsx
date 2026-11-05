import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Flower2, Flame, Star, X } from "lucide-react";
import { Note } from "../../types/database";
import { useAuth } from "../../contexts/AuthContext";
import {
  giftUrl,
  GiftKind,
  GiftObject,
} from "../../lib/giftLink";

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

const OBJECTS: { id: GiftObject; label: string; Icon: typeof Flower2 }[] = [
  { id: "flower", label: "Pressed flower", Icon: Flower2 },
  { id: "candle", label: "Candle", Icon: Flame },
  { id: "star", label: "Paper star", Icon: Star },
];

/**
 * Dedicate one of your letters to one specific person. The letter travels
 * inside the link itself - one link, one pair of eyes, nothing stored.
 */
export const GiftComposer: React.FC<GiftComposerProps> = ({
  isOpen,
  notes,
  onClose,
}) => {
  const { profile } = useAuth();
  const [noteId, setNoteId] = useState<string | null>(null);
  const [kind, setKind] = useState<GiftKind>("letter");
  const [object, setObject] = useState<GiftObject>("flower");
  const [copied, setCopied] = useState(false);

  const candidates = useMemo(
    () => notes.filter((n) => !n.is_locked).slice(0, 30),
    [notes],
  );
  const chosen = candidates.find((n) => n.id === noteId) ?? null;

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

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const area = document.createElement("textarea");
      area.value = link;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-hairline bg-wood-950/95 p-6 shadow-candle"
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
        <div className="max-h-40 overflow-y-auto space-y-1.5 mb-5 pr-1">
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
          <div className="flex items-center gap-2 mb-5">
            {OBJECTS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setObject(id)}
                aria-pressed={object === id}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-serif text-xs transition cursor-pointer ${
                  object === id
                    ? "border-gold text-gold-light bg-card"
                    : "border-hairline text-[#cbbfa8] hover:border-gold/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={copyLink}
          disabled={!link}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold hover:bg-gold-light disabled:opacity-40 px-6 py-3 font-serif text-sm font-semibold text-wood-950 shadow-candle transition cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "The link is yours - send it well" : "Copy the one-time link"}</span>
        </button>
      </motion.div>
    </div>
  );
};
