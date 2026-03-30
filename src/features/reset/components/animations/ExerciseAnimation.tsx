import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const exercises = [
  { emoji: '🦵', name: 'סקוואט', count: 10 },
  { emoji: '🏃', name: 'ריצה במקום', count: 15 },
  { emoji: '🙌', name: "ג'אמפינג ג'ק", count: 10 },
];

export default function ExerciseAnimation() {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  const current = exercises[exerciseIdx];

  useEffect(() => {
    if (!active) return;
    if (count >= current.count) {
      setActive(false);
      setDone(true);
      return;
    }
    const timer = setTimeout(() => setCount(prev => prev + 1), 1200);
    return () => clearTimeout(timer);
  }, [active, count, current.count]);

  const startExercise = () => {
    setActive(true);
    setCount(0);
    setDone(false);
  };

  const nextExercise = () => {
    setExerciseIdx(prev => (prev + 1) % exercises.length);
    setDone(false);
    setCount(0);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Exercise visual */}
      <motion.div
        className="text-5xl"
        animate={active ? {
          y: [0, -20, 0],
          scale: [1, 1.15, 1],
        } : {}}
        transition={{ duration: 0.6, repeat: active ? Infinity : 0, repeatType: 'loop' }}
      >
        {current.emoji}
      </motion.div>

      <p className="text-base font-bold text-foreground">{current.name}</p>

      {/* Counter */}
      {active && (
        <div className="flex items-center gap-2">
          <motion.span
            key={count}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-black text-primary"
          >
            {count}
          </motion.span>
          <span className="text-sm text-muted-foreground">/ {current.count}</span>
        </div>
      )}

      {/* Progress bar */}
      {active && (
        <div className="w-full max-w-[180px] h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${(count / current.count) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Actions */}
      {done ? (
        <div className="flex gap-2">
          <button onClick={nextExercise} className="btn-secondary text-sm px-4 py-2">
            תרגיל אחר
          </button>
          <button onClick={startExercise} className="btn-primary text-sm px-4 py-2">
            עוד פעם 💪
          </button>
        </div>
      ) : !active ? (
        <button onClick={startExercise} className="btn-primary text-sm px-6 py-2">
          התחל {current.name} 🔥
        </button>
      ) : null}
    </div>
  );
}
