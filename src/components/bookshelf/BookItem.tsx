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

export const BookItem: React.FC<BookItemProps> = ({ note, index, onOpen }) => {
  const binding = BOOK_BINDINGS[index % BOOK_BINDINGS.length];
  const penName = note.profiles?.pen_name || 'Anonymous';

  // 3D Tilt calculation (inspired by bloomiedays.replit.app cursor physics)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 220, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 220, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);

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

  // Height and thickness variation for organic library aesthetic
  const heights = [210, 230, 200, 225, 215, 235];
  const bookHeight = heights[index % heights.length];
  const bookWidth = 52 + (index % 3) * 6; // 52px - 64px width

  return (
    <div className="relative group perspective-[1000px] shrink-0 flex flex-col items-center">
      {/* Floating Hover Tooltip */}
      <div className="absolute -top-12 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap bg-wood-950/95 border border-gold/40 text-gold-light text-xs font-serif px-3 py-1 rounded-md shadow-candle backdrop-blur-md">
        <span>Click to open: "{note.title || 'Untitled Letter'}"</span>
      </div>

      {/* 3D Book Spine */}
      <motion.div
        onClick={() => onOpen(note)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          height: `${bookHeight}px`,
          width: `${bookWidth}px`,
          background: binding.bg,
          borderColor: binding.border,
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{
          y: -14,
          scale: 1.05,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        whileTap={{ scale: 0.97 }}
        className="cursor-pointer relative rounded-t-sm border-x border-t shadow-[0_8px_20px_rgba(0,0,0,0.85)] flex flex-col justify-between p-2 select-none transition-shadow group-hover:shadow-[0_12px_30px_rgba(212,163,115,0.35)]"
      >
        {/* Embossed gold spine lines at top */}
        <div className="space-y-1 pt-1 opacity-75">
          <div className="h-px bg-gold/50 mx-1" />
          <div className="h-0.5 bg-gold/40 mx-0.5" />
        </div>

        {/* Vertical Title along the spine */}
        <div className="flex-1 flex items-center justify-center py-2 overflow-hidden">
          <span
            className="font-serif text-sm md:text-base font-semibold tracking-wide text-gold/90 line-clamp-1 whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {note.title || 'Unspoken Letter'}
          </span>
        </div>

        {/* Lock indicator or Pen name glyph at base of spine */}
        <div className="pb-1 text-center flex flex-col items-center">
          <div className="h-px bg-gold/50 mx-1 w-full mb-1.5 opacity-75" />
          {note.is_locked ? (
            <div className="p-1 rounded-full bg-wax-crimson text-white shadow-xs">
              <Lock className="w-2.5 h-2.5 text-amber-200" />
            </div>
          ) : (
            <span
              className="text-[9px] font-sans font-medium text-gold/70 tracking-widest uppercase truncate max-w-full"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {penName.slice(0, 10)}
            </span>
          )}
        </div>

        {/* Hanging Ribbon Bookmark peeking out of bottom */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-4 rounded-b-xs shadow-md opacity-90 transition-transform group-hover:translate-y-1"
          style={{ backgroundColor: binding.ribbon }}
        />
      </motion.div>
    </div>
  );
};
