import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { INITIAL_PUBLIC_NOTES } from "../data/seedNotes";
import { CoffeeButton } from "../components/payments/CoffeeButton";
import { CandleLanternIcon } from "../components/common/CandleLanternIcon";
import { InkText } from "../components/cinematic/InkText";
import { RoomMemory } from "../components/cinematic/RoomMemory";
import { Librarian } from "../components/library/Librarian";
import { QuillFlight } from "../components/landing/QuillFlight";
import { landingIntro } from "../lib/librarian";

interface LandingPageProps {
  onAuth: (mode: "signin" | "signup") => void;
  onGuest: () => void;
}

interface RecentTitle {
  id: string;
  title: string;
  penName: string;
}

/** Titles only - proof the shelves are alive, without opening anyone's letter. */
const fetchRecentTitles = async (): Promise<RecentTitle[]> => {
  if (!isSupabaseConfigured) {
    return INITIAL_PUBLIC_NOTES.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title || "Untitled Letter",
      penName: n.profiles?.pen_name || "Anonymous Writer",
    }));
  }
  const base = () =>
    supabase
      .from("notes")
      .select("id, title, profiles:user_id(pen_name)")
      .eq("is_public", true)
      .eq("moderation_status", "clean")
      .order("published_at", { ascending: false })
      .limit(5);
  const { data: joined, error } = await base();
  let rows: {
    id: string;
    title: string | null;
    profiles?: { pen_name: string } | { pen_name: string }[] | null;
  }[] | null = joined;
  if (error) {
    console.error("Recent-shelf fetch failed, retrying without pen names:", error);
    const retry = await supabase
      .from("notes")
      .select("id, title")
      .eq("is_public", true)
      .eq("moderation_status", "clean")
      .order("published_at", { ascending: false })
      .limit(5);
    if (retry.error) {
      console.error("Recent-shelf fetch failed outright:", retry.error);
      return [];
    }
    rows = retry.data;
  }
  const source =
    rows && rows.length > 0
      ? rows
      : INITIAL_PUBLIC_NOTES.slice(0, 5).map((n) => ({
          id: n.id,
          title: n.title || "Untitled Letter",
          profiles: n.profiles
            ? { pen_name: n.profiles.pen_name }
            : undefined,
        }));
  return source.map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      title: row.title || "Untitled Letter",
      penName: p?.pen_name || "Anonymous Writer",
    };
  });
};
/**
 * The front door. One screen, one promise, one door - in the shape of a
 * quiet scene: shelves at the edges, a quill writing at a small desk, the
 * finished letters flying off as paper planes, and a few real letter
 * titles drifting along the shelf below.
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  onAuth,
  onGuest,
}) => {
  const [recent, setRecent] = useState<RecentTitle[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchRecentTitles().then((rows) => {
      if (!cancelled) setRecent(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="lp-scene" data-testid="landing-scene">
      {/* the room: shelf edges, candlelight, dust */}
      <div className="lp-shelf-edge lp-shelf-left" aria-hidden="true" />
      <div className="lp-shelf-edge lp-shelf-right" aria-hidden="true" />
      <div className="candle-glow absolute inset-0" aria-hidden="true" />
      <div className="lp-motes" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`lp-mote lp-mote-${(i % 7) + 1}`} />
        ))}
      </div>
      <QuillFlight />

      {/* floating pill header */}
      <header className="lp-header">
        <span className="lp-brand">
          <CandleLanternIcon className="h-6 w-4 text-gold" />
          <span className="font-serif italic">The Paper Vault</span>
        </span>
        <button
          type="button"
          onClick={() => onAuth("signin")}
          className="lp-signin"
        >
          Sign in
        </button>
      </header>

      {/* one promise, one door */}
      <main className="lp-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="lp-eyebrow"
        >
          <Flame className="w-3 h-3" />
          <span>An anonymous library of unsent letters</span>
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8 }}
          className="lp-headline"
        >
          <InkText text="Say what you" startDelay={0.5} perLetter={0.05} />
          <br />
          <span className="lp-highlight">
            <InkText text="couldn't" startDelay={1.15} perLetter={0.05} />
          </span>{" "}
          <InkText text="say." startDelay={1.6} perLetter={0.05} />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="lp-sub"
        >
          Write the thing you never told anyone. Seal it. Leave it on a shelf
          where a stranger who needs those words will find them.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.7 }}
          className="lp-ctas"
        >
          <button type="button" onClick={onGuest} className="lp-cta-primary">
            Step inside
          </button>
          <button
            type="button"
            onClick={() => onAuth("signin")}
            className="lp-cta-ghost"
          >
            I already have a key
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="lp-honest"
        >
          <p>No names. No feeds. Free to read, free to write.</p>
          <RoomMemory />
        </motion.div>
      </main>

      {/* the product, demonstrated: real letters drifting on the shelf */}
      {recent.length > 0 && (
        <section className="lp-drift" aria-label="Recently shelved letters">
          <span className="lp-drift-label">Recently shelved</span>
          <div className="lp-drift-row">
            {recent.map((item, i) => (
              <motion.span
                key={item.id}
                className="lp-drift-pill"
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 3.4 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
                title={`by ${item.penName}`}
              >
                "{item.title}"
              </motion.span>
            ))}
          </div>
        </section>
      )}

      {/* the Librarian keeps the corner */}
      <div className="lp-librarian">
        <Librarian line={landingIntro} />
      </div>

      <div className="lp-coffee">
        <CoffeeButton />
      </div>
    </div>
  );
};
