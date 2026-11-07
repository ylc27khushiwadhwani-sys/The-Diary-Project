import React, { useState } from "react";
import { COFFEE_LINK } from "../../lib/payments";

const CupIcon: React.FC = () => <img className="coffee-saucer" src="/art/coffee-saucer.webp" alt="" aria-hidden="true" />;

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
