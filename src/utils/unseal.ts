import type { Note } from '../types/database';

/**
 * Date seals ride on the existing tags column as "unseal:YYYY-MM-DD", so no
 * database change is needed. The date is the local calendar day the letter
 * opens for everyone. It is a soft seal: the page hides the letter until then.
 */
export const UNSEAL_PREFIX = 'unseal:';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const getUnsealDate = (tags?: string[] | null): string | null => {
  const tag = (tags ?? []).find((t) => t.toLowerCase().startsWith(UNSEAL_PREFIX));
  if (!tag) return null;
  const value = tag.slice(UNSEAL_PREFIX.length);
  return DATE_RE.test(value) ? value : null;
};

/** Local midnight at the start of the unseal day. */
const startOfDay = (isoDate: string): Date => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const isDateSealed = (note: Pick<Note, 'tags'>, now: Date = new Date()): boolean => {
  const date = getUnsealDate(note.tags);
  return date !== null && now.getTime() < startOfDay(date).getTime();
};

export const daysUntilUnseal = (isoDate: string, now: Date = new Date()): number => {
  const ms = startOfDay(isoDate).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86400000));
};

export const formatUnsealDate = (isoDate: string): string =>
  startOfDay(isoDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

export const withUnsealTag = (tags: string[], isoDate: string | null): string[] => {
  const rest = tags.filter((t) => !t.toLowerCase().startsWith(UNSEAL_PREFIX));
  return isoDate && DATE_RE.test(isoDate) ? [...rest, `${UNSEAL_PREFIX}${isoDate}`] : rest;
};

export const visibleTags = (tags?: string[] | null): string[] =>
  (tags ?? []).filter((t) => !t.toLowerCase().startsWith(UNSEAL_PREFIX));
