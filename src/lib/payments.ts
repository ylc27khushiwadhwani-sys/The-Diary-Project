import { supabase } from "./supabase";

export type PaymentPurpose = "letters" | "community";

export const FREE_LETTER_LIMIT = 10;

export const PAYMENTS_ORDER_URL: string =
  import.meta.env.VITE_PAYMENTS_ORDER_URL || "";
export const COFFEE_LINK: string = import.meta.env.VITE_COFFEE_LINK || "";
export const LETTERS_PRICE_LABEL: string =
  import.meta.env.VITE_LETTERS_PRICE_LABEL || "";
export const COMMUNITY_PRICE_LABEL: string =
  import.meta.env.VITE_COMMUNITY_PRICE_LABEL || "";

export const paymentsLive = (): boolean => Boolean(PAYMENTS_ORDER_URL);

export type PaymentResult =
  | { status: "not_configured" }
  | { status: "cancelled" }
  | { status: "error"; message: string }
  | { status: "paid_pending_confirmation" };

interface RazorpayCheckout {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

const loadCheckoutScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

/**
 * INTEGRATION POINT. Asks the server (supabase/functions/razorpay-order) for an order,
 * then opens Razorpay Checkout. Success is never decided here: only the signed webhook
 * (supabase/functions/razorpay-webhook) marks a payment captured and unlocks anything.
 * With no order endpoint configured it returns not_configured and charges nothing.
 */
export const startPayment = async (
  purpose: PaymentPurpose,
  email?: string,
): Promise<PaymentResult> => {
  if (!PAYMENTS_ORDER_URL) return { status: "not_configured" };
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(PAYMENTS_ORDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ purpose, email }),
    });
    const order = await res.json();
    if (!res.ok)
      return {
        status: "error",
        message: order?.error || "Could not start the payment.",
      };
    if (!(await loadCheckoutScript()) || !window.Razorpay)
      return { status: "error", message: "Could not load the payment window." };
    return await new Promise<PaymentResult>((resolve) => {
      const rzp = new window.Razorpay!({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: "The Paper Vault",
        prefill: email ? { email } : undefined,
        theme: { color: "#8a1426" },
        handler: () => resolve({ status: "paid_pending_confirmation" }),
        modal: { ondismiss: () => resolve({ status: "cancelled" }) },
      });
      rzp.open();
    });
  } catch {
    return { status: "error", message: "Could not reach the payment service." };
  }
};

export interface QuotaState {
  count: number;
  limit: number;
  paid: boolean;
  atLimit: boolean;
}

/** Reads the signed-in user's letter count and quota row. The limit is not shown anywhere until it is hit. */
export const fetchQuota = async (userId: string): Promise<QuotaState> => {
  let limit = FREE_LETTER_LIMIT;
  let paid = false;
  let count = 0;
  try {
    const { data } = await supabase
      .from("letter_quota")
      .select("free_limit, paid")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      limit = data.free_limit ?? FREE_LETTER_LIMIT;
      paid = Boolean(data.paid);
    }
    const res = await supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    count = res.count ?? 0;
  } catch {
    /* quota table not created yet: fall back to the default limit */
  }
  return { count, limit, paid, atLimit: !paid && count >= limit };
};

export const isLimitError = (
  error: { message?: string } | null | undefined,
): boolean =>
  Boolean(error?.message && error.message.includes("LETTER_LIMIT_REACHED"));
