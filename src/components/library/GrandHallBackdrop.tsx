import React from 'react';

// Gothic lancet windows with tracery, volumetric light beams and drifting
// dust motes - the grand-hall atmosphere that sits behind the reading room
// and the private study. Pure SVG + CSS, painted once, no image assets.
export const GrandHallBackdrop: React.FC<{ variant?: 'hall' | 'study' }> = ({ variant = 'hall' }) => {
  const windows = [300, 600, 900];
  return (
    <div className={`grand-hall-backdrop ${variant === 'study' ? 'grand-hall-study' : ''}`} aria-hidden="true">
      <svg className="grand-hall-windows" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMin slice">
        <defs>
          <linearGradient id="paneGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6dfa4" stopOpacity="0.55" />
            <stop offset="1" stopColor="#c99a52" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="hallFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.5" stopColor="#ffffff" />
            <stop offset="1" stopColor="#000000" />
          </linearGradient>
          <mask id="hallFadeMask">
            <rect width="1200" height="640" fill="url(#hallFade)" />
          </mask>
        </defs>
        <g mask="url(#hallFadeMask)">
          {windows.map((cx) => (
            <g key={cx}>
              <path
                d={`M ${cx - 70} 640 L ${cx - 70} 230 Q ${cx - 70} 130 ${cx} 92 Q ${cx + 70} 130 ${cx + 70} 230 L ${cx + 70} 640 Z`}
                fill="url(#paneGlow)"
                stroke="#0a0705"
                strokeWidth="12"
              />
              <line x1={cx} y1="118" x2={cx} y2="640" stroke="#0a0705" strokeWidth="9" />
              <line x1={cx - 70} y1="330" x2={cx + 70} y2="330" stroke="#0a0705" strokeWidth="9" />
              <circle cx={cx} cy="160" r="27" fill="none" stroke="#0a0705" strokeWidth="8" />
              <path d={`M ${cx - 27} 160 L ${cx + 27} 160 M ${cx} 133 L ${cx} 187`} stroke="#0a0705" strokeWidth="6" />
            </g>
          ))}
        </g>
      </svg>
      <div className="grand-hall-beams" />
      <div className="grand-hall-dust" />
      <div className="grand-hall-dust dust-slow" />
    </div>
  );
};
