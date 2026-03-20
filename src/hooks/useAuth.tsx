import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'staff' | 'student';

interface AuthCtx {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  fullName: string;
  lockedStudentId: string | null;
  loginWithCode: (code: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const STUDENT_ACCOUNT = { email: 'student@school.local', password: 'student555secure!' };

const CODE_MAP: Record<string, { email: string; password: string; name: string; role: AppRole }> = {
  '1001': { email: 'staff@school.local', password: 'staff1001secure!', name: 'צוות חינוכי', role: 'staff' },
  '9020': { email: 'admin@school.local', password: 'admin9020secure!', name: 'מנהל מערכת', role: 'admin' },
  '555': { email: STUDENT_ACCOUNT.email, password: STUDENT_ACCOUNT.password, name: 'תלמיד/ה', role: 'student' },
};

const LOCKED_STUDENT_KEY = 'locked_student_id';

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [lockedStudentId, setLockedStudentId] = useState<string | null>(
    () => sessionStorage.getItem(LOCKED_STUDENT_KEY)
  );

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
        setLockedStudentId(null);
        sessionStorage.removeItem(LOCKED_STUDENT_KEY);
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
    // Check static codes first
    const account = CODE_MAP[code];
    if (account) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (!signInError && signInData.user) {
        // Only student role can be self-assigned (RLS restriction)
        if (account.role === 'student') {
          const { data: existingRole } = await supabase.from('user_roles')
            .select('id').eq('user_id', signInData.user.id).eq('role', 'student' as any).maybeSingle();
          if (!existingRole) {
            await supabase.from('user_roles').insert({
              user_id: signInData.user.id,
              role: 'student' as any,
            });
          }
        }
        // Admin/staff roles are pre-seeded in the database
        if (code === '555') {
          sessionStorage.removeItem(LOCKED_STUDENT_KEY);
          setLockedStudentId(null);
        }
        return { error: null };
      }

      if (signInError?.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: { data: { full_name: account.name } },
        });

        if (signUpError) return { error: 'שגיאה ביצירת חשבון' };

        if (signUpData.user && account.role === 'student') {
          await supabase.from('user_roles').insert({
            user_id: signUpData.user.id,
            role: 'student' as any,
          });
        }

        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: account.email,
          password: account.password,
        });

        if (retryError) return { error: 'שגיאה בכניסה' };
        if (code === '555') {
          sessionStorage.removeItem(LOCKED_STUDENT_KEY);
          setLockedStudentId(null);
        }
        return { error: null };
      }

      return { error: 'שגיאה בכניסה' };
    }

    // Personal student code — sign in first, then look up student
    // Sign in with shared student account first (needed for RLS)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: STUDENT_ACCOUNT.email,
      password: STUDENT_ACCOUNT.password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: STUDENT_ACCOUNT.email,
          password: STUDENT_ACCOUNT.password,
          options: { data: { full_name: 'תלמיד/ה' } },
        });
        if (signUpError) return { error: 'שגיאה בכניסה' };
        if (signUpData.user) {
          await supabase.from('user_roles').insert({ user_id: signUpData.user.id, role: 'student' as any });
        }
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: STUDENT_ACCOUNT.email,
          password: STUDENT_ACCOUNT.password,
        });
        if (retryError) return { error: 'שגיאה בכניסה' };
      } else {
        return { error: 'שגיאה בכניסה' };
      }
    }

    // Now authenticated — look up student by code
    const { data: student } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('student_code', code.toUpperCase().trim())
      .maybeSingle();

    if (!student) {
      // Invalid code — sign out
      await supabase.auth.signOut();
      return { error: 'קוד שגוי' };
    }

    // Lock to this specific student
    sessionStorage.setItem(LOCKED_STUDENT_KEY, student.id);
    setLockedStudentId(student.id);
    setFullName(`${student.first_name} ${student.last_name}`);

    return { error: null };
  };

  const signOut = async () => {
    sessionStorage.removeItem(LOCKED_STUDENT_KEY);
    setLockedStudentId(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, fullName, lockedStudentId, loginWithCode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
