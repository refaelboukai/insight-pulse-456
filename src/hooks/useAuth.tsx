import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'staff' | 'student' | 'parent';

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
const PARENT_ACCOUNT  = { email: 'parent@school.local',  password: 'parent777secure!'  };
const SHARED_EMAILS   = new Set([STUDENT_ACCOUNT.email, PARENT_ACCOUNT.email]);

const CODE_MAP: Record<string, { email: string; password: string; name: string; role: AppRole }> = {
  '1001': { email: 'staff@school.local', password: 'staff1001secure!', name: 'צוות חינוכי', role: 'staff' },
  '9020': { email: 'admin@school.local', password: 'admin9020secure!', name: 'מנהל מערכת', role: 'admin' },
};

// sessionStorage keys – cleared when the browser tab is closed
const LOCKED_STUDENT_KEY = 'locked_student_id';
const LOGIN_ERROR_KEY     = 'login_pending_error';
const ROLE_KEY            = 'app_role';
const FULLNAME_KEY        = 'app_full_name';

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Role and name are mirrored in sessionStorage so page-refresh works
  const [role, setRoleState] = useState<AppRole | null>(
    () => (sessionStorage.getItem(ROLE_KEY) as AppRole | null)
  );
  const [fullName, setFullNameState] = useState(
    () => sessionStorage.getItem(FULLNAME_KEY) || ''
  );
  const [lockedStudentId, setLockedStudentIdState] = useState<string | null>(
    () => sessionStorage.getItem(LOCKED_STUDENT_KEY)
  );

  // Helpers that keep sessionStorage in sync
  const setRole = (r: AppRole | null) => {
    setRoleState(r);
    if (r) sessionStorage.setItem(ROLE_KEY, r);
    else   sessionStorage.removeItem(ROLE_KEY);
  };
  const setFullName = (n: string) => {
    setFullNameState(n);
    if (n) sessionStorage.setItem(FULLNAME_KEY, n);
    else   sessionStorage.removeItem(FULLNAME_KEY);
  };
  const setLockedStudentId = (id: string | null) => {
    setLockedStudentIdState(id);
    if (id) sessionStorage.setItem(LOCKED_STUDENT_KEY, id);
    else    sessionStorage.removeItem(LOCKED_STUDENT_KEY);
  };

  // When loginWithCode has already set role/name explicitly, skip the async DB fetch
  const skipRoleFetch = useRef(false);

  const clearSession = () => {
    setRole(null);
    setFullName('');
    setLockedStudentId(null);
    skipRoleFetch.current = false;
  };

  const fetchRoleAndProfile = async (userId: string) => {
    if (skipRoleFetch.current) {
      skipRoleFetch.current = false;
      return;
    }
    // If sessionStorage already has role from this session, don't override it
    if (sessionStorage.getItem(ROLE_KEY)) return;
    const [roleRes, profileRes] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('full_name').eq('user_id', userId).maybeSingle(),
    ]);
    setRole((roleRes.data?.role as AppRole) ?? 'staff');
    setFullName(profileRes.data?.full_name ?? '');
  };

  useEffect(() => {
    let mounted = true;

    // onAuthStateChange handles sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Only fetch from DB if loginWithCode hasn't already set a role
        setTimeout(() => {
          if (mounted) fetchRoleAndProfile(u.id);
        }, 0);
      } else {
        clearSession();
      }
      setLoading(false);
    });

    // getSession() handles the initial load (page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Shared accounts (student / parent) need lockedStudentId to work.
        // If it's missing (e.g. tab was closed and reopened), sign them out
        // so they re-enter their personal code.
        if (SHARED_EMAILS.has(u.email ?? '') && !sessionStorage.getItem(LOCKED_STUDENT_KEY)) {
          supabase.auth.signOut();
          clearSession();
          setLoading(false);
          return;
        }
        // Use sessionStorage role if available (avoids DB round-trip on refresh)
        if (!sessionStorage.getItem(ROLE_KEY)) {
          fetchRoleAndProfile(u.id);
        }
      } else {
        clearSession();
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

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const signInOrCreateShared = async (
    account: { email: string; password: string },
    roleName: AppRole,
    displayName: string,
  ) => {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (signInError) {
      if (!signInError.message.includes('Invalid login credentials')) {
        return { error: 'שגיאה בכניסה' };
      }
      // Account doesn't exist yet – create it (trigger will insert role)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { full_name: displayName } },
      });
      if (signUpError) return { error: 'שגיאה בכניסה' };
      // Fallback: insert role manually in case trigger hasn't run yet
      if (signUpData.user) {
        await supabase
          .from('user_roles')
          .insert({ user_id: signUpData.user.id, role: roleName as any });
      }
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      if (retryError) return { error: 'שגיאה בכניסה' };
    } else if (signInData.user) {
      // Account exists – try to insert role in case it's missing (ignore conflicts)
      await supabase
        .from('user_roles')
        .insert({ user_id: signInData.user.id, role: roleName as any })
        .then(() => {});
    }
    return { error: null };
  };

  // ─── Main login function ───────────────────────────────────────────────────

  const loginWithCode = async (code: string): Promise<{ error: string | null }> => {
    // ── Static codes (staff 1001, admin 9020) ────────────────────────────────
    const account = CODE_MAP[code];
    if (account) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email: account.email, password: account.password });

      if (!signInError && signInData.user) return { error: null };

      if (signInError?.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: { data: { full_name: account.name } },
        });
        if (signUpError) return { error: 'שגיאה ביצירת חשבון' };
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: account.email, password: account.password,
        });
        if (retryError) return { error: 'שגיאה בכניסה' };
        return { error: null };
      }
      return { error: 'שגיאה בכניסה' };
    }

    const sanitizedCode = code.trim().replace(/\s/g, '');

    // ── Parent code (starts with P) ──────────────────────────────────────────
    if (sanitizedCode.toUpperCase().startsWith('P')) {
      skipRoleFetch.current = true;
      const result = await signInOrCreateShared(PARENT_ACCOUNT, 'parent', 'הורה');
      if (result.error) { skipRoleFetch.current = false; return result; }

      const { data: student } = await (supabase.from('students') as any)
        .select('id, first_name, last_name')
        .ilike('parent_code', sanitizedCode)
        .maybeSingle();

      if (!student) {
        skipRoleFetch.current = false;
        sessionStorage.setItem(LOGIN_ERROR_KEY, 'קוד שגוי');
        await supabase.auth.signOut();
        clearSession();
        return { error: 'קוד שגוי' };
      }

      setLockedStudentId(student.id);
      setRole('parent');
      setFullName(`הורה של ${student.first_name} ${student.last_name}`);
      return { error: null };
    }

    // ── Student personal code ────────────────────────────────────────────────
    skipRoleFetch.current = true;
    const result = await signInOrCreateShared(STUDENT_ACCOUNT, 'student', 'תלמיד/ה');
    if (result.error) { skipRoleFetch.current = false; return result; }

    const { data: student } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .ilike('student_code', sanitizedCode)
      .maybeSingle();

    if (!student) {
      skipRoleFetch.current = false;
      sessionStorage.setItem(LOGIN_ERROR_KEY, 'קוד שגוי');
      await supabase.auth.signOut();
      clearSession();
      return { error: 'קוד שגוי' };
    }

    setLockedStudentId(student.id);
    setRole('student');
    setFullName(`${student.first_name} ${student.last_name}`);
    return { error: null };
  };

  // ─── Sign-out ──────────────────────────────────────────────────────────────

  const signOut = async () => {
    clearSession();
    setUser(null);
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
