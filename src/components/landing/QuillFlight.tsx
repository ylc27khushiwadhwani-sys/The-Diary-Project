import React from "react";

/**
 * Landing side-scene: a quill writes on a small letter; the letter folds
 * itself into an origami plane and flies away. Pure CSS, ~9s loop.
 * Two extra finished planes drift through the background for depth.
 */
export const QuillFlight: React.FC = () => (
  <div className="quill-scene" aria-hidden="true">
    {/* drifting background planes */}
    <svg className="qf-plane qf-plane-bg qf-plane-bg-1" viewBox="0 0 64 64">
      <path d="M6 40 L58 8 L34 52 L28 38 Z" fill="#e8cf9f" opacity="0.9" />
      <path d="M28 38 L58 8" stroke="#b98d55" strokeWidth="1.4" />
    </svg>
    <svg className="qf-plane qf-plane-bg qf-plane-bg-2" viewBox="0 0 64 64">
      <path d="M6 40 L58 8 L34 52 L28 38 Z" fill="#d9bd85" opacity="0.7" />
      <path d="M28 38 L58 8" stroke="#a87f4c" strokeWidth="1.4" />
    </svg>

    {/* the writing desk vignette */}
    <div className="qf-desk">
      {/* the letter being written */}
      <div className="qf-letter">
        <div className="qf-line qf-line-1" />
        <div className="qf-line qf-line-2" />
        <div className="qf-line qf-line-3" />
      </div>

      {/* the folded plane that flies out of the letter */}
      <svg className="qf-plane qf-plane-hero" viewBox="0 0 64 64">
        <path d="M6 40 L58 8 L34 52 L28 38 Z" fill="#f0dcb0" />
        <path d="M28 38 L58 8" stroke="#b98d55" strokeWidth="1.4" />
      </svg>

      {/* the quill */}
      <svg className="qf-quill" viewBox="0 0 80 80" fill="none">
        <path
          d="M62 8 C44 14 30 30 24 52 L20 66 L26 60 C46 50 58 32 62 8 Z"
          fill="#f3ece0"
          opacity="0.95"
        />
        <path d="M62 8 C48 20 36 38 26 58" stroke="#b98d55" strokeWidth="1.6" />
        <path d="M20 66 L16 72 L22 68 Z" fill="#d4a373" />
      </svg>

      {/* candle glow under it all */}
      <div className="qf-glow" />
    </div>
  </div>
);
