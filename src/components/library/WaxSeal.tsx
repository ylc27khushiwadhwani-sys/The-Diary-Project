import React from 'react';
import { Feather, Lock, Flame } from 'lucide-react';

interface WaxSealProps {
  color?: 'crimson' | 'gold' | 'emerald' | 'midnight';
  size?: 'sm' | 'md' | 'lg';
  icon?: 'quill' | 'lock' | 'flame' | 'crest';
  className?: string;
  isBroken?: boolean;
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  color = 'crimson',
  size = 'md',
  icon = 'quill',
  className = '',
  isBroken = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
  };

  const iconSizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const colorStyles = {
    crimson: 'wax-seal-badge text-amber-200/90',
    gold: 'wax-seal-gold text-amber-950',
    emerald: 'bg-radial-[at_35%_35%] from-[#2e7d5a] via-[#1b4d3e] to-[#0d2820] text-emerald-100 shadow-wax-seal',
    midnight: 'bg-radial-[at_35%_35%] from-[#2b3d63] via-[#1a2744] to-[#0c1322] text-blue-100 shadow-wax-seal',
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Wax drip irregular contours */}
      <div
        className={`${sizeMap[size]} ${colorStyles[color]} flex items-center justify-center font-cinzel font-bold border border-white/20 transition-transform duration-300 hover:scale-105 ${
          isBroken ? 'opacity-80 rotate-12 scale-95' : ''
        }`}
      >
        {/* Embossed inner ring */}
        <div className="absolute inset-1 rounded-full border border-black/30 flex items-center justify-center">
          {icon === 'lock' ? (
            <Lock className={`${iconSizeMap[size]} drop-shadow`} />
          ) : icon === 'flame' ? (
            <Flame className={`${iconSizeMap[size]} drop-shadow`} />
          ) : icon === 'crest' ? (
            <span className="font-cinzelDec font-black drop-shadow tracking-tighter">L</span>
          ) : (
            <Feather className={`${iconSizeMap[size]} drop-shadow`} />
          )}
        </div>
      </div>
    </div>
  );
};
