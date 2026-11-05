import React, { useState } from "react";
import { COFFEE_LINK } from "../../lib/payments";

const CupIcon: React.FC = () => (
  <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
    <path
      d="M9 4c0 2 2 2 2 4M14 3c0 2 2 2 2 5M19 4c0 2 2 2 2 4"
      stroke="#e8dab2"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      d="M5 12h19v6a8 8 0 0 1-8 8h-3a8 8 0 0 1-8-8z"
      fill="#c99a52"
      stroke="#5a3a18"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M24 14h2.5a3.5 3.5 0 0 1 0 7H23"
      fill="none"
      stroke="#5a3a18"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M7 14h15" stroke="#fff4d6" strokeWidth="1" opacity="0.5" />
  </svg>
);

/** Top-left of the Reading Room hero. Goes to the owner's payment link once one is set. */
export const CoffeeButton: React.FC = () => {
  const [note, setNote] = useState(false);
  const classes = "coffee-btn";
  const body = (
    <>
      <CupIcon />
      <span>
        like this idea? <b>buy me a coffee</b>
      </span>
    </>
  );
  return (
    <div className="coffee-wrap">
      {COFFEE_LINK ? (
        <a
          className={classes}
          href={COFFEE_LINK}
          target="_blank"
          rel="noopener noreferrer"
        >
          {body}
        </a>
      ) : (
        <button
          type="button"
          className={classes}
          onClick={() => setNote((v) => !v)}
        >
          {body}
        </button>
      )}
      {note && !COFFEE_LINK && (
        <p role="status" className="coffee-note">
          The coffee jar is not open yet. Thank you for wanting to fill it.
        </p>
      )}
    </div>
  );
};
