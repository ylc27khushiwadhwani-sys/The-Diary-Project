import React from "react";

/**
 * Hand-drawn gift objects, rendered as inline SVG in the vault's warm
 * palette. Every flower and keepsake the sender can fold into a letter
 * lives here - no emoji, no images, so they render identically in the
 * composer, the preview and the recipient's opening.
 */

export type GiftArtId =
  | "rose"
  | "marigold"
  | "jasmine"
  | "sunflower"
  | "lotus"
  | "pressed-flower"
  | "candle"
  | "paper-star"
  | "paper-boat";

interface GiftArtProps {
  id: GiftArtId | string;
  size?: number;
}

const Rose: React.FC = () => (
  <g>
    <path d="M50 62 C50 74 47 84 44 92" stroke="#5d7a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M47 76 C40 72 34 73 30 78 C36 81 43 81 47 76 Z" fill="#5d7a3a" />
    <path d="M50 30 C58 30 63 38 63 46 C63 56 56 62 50 62 C44 62 37 56 37 46 C37 38 42 30 50 30 Z" fill="#a63a46" />
    <path d="M50 36 C55 36 58 41 58 46 C58 52 54 56 50 56 C46 56 42 52 42 46 C42 41 45 36 50 36 Z" fill="#c14a56" />
    <path d="M50 41 C53 41 55 44 55 47 C55 50 53 52 50 52 C47 52 45 50 45 47 C45 44 47 41 50 41 Z" fill="#d95d68" />
    <path d="M50 30 C50 26 52 24 55 23 C54 27 52 29 50 30 Z" fill="#7f2d37" />
  </g>
);

const Marigold: React.FC = () => (
  <g>
    <path d="M50 58 C50 70 48 82 46 92" stroke="#5d7a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      const x1 = 50 + 8 * Math.cos(a);
      const y1 = 44 + 8 * Math.sin(a);
      const x2 = 50 + 20 * Math.cos(a);
      const y2 = 44 + 20 * Math.sin(a);
      return (
        <path
          key={i}
          d={`M${x1} ${y1} Q${50 + 23 * Math.cos(a + 0.26)} ${44 + 23 * Math.sin(a + 0.26)} ${x2} ${y2} Q${50 + 23 * Math.cos(a - 0.26)} ${44 + 23 * Math.sin(a - 0.26)} ${x1} ${y1} Z`}
          fill={i % 2 ? "#e8912d" : "#d97e1e"}
        />
      );
    })}
    <circle cx="50" cy="44" r="7" fill="#b35c12" />
    <circle cx="50" cy="44" r="4" fill="#8f470c" />
  </g>
);

const Jasmine: React.FC = () => (
  <g>
    <path d="M50 60 C50 72 48 82 45 92" stroke="#5d7a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {Array.from({ length: 6 }).map((_, i) => {
      const a = (i * 60 * Math.PI) / 180 - Math.PI / 2;
      const cx = 50 + 11 * Math.cos(a);
      const cy = 42 + 11 * Math.sin(a);
      return <ellipse key={i} cx={cx} cy={cy} rx="7.5" ry="5" fill="#f3ead2" transform={`rotate(${(a * 180) / Math.PI + 90} ${cx} ${cy})`} />;
    })}
    <circle cx="50" cy="42" r="4.5" fill="#e8c34f" />
    <path d="M47 72 C41 69 36 70 33 75 C38 77 44 76 47 72 Z" fill="#5d7a3a" />
  </g>
);

const Sunflower: React.FC = () => (
  <g>
    <path d="M50 62 C50 74 48 84 45 92" stroke="#5d7a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M48 74 C56 71 62 73 65 79 C59 81 52 80 48 74 Z" fill="#5d7a3a" />
    {Array.from({ length: 14 }).map((_, i) => {
      const a = (i * (360 / 14) * Math.PI) / 180;
      const x1 = 50 + 10 * Math.cos(a);
      const y1 = 42 + 10 * Math.sin(a);
      const x2 = 50 + 24 * Math.cos(a);
      const y2 = 42 + 24 * Math.sin(a);
      return (
        <path
          key={i}
          d={`M${x1} ${y1} L${50 + 27 * Math.cos(a + 0.2)} ${42 + 27 * Math.sin(a + 0.2)} L${x2} ${y2} L${50 + 27 * Math.cos(a - 0.2)} ${42 + 27 * Math.sin(a - 0.2)} Z`}
          fill="#e8b93c"
        />
      );
    })}
    <circle cx="50" cy="42" r="11" fill="#6e4119" />
    <circle cx="46" cy="40" r="1.4" fill="#4a2a0e" />
    <circle cx="53" cy="39" r="1.4" fill="#4a2a0e" />
    <circle cx="50" cy="45" r="1.4" fill="#4a2a0e" />
    <circle cx="55" cy="44" r="1.4" fill="#4a2a0e" />
  </g>
);

