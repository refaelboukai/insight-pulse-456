import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import { supabase } from '@reset/integrations/supabase/client';
import { useApp } from '@reset/contexts/AppContext';

interface LeaderEntry {
  student_name: string;
  student_id: string;
  total_score: number;
  max_level: number;
}

const GAME_OPTIONS = [
  { value: 'all', label: 'כולם' },
  { value: 'memory', label: 'זיכרון' },
  { value: 'reaction', label: 'תגובה' },
  { value: 'series', label: 'סדרות' },
  { value: 'tetris', label: 'טטריס' },
  { value: 'math', label: 'חשבון' },
  { value: 'reading', label: 'חידון הגיון' },
  { value: 'coordination', label: 'קואורדינציה' },
  { value: 'spatial', label: 'מרחבי' },
  { value: 'differences', label: 'הבדלים' },
];

export default function Leaderboard() {
  const { student } = useApp();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    let query = supabase.from('brain_training_scores').select('student_name, student_id, score, max_level_reached, game_type');

    if (filter !== 'all') {
      query = query.eq('game_type', filter);
    }

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    // Aggregate by student
    const map = new Map<string, LeaderEntry>();
    for (const row of data) {
      const key = row.student_id || row.student_name;
      const existing = map.get(key);
      if (existing) {
        existing.total_score += row.score;
        existing.max_level = Math.max(existing.max_level, row.max_level_reached);
      } else {
        map.set(key, {
          student_name: row.student_name,
          student_id: row.student_id || '',
          total_score: row.score,
          max_level: row.max_level_reached,
        });
      }
    }

    const sorted = Array.from(map.values()).sort((a, b) => b.total_score - a.total_score).slice(0, 10);
    setEntries(sorted);
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown size={18} className="text-warning" />;
    if (index === 1) return <Medal size={18} className="text-muted-foreground" />;
    if (index === 2) return <Medal size={18} className="text-warning/60" />;
    return <span className="text-sm font-bold text-muted-foreground w-[18px] text-center">{index + 1}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-reset p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={22} className="text-warning" />
        <h3 className="text-lg font-bold text-foreground">לוח תוצאות</h3>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {GAME_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">טוען...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          אין נתונים עדיין. שחקו משחקים כדי להופיע כאן!
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const isMe = student && entry.student_id === student.id;
            return (
              <motion.div
                key={entry.student_id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isMe ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50'
                }`}
              >
                <div className="w-6 flex justify-center">{getRankIcon(i)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                    {entry.student_name} {isMe && '(אני)'}
                  </p>
                  <p className="text-xs text-muted-foreground">רמה מקס׳ {entry.max_level}</p>
                </div>
                <p className="text-base font-bold text-foreground">{entry.total_score}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
