import { useState, useEffect, useMemo } from 'react';
import { Brain, Trophy, TrendingUp, Users, Flame, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];

interface Props {
  students: Student[];
}

interface ScoreRow {
  student_id: string | null;
  student_name: string;
  game_type: string;
  level: number;
  score: number;
  max_level_reached: number;
  total_games_played: number;
  consecutive_wins: number;
  consecutive_losses: number;
}

interface HistoryRow {
  student_id: string | null;
  student_name: string;
  game_type: string;
  won: boolean;
  level_at_time: number;
  points_earned: number;
  created_at: string;
}

const GAME_LABELS: Record<string, string> = {
  memory: 'זיכרון', reaction: 'תגובה', series: 'סדרות',
  math: 'חשבון', reading: 'הבנת הנקרא',
};

const COGNITIVE_DOMAINS: Record<string, string> = {
  memory: 'זיכרון עבודה', reaction: 'מהירות עיבוד', series: 'חשיבה לוגית',
  math: 'חשיבה מתמטית', reading: 'הבנה מילולית',
};

const CHART_COLORS = [
  'hsl(210, 60%, 45%)', 'hsl(142, 50%, 45%)', 'hsl(35, 90%, 55%)',
  'hsl(265, 45%, 50%)', 'hsl(350, 60%, 55%)',
];

function getLevelColor(level: number): string {
  if (level >= 8) return 'text-green-600';
  if (level >= 5) return 'text-primary';
  if (level >= 3) return 'text-amber-500';
  return 'text-muted-foreground';
}

