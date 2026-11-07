import React from "react";
import { motion } from "framer-motion";
import { CoffeeButton } from "../components/payments/CoffeeButton";
import { CandleLanternIcon } from "../components/common/CandleLanternIcon";
import { InkText } from "../components/cinematic/InkText";
import { RoomMemory } from "../components/cinematic/RoomMemory";
import { SelfWritingLetter } from "../components/landing/SelfWritingLetter";
import { LandingFlowerBorder } from "../components/common/GardenFlowers";

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
      {/* the garden: theme sky overhead, drifting dust, flowers below */}
      <LandingFlowerBorder />
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

      </header>

      {/* one promise, one door */}
      <main className="lp-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="lp-pill"
        >
          An anonymous library of unsent letters
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="lp-headline"
        >
          <InkText
            text="Paper keeps what"
            startDelay={0.4}
            perLetter={0.04}
          />
          <br />
          <InkText
            text="the heart "
            startDelay={1.3}
            perLetter={0.04}
          />
          <span className="lp-highlight">
            <InkText text="can't" startDelay={1.7} perLetter={0.05} />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.1, duration: 0.9 }}
          className="lp-quiet"
        >
          Say what you couldn't say. Let the words you never sent find a
          home on paper. Write under a pen name, keep your letter just for
          you, or leave it on the shelf for a stranger who might need it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.7 }}
          className="lp-cta"
        >
          <button
            type="button"
            onClick={() => onAuth("signup")}
            className="lp-cta-primary"
          >
            Sign up to get a library card
          </button>
          <button
            type="button"
            onClick={() => onAuth("signin")}
            className="lp-cta-ghost"
          >
            I already have a library card
          </button>
          <button type="button" onClick={onGuest} className="lp-guest-link">
            or wander in as a guest
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.0, duration: 0.8 }}
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
          transition={{ delay: 3.4, duration: 0.8 }}
          className="lp-honest"
        >
          <p>No names. No feeds. Free to read, free to write.</p>
          <RoomMemory />
        </motion.div>
      </main>

      <div className="lp-coffee">
        <CoffeeButton />
      </div>
    </div>
  );
};
