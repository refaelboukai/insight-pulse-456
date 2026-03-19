import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type AppRole = 'admin' | 'staff';

interface AuthCtx {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  fullName: string;
  loginWithCode: (code: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const STAFF_EMAIL = 'staff@school.local';
const STAFF_PASSWORD = 'staff1001secure';

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRoleAndProfile = async (userId: string) => {
    const [roleRes, profileRes] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('full_name').eq('user_id', userId).maybeSingle(),
    ]);
    setRole((roleRes.data?.role as AppRole) ?? 'staff');
    setFullName(profileRes.data?.full_name ?? '');
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchRoleAndProfile(u.id);
      } else {
        setRole(null);
        setFullName('');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchRoleAndProfile(u.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithCode = async (code: string): Promise<{ error: string | null }> => {
    if (code !== '1001') {
      return { error: 'קוד שגוי' };
    }

    // Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD,
    });

    if (!signInError) return { error: null };

    // If user doesn't exist, create it
    if (signInError.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
        options: { data: { full_name: 'צוות חינוכי' } },
      });

      if (signUpError) return { error: 'שגיאה ביצירת חשבון' };

      // Try signing in again after signup
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
      });

      if (retryError) return { error: 'שגיאה בכניסה' };
      return { error: null };
    }

    return { error: 'שגיאה בכניסה' };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, fullName, loginWithCode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
