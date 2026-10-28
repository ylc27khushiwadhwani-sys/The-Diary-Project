import React from 'react';

/** A single flickering candle: wax stick, teardrop flame, breathing glow. */
export const CandleFlame: React.FC<{ className?: string; delay?: number; size?: number }> = ({
  className = '',
  delay = 0,
  size = 1,
}) => (
  <div
    className={`candle ${className}`}
    style={{ ['--candle-scale' as string]: size, ['--candle-delay' as string]: `${delay}s` }}
    aria-hidden="true"
  >
    <span className="candle-glow-halo" />
    <span className="candle-flame">
      <span className="candle-flame-core" />
    </span>
    <span className="candle-wick" />
    <span className="candle-wax" />
  </div>
);
