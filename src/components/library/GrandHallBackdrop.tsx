import React from "react";
import { CandleFlame } from "../cinematic/CandleFlame";

// A warm wall of library bookshelves, volumetric light beams and drifting
// dust motes - the grand-hall atmosphere that sits behind the reading room
// and the private study. Pure SVG + CSS, painted once, no image assets.
const SPINES = [
  "#5b2a22",
  "#3f4a3a",
  "#6b4a2a",
  "#2f3a4f",
  "#7a3b2e",
  "#4a3326",
  "#8a6a3a",
  "#33262b",
  "#55623f",
  "#6a2f3a",
];
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Rows of book spines on dark wooden shelves, generated once (deterministic, crisp at any size).
const BookWall: React.FC = () => {
  const rows = 6;
  const rowH = 136;
  const items: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const baseY = 40 + (r + 1) * rowH;
    let x = 0;
    let i = 0;
    while (x < 1200) {
      const k = r * 100 + i++;
      const w = 15 + Math.floor(rand(k) * 22);
      const h = 78 + Math.floor(rand(k + 0.5) * 40);
      const lean = rand(k + 0.9) > 0.97;
      items.push(
        <g
          key={k}
          transform={
            lean ? "rotate(-6 " + (x + w) + " " + baseY + ")" : undefined
          }
        >
          <rect
            x={x}
            y={baseY - h}
            width={w}
            height={h}
            fill={SPINES[Math.floor(rand(k + 0.2) * SPINES.length)]}
          />
          <rect
            x={x}
            y={baseY - h + 10}
            width={w}
            height="3"
            fill="#d9b66a"
            opacity="0.55"
          />
          <rect
            x={x}
            y={baseY - 14}
            width={w}
            height="3"
            fill="#d9b66a"
            opacity="0.4"
          />
          <rect
            x={x + w - 2}
            y={baseY - h}
            width="2"
            height={h}
            fill="#000"
            opacity="0.28"
          />
        </g>,
      );
      x += w + 1;
    }
    items.push(
      <rect
        key={"s" + r}
        x="0"
        y={baseY}
        width="1200"
        height="14"
        fill="#2a1810"
      />,
    );
  }
  return (
    <svg
      className="grand-hall-windows hall-parallax-far"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="1200" height="900" fill="#1a0f0a" />
      {items}
      {[0, 400, 800, 1186].map((x) => (
        <rect key={x} x={x} y="0" width="14" height="900" fill="#24140d" />
      ))}
    </svg>
  );
};

export const GrandHallBackdrop: React.FC<{ variant?: "hall" | "study" }> = ({
  variant = "hall",
}) => {
  // The backdrop stays still: no cursor-driven parallax. (Removed at the
  // owner's request; the hall keeps its candlelight, rays and drift.)
  return (
    <div
      className={`grand-hall-backdrop hall-pushin ${variant === "study" ? "grand-hall-study" : ""}`}
      aria-hidden="true"
    >
      <BookWall />
      <div className="grand-hall-beams" />
      <div className="hall-rays">
        <span className="hall-ray r1" />
        <span className="hall-ray r2" />
        <span className="hall-ray r3" />
      </div>
      <span className="hall-pool p1" />
      <span className="hall-pool p2" />
      <span className="hall-pool p3" />
      <div className="hall-dapple" />
      <div className="grand-hall-dust" />
      <div className="grand-hall-dust dust-slow" />
      <div className="hall-tint" />
      <div className="hall-vignette" />
      <span className="hall-moth" aria-hidden="true">
        <svg viewBox="0 0 40 30" width="22" height="16">
          <g className="moth-wing moth-l">
            <path
              d="M20 15 C12 2 2 4 3 13 C4 21 13 22 20 17 Z"
              fill="#cdbb94"
              fillOpacity="0.85"
            />
            <path
              d="M20 17 C14 22 10 28 15 27 C18 26 20 22 20 17 Z"
              fill="#a8946b"
              fillOpacity="0.8"
            />
          </g>
          <g className="moth-wing moth-r">
            <path
              d="M20 15 C28 2 38 4 37 13 C36 21 27 22 20 17 Z"
              fill="#cdbb94"
              fillOpacity="0.85"
            />
            <path
              d="M20 17 C26 22 30 28 25 27 C22 26 20 22 20 17 Z"
              fill="#a8946b"
              fillOpacity="0.8"
            />
          </g>
          <ellipse cx="20" cy="16" rx="1.4" ry="5" fill="#5a4a30" />
        </svg>
      </span>
      <div className="hall-parallax-near">
        <CandleFlame
          className="hall-candle hc-left"
          size={variant === "study" ? 0.8 : 1}
          delay={0.4}
        />
        <CandleFlame className="hall-candle hc-right" size={0.7} delay={1.7} />
      </div>
    </div>
  );
};
