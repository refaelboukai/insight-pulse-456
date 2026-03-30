import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TemperatureAnimation() {
  const [active, setActive] = useState(false);
  const [temp, setTemp] = useState(100);

  useEffect(() => {
    if (!active) return;
    if (temp <= 0) {
      setTimeout(() => { setActive(false); setTemp(100); }, 1500);
      return;
    }
    const timer = setTimeout(() => setTemp(prev => Math.max(prev - 2, 0)), 80);
    return () => clearTimeout(timer);
  }, [active, temp]);

  const coldLevel = 1 - temp / 100;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Ice/water visual */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
          animate={{
            background: `linear-gradient(to top, rgba(59,130,246,${0.1 + coldLevel * 0.4}), rgba(147,197,253,${0.05 + coldLevel * 0.2}))`,
            scale: active ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 1, repeat: active ? Infinity : 0, repeatType: 'reverse' }}
          style={{ border: `3px solid rgba(59,130,246,${0.2 + coldLevel * 0.5})` }}
        >
          {temp <= 0 ? '❄️' : active ? '🧊' : '💧'}
        </motion.div>

        {/* Temperature indicator */}
        {active && (
          <div className="absolute -left-2 top-2 bottom-2 w-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="absolute bottom-0 w-full rounded-full"
              style={{ background: `linear-gradient(to top, #3b82f6, #93c5fd)` }}
              animate={{ height: `${100 - temp}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Status */}
      {active ? (
        <div className="text-center">
          <p className="text-sm font-bold text-blue-500">
            {temp > 60 ? '🌡 מתחיל להתקרר...' : temp > 20 ? '❄️ קר... הגוף נרגע' : '🧊 קפוא! הרגעה מיידית'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">דמיין מים קרים על הפנים</p>
        </div>
      ) : (
        <button onClick={() => { setActive(true); setTemp(100); }} className="btn-primary text-sm px-6 py-2">
          {temp < 100 ? 'עוד פעם 🧊' : 'התחל הדמיה 💧'}
        </button>
      )}
    </div>
  );
}
