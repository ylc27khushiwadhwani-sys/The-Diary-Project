export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The doors play on every page load. This flag lives in memory only, so it stops the opening
// sequence and ink title from replaying while the visitor moves around inside one page load.
let entrySeenThisLoad = false;

/** True once the opening sequence has finished (or been skipped) during this page load. */
export const hasSeenEntry = (): boolean => entrySeenThisLoad;

export const markEntrySeen = (): void => {
  entrySeenThisLoad = true;
};

/** Fired to make the dust canvas release a burst of embers. */
export const EMBER_EVENT = "paper-vault:embers";
export const burstEmbers = (): void => {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent(EMBER_EVENT));
};
