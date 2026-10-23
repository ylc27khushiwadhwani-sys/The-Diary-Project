import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface LibraryCardProps {
  penName?: string;
  avatarColor?: string;
  className?: string;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({
  penName = 'Quiet Heron',
  avatarColor = '#d4a373',
  className = '',
}) => {
  // 3D tilt tracking cursor movement like bloomiedays
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`mx-auto w-full max-w-xs rotate-[-2deg] rounded-md border border-hairline bg-card/90 p-7 text-center shadow-book backdrop-blur-md transition-all duration-300 hover:rotate-0 hover:shadow-candle ${className}`}
    >
      <div className="flex items-center justify-center gap-1.5 text-gold/80 mb-1">
        <Sparkles className="w-3 h-3 text-gold" />
        <p className="label-caps text-[0.7rem]">Library card</p>
      </div>

      <div className="my-4 h-px bg-hairline" />

      <p className="text-xs uppercase tracking-widest text-[#9e9488] font-sans">
        Anonymous Pen Name
      </p>
      <p
        className="font-serif text-3xl md:text-4xl italic font-normal tracking-wide my-2 transition-colors"
        style={{ color: avatarColor || '#d4a373' }}
      >
        {penName}
      </p>

      <div className="my-4 h-px bg-hairline" />

      <div className="flex items-center justify-center gap-1.5 text-[10px] tracking-widest uppercase text-[#9e9488] font-sans">
        <ShieldCheck className="w-3.5 h-3.5 text-gold/70" />
        <span>EMAIL • HIDDEN</span>
      </div>
      <p className="mt-1 text-[10px] tracking-widest uppercase text-rose-light font-sans font-medium">
        SHELVES • ENCRYPTED
      </p>
    </motion.div>
  );
};
