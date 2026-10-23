import React from 'react';

interface CandleLanternIconProps {
  className?: string;
}

export const CandleLanternIcon: React.FC<CandleLanternIconProps> = ({ className = 'h-24 w-12 text-gold' }) => {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 120" className={`mx-auto ${className}`}>
      {/* Hanging Chain / Cord */}
      <line x1="30" y1="0" x2="30" y2="40" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" />
      
      {/* Lantern Cap and Hood */}
      <polygon points="22,34 38,34 44,40 16,40" fill="currentColor" fillOpacity="0.6" />
      
      {/* Glass Body */}
      <path
        d="M14 40 h32 l-6 28 h-20 z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.5"
      />
      
      {/* Inner Glowing Candle Flame */}
      <circle cx="30" cy="58" r="6" className="fill-gold animate-pulse" />
      <circle cx="30" cy="58" r="14" fill="currentColor" fillOpacity="0.15" />
      
      {/* Lantern Bottom Rim & Finial */}
      <line x1="20" y1="68" x2="40" y2="68" stroke="currentColor" strokeWidth="2" strokeOpacity="0.8" />
      <circle cx="30" cy="72" r="2.5" fill="currentColor" fillOpacity="0.7" />
    </svg>
  );
};
