import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';

const STREAK_KEY = 'reset_app_streak';

const encouragements = [
  'כל הכבוד! אתה דואג לעצמך 💪',
  'עוד יום של בחירה חכמה 🌟',
  'המוח שלך אוהב את זה! 🧠',
  'אתה גיבור של עצמך 🦸',
  'קטן קטן, אתה משתנה 🌱',
  'רגע של עצירה = כוח גדול ⚡',
  'תמשיך ככה, אתה עושה עבודה מדהימה! 🎯',
];

function getStreak(): { count: number; lastDate: string } {
  try {
    const saved = localStorage.getItem(STREAK_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { count: 0, lastDate: '' };
}

function updateStreak(): number {
  const today = new Date().toDateString();
  const streak = getStreak();
  
  if (streak.lastDate === today) return streak.count;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const newCount = streak.lastDate === yesterday.toDateString() ? streak.count + 1 : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today }));
  return newCount;
}

export default function StreakCounter() {
  const [count, setCount] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const c = updateStreak();
    setCount(c);
    // Show encouragement after a short delay
    const timer = setTimeout(() => {
      setMessage(encouragements[Math.floor(Math.random() * encouragements.length)]);
      setShowEncouragement(true);
      // Auto-hide after 4 seconds
      setTimeout(() => setShowEncouragement(false), 4000);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (count === 0) return null;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 justify-center py-2 px-4 rounded-2xl bg-warning/10"
      >
        <Flame size={18} className="text-warning" />
        <span className="text-sm font-bold text-warning">
          {count} {count === 1 ? 'יום' : 'ימים'} ברצף
        </span>
        {count >= 3 && <Sparkles size={14} className="text-warning" />}
      </motion.div>

      <AnimatePresence>
        {showEncouragement && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap z-10 
                       bg-card text-foreground text-xs font-medium px-4 py-2 rounded-xl"
            style={{ boxShadow: 'var(--shadow-card-hover)' }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
