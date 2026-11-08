import React, { useState } from "react";
import { motion } from "framer-motion";
import { Feather, Wind } from "lucide-react";
import { Note } from "../../types/database";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { screenNoteContent } from "../../services/moderation";
import { useAuth } from "../../contexts/AuthContext";
import { useCancellableLoad } from "../../hooks/useCancellableLoad";
import { isLimitError } from "../../lib/payments";

const whisperAge = (iso: string): string => {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const WHISPER_TAG = "whisper";
const WHISPERS_KEY = "paper-vault:whispers";
const MAX_LEN = 140;

/** Whispers are one-line notes, pinned without a title or a seal. */
const loadWhispers = async (): Promise<Note[] | null> => {
  if (!isSupabaseConfigured) {
    try {
      return JSON.parse(localStorage.getItem(WHISPERS_KEY) || "[]");
    } catch {
      return [];
    }
  }
  const { data, error } = await supabase
    .from("notes")
    .select("id, content, created_at, tags, profiles:user_id(pen_name)")
    .eq("is_public", true)
    .eq("moderation_status", "clean")
    .contains("tags", [WHISPER_TAG])
    .order("created_at", { ascending: false })
    .limit(24);
  if (error || !data) return error ? null : [];
  return data as unknown as Note[];
};

/**
 * The Whisper Wall: one line, no letter, no sealing - the lowest-pressure
 * way to leave something in the library. Scraps of paper, pinned.
 */
export const WhisperWall: React.FC = () => {
  const { user, profile } = useAuth();
  const [whispers, setWhispers] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pinning, setPinning] = useState(false);

  const { loading, refetch } = useCancellableLoad(
    loadWhispers,
    [],
    (rows) => setWhispers(rows ?? []),
  );

  const pinWhisper = async () => {
    const text = draft.trim();
    if (!text || pinning) return;
    setPinning(true);
    setNotice(null);
    const line = text.slice(0, MAX_LEN);
    if (!isSupabaseConfigured) {
      const demoVerdict = await screenNoteContent(line);
      if (!demoVerdict.allowed) {
        setNotice("That whisper can't go on the wall. Try another line.");
        setPinning(false);
        return;
      }
      const local: Note = {
        id: `whisper-${Date.now()}`,
        user_id: user?.id || "guest",
        content: line,
        title: null,
        is_public: true,
        allow_responses: false,
        is_locked: false,
        moderation_status: "clean",
        tags: [WHISPER_TAG],
        created_at: new Date().toISOString(),
        profiles: profile
          ? { ...profile }
          : ({ pen_name: "A passerby" } as Note["profiles"]),
      } as Note;
      const next = [local, ...whispers].slice(0, 24);
      setWhispers(next);
      try {
        localStorage.setItem(WHISPERS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setDraft("");
      setPinning(false);
      return;
    }
    if (!user) {
      setNotice("Step inside first - then the wall is yours too.");
      setPinning(false);
      return;
    }
    const verdict = await screenNoteContent(line);
    if (!verdict.allowed) {
      setNotice(
        verdict.categories.self_harm
          ? "That one sounds heavy. It stays with you, not on the wall - free, confidential helplines are listed in the footer."
          : "That whisper can't go on the wall (contact details, links, harsh language, or content we can't publish). Try another line.",
      );
      setPinning(false);
      return;
    }
    const { data: pinned, error } = await supabase.from("notes").insert([
      {
        id: crypto.randomUUID(),
        user_id: user.id,
        content: line,
        title: null,
        is_public: true,
        allow_responses: false,
        moderation_status: "clean",
        tags: [WHISPER_TAG],
      },
    ]).select("id, is_public");
    if (!error && pinned && pinned.length > 0 && !pinned[0].is_public) {
      setNotice("That whisper was held back by the safety screen.");
      setPinning(false);
      return;
    }
    if (error) {
      setNotice(
        isLimitError(error)
          ? "Your shelves are full - a whisper still needs a corner somewhere."
          : "The pin didn't hold. Try once more.",
      );
    } else {
      setDraft("");
      refetch();
    }
    setPinning(false);
  };

  return (
    <section className="mt-14">
      <div className="text-center mb-6">
        <span className="label-caps">The Whisper Wall</span>
        <p className="mt-2 font-body text-xs italic text-muted">
          One line, no letter, no seal. Say it small and pin it up.
        </p>
      </div>

      <div className="mx-auto max-w-xl flex items-center gap-2 mb-8">
        <input
          type="text"
          value={draft}
          maxLength={MAX_LEN}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") pinWhisper();
          }}
          placeholder="whisper something..."
          aria-label="Whisper one line"
          className="flex-1 bg-card/70 border border-hairline rounded-full px-5 py-3 font-serif italic text-sm text-cream placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-gold transition"
        />
        <button
          type="button"
          onClick={pinWhisper}
          disabled={!draft.trim() || pinning}
          className="shrink-0 inline-flex items-center gap-2 rounded-full bg-gold hover:bg-gold-light disabled:opacity-40 px-5 py-3 font-serif text-sm font-semibold text-wood-950 shadow-candle transition cursor-pointer"
        >
          <Wind className="w-4 h-4" />
          <span>Pin it</span>
        </button>
      </div>
      {notice && (
        <p role="status" className="text-center font-body text-xs italic text-gold mb-6">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="text-center font-body text-xs italic text-muted py-6">
          <Feather className="inline w-3.5 h-3.5 mr-2 animate-pulse" />
          Listening for whispers...
        </p>
      ) : (
        <div className="whisper-board">
          {whispers.map((w, i) => (
            <motion.figure
              key={w.id}
              initial={{ opacity: 0, y: 10, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: (i % 2 === 0 ? -1 : 1) * (1 + (i % 3) * 0.4) }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              className="whisper-scrap"
            >
              <span className="whisper-pin" aria-hidden="true" />
              <blockquote className="whisper-line">{w.content}</blockquote>
              <figcaption className="whisper-by">
                {w.profiles?.pen_name || "a passerby"} · {whisperAge(w.created_at)}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      )}
    </section>
  );
};
