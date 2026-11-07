import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GiftPayload } from "../lib/giftLink";
import { giftItemFor } from "../lib/giftCatalog";
import { GiftArt } from "../components/gifts/GiftArt";
import { WaxSeal } from "../components/library/WaxSeal";

interface GiftOpeningPageProps {
  gift: GiftPayload;
  onEnterVault: () => void;
}

/**
 * What the recipient sees. The ceremony has three beats: the sealed
 * thing arrives, the wax breaks, then the letter unfolds with whatever
 * was folded inside. The whole letter travelled inside the link - it
 * was never anywhere else.
 */
export const GiftOpeningPage: React.FC<GiftOpeningPageProps> = ({
  gift,
  onEnterVault,
}) => {
  const [opened, setOpened] = useState(false);
  const item = gift.g ? giftItemFor(gift.g) : null;

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
              exit={{ opacity: 0, y: -18, rotate: -2 }}
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
              <span className="mt-5 block font-body text-xs italic text-muted group-hover:text-gold transition">
                Break the seal - this was made for one pair of eyes.
              </span>
            </motion.button>
          ) : (
            <motion.div key="open" className="gift-open-stage">
              {item && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, type: "spring" }}
                  className="gift-object"
                  aria-label={`With ${item.label.toLowerCase()}`}
                >
                  <GiftArt id={gift.g ?? ""} size={52} />
                  <span>with {item.label.toLowerCase()}</span>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 22, rotate: -2, scaleY: 0.92 }}
                animate={{ opacity: 1, y: 0, rotate: -0.6, scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="gift-letter"
              >
                {gift.t && <h1 className="gift-title">"{gift.t}"</h1>}
                <p className="gift-body">{gift.c}</p>
                <p className="gift-from">- {gift.f}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onEnterVault}
          className="mt-12 font-body text-xs text-muted hover:text-gold underline underline-offset-4 decoration-hairline transition cursor-pointer"
        >
          The Paper Vault - an anonymous library of unsent letters
        </button>
      </div>
    </div>
  );
};
