import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  hasSeenEntry,
  markEntrySeen,
  prefersReducedMotion,
  burstEmbers,
} from "../../lib/motion";
import { CandleFlame } from "./CandleFlame";
import { HeartSeal } from "../library/HeartSeal";

const TOTAL_MS = 8600;

/**
 * Opening sequence, played once per visitor: heavy library doors swing open on candlelight, a single candle in the dark, the
 * room blooms outward from its light, a wax seal presses in, cracks, and the
 * veil lifts into a slow push-in on the hall. Click, tap or any key skips it.
 * It plays on every page load; prefers-reduced-motion skips it.
 */
export const EntrySequence: React.FC = () => {
  const [active, setActive] = useState(
    () => !hasSeenEntry() && !prefersReducedMotion(),
  );
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    markEntrySeen();
    document.documentElement.removeAttribute("data-entry");
    document.body.style.overflow = "";
    setLeaving(true);
    burstEmbers();
    window.setTimeout(() => setActive(false), 900);
  }, []);

  useEffect(() => {
    if (!active) return;
    document.documentElement.setAttribute("data-entry", "playing");
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(finish, TOTAL_MS);
    const onKey = () => finish();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.documentElement.removeAttribute("data-entry");
      document.body.style.overflow = "";
    };
  }, [active, finish]);

  if (!active) return null;

  return (
    <div
      className={`entry-sequence ${leaving ? "entry-leaving" : ""}`}
      role="dialog"
      aria-label="Welcome to The Paper Vault"
      data-testid="entry-sequence"
      onClick={finish}
    >
      <div className="entry-hole" />
      <div className="entry-door-glow" />
      <div className="entry-doors" aria-hidden="true">
        <div className="entry-door door-l">
          <i className="door-panel" />
          <i className="door-strap s1" />
          <i className="door-strap s2" />
          <i className="door-ring" />
        </div>
        <div className="entry-door door-r">
          <i className="door-panel" />
          <i className="door-strap s1" />
          <i className="door-strap s2" />
          <i className="door-ring" />
        </div>
      </div>
      <div className="entry-stage">
        <CandleFlame className="entry-candle" size={1.5} />
        <p className="entry-caption">The Paper Vault</p>
        <div className="entry-seal">
          <HeartSeal size={92} />
        </div>
        <div className="entry-crack" />
      </div>
      <button
        type="button"
        className="entry-skip"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        Skip
      </button>
    </div>
  );
};
