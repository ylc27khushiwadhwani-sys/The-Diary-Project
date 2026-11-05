import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  hasSeenEntry,
  markEntrySeen,
  prefersReducedMotion,
  burstEmbers,
} from "../../lib/motion";
const TOTAL_MS = 5000;

/**
 * Opening sequence: heavy library doors swing open on candlelight, the veil
 * blooms outward, and the visitor lands straight in the library. Click, tap
 * or any key skips it. It plays on every page load; prefers-reduced-motion
 * skips it.
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
