import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Feather, Mail, ShieldCheck } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { INITIAL_PUBLIC_NOTES } from "../data/seedNotes";
import { CoffeeButton } from "../components/payments/CoffeeButton";
import { CommunityJoin } from "../components/payments/CommunityJoin";
import { CandleLanternIcon } from "../components/common/CandleLanternIcon";
import { InkText } from "../components/cinematic/InkText";
import { RoomMemory } from "../components/cinematic/RoomMemory";
import { Librarian } from "../components/library/Librarian";
import { LibraryCard } from "../components/library/LibraryCard";
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
    return INITIAL_PUBLIC_NOTES.slice(0, 6).map((n) => ({
      id: n.id,
      title: n.title || "Untitled Letter",
      penName: n.profiles?.pen_name || "Anonymous Writer",
    }));
  }
  const { data } = await supabase
    .from("notes")
    .select("id, title, profiles:user_id(pen_name)")
    .eq("is_public", true)
    .eq("moderation_status", "clean")
    .order("published_at", { ascending: false })
    .limit(6);
  if (!data) return [];
  const rows = data as unknown as {
    id: string;
    title: string | null;
    profiles: { pen_name: string } | { pen_name: string }[] | null;
  }[];
  return rows.map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      title: row.title || "Untitled Letter",
      penName: p?.pen_name || "Anonymous Writer",
    };
  });
};

