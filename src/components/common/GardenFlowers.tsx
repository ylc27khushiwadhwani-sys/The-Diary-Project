import React from "react";

/**
 * Tall illustrated blooms along the base of a room, drawn in the spirit of
 * the gardenletters.online reference: thin curved stems, long leaves and
 * iris-like flowers with a gentle sway. Golden at night (dark mode),
 * coloured irises by day (light mode) - the CSS keys off html.light.
 */

const Flower: React.FC<{ variant: string; style?: React.CSSProperties }> = ({
  variant,
  style,
}) => (
  <svg
    viewBox="0 0 60 170"
    className={`gf-flower ${variant}`}
    style={style}
    aria-hidden="true"
  >
    {/* stem */}
    <path
      d="M30 170 C 27 132 35 100 30 62"
      fill="none"
      className="gf-stem-path"
    />
    {/* leaves */}
    <path d="M29 168 C 17 142 7 122 3 98 C 16 118 24 138 29 152 Z" className="gf-leaf" />
    <path d="M31 168 C 43 144 53 128 57 106 C 45 124 36 142 31 154 Z" className="gf-leaf" />
    {/* iris bloom: one upright standard, two falls */}
    <path d="M30 62 C 21 50 21 34 30 22 C 39 34 39 50 30 62 Z" className="gf-petal-up" />
    <path d="M30 60 C 17 58 7 64 3 77 C 16 79 27 72 30 62 Z" className="gf-petal-fall" />
    <path d="M30 60 C 43 58 53 64 57 77 C 44 79 33 72 30 62 Z" className="gf-petal-fall" />
    <circle cx="30" cy="57" r="3.4" className="gf-heart" />
  </svg>
);

export const GardenFlowers: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`garden-flowers ${className}`} aria-hidden="true">
    <div className="gf-cluster">
      <Flower variant="gf-crimson" style={{ height: "clamp(96px, 17vh, 168px)" }} />
      <Flower
        variant="gf-gold"
        style={{ height: "clamp(72px, 12vh, 124px)", animationDelay: "-1.6s" }}
      />
    </div>
    <div className="gf-cluster">
      <Flower
        variant="gf-blue"
        style={{ height: "clamp(78px, 13vh, 132px)", animationDelay: "-2.8s" }}
      />
      <Flower
        variant="gf-crimson"
        style={{ height: "clamp(100px, 18vh, 176px)", animationDelay: "-0.9s" }}
      />
    </div>
  </div>
);
