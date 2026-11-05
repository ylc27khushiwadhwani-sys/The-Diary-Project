/**
 * Dedicated letters: the whole letter travels inside the link itself
 * (base64url in the hash), so a one-time link needs no database row and
 * only the person holding the link can read it.
 */

export type GiftKind = "letter" | "postcard" | "gift";
// ids come from src/lib/giftCatalog.ts; string keeps old links decoding.
export type GiftObject = string;

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

/** A record of every link the sender has minted, kept on this device.
 *  Hash-links carry no server row, so "opened" state cannot be known -
 *  the history is a memento, not a tracker. */
export interface GiftRecord {
  t: string | null;
  k: GiftKind;
  g?: GiftObject;
  f: string;
  at: string;
  url: string;
}

const GIFT_HISTORY_KEY = "paper-vault:gifts";

export const loadGiftRecords = (): GiftRecord[] => {
  try {
    const raw = localStorage.getItem(GIFT_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as GiftRecord[]) : [];
  } catch {
    return [];
  }
};

export const saveGiftRecord = (record: GiftRecord): GiftRecord[] => {
  const existing = loadGiftRecords();
  const next = [record, ...existing].slice(0, 20);
  try {
    localStorage.setItem(GIFT_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* a full drawer should never lose a letter */
  }
  return next;
};
