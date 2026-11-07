import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Feather } from "lucide-react";
import { Note } from "../../types/database";
import {
  getUnsealDate,
  isDateSealed,
  daysUntilUnseal,
  formatUnsealDate,
} from "../../utils/unseal";
import { WaxSeal } from "../library/WaxSeal";
import { getSealChoice } from "../../lib/sealPreference";

export const FUTURE_SELF_TAG = "futureself";

export const isFutureSelfNote = (note: Note): boolean =>
  (note.tags ?? []).some((t) => t.toLowerCase() === FUTURE_SELF_TAG);

interface FutureSelfDeskProps {
  notes: Note[];
  onWriteFutureSelf: () => void;
  onOpen: (note: Note) => void;
}

/**
 * Headline writing ritual: letters to your future self. Sealed envelopes sit
 * on the desk with the unseal date embossed and a quiet countdown; on the day
 * one unseals, it glows.
 */
export const FutureSelfDesk: React.FC<FutureSelfDeskProps> = ({
  notes,
  onWriteFutureSelf,
  onOpen,
}) => {
  const futureLetters = useMemo(
    () =>
      notes
        .filter(isFutureSelfNote)
        .sort((a, b) =>
          (getUnsealDate(a.tags) ?? "").localeCompare(
            getUnsealDate(b.tags) ?? "",
          ),
        ),
    [notes],
  );

  return (
    <section className="bg-card/80 border border-gold/25 rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-md shadow-parchment">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="max-w-md">
          <span className="label-caps block mb-1.5 text-gold">
            A letter to your future self
          </span>
          <p className="font-body text-sm text-muted italic leading-relaxed">
            Write to the person you will be. Choose the morning it opens -
            until then it sits here, sealed in wax with the date embossed, and
            even you can't peek.
          </p>
        </div>
        <button
          type="button"
          onClick={onWriteFutureSelf}
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-wax-crimson hover:bg-wax-crimsonBright text-amber-50 rounded-full font-serif text-sm font-semibold transition shadow-candle border border-red-500/30 cursor-pointer hover:-translate-y-0.5"
        >
          <Feather className="w-4 h-4" />
          <span>Write to future you</span>
        </button>
      </div>

      {futureLetters.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4">
          {futureLetters.map((note) => {
            const unsealDate = getUnsealDate(note.tags);
            const sealed = isDateSealed(note);
            return (
              <motion.button
                key={note.id}
                type="button"
                onClick={() => onOpen(note)}
                whileHover={{ y: -3 }}
                className={`fs-envelope ${sealed ? "" : "fs-unsealed"}`}
                aria-label={
                  sealed
                    ? `Sealed letter to your future self, opens ${unsealDate ? formatUnsealDate(unsealDate) : "someday"}`
                    : `Unsealed letter from your past self: ${note.title || "Untitled Letter"}`
                }
              >
                <span className="fs-flap" />
                <span className="fs-emboss">
                  {sealed ? (
                    <>
                      <span className="fs-date">
                        {unsealDate
                          ? formatUnsealDate(unsealDate)
                          : "Sealed"}
                      </span>
                      <span className="fs-countdown">
                        {unsealDate && daysUntilUnseal(unsealDate) === 1
                          ? "opens tomorrow"
                          : unsealDate
                            ? `${daysUntilUnseal(unsealDate)} days to go`
                            : ""}
                      </span>
                    </>
                  ) : (
                    <span className="fs-open-line">It unsealed - read it</span>
                  )}
                </span>
                <span className="fs-seal">
                  <WaxSeal
                    color={sealed ? getSealChoice().color : "gold"}
                    size="md"
                    icon={sealed ? getSealChoice().icon : "quill"}
                  />
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );
};
