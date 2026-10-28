import React, { useState } from "react";
import {
  Lock,
  Feather,
  Sparkles,
  BookOpen,
  Heart,
  Globe,
  Folder,
  Trash2,
  Type,
} from "lucide-react";
import { Note, Shelf } from "../../types/database";
import { WaxSeal } from "./WaxSeal";
import { maskText } from "../../utils/crypto";
import promptsData from "../../data/prompts.json";

interface ParchmentLetterProps {
  note: Note;
  shelf?: Shelf;
  isUnlocked?: boolean;
  onOpen?: () => void;
  onDelete?: () => void;
  onRespond?: () => void;
  onReport?: () => void;
  mode?: "shelf" | "public" | "full";
  showActions?: boolean;
}

export const ParchmentLetter: React.FC<ParchmentLetterProps> = ({
  note,
  shelf,
  isUnlocked = !note.is_locked,
  onOpen,
  onDelete,
  onRespond,
  onReport,
  mode = "shelf",
  showActions = true,
}) => {
  const [handwritingFont, setHandwritingFont] = useState(false);
  const prompt = promptsData.find((p) => p.id === note.prompt_id);
  const authorPenName = note.profiles?.pen_name || "Anonymous Writer";

  const formattedDate = new Date(
    note.published_at || note.created_at,
  ).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // If the note is locked and not unlocked yet, render the Folded Wax-Sealed Envelope
  if (note.is_locked && !isUnlocked) {
    return (
      <div
        onClick={onOpen}
        className="group relative letter-frame cursor-pointer transition-all duration-300 hover:-translate-y-1"
      >
        {/* Envelope Body */}
        <div className="parchment-sheet letter-deckle p-6 relative flex flex-col items-center justify-center min-h-[220px] text-center">
          {/* Velvet ribbon along the spine edge */}
          <div className="letter-ribbon" />
          {/* Vintage stamps */}
          <div className="letter-stamps">
            <span className="letter-stamp" />
          </div>
          {/* Envelope Flap Crease Overlay */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-6 top-0 border-b border-dashed border-amber-800/25" />

          {/* Central Wax Seal with Lock */}
          <div className="relative mb-3 transform transition-transform group-hover:scale-110">
            <WaxSeal color="crimson" size="lg" icon="lock" />
          </div>

          <div className="space-y-1">
            <span className="font-serif text-xs font-bold tracking-widest uppercase text-wood-700">
              Sealed Letter
            </span>
            <h4 className="font-serif font-medium text-base text-wood-950 line-clamp-1 max-w-[240px]">
              {note.title || "Eyes-Only Unsent Note"}
            </h4>
            <p className="font-mono text-[10px] text-amber-900/50 select-none tracking-widest mt-1">
              {maskText(40)}
            </p>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-wood-900/80 hover:bg-wood-900 text-amber-200 border border-amber-600/40 rounded-full text-xs font-serif transition">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Break Seal with Passcode</span>
          </div>

          {/* Shelf or Date Badge */}
          {shelf && (
            <span className="absolute bottom-3 left-4 text-[10px] font-serif text-wood-600">
              Shelf: {shelf.name}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Open deckle-edged keepsake letter
  return (
    <div className="letter-frame h-full">
      <article
        onClick={mode === "shelf" ? onOpen : undefined}
        className={`group relative parchment-sheet letter-deckle transition-all duration-300 flex flex-col justify-between h-full ${
          mode === "shelf" ? "cursor-pointer hover:-translate-y-1" : ""
        }`}
      >
        {/* Velvet ribbon along the spine edge */}
        <div className="letter-ribbon" />
        {/* Vintage stamps */}
        <div className="letter-stamps">
          <span className="letter-stamp" />
          {mode !== "shelf" && <span className="letter-stamp stamp-green" />}
        </div>

        {/* Parchment Inner Content */}
        <div className="p-6 sm:p-8 pl-9 sm:pl-10 flex-1 flex flex-col justify-between">
          <div>
            {/* Header Bar with Seal and Ornate Title */}
            <div className="flex items-start justify-between gap-3 mb-4 border-b border-amber-900/20 pb-3">
              <div className="flex items-center gap-3">
                <WaxSeal
                  color={note.is_public ? "gold" : "crimson"}
                  size="md"
                  icon={note.is_public ? "crest" : "quill"}
                />
                <div>
                  <span className="font-serif text-[10px] tracking-widest uppercase text-wood-600 block">
                    The Paper Vault
                  </span>
                  <span className="font-script text-lg text-wood-900 leading-none">
                    {authorPenName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-serif text-[11px] text-wood-700/80 tracking-wide">
                  {formattedDate}
                </span>

                {/* Handwriting font toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHandwritingFont(!handwritingFont);
                  }}
                  className="p-1 text-wood-600 hover:text-wood-950 rounded transition"
                  title={
                    handwritingFont
                      ? "Switch to Quill Handwriting"
                      : "Switch to Book Serif"
                  }
                >
                  <Type className="w-3.5 h-3.5" />
                </button>

                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          "Burn and delete this unsent letter forever?",
                        )
                      ) {
                        onDelete();
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-wood-500 hover:text-red-700 transition"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Badges / Shelf / Prompt Info */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {shelf && (
                <span className="inline-flex items-center gap-1 text-[11px] font-serif font-medium text-wood-800 bg-amber-900/10 px-2.5 py-0.5 rounded-full border border-amber-900/20">
                  <Folder className="w-3 h-3 text-wood-700" />
                  <span>{shelf.name}</span>
                </span>
              )}

              {note.is_public && (
                <span className="inline-flex items-center gap-1 text-[11px] font-serif font-medium text-emerald-900 bg-emerald-700/10 px-2.5 py-0.5 rounded-full border border-emerald-800/20">
                  <Globe className="w-3 h-3 text-emerald-700" />
                  <span>In Public Library</span>
                </span>
              )}

              {prompt && (
                <span className="inline-flex items-center gap-1 text-[11px] font-serif italic text-amber-950/80 bg-amber-800/10 px-2.5 py-0.5 rounded-full">
                  <BookOpen className="w-3 h-3 text-amber-800" />
                  <span>Prompt: {prompt.title}</span>
                </span>
              )}
            </div>

            {/* Letter Title */}
            {note.title && (
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-wood-950 mb-3 tracking-tight leading-snug">
                {note.title}
              </h3>
            )}

            {/* Letter Body Text - handwritten cursive by default */}
            <div
              className={`text-wood-900 whitespace-pre-wrap select-text ${
                handwritingFont
                  ? "font-serif text-lg md:text-xl font-medium leading-relaxed"
                  : "font-hand text-2xl md:text-[1.75rem] font-normal leading-[1.8]"
              } ${mode === "shelf" && note.content.length > 420 ? "line-clamp-[7]" : ""}`}
            >
              {note.content}
            </div>
            {mode === "shelf" && note.content.length > 420 && (
              <p className="font-body text-xs italic text-wood-700 mt-2">
                ...open the letter to keep reading
              </p>
            )}
          </div>

          {/* Bottom Flourish & Signature */}
          <div className="pt-6 mt-6 border-t border-amber-900/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-wood-700 font-serif text-[11px]">
              <Feather className="w-3.5 h-3.5 text-amber-800" />
              <span className="italic">
                ~ Penned in solitude by {authorPenName} ~
              </span>
            </div>

            {/* Action buttons if public or full */}
            {showActions && (
              <div className="flex items-center gap-2">
                {note.allow_responses && onRespond && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRespond();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-wood-900 hover:bg-wood-800 text-amber-100 rounded-full font-serif text-xs font-semibold shadow-xs border border-amber-600/30 transition cursor-pointer"
                  >
                    <Heart className="w-3 h-3 text-red-400" />
                    <span>Send Response Letter</span>
                  </button>
                )}

                {onReport && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReport();
                    }}
                    className="p-1.5 text-wood-500 hover:text-red-700 transition"
                    title="Report inappropriate content"
                  >
                    <Sparkles className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pressed botanical accent */}
        {mode !== "shelf" && <div className="letter-botanical" />}
      </article>
    </div>
  );
};
