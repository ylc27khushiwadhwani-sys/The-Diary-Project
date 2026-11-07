import React from "react";

/**
 * Night sky over the landing garden: a field of small twinkling stars, a
 * couple of faint constellations, and a shooting star every once in a
 * while. Purely decorative - sits behind everything, never intercepts
 * clicks, and goes still for reduced-motion visitors.
 */

// Deterministic pseudo-random so the sky is the same on every visit.
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rand = mulberry32(20261108);
const STARS = Array.from({ length: 90 }, (_, i) => ({
  left: rand() * 100,
  top: rand() * 62,
  size: i % 9 === 0 ? 3 : i % 3 === 0 ? 2 : 1.4,
  delay: -rand() * 6,
  duration: 2.6 + rand() * 3.8,
  warm: rand() > 0.72,
}));

const Constellation: React.FC<{ className: string; points: [number, number][]; width: number }> = ({
  className,
  points,
  width,
}) => (
  <svg
    className={`lp-constellation ${className}`}
    style={{ width }}
    viewBox="0 0 100 100"
    aria-hidden="true"
  >
    <polyline
      points={points.map(([x, y]) => `${x},${y}`).join(" ")}
      fill="none"
      stroke="rgba(233, 213, 179, 0.22)"
      strokeWidth="0.7"
    />
    {points.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.9 : 1.3} fill="rgba(247, 236, 205, 0.85)" />
    ))}
  </svg>
);

export const LandingStars: React.FC = () => (
  <div className="lp-stars" aria-hidden="true">
    {STARS.map((s, i) => (
      <span
        key={i}
        className="lp-star"
        style={{
          left: `${s.left}%`,
          top: `${s.top}%`,
          width: s.size,
          height: s.size,
          animationDelay: `${s.delay}s`,
          animationDuration: `${s.duration}s`,
          background: s.warm ? "#f3d9a4" : "#f7ecd9",
        }}
      />
    ))}
    <Constellation
      className="lp-constellation-a"
      width={150}
      points={[
        [8, 72],
        [26, 50],
        [44, 58],
        [58, 34],
        [76, 22],
        [88, 36],
      ]}
    />
    <Constellation
      className="lp-constellation-b"
      width={110}
      points={[
        [12, 30],
        [30, 44],
        [46, 30],
        [62, 46],
        [84, 60],
      ]}
    />
    <span className="lp-shoot lp-shoot-1" />
    <span className="lp-shoot lp-shoot-2" />
    <span className="lp-shoot lp-shoot-3" />
  </div>
);
