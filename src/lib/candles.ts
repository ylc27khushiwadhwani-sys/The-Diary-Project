/**
 * "Light a candle" - a quiet, anonymous resonance on a letter.
 * Kept on this device for now: honest copy says "you lit a candle",
 * never a fake global count. A shared count needs a small Supabase table.
 */
const KEY = "paper-vault:candles";

const readLit = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const isCandleLit = (noteId: string): boolean =>
  readLit().includes(noteId);

export const lightCandle = (noteId: string): void => {
  try {
    const lit = readLit();
    if (!lit.includes(noteId)) {
      localStorage.setItem(KEY, JSON.stringify([...lit, noteId]));
    }
  } catch {
    /* storage full or unavailable: the gesture still shows for the session */
  }
};
