import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../src/types/database';
import { initialAuthState, applyInitialSessionResult } from '../src/contexts/AuthContext';

const DEMO_STORAGE_KEY = 'unsent_library_demo_profile';

const demoProfile: Profile = {
  id: 'demo-abc123',
  pen_name: 'Stale Demo Heron',
  avatar_color: '#d4a373',
  created_at: '2026-10-01T00:00:00.000Z',
};

const storage = new Map<string, string>();

/**
 * AuthContext stale demo-profile fix (KTD3 / R3).
 *
 * A configured deployment must never seed user/profile from a leftover demo
 * profile in localStorage, and an initial getSession() resolution that finds
 * no session must clear whatever profile state it started with — matching the
 * existing onAuthStateChange logout reset.
 */
describe('Auth demo-session gating', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
      clear: () => storage.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts a configured deployment with null user and profile when storage is empty', () => {
    expect(initialAuthState(true)).toEqual({ user: null, profile: null });
  });

  it('never seeds a configured deployment from a stored demo profile', () => {
    storage.set(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));

    // Even with a valid demo profile on disk, the gate short-circuits
    // readDemoSession() so nothing is seeded.
    expect(initialAuthState(true)).toEqual({ user: null, profile: null });

    // Control: with no real backend configured, the same stored profile seeds
    // both fields — proving the gate, not a broken reader, blocks the seed.
    expect(initialAuthState(false)).toEqual({
      user: { id: demoProfile.id, email: 'anonymous@unsentlibrary.local' } as User,
      profile: demoProfile,
    });
  });

  it('clears profile when the initial getSession() resolves no session', () => {
    const setSession = vi.fn();
    const setUser = vi.fn();
    const setProfile = vi.fn();
    const setLoading = vi.fn();
    const fetchProfile = vi.fn();

    applyInitialSessionResult(
      { data: { session: null } },
      { setSession, setUser, setProfile, setLoading, fetchProfile }
    );

    expect(setProfile).toHaveBeenCalledWith(null);
    expect(setUser).toHaveBeenCalledWith(null);
    expect(fetchProfile).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it('leaves profile to fetchProfile when a session does resolve', () => {
    const setSession = vi.fn();
    const setUser = vi.fn();
    const setProfile = vi.fn();
    const setLoading = vi.fn();
    const fetchProfile = vi.fn();

    applyInitialSessionResult(
      { data: { session: { user: { id: 'user-1' } } as unknown as Session } },
      { setSession, setUser, setProfile, setLoading, fetchProfile }
    );

    expect(fetchProfile).toHaveBeenCalledWith('user-1');
    expect(setProfile).not.toHaveBeenCalled();
    expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
    expect(setLoading).toHaveBeenCalledWith(false);
  });
});
