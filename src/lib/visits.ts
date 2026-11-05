const KEY = 'paper-vault:visits';
const SESSION_KEY = 'paper-vault:visit-counted';

/** Counts one visit per browser session. Returns the running total. */
export const registerVisit = (): number => {
  try {
    const current = parseInt(localStorage.getItem(KEY) || '0', 10) || 0;
    if (sessionStorage.getItem(SESSION_KEY)) return Math.max(current, 1);
    const next = current + 1;
    localStorage.setItem(KEY, String(next));
    sessionStorage.setItem(SESSION_KEY, '1');
    return next;
  } catch {
    return 1;
  }
};
