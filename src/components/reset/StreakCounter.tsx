import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';

const STREAK_KEY = 'reset_app_streak';
const encouragements = [
  'כל הכבוד! אתה דואג לעצמך 💪', 'עוד יום של בחירה חכמה 🌟',
  'המוח שלך אוהב את זה! 🧠', 'אתה גיבור של עצמך 🦸',
  'רגע של עצירה = כוח גדול ⚡',
];

function updateStreak(): number {
  const today = new Date().toDateString();
  try {
    const saved = localStorage.getItem(STREAK_KEY);
    if (saved) {
      const streak = JSON.parse(saved);
      if (streak.lastDate === today) return streak.count;
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const newCount = streak.lastDate === yesterday.toDateString() ? streak.count + 1 : 1;
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today }));
      return newCount;
    }
  } catch {}
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 1, lastDate: today }));
  return 1;
}

export default function StreakCounter() {
  const [count, setCount] = useState(0);
  const [showMsg, setShowMsg] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const c = updateStreak(); setCount(c);
    const t = setTimeout(() => {
      setMessage(encouragements[Math.floor(Math.random() * encouragements.length)]);
      setShowMsg(true);
      setTimeout(() => setShowMsg(false), 4000);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  if (count === 0) return null;

  return (
    <div className="relative">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 justify-center py-2 px-4 rounded-2xl bg-amber-500/10">
        <Flame size={18} className="text-amber-500" />
        <span className="text-sm font-bold text-amber-600">{count} {count === 1 ? 'יום' : 'ימים'} ברצף</span>
        {count >= 3 && <Sparkles size={14} className="text-amber-500" />}
      </motion.div>
      <AnimatePresence>
        {showMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap z-10 bg-card text-foreground text-xs font-medium px-4 py-2 rounded-xl shadow-lg">
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
