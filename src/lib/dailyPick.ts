/** Deterministic daily picks: the same choice all day, for everyone. */

export const todayKey = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

/** Small stable string hash (FNV-1a-ish) so a date key becomes an index. */
const hashString = (value: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
};

/** Index into `length` items that stays fixed for the given key (a day). */
export const dailyIndex = (length: number, key: string = todayKey()): number =>
  length <= 0 ? 0 : hashString(key) % length;

export const pickDaily = <T>(items: T[], key: string = todayKey()): T | null =>
  items.length === 0 ? null : items[dailyIndex(items.length, key)];
