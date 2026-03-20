import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'staff' | 'student';

interface AuthCtx {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  fullName: string;
  loginWithCode: (code: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const CODE_MAP: Record<string, { email: string; password: string; name: string; role: AppRole }> = {
  '1001': { email: 'staff@school.local', password: 'staff1001secure!', name: 'צוות חינוכי', role: 'staff' },
  '9020': { email: 'admin@school.local', password: 'admin9020secure!', name: 'מנהל מערכת', role: 'admin' },
  '555': { email: 'student@school.local', password: 'student555secure!', name: 'תלמיד/ה', role: 'student' },
};

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
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setTimeout(() => {
          if (mounted) fetchRoleAndProfile(u.id);
        }, 0);
      } else {
        setRole(null);
        setFullName('');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchRoleAndProfile(u.id);
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithCode = async (code: string): Promise<{ error: string | null }> => {
    const account = CODE_MAP[code];
    if (!account) {
      return { error: 'קוד שגוי' };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (!signInError) return { error: null };

    if (signInError.message.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { full_name: account.name } },
      });

      if (signUpError) return { error: 'שגיאה ביצירת חשבון' };

      if (signUpData.user) {
        const roleToAssign = account.role;
        if (roleToAssign === 'admin' || roleToAssign === 'student') {
          await supabase.from('user_roles').insert({
            user_id: signUpData.user.id,
            role: roleToAssign as any,
          });
        }
      }

      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
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
