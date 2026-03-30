import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  duration?: number;
  label?: string;
  onComplete?: () => void;
}

export default function StepTimer({ duration = 30, label = 'טיימר', onComplete }: Props) {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active || timeLeft <= 0) {
      if (active && timeLeft <= 0) {
        setActive(false);
        setDone(true);
        onComplete?.();
      }
      return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [active, timeLeft, onComplete]);

  const start = () => { setActive(true); setTimeLeft(duration); setDone(false); };
  const progress = ((duration - timeLeft) / duration) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center gap-3 py-3">
      {/* Circular progress */}
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" strokeWidth="5" className="stroke-muted" />
          <motion.circle
            cx="40" cy="40" r="34" fill="none" strokeWidth="5"
            className="stroke-primary"
            strokeLinecap="round"
            strokeDasharray={213.6}
            animate={{ strokeDashoffset: 213.6 * (1 - progress / 100) }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="text-sm font-bold text-emerald-500">✓ סיימת!</p>
            <button onClick={start} className="text-xs text-primary underline mt-1">עוד פעם</button>
          </motion.div>
        ) : active ? (
          <motion.p key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground">
            {label}
          </motion.p>
        ) : (
          <motion.button key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={start} className="btn-primary text-xs px-4 py-1.5">
            התחל טיימר ⏱
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
