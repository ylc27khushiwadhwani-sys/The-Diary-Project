import React, { useId } from "react";

/**
 * Watercolor garden blooms along the base of a room, in the spirit of the
 * gardenletters.online reference: soft painted petals with light centres and
 * deeper edges, thin curved stems, long blade leaves, dense clusters that
 * sway gently. Golden at night (dark mode), coloured irises and buttercups
 * by day (light mode) - the CSS keys off html.light. Shapes are drawn by
 * hand here; no reference artwork is copied.
 */

type BloomType = "iris" | "round" | "cup";

interface FlowerSpec {
  type: BloomType;
  variant: string;
  height: number;
  delay: number;
  duration: number;
}

const Flower: React.FC<FlowerSpec> = ({
  type,
  variant,
  height,
  delay,
  duration,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg
      viewBox="0 0 60 170"
      className={`gf-flower ${variant}`}
      style={{
        height,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`gf${id}`} cx="42%" cy="28%" r="78%">
          <stop offset="0%" className="gf-stop-hi" />
          <stop offset="55%" className="gf-stop-mid" />
          <stop offset="100%" className="gf-stop-deep" />
        </radialGradient>
      </defs>
      {/* stem */}
      <path
        d="M30 170 C 27 134 35 102 30 64"
        fill="none"
        className="gf-stem-path"
      />
      {/* long blade leaves */}
      <path
        d="M29 168 C 16 144 6 124 2 100 C 15 119 24 140 29 154 Z"
        className="gf-leaf"
      />
      <path
        d="M31 168 C 44 146 54 130 58 108 C 46 125 36 144 31 156 Z"
        className="gf-leaf"
      />
      <path
        d="M30 168 C 24 150 22 136 24 122 C 29 136 31 150 30 162 Z"
        className="gf-leaf gf-leaf-soft"
      />
      {type === "iris" && (
        <g transform="translate(30 46)" fill={`url(#gf${id})`}>
          {/* three upright spears */}
          <path d="M0 0 C -4 -12, -3 -28, 0 -36 C 3 -28, 4 -12, 0 0 Z" />
          <path d="M0 0 C -11 -6, -13 -19, -9 -28 C -2 -21, 1 -10, 0 0 Z" />
          <path d="M0 0 C 11 -6, 13 -19, 9 -28 C 2 -21, -1 -10, 0 0 Z" />
          {/* two falls */}
          <path
            d="M0 2 C -12 2, -21 8, -23 17 C -12 18, -3 11, 0 2 Z"
            className="gf-fall"
          />
          <path
            d="M0 2 C 12 2, 21 8, 23 17 C 12 18, 3 11, 0 2 Z"
            className="gf-fall"
          />
          <circle cx="0" cy="2" r="3" className="gf-heart" />
        </g>
      )}
      {type === "round" && (
        <g transform="translate(30 42)">
          {[0, 72, 144, 216, 288].map((a) => (
            <path
              key={a}
              transform={`rotate(${a})`}
              d="M0 0 C -10 -7, -13 -21, -5 -27 C -1 -30, 1 -30, 5 -27 C 13 -21, 10 -7, 0 0 Z"
              fill={`url(#gf${id})`}
            />
          ))}
          <circle r="4.8" className="gf-heart" />
        </g>
      )}
      {type === "cup" && (
        <g transform="translate(30 44)">
          <path
            d="M-15 -10 C -17 7, -8 18, 0 18 C 8 18, 17 7, 15 -10 C 10 -3, 5 -5, 0 -13 C -5 -5, -10 -3, -15 -10 Z"
            fill={`url(#gf${id})`}
          />
          <path
            d="M-15 -10 C -10 -3, -5 -5, 0 -13 C 5 -5, 10 -3, 15 -10"
            fill="none"
            className="gf-cup-rim"
          />
        </g>
      )}
    </svg>
  );
};

const Cluster: React.FC<{ flowers: FlowerSpec[] }> = ({ flowers }) => (
  <div className="gf-cluster">
    {flowers.map((f, i) => (
      <Flower key={i} {...f} />
    ))}
  </div>
);

export const GardenFlowers: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`garden-flowers ${className}`} aria-hidden="true">
    <Cluster
      flowers={[
        { type: "iris", variant: "gf-v1", height: 158, delay: 0, duration: 5.4 },
        { type: "round", variant: "gf-v2", height: 112, delay: -1.4, duration: 4.8 },
        { type: "cup", variant: "gf-v3", height: 134, delay: -2.6, duration: 5.9 },
        { type: "round", variant: "gf-v4", height: 92, delay: -0.8, duration: 5.1 },
      ]}
    />
    <Cluster
      flowers={[
        { type: "cup", variant: "gf-v2", height: 122, delay: -2.1, duration: 5.6 },
        { type: "iris", variant: "gf-v5", height: 148, delay: -0.5, duration: 5.0 },
        { type: "round", variant: "gf-v1", height: 104, delay: -3.2, duration: 6.1 },
      ]}
    />
    <Cluster
      flowers={[
        { type: "cup", variant: "gf-v3", height: 152, delay: -1.1, duration: 5.2 },
        { type: "iris", variant: "gf-v4", height: 118, delay: -2.9, duration: 4.9 },
        { type: "round", variant: "gf-v5", height: 138, delay: -0.3, duration: 5.8 },
        { type: "iris", variant: "gf-v2", height: 96, delay: -1.9, duration: 5.5 },
      ]}
    />
  </div>
);
