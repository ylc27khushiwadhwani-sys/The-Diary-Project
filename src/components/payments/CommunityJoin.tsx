import React, { useState } from "react";
import {
  startPayment,
  PaymentResult,
  COMMUNITY_PRICE_LABEL,
} from "../../lib/payments";
import { PayNote } from "./PayNote";

/** Paid newsletter and community join, near the bottom of the Reading Room. */
export const CommunityJoin: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setResult(await startPayment("community", email));
    setBusy(false);
  };
  return (
    <section
      className="px-6 py-16 border-t border-hairline bg-wood-950/50"
      data-testid="community-join"
    >
      <div className="mx-auto max-w-xl text-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="label-caps cursor-pointer inline-flex items-center gap-2 hover:text-gold-light"
        >
          <span>Subscribe to our newsletter · Join our community</span>
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <form
            onSubmit={join}
            className="mt-6 text-left parchment-sheet reader-ivory letter-deckle p-6 text-wood-950"
          >
            <p className="font-body text-sm italic text-wood-800 leading-relaxed mb-4">
              Letters from the library in your inbox, and a place among the
              people who read and write here
              {COMMUNITY_PRICE_LABEL ? ` (${COMMUNITY_PRICE_LABEL})` : ""}.
              Joining is a paid membership.
            </p>
            <label
              className="reader-footer-caps block mb-1"
              htmlFor="community-email"
            >
              Your email
            </label>
            <input
              id="community-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-md bg-amber-50 border border-amber-900/30 text-sm text-wood-950 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
            <button
              type="submit"
              disabled={!valid || busy}
              className="mt-4 w-full px-5 py-2.5 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-full font-serif text-sm font-semibold shadow-candle border border-red-500/30 cursor-pointer disabled:opacity-50"
            >
              {busy ? "Opening payment..." : "Join and pay"}
            </button>
            <PayNote result={result} />
          </form>
        )}
      </div>
    </section>
  );
};
