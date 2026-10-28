import React, { useEffect, useRef } from "react";
import { CandleFlame } from "../cinematic/CandleFlame";
import { prefersReducedMotion } from "../../lib/motion";

// Gothic lancet windows with tracery, volumetric light beams and drifting
// dust motes - the grand-hall atmosphere that sits behind the reading room
// and the private study. Pure SVG + CSS, painted once, no image assets.
export const GrandHallBackdrop: React.FC<{ variant?: "hall" | "study" }> = ({
  variant = "hall",
}) => {
  const windows = [300, 600, 900];
  const ref = useRef<HTMLDivElement>(null);

  // Pointer parallax across three depths (windows far, rays mid, candles near).
  // Touch/coarse pointers and reduced-motion get a slow automatic drift instead.
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches
    )
      return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--px", `${(nx * 26).toFixed(1)}px`);
        el.style.setProperty("--py", `${(ny * 14).toFixed(1)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`grand-hall-backdrop hall-pushin ${variant === "study" ? "grand-hall-study" : ""}`}
      aria-hidden="true"
    >
      <svg
        className="grand-hall-windows hall-parallax-far"
        viewBox="0 0 1200 640"
        preserveAspectRatio="xMidYMin slice"
      >
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
              <line
                x1={cx}
                y1="118"
                x2={cx}
                y2="640"
                stroke="#0a0705"
                strokeWidth="9"
              />
              <line
                x1={cx - 70}
                y1="330"
                x2={cx + 70}
                y2="330"
                stroke="#0a0705"
                strokeWidth="9"
              />
              <circle
                cx={cx}
                cy="160"
                r="27"
                fill="none"
                stroke="#0a0705"
                strokeWidth="8"
              />
              <path
                d={`M ${cx - 27} 160 L ${cx + 27} 160 M ${cx} 133 L ${cx} 187`}
                stroke="#0a0705"
                strokeWidth="6"
              />
            </g>
          ))}
        </g>
      </svg>
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
