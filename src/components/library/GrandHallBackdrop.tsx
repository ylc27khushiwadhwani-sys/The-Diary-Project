import React from "react";
import { CandleFlame } from "../cinematic/CandleFlame";

// A warm wall of library bookshelves, volumetric light beams and drifting
// dust motes - the grand-hall atmosphere that sits behind the reading room
// and the private study. Pure SVG + CSS, painted once, no image assets.
const BookWall = React.memo(() => <img src="/art/library-wall.svg" alt="" className="grand-hall-windows" aria-hidden="true" />);

export const GrandHallBackdrop: React.FC<{ variant?: "hall" | "study" }> = ({
  variant = "hall",
}) => {
  // The backdrop stays still: no cursor-driven parallax. (Removed at the
  // owner's request; the hall keeps its candlelight, rays and drift.)
  return (
    <div
      className={`grand-hall-backdrop ${variant === "study" ? "grand-hall-study" : ""}`}
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
