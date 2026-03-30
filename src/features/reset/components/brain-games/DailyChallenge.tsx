import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Flame, ArrowLeft } from 'lucide-react';
import { useApp } from '@reset/contexts/AppContext';

const GAME_IDS = ['memory', 'reaction', 'series', 'tetris', 'math', 'reading', 'coordination', 'spatial', 'differences'] as const;
const GAME_LABELS: Record<string, string> = {
  memory: 'זיכרון', reaction: 'תגובה מהירה', series: 'סדרות', tetris: 'טטריס',
  math: 'חשבון מהיר', reading: 'חידון הגיון', coordination: 'קואורדינציה',
  spatial: 'תפיסה מרחבית', differences: 'מצא את ההבדלים',
};

function getDailyGame(): string {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return GAME_IDS[seed % GAME_IDS.length];
}

function getDailyStreak(): { count: number; completedToday: boolean } {
  const raw = localStorage.getItem('brain_daily_streak');
  if (!raw) return { count: 0, completedToday: false };
  try {
    const data = JSON.parse(raw);
    const today = new Date().toDateString();
    return { count: data.count || 0, completedToday: data.lastDate === today };
  } catch { return { count: 0, completedToday: false }; }
}

export function markDailyComplete() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const current = getDailyStreak();
  const isConsecutive = localStorage.getItem('brain_daily_streak')
    ? JSON.parse(localStorage.getItem('brain_daily_streak')!).lastDate === yesterday
    : false;

  localStorage.setItem('brain_daily_streak', JSON.stringify({
    count: current.completedToday ? current.count : (isConsecutive ? current.count + 1 : 1),
    lastDate: today,
  }));
}

interface DailyChallengeProps {
  onStartGame: (gameId: string) => void;
}

export default function DailyChallenge({ onStartGame }: DailyChallengeProps) {
  const { student } = useApp();
  const dailyGame = useMemo(getDailyGame, []);
  const streak = useMemo(getDailyStreak, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-reset p-5 bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border-2 border-warning/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-warning" />
          <h3 className="text-base font-bold text-foreground">אתגר יומי</h3>
        </div>
        {streak.count > 0 && (
          <div className="flex items-center gap-1 bg-warning/20 rounded-full px-3 py-1">
            <Flame size={16} className="text-warning" />
            <span className="text-sm font-bold text-warning">{streak.count}</span>
          </div>
        )}
      </div>

      {streak.completedToday ? (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">✅ השלמת את האתגר היומי!</p>
          <p className="text-xs text-muted-foreground mt-1">חזור מחר לאתגר חדש</p>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">המשחק של היום:</p>
            <p className="text-base font-bold text-foreground">{GAME_LABELS[dailyGame]}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStartGame(dailyGame)}
            className="btn-primary flex items-center gap-1 text-sm px-4 py-2"
          >
            <ArrowLeft size={16} />
            שחק עכשיו
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
