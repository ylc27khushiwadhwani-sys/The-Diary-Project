import { describe, it, expect } from 'vitest';
import { isAuthReturn } from './authReturn';
describe('email authentication return', () => {
  it('enters the library for new and legacy email callbacks only', () => {
    expect(isAuthReturn({search:'?auth=complete',hash:''})).toBe(true);
    expect(isAuthReturn({search:'?code=callback',hash:''})).toBe(true);
    expect(isAuthReturn({search:'',hash:'#access_token=callback&type=magiclink'})).toBe(true);
    expect(isAuthReturn({search:'',hash:''})).toBe(false);
    expect(isAuthReturn({search:'',hash:'#gift=example'})).toBe(false);
  });
});
