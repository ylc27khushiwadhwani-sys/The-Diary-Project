import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, Feather, Lock } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Note } from "../../types/database";
import { prefersReducedMotion } from "../../lib/motion";
import { getLetterStyle, LETTER_FONTS } from "../../utils/letterStyle";
import { isDateSealed } from "../../utils/unseal";
import {
  SHELF_SECTIONS,
  matchesSection,
} from "../bookshelf/InteractiveBookshelf";

/**
 * The Grand Library: every public letter stands on the desk as a physical
 * book. The camera drifts slowly along the row; drag, scroll or use the
 * arrows to walk it yourself. Choosing a book pulls it out of the row and
 * opens it. Aesthetic follows the vault: aged bindings, gold tooling,
 * candlelit wood.
 */

interface GrandLibraryBooksProps {
  notes: Note[];
  loading?: boolean;
  /** Open a letter in the reader. */
  onOpen: (note: Note) => void;
  /** Jump to the classic shelf browse for a section ("all" included). */
  onChoose: (sectionId: string) => void;
  onRandom: () => void;
  randomDisabled?: boolean;
  /** Letter currently being read in-scene (the opened book stays on the desk). */
  readerNote?: Note | null;
  /** Render the reading view for the opened book, inside the scene. */
  renderReader?: (note: Note) => React.ReactNode;
  /** Close the in-scene reader. */
  onCloseReader?: () => void;
}

// Antique bindings, shared spirit with the bookshelf spines.
const BINDINGS = [
  { bg: "linear-gradient(135deg,#4a151b 0%,#2e0d11 100%)", border: "#6b232c", ribbon: "#a3333d" },
  { bg: "linear-gradient(135deg,#122820 0%,#0a1813 100%)", border: "#1f4536", ribbon: "#204a39" },
  { bg: "linear-gradient(135deg,#152238 0%,#0c1422 100%)", border: "#23385d", ribbon: "#2a4365" },
  { bg: "linear-gradient(135deg,#422918 0%,#29180d 100%)", border: "#633e24", ribbon: "#8c5027" },
  { bg: "linear-gradient(135deg,#2e1c2b 0%,#1c111a 100%)", border: "#4a2c45", ribbon: "#522f4d" },
  { bg: "linear-gradient(135deg,#22201d 0%,#151412 100%)", border: "#383530", ribbon: "#44403c" },
];

const hash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Books stand spine-out, packed like a real row; a revealed/opened book
// turns to face the reader and overlaps its neighbours.
const BOOK_GAP = 12;
const SPACING = BOOK_GAP + 28;
const STAGE_SIDE_PAD = 60;
// Past this many letters the desk ends with a note pointing at the archive.
const MAX_BOOKS = 400;
const DRIFT_RESUME_MS = 6000;
// One unhurried end-to-end glide of the desk. Motion is time-based, so it
// feels the same on 120Hz phones and on slow ones (the old per-frame sine
// crawled on low-fps devices and parked at the ends of the row).
const DRIFT_LEG_MS = 24000;
// Smoothstep: eases out of each end, then keeps cruising - the row is
// always visibly gliding, with only a short settle at the turnarounds.
const smoothLeg = (t: number) => t * t * (3 - 2 * t);
// Pull-out and cover swing complete, then the opened book grows into the
// in-scene reader (handoff). The 3D book fades as the reader arrives.
const OPEN_ANIMATION_MS = 1690;
const HANDOFF_DONE_MS = 2255;

