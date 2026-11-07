/** Only an intentional email-auth callback bypasses the landing. */
export const isAuthReturn = (location: Pick<Location, 'search' | 'hash'>): boolean => {
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  return query.get('auth') === 'complete' || query.has('code') || hash.has('access_token');
};
