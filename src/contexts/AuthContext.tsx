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
  loginAsGuestDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'unsent_library_demo_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
      // Local demo mode fallback
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          setUser({ id: parsed.id, email: 'anonymous@unsentlibrary.local' } as User);
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

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
      loginAsGuestDemo();
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

  const loginAsGuestDemo = () => {
    const demoId = 'demo-' + Math.random().toString(36).substring(2, 9);
    const demoProfile: Profile = {
      id: demoId,
      pen_name: generatePseudonym(),
      avatar_color: getRandomAvatarColor(),
      created_at: new Date().toISOString(),
    };
    setUser({ id: demoId, email: 'writer@unsent.local' } as User);
    setProfile(demoProfile);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
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
