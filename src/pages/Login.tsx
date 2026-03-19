import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap, LogIn, KeyRound, Sparkles } from 'lucide-react';

const SAVED_CODE_KEY = 'saved_login_code';

export default function Login() {
  const { loginWithCode } = useAuth();
  const savedCode = localStorage.getItem(SAVED_CODE_KEY) || '';
  const [code, setCode] = useState(savedCode);
  const [saveCode, setSaveCode] = useState(!!savedCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (saveCode) {
      localStorage.setItem(SAVED_CODE_KEY, code);
    } else {
      localStorage.removeItem(SAVED_CODE_KEY);
    }

    const { error } = await loginWithCode(code);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.04]" style={{ background: 'var(--gradient-primary)' }} />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'var(--gradient-accent)' }} />
      </div>

      <div className="w-full max-w-sm relative animate-scale-in">
        {/* Card */}
        <div className="card-styled rounded-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 w-full" style={{ background: 'var(--gradient-primary)' }} />

          <div className="px-8 pt-10 pb-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="relative mx-auto w-20 h-20 mb-5">
                <div className="absolute inset-0 rounded-2xl opacity-20 animate-pulse-soft" style={{ background: 'var(--gradient-primary)' }} />
                <div className="relative w-full h-full rounded-2xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">מערכת דיווח תלמידים</h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                מערכת פנימית לצוות חינוכי
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="הזן קוד כניסה"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  dir="ltr"
                  className="text-center text-lg tracking-[0.3em] h-12 pr-10 rounded-xl border-2 focus:border-primary transition-colors"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={saveCode}
                  onCheckedChange={v => setSaveCode(!!v)}
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">שמור קוד כניסה</span>
              </label>

              {error && (
                <div className="text-center py-2 px-3 rounded-lg bg-destructive/8 border border-destructive/15">
                  <p className="text-destructive text-sm font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold rounded-xl btn-primary-gradient border-0"
              >
                <LogIn className="ml-2 h-5 w-5" />
                {loading ? 'מתחבר...' : 'כניסה למערכת'}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          גישה מורשית בלבד
        </p>
      </div>
    </div>
  );
}
