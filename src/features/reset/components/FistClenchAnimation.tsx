import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'idle' | 'clench' | 'release';

export default function FistClenchAnimation() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(5);
  const [cycleCount, setCycleCount] = useState(0);

  const startExercise = () => {
    setPhase('clench');
    setCountdown(5);
    setCycleCount(prev => prev + 1);
  };

  useEffect(() => {
    if (phase === 'idle') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (phase === 'clench') {
      setPhase('release');
      setCountdown(5);
    } else if (phase === 'release') {
      setPhase('idle');
    }
  }, [phase, countdown]);

  const isClenched = phase === 'clench';
  const isRelease = phase === 'release';

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Hands animation */}
      <div className="flex items-center justify-center gap-6">
        {/* Left hand */}
        <motion.div
          className="relative"
          animate={{
            scale: isClenched ? 0.85 : 1,
            rotate: isClenched ? -5 : 0,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <svg width="70" height="90" viewBox="0 0 70 90" className="drop-shadow-md">
            {/* Palm */}
            <motion.rect
              x="10" y="35" rx="12" ry="12"
              width="50" height="50"
              className="fill-amber-100 stroke-amber-300"
              strokeWidth="2"
              animate={{ 
                width: isClenched ? 44 : 50,
                height: isClenched ? 40 : 50,
                y: isClenched ? 40 : 35,
                x: isClenched ? 13 : 10,
                rx: isClenched ? 14 : 12,
              }}
              transition={{ duration: 0.5 }}
            />
            {/* Fingers */}
            {[0, 1, 2, 3].map(i => (
              <motion.rect
                key={i}
                x={15 + i * 11}
                rx="5" ry="5"
                width="9"
                className="fill-amber-100 stroke-amber-300"
                strokeWidth="2"
                animate={{
                  y: isClenched ? 38 : 5,
                  height: isClenched ? 14 : 35,
                  rx: isClenched ? 4 : 5,
                }}
                transition={{ duration: 0.4, delay: isClenched ? i * 0.05 : (3 - i) * 0.05 }}
              />
            ))}
            {/* Thumb */}
            <motion.ellipse
              cx="8" cy="55"
              className="fill-amber-100 stroke-amber-300"
              strokeWidth="2"
              animate={{
                cx: isClenched ? 14 : 8,
                cy: isClenched ? 48 : 55,
                rx: isClenched ? 8 : 9,
                ry: isClenched ? 7 : 12,
              }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
          </svg>
        </motion.div>

        {/* Right hand (mirrored) */}
        <motion.div
          className="relative"
          style={{ transform: 'scaleX(-1)' }}
          animate={{
            scale: isClenched ? 0.85 : 1,
            rotate: isClenched ? -5 : 0,
          }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <svg width="70" height="90" viewBox="0 0 70 90" className="drop-shadow-md">
            <motion.rect
              x="10" y="35" rx="12" ry="12"
              width="50" height="50"
              className="fill-amber-100 stroke-amber-300"
              strokeWidth="2"
              animate={{
                width: isClenched ? 44 : 50,
                height: isClenched ? 40 : 50,
                y: isClenched ? 40 : 35,
                x: isClenched ? 13 : 10,
                rx: isClenched ? 14 : 12,
              }}
              transition={{ duration: 0.5 }}
            />
            {[0, 1, 2, 3].map(i => (
              <motion.rect
                key={i}
                x={15 + i * 11}
                rx="5" ry="5"
                width="9"
                className="fill-amber-100 stroke-amber-300"
                strokeWidth="2"
                animate={{
                  y: isClenched ? 38 : 5,
                  height: isClenched ? 14 : 35,
                  rx: isClenched ? 4 : 5,
                }}
                transition={{ duration: 0.4, delay: isClenched ? i * 0.05 : (3 - i) * 0.05 }}
              />
            ))}
            <motion.ellipse
              cx="8" cy="55"
              className="fill-amber-100 stroke-amber-300"
              strokeWidth="2"
              animate={{
                cx: isClenched ? 14 : 8,
                cy: isClenched ? 48 : 55,
                rx: isClenched ? 8 : 9,
                ry: isClenched ? 7 : 12,
              }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
          </svg>
        </motion.div>
      </div>

      {/* Status & countdown */}
      <AnimatePresence mode="wait">
        {phase === 'idle' ? (
          <motion.button
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={startExercise}
            className="btn-primary text-sm px-6 py-2"
          >
            {cycleCount > 0 ? 'עוד פעם ✊' : 'התחל תרגול ✊'}
          </motion.button>
        ) : (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className={`text-base font-bold mb-1 ${isClenched ? 'text-red-500' : 'text-emerald-500'}`}>
              {isClenched ? '💪 כווץ חזק!' : '🌿 שחרר...'}
            </p>
            <motion.p
              key={countdown}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-black text-foreground"
            >
              {countdown}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tension indicator bar */}
      {phase !== 'idle' && (
        <div className="w-full max-w-[200px] h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isClenched ? 'bg-red-400' : 'bg-emerald-400'}`}
            animate={{ width: `${(countdown / 5) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      )}
    </div>
  );
}