const Lotus: React.FC = () => (
  <g>
    <path d="M24 62 C30 52 40 48 50 48 C60 48 70 52 76 62 C68 70 58 72 50 72 C42 72 32 70 24 62 Z" fill="#c9809b" />
    <path d="M36 58 C38 46 43 38 50 34 C57 38 62 46 64 58 C59 63 54 65 50 65 C46 65 41 63 36 58 Z" fill="#e0a4ba" />
    <path d="M50 34 C46 40 44 48 44 56 C46 60 48 62 50 63 C52 62 54 60 56 56 C56 48 54 40 50 34 Z" fill="#efc3d2" />
    <path d="M20 66 C32 76 68 76 80 66 C74 78 62 84 50 84 C38 84 26 78 20 66 Z" fill="#a95f7c" />
    <ellipse cx="50" cy="88" rx="18" ry="3.5" fill="#3d5a3a" opacity="0.55" />
  </g>
);

const PressedFlower: React.FC = () => (
  <g>
    <rect x="26" y="22" width="48" height="60" rx="2" fill="#f4ead0" opacity="0.28" />
    <rect x="30" y="26" width="40" height="52" rx="1" fill="none" stroke="#d4a94f" strokeWidth="0.8" opacity="0.6" />
    {Array.from({ length: 5 }).map((_, i) => {
      const a = (i * 72 * Math.PI) / 180 - Math.PI / 2;
      const cx = 50 + 9 * Math.cos(a);
      const cy = 44 + 9 * Math.sin(a);
      return <ellipse key={i} cx={cx} cy={cy} rx="6.5" ry="4" fill="#b87f8f" opacity="0.9" transform={`rotate(${(a * 180) / Math.PI + 90} ${cx} ${cy})`} />;
    })}
    <circle cx="50" cy="44" r="3.6" fill="#c9a44a" />
    <path d="M50 50 C50 58 49 64 48 70" stroke="#7a8a52" strokeWidth="1.6" fill="none" opacity="0.85" />
  </g>
);

const Candle: React.FC = () => (
  <g>
    <ellipse cx="50" cy="82" rx="16" ry="4" fill="#120b06" opacity="0.6" />
    <path d="M40 48 L60 48 L59 82 C59 85 55 86.5 50 86.5 C45 86.5 41 85 41 82 Z" fill="#e8d5ae" />
    <path d="M40 48 C40 50.5 44 52 50 52 C56 52 60 50.5 60 48 C60 45.5 56 44 50 44 C44 44 40 45.5 40 48 Z" fill="#f4e6c4" />
    <path d="M44 52 C44 56 43 58 42.5 60 L42 52.5 Z" fill="#d9c296" />
    <path d="M50 44 L50 38" stroke="#3a2a18" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M50 24 C54 29 55.5 33 50 38 C44.5 33 46 29 50 24 Z" fill="#e8912d" />
    <path d="M50 29 C52 31.5 52.5 33.5 50 36 C47.5 33.5 48 31.5 50 29 Z" fill="#f6d36b" />
  </g>
);

const PaperStar: React.FC = () => (
  <g>
    <path d="M50 22 L57 40 L76 41 L62 53 L67 72 L50 61 L33 72 L38 53 L24 41 L43 40 Z" fill="#f3d9a4" />
    <path d="M50 22 L57 40 L50 47 Z" fill="#e2c48d" />
    <path d="M50 47 L62 53 L67 72 L50 61 Z" fill="#d9b878" />
    <path d="M50 47 L38 53 L33 72 L50 61 Z" fill="#e8cf9f" />
    <path d="M50 22 L43 40 L50 47 Z" fill="#efd9ad" />
  </g>
);

const PaperBoat: React.FC = () => (
  <g>
    <path d="M22 62 L40 44 L60 44 L78 62 Z" fill="#f0e3c0" />
    <path d="M40 44 L50 26 L50 62 L22 62 Z" fill="#e4d3ac" />
    <path d="M50 26 L60 44 L50 62 Z" fill="#f4ead0" />
    <path d="M50 44 L50 62" stroke="#c9b384" strokeWidth="1" />
    <path d="M22 62 L78 62 L70 72 L30 72 Z" fill="#d9c296" />
    <path d="M26 78 C34 74 42 74 50 78 C58 82 66 82 74 78" stroke="#5a7050" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
  </g>
);

const ART: Record<GiftArtId, React.FC> = {
  rose: Rose,
  marigold: Marigold,
  jasmine: Jasmine,
  sunflower: Sunflower,
  lotus: Lotus,
  "pressed-flower": PressedFlower,
  candle: Candle,
  "paper-star": PaperStar,
  "paper-boat": PaperBoat,
};

// Links minted by the first version used these ids.
const LEGACY: Record<string, GiftArtId> = {
  flower: "pressed-flower",
  star: "paper-star",
};

export const GiftArt: React.FC<GiftArtProps> = ({ id, size = 64 }) => {
  const resolved = (ART[id as GiftArtId] ? id : LEGACY[id]) as
    | GiftArtId
    | undefined;
  const Art = resolved ? ART[resolved] : null;
  if (!Art) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <Art />
    </svg>
  );
};