const BEATS = [
  {
    icon: <Feather className="w-5 h-5 text-gold" />,
    title: "Write it",
    body: "The thing that sits in your chest at 2am. Under a pen name - never your own.",
  },
  {
    icon: <Mail className="w-5 h-5 text-gold" />,
    title: "Seal it",
    body: "Pin-lock it, or date-seal it for a future morning. Some letters are written to wait.",
  },
  {
    icon: <BookOpen className="w-5 h-5 text-gold" />,
    title: "Leave it on a shelf",
    body: "Release it to the library, where a stranger who needed exactly those words will find them.",
  },
];

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
    <div className="relative min-h-screen overflow-x-hidden text-amber-100">
      {/* 1. Hero - one promise, one door */}
      <section className="landing-hero relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 py-20">
        <div className="candle-glow absolute inset-0" />
        <QuillFlight />

        {/* mini top bar */}
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 sm:px-8 py-4 z-20">
          <div className="flex items-center gap-3">
            <span className="font-serif italic text-lg text-[#f3ece0]">
              The Paper Vault
            </span>
            <CoffeeButton />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAuth("signin")}
              className="label-caps rounded-full border border-hairline bg-card/60 px-3.5 py-2 text-gold transition-colors hover:bg-gold hover:text-wood-950 cursor-pointer text-[10px]"
            >
              Sign In
            </button>
            <button
              onClick={() => onAuth("signup")}
              className="label-caps rounded-full border border-gold/60 bg-gold px-3.5 py-2 !text-wood-950 transition-colors hover:bg-gold-light cursor-pointer text-[10px]"
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <CandleLanternIcon className="h-24 w-12 text-gold mx-auto mb-3" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="label-caps mt-2 text-gold"
          >
            An anonymous library of unsent letters
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-4 text-5xl sm:text-7xl font-serif tracking-tight text-[#fbf3e2] [text-shadow:0_0_46px_rgba(226,177,122,0.5)]"
          >
            <InkText
              text="Say what you couldn't say."
              startDelay={0.6}
              perLetter={0.05}
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8 }}
            className="mx-auto mt-6 max-w-lg font-body text-base sm:text-lg text-[#cbbfa8] leading-relaxed italic"
          >
            Write the thing you carry and never told anyone. Seal it. Leave it
            on a shelf where a stranger who needs exactly those words will find
            it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <button
              onClick={() => onAuth("signup")}
              className="rounded-full bg-gold hover:bg-gold-light px-10 py-4 font-serif text-lg text-wood-950 font-semibold shadow-candle transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              Enter the Library
            </button>
            <button
              onClick={onGuest}
              className="font-serif text-sm text-[#cbbfa8] hover:text-gold-light underline underline-offset-4 decoration-hairline transition cursor-pointer"
            >
              or step in quietly as a guest - no email, no name
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.8 }}
          >
            <RoomMemory />
          </motion.div>
        </div>
      </section>

      {/* 2. The Librarian introduces the place */}
      <section className="px-6 py-14 border-y border-hairline/60 bg-wood-950/40">
        <div className="mx-auto max-w-2xl">
          <Librarian line={landingIntro} />
        </div>
      </section>

      {/* 3. How it works - three beats */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BEATS.map((beat, i) => (
              <motion.div
                key={beat.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="bg-card/80 border border-hairline rounded-2xl p-7 backdrop-blur-md shadow-parchment text-center"
              >
                <div className="w-11 h-11 rounded-full bg-amber-900/15 border border-amber-800/30 flex items-center justify-center mx-auto mb-4">
                  {beat.icon}
                </div>
                <h2 className="font-serif text-2xl text-[#fbf3e2] mb-2">
                  {beat.title}
                </h2>
                <p className="font-body text-sm text-[#c9bda9] leading-relaxed italic">
                  {beat.body}
                </p>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-8 font-serif italic text-lg text-[#e8dab2]">
            Or write to the person you will be in a year - the letter waits,
            sealed, until the day you choose.
          </p>
        </div>
      </section>

      {/* 4. Recently shelved - proof the shelves are alive */}
      {recent.length > 0 && (
        <section className="px-6 py-16 border-y border-hairline/60 bg-wood-950/40">
          <div className="mx-auto max-w-3xl">
            <span className="label-caps block text-center mb-6">
              Recently shelved
            </span>
            <ul className="space-y-3">
              {recent.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.45 }}
                  className="flex items-baseline justify-between gap-4 border-b border-hairline/40 pb-3"
                >
                  <span className="font-serif text-lg text-[#f3ece0] italic truncate">
                    "{item.title}"
                  </span>
                  <span className="font-body text-xs text-[#9e9488] whitespace-nowrap">
                    {item.penName}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 5. Identity promise */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <span className="label-caps block mb-2">Anonymous Identity</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#fbf3e2] mb-4">
              Your identity belongs to you alone
            </h2>
            <p className="font-body text-base text-[#c9bda9] leading-relaxed mb-6 italic">
              When you enter the library, you receive an anonymous pen name.
              Nobody sees your email, your location, or anything that is yours.
            </p>
            <LibraryCard
              penName="Quiet Heron"
              avatarColor="#d4a373"
              className="mx-auto md:mx-0"
            />
          </div>

          <div>
            <p className="label-caps mb-4 text-center">From a shelf, someday</p>
            <div className="letter-frame parchment-sheet letter-deckle rotate-[0.6deg] p-8 sm:p-12 pl-10 sm:pl-14 text-wood-950 relative">
              <div className="letter-ribbon" />
              <div className="letter-stamps">
                <span className="letter-stamp" />
              </div>
              <div className="letter-botanical" />
              <blockquote className="font-serif text-2xl sm:text-3xl italic leading-relaxed text-wood-950">
                "To the friend I stopped calling:
                <br />
                <br />
                I'm not angry anymore. I just didn't know how to say I missed
                you."
              </blockquote>
              <div className="mt-8 text-right font-serif text-lg text-wood-800">
                — Quiet Heron
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Honest fine print + final door */}
      <section className="px-6 pb-20 text-center">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="flex items-center justify-center gap-2 text-xs font-serif text-[#9e9488]">
            <ShieldCheck className="w-4 h-4 text-gold/70" />
            <span>
              Free to read. Free to write your first ten letters. No real
              names, ever.
            </span>
          </div>
          <button
            onClick={() => onAuth("signup")}
            className="rounded-full bg-gold hover:bg-gold-light px-10 py-4 font-serif text-lg text-wood-950 font-semibold shadow-candle transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            Enter the Library
          </button>
        </div>
      </section>

      <CommunityJoin />
    </div>
  );
};
