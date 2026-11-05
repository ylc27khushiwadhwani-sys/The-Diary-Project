import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower2, Flame, Star } from "lucide-react";
import { GiftPayload } from "../lib/giftLink";
import { WaxSeal } from "../components/library/WaxSeal";

interface GiftOpeningPageProps {
  gift: GiftPayload;
  onEnterVault: () => void;
}

const GIFT_OBJECTS = {
  flower: { Icon: Flower2, label: "a pressed flower", tint: "#d95d68" },
  candle: { Icon: Flame, label: "a candle that doesn't go out", tint: "#e2b17a" },
  star: { Icon: Star, label: "a folded paper star", tint: "#f3d9a4" },
} as const;

/**
 * What the recipient sees: a sealed something, then the words. The whole
 * letter travelled inside the link - it was never anywhere else.
 */
export const GiftOpeningPage: React.FC<GiftOpeningPageProps> = ({
  gift,
  onEnterVault,
}) => {
  const [opened, setOpened] = useState(false);
  const object = gift.g ? GIFT_OBJECTS[gift.g] : null;

  return (
    <div className="gift-scene">
      <div className="candle-glow absolute inset-0 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-lg px-5 py-16 text-center">
        <span className="label-caps block mb-8">
          Something was left for you
        </span>

        <AnimatePresence mode="wait">
          {!opened ? (
            <motion.button
              key="sealed"
              type="button"
              onClick={() => setOpened(true)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="gift-sealed group"
              aria-label="Break the seal to read what was left for you"
            >
              {gift.k === "postcard" ? (
                <span className="gift-postcard-back">
                  <span className="gift-postcard-lines" />
                  <WaxSeal color="crimson" size="lg" icon="quill" />
                </span>
              ) : (
                <span className="gift-envelope">
                  <span className="lotd-flap" />
                  <span className="lotd-seal">
                    <WaxSeal color="crimson" size="lg" icon="quill" />
                  </span>
                </span>
              )}
              <span className="mt-5 block font-body text-xs italic text-[#9e9488] group-hover:text-gold transition">
                Break the seal - this was made for one pair of eyes.
              </span>
            </motion.button>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, y: 18, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: -0.6 }}
              transition={{ duration: 0.7 }}
              className="gift-letter"
            >
              {object && (
                <div
                  className="gift-object"
                  aria-label={`With ${object.label}`}
                >
                  <object.Icon
                    className="w-7 h-7"
                    style={{ color: object.tint }}
                  />
                  <span>with {object.label}</span>
                </div>
              )}
              {gift.t && <h1 className="gift-title">"{gift.t}"</h1>}
              <p className="gift-body">{gift.c}</p>
              <p className="gift-from">- {gift.f}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onEnterVault}
          className="mt-12 font-body text-xs text-[#9e9488] hover:text-gold underline underline-offset-4 decoration-hairline transition cursor-pointer"
        >
          The Paper Vault - an anonymous library of unsent letters
        </button>
      </div>
    </div>
  );
};

