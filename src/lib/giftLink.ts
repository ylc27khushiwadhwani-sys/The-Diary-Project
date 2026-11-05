/**
 * Dedicated letters: the whole letter travels inside the link itself
 * (base64url in the hash), so a one-time link needs no database row and
 * only the person holding the link can read it.
 */

export type GiftKind = "letter" | "postcard" | "gift";
export type GiftObject = "flower" | "candle" | "star";

export interface GiftPayload {
  t: string | null;
  c: string;
  f: string;
  k: GiftKind;
  g?: GiftObject;
}

export const encodeGift = (payload: GiftPayload): string => {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const decodeGift = (encoded: string): GiftPayload | null => {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    const payload = JSON.parse(json) as GiftPayload;
    if (!payload || typeof payload.c !== "string" || !payload.c) return null;
    return payload;
  } catch {
    return null;
  }
};

export const giftHash = (payload: GiftPayload): string =>
  `#gift=${encodeGift(payload)}`;

export const giftFromLocation = (): GiftPayload | null => {
  const hash = window.location.hash;
  if (!hash.startsWith("#gift=")) return null;
  return decodeGift(hash.slice("#gift=".length));
};

export const giftUrl = (payload: GiftPayload): string =>
  `${window.location.origin}${window.location.pathname}${giftHash(payload)}`;
