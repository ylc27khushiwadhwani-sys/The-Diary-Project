import React, { useId } from 'react';

interface HeartSealProps {
  size?: number;
  className?: string;
  /** Show a lock mark instead of the pressed leaf (sealed letters). */
  locked?: boolean;
  title?: string;
}

/** Glossy burgundy heart-shaped wax seal with a pressed leaf crest. */
export const HeartSeal: React.FC<HeartSealProps> = ({ size = 64, className = '', locked = false, title }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 100 96"
      width={size}
      height={size * 0.96}
      className={`heart-seal ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id={`w${id}`} cx="36%" cy="30%" r="80%">
          <stop offset="0" stopColor="#c0343f" />
          <stop offset="0.45" stopColor="#8a1426" />
          <stop offset="1" stopColor="#3d0710" />
        </radialGradient>
        <radialGradient id={`h${id}`} cx="30%" cy="22%" r="40%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`r${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
        </filter>
      </defs>
      <g filter={`url(#r${id})`}>
        <path
          d="M50 90 C 14 62 6 40 12 25 C 19 8 40 8 50 26 C 60 8 81 8 88 25 C 94 40 86 62 50 90 Z"
          fill={`url(#w${id})`}
          stroke="#2a050b"
          strokeOpacity="0.6"
          strokeWidth="1.5"
        />
      </g>
      <path
        d="M50 80 C 22 58 15 41 20 29 C 25 17 41 17 50 32 C 59 17 75 17 80 29 C 85 41 78 58 50 80 Z"
        fill="none"
        stroke="#2a050b"
        strokeOpacity="0.55"
        strokeWidth="1.6"
      />
      <path
        d="M50 80 C 22 58 15 41 20 29 C 25 17 41 17 50 32 C 59 17 75 17 80 29 C 85 41 78 58 50 80 Z"
        fill="none"
        stroke="#e87b84"
        strokeOpacity="0.28"
        strokeWidth="1"
        transform="translate(-0.8 -0.8)"
      />
      {locked ? (
        <g fill="#3a0610" fillOpacity="0.75" transform="translate(50 46)">
          <rect x="-9" y="-2" width="18" height="14" rx="2" />
          <path d="M-5 -2 V-7 a5 5 0 0 1 10 0 V-2" fill="none" stroke="#3a0610" strokeOpacity="0.75" strokeWidth="2.6" />
        </g>
      ) : (
        <g transform="translate(50 47) scale(0.34)" fill="#3a0610" fillOpacity="0.7">
          <path d="M0 -40 L9 -20 L32 -28 L21 -6 L40 0 L20 12 L28 32 L8 24 L0 44 L-8 24 L-28 32 L-20 12 L-40 0 L-21 -6 L-32 -28 L-9 -20 Z" />
        </g>
      )}
      <ellipse cx="34" cy="26" rx="14" ry="8" fill={`url(#h${id})`} transform="rotate(-24 34 26)" />
    </svg>
  );
};
