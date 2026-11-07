import React from "react";
import { motion } from "framer-motion";
import { CoffeeButton } from "../components/payments/CoffeeButton";
import { CandleLanternIcon } from "../components/common/CandleLanternIcon";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { InkText } from "../components/cinematic/InkText";
import { RoomMemory } from "../components/cinematic/RoomMemory";
import { SelfWritingLetter } from "../components/landing/SelfWritingLetter";

interface LandingPageProps {
  onAuth: (mode: "signin" | "signup") => void;
  onGuest: () => void;
}

/**
 * The front door. One line that says the whole product, then a letter
 * quietly writing itself - the page explains itself by showing someone
 * using it. Two doors: step in as a guest, or sign in.
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  onAuth,
  onGuest,
}) => {
  return (
    <div className="lp-scene" data-testid="landing-scene">
      {/* the room: bookshelf spines at the edges, candlelight, drifting dust */}
      <div className="lp-shelf-edge lp-shelf-left" aria-hidden="true" />
      <div className="lp-shelf-edge lp-shelf-right" aria-hidden="true" />
      <div className="candle-glow absolute inset-0" aria-hidden="true" />
      <div className="lp-motes" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`lp-mote lp-mote-${(i % 7) + 1}`} />
        ))}
      </div>

      {/* floating pill header */}
      <header className="lp-header">
        <span className="lp-brand">
          <CandleLanternIcon className="h-6 w-4 text-gold" />
          <span className="font-serif italic">The Paper Vault</span>
        </span>
        <nav className="lp-nav" aria-label="Enter the vault">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => onAuth("signin")}
            className="lp-nav-ghost"
          >
            Sign in
          </button>
          <button type="button" onClick={onGuest} className="lp-signin">
            Step inside
          </button>
        </nav>
      </header>

      {/* one promise, one door */}
      <main className="lp-center">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="lp-headline"
        >
          <InkText
            text="Everyone has one letter"
            startDelay={0.4}
            perLetter={0.04}
          />
          <br />
          <InkText
            text="they "
            startDelay={1.5}
            perLetter={0.04}
          />
          <span className="lp-highlight">
            <InkText text="never sent." startDelay={1.8} perLetter={0.045} />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.9 }}
          className="lp-quiet"
        >
          This is where they live.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.8 }}
          className="lp-letter-stage"
        >
          <SelfWritingLetter />
          <span className="lp-keepsake lp-keepsake-left" aria-hidden="true">
            I should have called.
          </span>
          <span className="lp-keepsake lp-keepsake-right" aria-hidden="true">
            you were right about everything
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 0.8 }}
          className="lp-honest"
        >
          <p>An anonymous library of unsent letters. No names. No feeds. Free to read, free to write.</p>
          <RoomMemory />
        </motion.div>
      </main>

      <div className="lp-coffee">
        <CoffeeButton />
      </div>
    </div>
  );
};
