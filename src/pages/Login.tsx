import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, LogIn, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm animate-fade-in">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">מערכת דיווח תלמידים</CardTitle>
          <CardDescription>הכנס/י קוד כניסה</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="קוד כניסה"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              dir="ltr"
              className="text-center text-lg tracking-widest"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={saveCode}
                onCheckedChange={v => setSaveCode(!!v)}
              />
              <span className="text-sm text-muted-foreground">שמור קוד כניסה</span>
            </label>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="ml-2 h-4 w-4" />
              {loading ? 'מתחבר...' : 'כניסה'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
