import { useState } from 'react';
import { useApp } from '@reset/contexts/AppContext';
import { motion } from 'framer-motion';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [showNoCode, setShowNoCode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleLogin = async () => {
    if (!code.trim()) return;
    const err = await login(code, remember);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="card-reset p-8 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-foreground leading-tight mb-2">
              בית ספר מרום בית אקשטיין
            </h1>
            <p className="text-lg font-semibold text-primary mb-1">RESET</p>
            <p className="text-base text-muted-foreground">אפליקציית כלים לוויסות רגשי</p>
          </div>

          <p className="text-base text-foreground/80 mb-6">
            עצירה קטנה יכולה לשנות תגובה גדולה.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="הזן קוד אישי"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-center font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <button onClick={handleLogin} className="btn-primary w-full">
              <span className="flex items-center justify-center gap-2">
                <KeyRound size={18} />
                כניסה
              </span>
            </button>

            <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="rounded"
              />
              זכור אותי במכשיר הזה
            </label>
            <p className="text-xs text-muted-foreground">לשימוש במכשיר אישי בלבד</p>

            <button
              onClick={() => setShowNoCode(true)}
              className="text-sm text-primary hover:underline"
            >
              אין לי קוד
            </button>

            {showNoCode && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive bg-destructive/10 rounded-xl p-3"
              >
                יש לפנות לאיש צוות כדי לקבל קוד גישה.
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
