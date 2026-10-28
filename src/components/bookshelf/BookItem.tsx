import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Note } from '../../types/database';

interface BookItemProps {
  note: Note;
  index: number;
  onOpen: (note: Note) => void;
}

// Rich antique leather book bindings palette
const BOOK_BINDINGS = [
  {
    bg: 'linear-gradient(135deg, #4a151b 0%, #2e0d11 100%)', // Burgundy
    accent: '#d4a373',
    ribbon: '#a3333d',
    border: '#6b232c',
  },
  {
    bg: 'linear-gradient(135deg, #122820 0%, #0a1813 100%)', // Deep Forest
    accent: '#e2b17a',
    ribbon: '#204a39',
    border: '#1f4536',
  },
  {
    bg: 'linear-gradient(135deg, #152238 0%, #0c1422 100%)', // Oxford Navy
    accent: '#d4a373',
    ribbon: '#2a4365',
    border: '#23385d',
  },
  {
    bg: 'linear-gradient(135deg, #422918 0%, #29180d 100%)', // Aged Leather Amber
    accent: '#f3ece0',
    ribbon: '#8c5027',
    border: '#633e24',
  },
  {
    bg: 'linear-gradient(135deg, #2e1c2b 0%, #1c111a 100%)', // Muted Plum
    accent: '#e2b17a',
    ribbon: '#522f4d',
    border: '#4a2c45',
  },
  {
    bg: 'linear-gradient(135deg, #22201d 0%, #151412 100%)', // Deep Charcoal
    accent: '#d4a373',
    ribbon: '#44403c',
    border: '#383530',
  },
];

// Compact spine sizing: slim volumes of varied heights so a whole shelf
// packs into a short band, like a tightly filled bookcase row.
const SPINE_HEIGHTS = [96, 116, 104, 124, 108, 132, 100, 120];

export const BookItem: React.FC<BookItemProps> = ({ note, index, onOpen }) => {
  const binding = BOOK_BINDINGS[index % BOOK_BINDINGS.length];
  const title = note.title || 'Untitled Letter';

  // 3D Tilt calculation (inspired by bloomiedays.replit.app cursor physics)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 220, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 220, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const bookHeight = SPINE_HEIGHTS[index % SPINE_HEIGHTS.length];

  return (
    // Spines flex so a shelf's books distribute across the full ledge,
    // tightly packed like a filled bookcase row (min/max keep them book-like)
    <div className="relative group perspective-[1000px] flex-1 min-w-[14px] max-w-[44px] flex flex-col items-center">
      {/* Floating Hover Tooltip — light speech bubble with a small tail */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap bg-[#fbf5e8] text-wood-950 text-[11px] font-serif px-2.5 py-1 rounded-md shadow-[0_6px_16px_rgba(0,0,0,0.55)]">
        <span>Click to open: &quot;{title}&quot;</span>
        <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-[#fbf5e8] rounded-[1px]" />
      </div>

      {/* 3D Book Spine */}
      <motion.div
        onClick={() => onOpen(note)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          height: `${bookHeight}px`,
          width: '100%',
          background: binding.bg,
          borderColor: binding.border,
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{
          y: -6,
          scale: 1.08,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        whileTap={{ scale: 0.97 }}
        className="cursor-pointer relative rounded-t-[2px] border-x border-t shadow-[0_8px_20px_rgba(0,0,0,0.85)] flex flex-col justify-between select-none transition-shadow group-hover:shadow-[0_12px_30px_rgba(212,163,115,0.35)]"
      >
        {/* Embossed gold spine lines at top */}
        <div className="space-y-0.5 pt-1 opacity-75">
          <div className="h-px bg-gold/50 mx-1" />
          <div className="h-px bg-gold/40 mx-0.5" />
        </div>

        {/* Vertical Title along the spine */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <span
            className="font-serif text-[9px] md:text-[10px] font-semibold tracking-wide text-gold/90 line-clamp-1 whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {title}
          </span>
        </div>

        {/* Lock indicator at base of spine */}
        <div className="pb-1 text-center flex flex-col items-center">
          <div className="h-px bg-gold/50 mx-1 w-full mb-1 opacity-75" />
          {note.is_locked ? (
            <Lock className="w-2 h-2 text-amber-200" />
          ) : (
            <span
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: binding.accent, opacity: 0.7 }}
            />
          )}
        </div>

        {/* Hanging Ribbon Bookmark peeking out of bottom */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-3 rounded-b-xs shadow-md opacity-90 transition-transform group-hover:translate-y-0.5"
          style={{ backgroundColor: binding.ribbon }}
        />
      </motion.div>
    </div>
  );
};
