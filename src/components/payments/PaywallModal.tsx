import React, { useState } from "react";
import { X } from "lucide-react";
import {
  startPayment,
  PaymentResult,
  LETTERS_PRICE_LABEL,
} from "../../lib/payments";
import { PayNote } from "./PayNote";
import { WaxSeal } from "../library/WaxSeal";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Shown only after a writer reaches their free letters. Never advertised before that. */
export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  if (!isOpen) return null;
  const pay = async () => {
    setBusy(true);
    setResult(await startPayment("letters"));
    setBusy(false);
  };
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-label="Keep writing"
    >
      <div className="relative w-full max-w-md parchment-sheet reader-ivory letter-deckle p-8 text-center text-wood-950">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 p-1 text-wood-700 hover:text-wood-950 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mx-auto mb-3 w-fit">
          <WaxSeal color="crimson" size="lg" icon="lock" />
        </div>
        <h2 className="font-serif text-2xl font-bold mb-2">
          Your free pages are full
        </h2>
        <p className="font-body text-sm text-wood-800 italic leading-relaxed mb-5">
          Every letter you have written is safe and stays yours. To keep writing
          new ones, continue with a one-time payment
          {LETTERS_PRICE_LABEL ? ` of ${LETTERS_PRICE_LABEL}` : ""}.
        </p>
        <button
          type="button"
          onClick={pay}
          disabled={busy}
          className="px-6 py-3 bg-wax-crimson hover:bg-wax-crimsonBright text-white rounded-full font-serif text-sm font-semibold shadow-candle border border-red-500/30 cursor-pointer disabled:opacity-60"
        >
          {busy ? "Opening payment..." : "Continue writing"}
        </button>
        <PayNote result={result} />
      </div>
    </div>
  );
};
