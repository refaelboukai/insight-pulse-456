import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { LogIn, KeyRound, Sparkles } from 'lucide-react';
import logoSrc from '@/assets/logo.jpeg';

const SAVED_CODE_KEY = 'saved_login_code';

export default function Login() {
  const { loginWithCode } = useAuth();
  const savedCode = localStorage.getItem(SAVED_CODE_KEY) || '';
  const [code, setCode] = useState(savedCode);
  const [saveCode, setSaveCode] = useState(!!savedCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoLogging, setAutoLogging] = useState(!!savedCode);

  // Auto-login if saved code exists
  useEffect(() => {
    if (savedCode && autoLogging) {
      (async () => {
        setLoading(true);
        const { error } = await loginWithCode(savedCode);
        if (error) {
          setAutoLogging(false);
          setError(error);
        }
        setLoading(false);
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show nothing while auto-logging in
  if (autoLogging && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-full bg-primary/30" />
          </div>
          <p className="text-muted-foreground text-sm">מתחבר אוטומטית...</p>
        </div>
      </div>
    );
  }

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
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.04]" style={{ background: 'var(--gradient-primary)' }} />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'var(--gradient-accent)' }} />
      </div>

      <div className="w-full max-w-sm relative animate-scale-in">
        <div className="card-styled rounded-2xl overflow-hidden">
          <div className="w-full py-2 text-center" style={{ background: 'var(--gradient-primary)' }}>
            <span className="text-xs font-bold text-primary-foreground tracking-wide">בית ספר מרום בית אקשטיין</span>
          </div>

          <div className="px-8 pt-8 pb-7">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="mx-auto w-20 h-20 rounded-full overflow-hidden shadow-lg border-2 border-primary/20 mb-4 bg-white">
                <img src={logoSrc} alt="לוגו בית ספר מרום" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-1">מערכת דיווח תלמידים</h1>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                מערכת פנימית לצוות החינוכי ולתלמידים
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="הזן קוד כניסה"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  dir="ltr"
                  className="text-center text-lg tracking-[0.3em] h-11 pr-10 rounded-xl border-2 focus:border-primary transition-colors"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox checked={saveCode} onCheckedChange={v => setSaveCode(!!v)} />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">שמור קוד כניסה</span>
              </label>

              {error && (
                <div className="text-center py-2 px-3 rounded-lg bg-destructive/8 border border-destructive/15">
                  <p className="text-destructive text-xs font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-semibold rounded-xl btn-primary-gradient border-0"
              >
                <LogIn className="ml-2 h-4 w-4" />
                {loading ? 'מתחבר...' : 'כניסה למערכת'}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-5">
          גישה מורשית בלבד
        </p>
      </div>
    </div>
  );
}