import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types/database';
import { generatePseudonym, getRandomAvatarColor } from '../utils/pseudonyms';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePenName: (name: string) => Promise<{ error: Error | null }>;
  loginAsGuestDemo: (penName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'unsent_library_demo_profile';

// Reads the local demo session during the initial render (lazy state
// initializer) so demo mode needs no synchronous setState inside an effect.
const readDemoSession = (): { user: User; profile: Profile } | null => {
  const saved = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as Profile;
    if (!parsed?.id) return null;
    return {
      user: { id: parsed.id, email: 'anonymous@unsentlibrary.local' } as User,
      profile: parsed,
    };
  } catch {
    return null;
  }
};

// Gated demo seeding (KTD3): a configured deployment must never seed
// user/profile from a leftover demo profile, however the browser's localStorage
// was previously used. Exported for unit tests.
export const initialAuthState = (
  configured: boolean
): { user: User | null; profile: Profile | null } => {
  const demo = configured ? null : readDemoSession();
  return { user: demo?.user ?? null, profile: demo?.profile ?? null };
};

type InitialSessionHandlers = {
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => void;
};

// Applies the initial getSession() result: a no-session resolution clears any
// stale (demo-seeded) profile, mirroring the onAuthStateChange logout reset
// below. Exported for unit tests.
export const applyInitialSessionResult = (
  result: { data: { session: Session | null } },
  handlers: InitialSessionHandlers
): void => {
  const session = result.data.session;
  handlers.setSession(session);
  handlers.setUser(session?.user ?? null);
  if (session?.user) {
    handlers.fetchProfile(session.user.id);
  } else {
    handlers.setProfile(null);
  }
  handlers.setLoading(false);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialAuth] = useState(() => initialAuthState(isSupabaseConfigured));
  const [user, setUser] = useState<User | null>(() => initialAuth.user);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => initialAuth.profile);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  // Load existing profile from Supabase or local demo session
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet, create one
        const newPenName = generatePseudonym();
        const avatarColor = getRandomAvatarColor();
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: userId, pen_name: newPenName, avatar_color: avatarColor })
          .select()
          .single();
        if (newProfile) setProfile(newProfile);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Demo mode: the saved session already came in with the initial state and
      // `loading` starts as false, so there is nothing to set synchronously.
      return;
    }

    supabase.auth.getSession().then((result) =>
      applyInitialSessionResult(result, {
        setSession,
        setUser,
        setProfile,
        setLoading,
        fetchProfile,
      })
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    if (!isSupabaseConfigured) {
      // Local simulated login
      await loginAsGuestDemo();
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updatePenName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { error: new Error('Pen name cannot be empty') };

    if (!isSupabaseConfigured) {
      if (profile) {
        const updated = { ...profile, pen_name: trimmed };
        setProfile(updated);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updated));
      }
      return { error: null };
    }

    if (!user) return { error: new Error('User not logged in') };

    const { error } = await supabase
      .from('profiles')
      .update({ pen_name: trimmed })
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, pen_name: trimmed });
    }
    return { error };
  };

  // Guest entry. Demo mode fabricates a local-only id (never sent to the
  // database). A configured deployment instead uses Supabase's own anonymous
  // auth, so the resulting user.id is a real UUID that RLS and foreign keys
  // accept -- guests can actually save notes, not just preview the UI.
  const loginAsGuestDemo = async (penName?: string) => {
    if (!isSupabaseConfigured) {
      const demoId = 'demo-' + Math.random().toString(36).substring(2, 9);
      const demoProfile: Profile = {
        id: demoId,
        pen_name: penName?.trim() || generatePseudonym(),
        avatar_color: getRandomAvatarColor(),
        created_at: new Date().toISOString(),
      };
      setUser({ id: demoId, email: 'writer@unsent.local' } as User);
      setProfile(demoProfile);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
      return;
    }

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      console.error('Anonymous sign-in failed:', error);
      return;
    }
    setSession(data.session);
    setUser(data.user);

    // The on_auth_user_created trigger provisions the profile synchronously
    // within the same transaction as the auth.users insert, so it is already
    // committed by the time this select runs.
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    let finalProfile = profileRow;
    if (finalProfile && penName?.trim()) {
      const { data: renamed } = await supabase
        .from('profiles')
        .update({ pen_name: penName.trim() })
        .eq('id', data.user.id)
        .select()
        .single();
      if (renamed) finalProfile = renamed;
    }
    if (finalProfile) setProfile(finalProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithMagicLink,
        signOut,
        updatePenName,
        loginAsGuestDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
