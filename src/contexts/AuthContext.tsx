import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signUpPatient, signInPatient, signOutPatient, ensureUserProfile } from '@/lib/auth';

type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (u: User) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', u.id)
      .maybeSingle();
    setProfile(data ?? null);
  };

  useEffect(() => {
    // Hard timeout: if getSession takes >3s, unblock the app anyway
    const timeout = setTimeout(() => setLoading(false), 3000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      clearTimeout(timeout);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        ensureUserProfile(s.user.id, s.user.email!, s.user.user_metadata?.full_name);
        fetchProfile(s.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await ensureUserProfile(s.user.id, s.user.email!, s.user.user_metadata?.full_name);
        fetchProfile(s.user);
      } else {
        setProfile(null);
      }
    });

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    await signUpPatient(email, password, fullName);
  };

  const signIn = async (email: string, password: string) => {
    await signInPatient(email, password);
  };

  const signOut = async () => {
    await signOutPatient();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