export const GrandLibraryBooks: React.FC<GrandLibraryBooksProps> = ({
  notes,
  loading,
  onOpen,
  onChoose,
  onRandom,
  randomDisabled,
  readerNote = null,
  renderReader,
  onCloseReader,
}) => {
  const [sectionId, setSectionId] = useState("all");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [handingOff, setHandingOff] = useState(false);
  // Touch reveal: first tap turns a spine-out book to show its cover,
  // second tap opens it (hover already does this on a mouse).
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [flipOrigin, setFlipOrigin] = useState<{ x: number; y: number; scale: number; opacity: number } | null>(null);
  const busyRef = useRef(false);

  const books = useMemo(
    () =>
      notes
        .filter((note) => matchesSection(note, sectionId))
        .slice(0, MAX_BOOKS),
    [notes, sectionId],
  );
  const overflowCount = notes.filter((note) => matchesSection(note, sectionId)).length - books.length;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  // driftPhase counts ping-pong legs (1 leg = one end-to-end glide).
  const camera = useRef({ x: 0, target: 0, driftPhase: 0 });
  const interaction = useRef({ dragging: false, dragged: false, startX: 0, startCam: 0, lastTouch: 0, pointerType: "mouse" as string });
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The camera holds still while a book is being opened or read, so the
  // opening stays one continuous, steady movement.
  useEffect(() => {
    busyRef.current = !!openingId || !!readerNote;
  }, [openingId, readerNote]);

  const trackWidth = books.length * SPACING - BOOK_GAP + STAGE_SIDE_PAD * 2;

  const clampTarget = useCallback((value: number) => {
    const stage = stageRef.current;
    const actualTrack = trackRef.current?.scrollWidth ?? trackWidth;
    const max = Math.max(0, actualTrack - (stage?.clientWidth ?? 0));
    return Math.min(max, Math.max(0, value));
  }, [trackWidth]);

  // Camera loop: ease toward the target, and when nobody is steering,
  // drift slowly along the row like the reference's gliding shot.
  useEffect(() => {
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = 0;
    const step = (now: number) => {
      const cam = camera.current;
      const dt = last ? Math.min(100, now - last) : 16.7;
      last = now;
      const idle = now - interaction.current.lastTouch > DRIFT_RESUME_MS;
      if (busyRef.current) {
        raf = requestAnimationFrame(step);
        return;
      }
      const actualTrack = trackRef.current?.scrollWidth ?? trackWidth;
      if (!reduced && idle && !interaction.current.dragging && actualTrack > (stageRef.current?.clientWidth ?? 0)) {
        cam.driftPhase += dt / DRIFT_LEG_MS;
        const leg = cam.driftPhase % 2;
        const along = leg < 1 ? leg : 2 - leg; // ping-pong 0 -> 1 -> 0
        const max = Math.max(0, actualTrack - (stageRef.current?.clientWidth ?? 0));
        cam.target = smoothLeg(along) * max;
      }
      cam.x += (cam.target - cam.x) * Math.min(1, 0.06 * (dt / 16.7));
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-cam.x}px,0,0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [trackWidth]);

  // Recenter when the filter changes the row.
  useEffect(() => {
    camera.current.x = 0;
    camera.current.target = 0;
  }, [sectionId, notes.length]);

  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current);
    },
    [],
  );

  const steer = (delta: number) => {
    interaction.current.lastTouch = performance.now();
    camera.current.target = clampTarget(camera.current.target + delta);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    interaction.current.pointerType = e.pointerType;
    interaction.current.dragging = true;
    interaction.current.dragged = false;
    interaction.current.startX = e.clientX;
    interaction.current.startCam = camera.current.target;
    interaction.current.lastTouch = performance.now();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!interaction.current.dragging) return;
    const dx = e.clientX - interaction.current.startX;
    if (Math.abs(dx) > 8) interaction.current.dragged = true;
    interaction.current.lastTouch = performance.now();
    camera.current.target = clampTarget(interaction.current.startCam - dx);
  };
  const endDrag = () => {
    interaction.current.dragging = false;
    interaction.current.lastTouch = performance.now();
  };

  // Backstop: a press that ends anywhere still ends the drag. On touch the
  // browser can cancel the gesture mid-press (it takes over scrolling) or
  // the release can land on an overlay - missing that end left `dragging`
  // stuck true, which paused the desk's glide forever after one touch.
  useEffect(() => {
    const clearDrag = () => {
      interaction.current.dragging = false;
    };
    window.addEventListener("pointerup", clearDrag);
    window.addEventListener("pointercancel", clearDrag);
    return () => {
      window.removeEventListener("pointerup", clearDrag);
      window.removeEventListener("pointercancel", clearDrag);
    };
  }, []);

  const openBook = (note: Note, el: HTMLElement) => {
    if (interaction.current.dragged) return; // that was a walk, not a choice
    if (openingId) return;
    if (interaction.current.pointerType === "touch" && revealedId !== note.id) {
      setRevealedId(note.id); // first touch turns the book to show its cover
      return;
    }
    if (prefersReducedMotion()) {
      onOpen(note);
      return;
    }
    setOpeningId(note.id);
    openTimer.current = setTimeout(() => {
      // Measure the pulled-out book so the reader grows out of its actual
      // position - one continuous movement, no jump. The reader overlay is
      // fixed to the viewport, so the handoff aims at the viewport centre.
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw > 0 && vh > 0) {
        const targetW = Math.min(880, vw - 24);
        setFlipOrigin({
          x: rect.left + rect.width / 2 - vw / 2,
          y: rect.top + rect.height / 2 - vh / 2,
          scale: Math.max(0.12, rect.width / targetW),
          opacity: 0.55,
        });
      } else {
        setFlipOrigin(null);
      }
      setHandingOff(true);
      onOpen(note);
    }, OPEN_ANIMATION_MS);
    handoffTimer.current = setTimeout(() => {
      setOpeningId(null);
      setHandingOff(false);
    }, HANDOFF_DONE_MS);
  };

  return (
    <section className="glb-scene" aria-labelledby="grand-room-title">
      <div className="glb-back-shelves" aria-hidden="true" />
      <div className="glb-glow glb-glow-left" aria-hidden="true" />
      <div className="glb-glow glb-glow-right" aria-hidden="true" />

      <header className="grand-room-heading glb-heading">
        <p>THE PAPER VAULT</p>
        <h1 id="grand-room-title">The Grand Library</h1>
        <span>Every letter stands here as a book. Choose one and open it.</span>
      </header>

      <div className="glb-controls">
        <div className="glb-sections" role="group" aria-label="Filter the desk by shelf">
          {SHELF_SECTIONS.filter((section) => section.id !== "all").map((section) => (
            <button
              key={section.id}
              type="button"
              aria-pressed={sectionId === section.id}
              className={`glb-chip ${sectionId === section.id ? "is-active" : ""}`}
              onClick={() => setSectionId(sectionId === section.id ? "all" : section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
        <div className="glb-actions">
          <button type="button" className="glb-random" onClick={onRandom} disabled={randomDisabled}>
            read in random order
          </button>
          <button type="button" className="glb-browse" onClick={() => onChoose(sectionId)}>
            browse as shelves ↗
          </button>
        </div>
      </div>

      {loading ? (
        <div role="status" className="glb-empty">
          <Feather className="w-6 h-6 text-gold/60 mx-auto mb-3 animate-pulse" />
          <p>Unshelving the letters...</p>
        </div>
      ) : books.length === 0 ? (
        <div role="status" className="glb-empty">
          <Feather className="w-7 h-7 text-gold/50 mx-auto mb-3" />
          <p>This part of the desk is waiting for its first letter.</p>
        </div>
      ) : (
        <div
          ref={stageRef}
          className="glb-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          onWheel={(e) => steer(e.deltaY + e.deltaX)}
          role="region"
          aria-label="Letters standing as books on the library desk. Drag sideways to walk along the desk."
        >
          <div
            ref={trackRef}
            className="glb-track"
            style={{ width: trackWidth, paddingLeft: STAGE_SIDE_PAD, paddingRight: STAGE_SIDE_PAD }}
          >
            {books.map((note, index) => {
              const h = hash(note.id || String(index));
              const binding = BINDINGS[h % BINDINGS.length];
              const height = 208 + (h % 5) * 14;
              const tilt = 86 + (h % 3) * 2; // binding spine out, near-square so cover wedges stay thin even at screen edges; hover/touch turns the cover to you
              const title = note.title || "Untitled Letter";
              const penName = note.profiles?.pen_name || "Anonymous";
              const opening = openingId === note.id;
              const lean = (Math.floor(index / 3) % 2 === 0 ? -1 : 1) * (5 + (h % 3)); // slump groups share one lean, like books resting on each other
              const revealed = revealedId === note.id;
              return (
                <div
                  key={note.id}
                  className={`glb-book ${opening ? "is-opening" : ""} ${opening && handingOff ? "is-handing-off" : ""} ${revealed && !opening ? "is-revealed" : ""}`}
                  style={{
                    height,
                    ["--tilt" as string]: `${tilt}deg`,
                    ["--lean" as string]: `${lean}deg`,
                    ["--restz" as string]: index % 2 === 0 ? "0px" : "-14px", // leaning books rest in front of or behind their neighbor, never inside it
                    marginLeft: index > 0 && index % 3 === 0 ? 34 : undefined, // channel between slump groups so converging tops never cross
                  }}
                >
                  <button
                    type="button"
                    className="glb-book3d"
                    onClick={(e) => openBook(note, e.currentTarget)}
                    aria-label={`Open letter: ${title}`}
                  >
                    <span className="glb-firstpage" aria-hidden="true">
                      {!note.is_locked && !isDateSealed(note) && (
                        <span
                          className="glb-firstpage-text"
                          style={{ fontFamily: LETTER_FONTS[getLetterStyle(note.tags).font].family }}
                        >
                          {note.content.slice(0, 260)}
                        </span>
                      )}
                    </span>
                    <span className="glb-cover">
                      <span
                        className="glb-face glb-front"
                        style={{ background: binding.bg, borderColor: binding.border }}
                      >
                        <span className="glb-frame" aria-hidden="true">
                          <span className="glb-ornament">✦</span>
                          <span className="glb-title">{title}</span>
                          <span className="glb-pen">{penName}</span>
                          {note.is_locked && <Lock className="w-3 h-3" aria-label="Passcode protected" />}
                        </span>
                        <span
                          className="glb-ribbon"
                          style={{ background: binding.ribbon }}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="glb-face glb-cover-inside" aria-hidden="true" />
                    </span>
                    <span
                      className="glb-face glb-spine"
                      style={{ background: binding.bg, borderColor: binding.border }}
                      aria-hidden="true"
                    >
                      <span className="glb-spine-title">{title}</span>
                    </span>
                    <span className="glb-face glb-pages" aria-hidden="true" />
                    <span className="glb-face glb-top" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="glb-desk" aria-hidden="true" />
          <button
            type="button"
            className="glb-arrow glb-arrow-left"
            aria-label="Walk toward the start of the desk"
            onClick={() => steer(-(stageRef.current?.clientWidth ?? 400) * 0.7)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="glb-arrow glb-arrow-right"
            aria-label="Walk toward the end of the desk"
            onClick={() => steer((stageRef.current?.clientWidth ?? 400) * 0.7)}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {renderReader && onCloseReader &&
        // Portal to body: inside the page's z-10 stacking context the reader
        // painted under the sticky header (z-50), clipping the letter's top
        // on phones. At root its z-60 sits above the header.
        createPortal(
        <AnimatePresence>
          {readerNote && (
            <div
              className="glb-reader"
              role="dialog"
              aria-modal="true"
              aria-label={`Reading: ${readerNote.title || "Untitled Letter"}`}
              onClick={onCloseReader}
            >
              <motion.div
                className="glb-reader-book"
                initial={flipOrigin ?? { opacity: 0, scale: 0.85 }}
                animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 24, transition: { duration: 0.35, ease: "easeIn" } }}
                transition={{ duration: 0.69, ease: [0.3, 0.8, 0.25, 1] }}
                onClick={(e) => e.stopPropagation()}
              >
                {renderReader(readerNote)}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <p className="glb-count" role="note">
        {books.length > 0 &&
          `${books.length} ${books.length === 1 ? "letter stands" : "letters stand"} on the desk${overflowCount > 0 ? `, and ${overflowCount} more rest deeper in the archive` : ""}.`}
      </p>
    </section>
  );
};