export default function ResetBrainTrainingDashboard({ students }: Props) {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('brain_training_scores').select('*'),
      supabase.from('brain_training_history').select('*').order('created_at', { ascending: false }).limit(500),
    ]).then(([scoresRes, historyRes]) => {
      if (scoresRes.data) setScores(scoresRes.data as ScoreRow[]);
      if (historyRes.data) setHistory(historyRes.data as HistoryRow[]);
      setLoading(false);
    });
  }, []);

  const summary = useMemo(() => {
    const uniqueStudents = new Set(scores.map(s => s.student_id || s.student_name));
    const totalGames = scores.reduce((sum, s) => sum + s.total_games_played, 0);
    const avgLevel = scores.length > 0 ? (scores.reduce((sum, s) => sum + s.max_level_reached, 0) / scores.length).toFixed(1) : '0';
    return { activeStudents: uniqueStudents.size, totalGames, avgLevel, totalStudents: students.length };
  }, [scores, students]);

  const gamePopularity = useMemo(() => {
    const counts: Record<string, number> = {};
    scores.forEach(s => { counts[s.game_type] = (counts[s.game_type] || 0) + s.total_games_played; });
    return Object.entries(counts).map(([type, count]) => ({ name: GAME_LABELS[type] || type, value: count })).sort((a, b) => b.value - a.value);
  }, [scores]);

  const avgLevelByGame = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    scores.forEach(s => {
      if (!grouped[s.game_type]) grouped[s.game_type] = { total: 0, count: 0 };
      grouped[s.game_type].total += s.max_level_reached;
      grouped[s.game_type].count++;
    });
    return Object.entries(grouped).map(([type, data]) => ({
      game: GAME_LABELS[type] || type,
      level: +(data.total / data.count).toFixed(1),
      fullMark: 10,
    }));
  }, [scores]);

  const studentProgress = useMemo(() => {
    const map = new Map<string, { id: string; name: string; totalScore: number; totalGames: number; maxLevel: number; gamesPlayed: Record<string, { maxLevel: number; games: number }> }>();
    scores.forEach(s => {
      const key = s.student_id || s.student_name;
      if (!map.has(key)) map.set(key, { id: s.student_id || '', name: s.student_name, totalScore: 0, totalGames: 0, maxLevel: 0, gamesPlayed: {} });
      const entry = map.get(key)!;
      entry.totalScore += s.score;
      entry.totalGames += s.total_games_played;
      entry.maxLevel = Math.max(entry.maxLevel, s.max_level_reached);
      entry.gamesPlayed[s.game_type] = { maxLevel: s.max_level_reached, games: s.total_games_played };
    });
    return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
  }, [scores]);

  // Weekly trend from history
  const weeklyTrend = useMemo(() => {
    if (history.length === 0) return [];
    const now = new Date();
    const trend = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const weekGames = history.filter(h => { const d = new Date(h.created_at); return d >= weekStart && d < weekEnd; });
      const wins = weekGames.filter(h => h.won).length;
      trend.push({
        week: `שבוע ${4 - w}`,
        games: weekGames.length,
        wins,
        avgLevel: weekGames.length > 0 ? +(weekGames.reduce((s, h) => s + h.level_at_time, 0) / weekGames.length).toFixed(1) : 0,
      });
    }
    return trend;
  }, [history]);

  if (loading) return <div className="p-4 text-center text-muted-foreground text-sm">טוען נתוני אימון מוח...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">התקדמות אימון מוח</h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-card p-3 text-center">
          <Users size={15} className="text-primary mx-auto mb-0.5" />
          <p className="text-lg font-bold text-foreground">{summary.activeStudents}/{summary.totalStudents}</p>
          <p className="text-[10px] text-muted-foreground">תלמידים פעילים</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <Flame size={15} className="text-amber-500 mx-auto mb-0.5" />
          <p className="text-lg font-bold text-foreground">{summary.totalGames}</p>
          <p className="text-[10px] text-muted-foreground">סה"כ משחקים</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <TrendingUp size={15} className="text-primary mx-auto mb-0.5" />
          <p className="text-lg font-bold text-foreground">{summary.avgLevel}</p>
          <p className="text-[10px] text-muted-foreground">ממוצע רמה</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <Trophy size={15} className="text-amber-500 mx-auto mb-0.5" />
          <p className="text-lg font-bold text-foreground">{scores.filter(s => s.max_level_reached >= 5).length}</p>
          <p className="text-[10px] text-muted-foreground">מצטיינים (5+)</p>
        </div>
      </div>

      {/* Charts */}
      {gamePopularity.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-3">פופולריות משחקים</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gamePopularity} layout="vertical">
              <XAxis type="number" fontSize={10} />
              <YAxis dataKey="name" type="category" width={70} fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" name="משחקים" radius={[0, 6, 6, 0]}>
                {gamePopularity.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {avgLevelByGame.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-3">ממוצע רמה לפי יכולת</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={avgLevelByGame}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="game" fontSize={9} />
              <PolarRadiusAxis domain={[0, 10]} fontSize={9} />
              <Radar dataKey="level" stroke="hsl(142, 50%, 45%)" fill="hsl(142, 50%, 45%)" fillOpacity={0.3} name="ממוצע רמה" />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {weeklyTrend.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1">
            <Activity size={13} className="text-primary" /> מגמה שבועית
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="games" name="משחקים" stroke="hsl(210, 60%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="wins" name="ניצחונות" stroke="hsl(142, 50%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Student Progress */}
      <div className="rounded-xl border bg-card p-4">
        <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1">
          <Users size={13} className="text-primary" /> התקדמות תלמידים
        </h4>
        {studentProgress.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">אין נתונים עדיין</p>
        ) : (
          <div className="space-y-1.5">
            {studentProgress.map((sp, idx) => (
              <div key={sp.id || idx} className="border rounded-xl overflow-hidden">
                <button onClick={() => setExpandedStudent(expandedStudent === sp.id ? null : sp.id)}
                  className="w-full flex items-center gap-2 p-2.5 hover:bg-muted/30 transition-colors text-right">
                  <span className={`text-xs font-bold w-5 text-center ${idx < 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{sp.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-center">
                    <div><p className="text-xs font-bold text-primary">{sp.totalScore}</p><p className="text-[9px] text-muted-foreground">ניקוד</p></div>
                    <div><p className="text-xs font-bold text-foreground">{sp.totalGames}</p><p className="text-[9px] text-muted-foreground">משחקים</p></div>
                    <div><p className={`text-xs font-bold ${getLevelColor(sp.maxLevel)}`}>{sp.maxLevel}</p><p className="text-[9px] text-muted-foreground">מקס׳</p></div>
                    {expandedStudent === sp.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>
                </button>
                <AnimatePresence>
                  {expandedStudent === sp.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-2.5 pt-0 border-t bg-muted/20 space-y-1.5">
                        {Object.entries(sp.gamesPlayed).map(([type, data]) => (
                          <div key={type} className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-foreground w-16 truncate">{GAME_LABELS[type] || type}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${(data.maxLevel / 10) * 100}%` }} />
                            </div>
                            <span className={`text-[10px] font-bold w-6 text-left ${getLevelColor(data.maxLevel)}`}>{data.maxLevel}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
