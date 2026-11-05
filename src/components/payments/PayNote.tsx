import React from "react";
import { PaymentResult } from "../../lib/payments";

/** Honest status line for a payment attempt. Never claims a charge that did not happen. */
export const PayNote: React.FC<{ result: PaymentResult | null }> = ({
  result,
}) => {
  if (!result) return null;
  const text =
    result.status === "not_configured"
      ? "Payments are not switched on yet, so nothing was charged. This will work as soon as the library opens its payment account."
      : result.status === "cancelled"
        ? "Payment cancelled. Nothing was charged."
        : result.status === "paid_pending_confirmation"
          ? "Payment received. Confirming it with the bank now; this unlocks within a minute."
          : result.message;
  return (
    <p
      role="status"
      className="mt-3 text-xs font-serif italic text-amber-200/90"
    >
      {text}
    </p>
  );
};
