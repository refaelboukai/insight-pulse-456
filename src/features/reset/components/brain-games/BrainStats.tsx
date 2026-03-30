import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { supabase } from '@reset/integrations/supabase/client';
import { useApp } from '@reset/contexts/AppContext';

interface GameStat {
  game_type: string;
  max_level_reached: number;
  score: number;
  total_games_played: number;
}

const GAME_LABELS: Record<string, string> = {
  memory: 'זיכרון',
  reaction: 'תגובה',
  series: 'לוגיקה',
  math: 'חשבון',
  reading: 'הבנה',
  coordination: 'קואורדינציה',
  spatial: 'מרחבי',
  tetris: 'טטריס',
  differences: 'ריכוז',
};

const CATEGORIES = ['memory', 'reaction', 'series', 'math', 'reading', 'coordination', 'spatial', 'tetris', 'differences'];

export default function BrainStats() {
  const { student } = useApp();
  const [stats, setStats] = useState<GameStat[]>([]);

  useEffect(() => {
    if (!student) return;
    supabase
      .from('brain_training_scores')
      .select('game_type, max_level_reached, score, total_games_played')
      .eq('student_id', student.id)
      .then(({ data }) => { if (data) setStats(data); });
  }, [student]);

  const getLevel = (type: string) => {
    const s = stats.find(s => s.game_type === type);
    return s ? s.max_level_reached : 0;
  };

  const totalScore = stats.reduce((sum, s) => sum + s.score, 0);
  const totalGames = stats.reduce((sum, s) => sum + s.total_games_played, 0);
  const maxPossible = 10;

  // Radar chart calculations
  const cx = 120, cy = 120, r = 90;
  const count = CATEGORIES.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const dist = (value / maxPossible) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const polygonPoints = CATEGORIES.map((cat, i) => {
    const p = getPoint(i, getLevel(cat));
    return `${p.x},${p.y}`;
  }).join(' ');

  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-reset p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain size={22} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">כרטיס המוח שלי</h3>
      </div>

      {/* Summary */}
      <div className="flex justify-around mb-4 text-center">
        <div>
          <p className="text-2xl font-bold text-primary">{totalScore}</p>
          <p className="text-xs text-muted-foreground">ניקוד כולל</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{totalGames}</p>
          <p className="text-xs text-muted-foreground">משחקים</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.length}/{CATEGORIES.length}</p>
          <p className="text-xs text-muted-foreground">משחקים שנוסו</p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <svg width="240" height="240" viewBox="0 0 240 240">
          {/* Grid circles */}
          {gridLevels.map(lv => {
            const pts = CATEGORIES.map((_, i) => {
              const p = getPoint(i, lv);
              return `${p.x},${p.y}`;
            }).join(' ');
            return (
              <polygon
                key={lv}
                points={pts}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity={0.5}
              />
            );
          })}

          {/* Axis lines */}
          {CATEGORIES.map((_, i) => {
            const p = getPoint(i, maxPossible);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="1" opacity={0.3} />;
          })}

          {/* Data polygon */}
          <motion.polygon
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            points={polygonPoints}
            fill="hsl(var(--primary) / 0.2)"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Data points + labels */}
          {CATEGORIES.map((cat, i) => {
            const p = getPoint(i, getLevel(cat));
            const labelP = getPoint(i, maxPossible + 2.5);
            return (
              <g key={cat}>
                <circle cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" />
                <text
                  x={labelP.x}
                  y={labelP.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill="hsl(var(--muted-foreground))"
                  fontWeight="bold"
                >
                  {GAME_LABELS[cat]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}
