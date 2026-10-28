const ENTRY_KEY = 'paper-vault:entry-seen';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True once the visitor has seen the opening sequence + ink title. */
export const hasSeenEntry = (): boolean => {
  try {
    return window.localStorage.getItem(ENTRY_KEY) === '1';
  } catch {
    return true; // storage blocked: never trap a visitor in the intro
  }
};

export const markEntrySeen = (): void => {
  try {
    window.localStorage.setItem(ENTRY_KEY, '1');
  } catch {
    /* ignore */
  }
};

/** Fired to make the dust canvas release a burst of embers. */
export const EMBER_EVENT = 'paper-vault:embers';
export const burstEmbers = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EMBER_EVENT));
};
