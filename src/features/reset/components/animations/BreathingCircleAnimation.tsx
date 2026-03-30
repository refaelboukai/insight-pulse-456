import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale';

const phaseConfig = {
  inhale: { duration: 4, label: 'שאף...', color: 'text-blue-500', scale: 1.4 },
  hold: { duration: 4, label: 'עצור...', color: 'text-amber-500', scale: 1.4 },
  exhale: { duration: 6, label: 'נשוף...', color: 'text-emerald-500', scale: 1 },
};

export default function BreathingCircleAnimation() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);

  const startExercise = () => {
    setPhase('inhale');
    setCountdown(4);
    setCycles(0);
  };

  useEffect(() => {
    if (phase === 'idle') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (phase === 'inhale') {
      setPhase('hold');
      setCountdown(4);
    } else if (phase === 'hold') {
      setPhase('exhale');
      setCountdown(6);
    } else if (phase === 'exhale') {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      if (newCycles >= 4) {
        setPhase('idle');
      } else {
        setPhase('inhale');
        setCountdown(4);
      }
    }
  }, [phase, countdown, cycles]);

  const config = phase !== 'idle' ? phaseConfig[phase] : null;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Breathing circle */}
      <div className="relative flex items-center justify-center w-36 h-36">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-200/50"
          animate={{
            scale: phase === 'idle' ? 1 : config?.scale || 1,
            borderColor: phase === 'inhale' ? 'rgba(59,130,246,0.5)' 
              : phase === 'hold' ? 'rgba(245,158,11,0.4)' 
              : phase === 'exhale' ? 'rgba(16,185,129,0.5)' 
              : 'rgba(191,219,254,0.5)',
          }}
          transition={{ duration: phase === 'exhale' ? 6 : 4, ease: 'easeInOut' }}
        />
        {/* Inner circle */}
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.15))' }}
          animate={{
            scale: phase === 'idle' ? 1 : config?.scale || 1,
            background: phase === 'inhale' ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(96,165,250,0.2))'
              : phase === 'hold' ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.15))'
              : phase === 'exhale' ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.2))'
              : 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.15))',
          }}
          transition={{ duration: phase === 'exhale' ? 6 : 4, ease: 'easeInOut' }}
        >
          {phase !== 'idle' && (
            <motion.span
              key={countdown}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black text-foreground"
            >
              {countdown}
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        {phase === 'idle' ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            {cycles >= 4 ? (
              <p className="text-sm font-medium text-emerald-600 mb-2">🌿 מצוין! סיימת 4 סבבים</p>
            ) : null}
            <button onClick={startExercise} className="btn-primary text-sm px-6 py-2">
              {cycles > 0 ? 'עוד סבב' : 'התחל נשימה'}
            </button>
          </motion.div>
        ) : (
          <motion.div key={phase} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
            <p className={`text-base font-bold ${config?.color}`}>{config?.label}</p>
            <p className="text-xs text-muted-foreground mt-1">סבב {cycles + 1} מתוך 4</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
