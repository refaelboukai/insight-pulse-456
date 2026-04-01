import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Brain, Trophy, TrendingUp, TrendingDown, Users, Flame, ChevronDown, ChevronUp, Eye, AlertTriangle, Sparkles, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@reset/integrations/supabase/client';
import { Student } from '@reset/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell, Legend,
} from 'recharts';

interface Props {
  students: Student[];
  onBack: () => void;
  onSelectStudent?: (id: string) => void;
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

interface CognitiveChange {
  studentName: string;
  studentId: string;
  domain: string;
  gameType: string;
  previousLevel: number;
  currentLevel: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
  winRate: number;
  gamesThisWeek: number;
  gamesLastWeek: number;
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
  updated_at: string;
  created_at: string;
}

const GAME_LABELS: Record<string, string> = {
  memory: 'זיכרון',
  reaction: 'תגובה',
  series: 'סדרות',
  tetris: 'טטריס',
  math: 'חשבון',
  reading: 'חידון הגיון',
  coordination: 'קואורדינציה',
  spatial: 'מרחבי',
  differences: 'הבדלים',
};

const COGNITIVE_DOMAINS: Record<string, string> = {
  memory: 'זיכרון עבודה',
  reaction: 'מהירות עיבוד',
  series: 'חשיבה לוגית',
  math: 'חשיבה מתמטית',
  reading: 'הבנה מילולית',
  coordination: 'קואורדינציה',
  spatial: 'תפיסה מרחבית',
  tetris: 'תכנון וארגון',
  differences: 'קשב וריכוז',
};

const CHART_COLORS = [
  'hsl(210, 60%, 45%)', 'hsl(142, 50%, 45%)', 'hsl(35, 90%, 55%)',
  'hsl(265, 45%, 50%)', 'hsl(350, 60%, 55%)', 'hsl(174, 42%, 50%)',
  'hsl(0, 85%, 60%)', 'hsl(210, 80%, 60%)', 'hsl(30, 70%, 50%)',
];

function getLevelColor(level: number): string {
  if (level >= 8) return 'text-green-600';
  if (level >= 5) return 'text-primary';
  if (level >= 3) return 'text-warning';
  return 'text-muted-foreground';
}

function getLevelBg(level: number): string {
  if (level >= 8) return 'bg-green-100';
  if (level >= 5) return 'bg-primary/10';
  if (level >= 3) return 'bg-warning/10';
  return 'bg-secondary';
}

export default function BrainTrainingDashboard({ students, onBack, onSelectStudent }: Props) {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('brain_training_scores').select('*'),
      supabase.from('brain_training_history').select('*').order('created_at', { ascending: false }).limit(1000),
    ]).then(([scoresRes, historyRes]) => {
      if (scoresRes.data) setScores(scoresRes.data as ScoreRow[]);
      if (historyRes.data) setHistory(historyRes.data as HistoryRow[]);
      setLoading(false);
    });
  }, []);

  // Summary stats
  const summary = useMemo(() => {
    const uniqueStudents = new Set(scores.map(s => s.student_id || s.student_name));
    const totalGames = scores.reduce((sum, s) => sum + s.total_games_played, 0);
    const avgLevel = scores.length > 0
      ? (scores.reduce((sum, s) => sum + s.max_level_reached, 0) / scores.length).toFixed(1)
      : '0';
    const highPerformers = new Set<string>();
    scores.forEach(s => { if (s.max_level_reached >= 5) highPerformers.add(s.student_id || s.student_name); });
    return {
      activeStudents: uniqueStudents.size,
      totalGames,
      avgLevel,
      totalStudents: students.length,
      highPerformers: highPerformers.size,
    };
  }, [scores, students]);

  // Per-student aggregated data
  const studentProgress = useMemo(() => {
    const map = new Map<string, {
      id: string; name: string; totalScore: number; totalGames: number;
      maxLevel: number; gamesPlayed: Record<string, { level: number; maxLevel: number; games: number; score: number }>;
      strongAreas: string[]; weakAreas: string[];
    }>();

    scores.forEach(s => {
      const key = s.student_id || s.student_name;
      if (!map.has(key)) {
        map.set(key, {
          id: s.student_id || '', name: s.student_name,
          totalScore: 0, totalGames: 0, maxLevel: 0, gamesPlayed: {},
          strongAreas: [], weakAreas: [],
        });
      }
      const entry = map.get(key)!;
      entry.totalScore += s.score;
      entry.totalGames += s.total_games_played;
      entry.maxLevel = Math.max(entry.maxLevel, s.max_level_reached);
      entry.gamesPlayed[s.game_type] = {
        level: s.level,
        maxLevel: s.max_level_reached,
        games: s.total_games_played,
        score: s.score,
      };
    });

    // Calculate strong/weak areas
    map.forEach(entry => {
      const gameEntries = Object.entries(entry.gamesPlayed);
      gameEntries.forEach(([type, data]) => {
        if (data.maxLevel >= 5) entry.strongAreas.push(COGNITIVE_DOMAINS[type] || type);
        else if (data.maxLevel <= 2 && data.games >= 3) entry.weakAreas.push(COGNITIVE_DOMAINS[type] || type);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
  }, [scores]);

  // Games popularity
  const gamePopularity = useMemo(() => {
    const filtered = selectedStudent === 'all' ? scores : scores.filter(s => s.student_id === selectedStudent);
    const counts: Record<string, number> = {};
    filtered.forEach(s => { counts[s.game_type] = (counts[s.game_type] || 0) + s.total_games_played; });
    return Object.entries(counts)
      .map(([type, count]) => ({ name: GAME_LABELS[type] || type, value: count, type }))
      .sort((a, b) => b.value - a.value);
  }, [scores, selectedStudent]);

  // Avg max level per game
  const avgLevelByGame = useMemo(() => {
    const filtered = selectedStudent === 'all' ? scores : scores.filter(s => s.student_id === selectedStudent);
    const grouped: Record<string, { total: number; count: number }> = {};
    filtered.forEach(s => {
      if (!grouped[s.game_type]) grouped[s.game_type] = { total: 0, count: 0 };
      grouped[s.game_type].total += s.max_level_reached;
      grouped[s.game_type].count++;
    });
    return Object.entries(grouped).map(([type, data]) => ({
      game: GAME_LABELS[type] || type,
      domain: COGNITIVE_DOMAINS[type] || type,
      level: +(data.total / data.count).toFixed(1),
      fullMark: 10,
    }));
  }, [scores, selectedStudent]);

  // Cognitive changes detection
  const cognitiveChanges = useMemo(() => {
    if (history.length === 0) return { changes: [] as CognitiveChange[], weeklyTrend: [] as any[], alerts: [] as string[] };

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = history.filter(h => new Date(h.created_at) >= oneWeekAgo);
    const lastWeek = history.filter(h => {
      const d = new Date(h.created_at);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    });

    // Per student+game changes
    const changes: CognitiveChange[] = [];
    const studentGames = new Map<string, Map<string, { thisWeek: HistoryRow[]; lastWeek: HistoryRow[] }>>();

    const addToMap = (rows: HistoryRow[], period: 'thisWeek' | 'lastWeek') => {
      rows.forEach(r => {
        const sid = r.student_id || r.student_name;
        if (!studentGames.has(sid)) studentGames.set(sid, new Map());
        const gMap = studentGames.get(sid)!;
        if (!gMap.has(r.game_type)) gMap.set(r.game_type, { thisWeek: [], lastWeek: [] });
        gMap.get(r.game_type)![period].push(r);
      });
    };
    addToMap(thisWeek, 'thisWeek');
    addToMap(lastWeek, 'lastWeek');

    studentGames.forEach((gMap, sid) => {
      gMap.forEach((data, gameType) => {
        if (data.thisWeek.length === 0 && data.lastWeek.length === 0) return;
        const avgLevelThis = data.thisWeek.length > 0
          ? data.thisWeek.reduce((s, h) => s + h.level_at_time, 0) / data.thisWeek.length : 0;
        const avgLevelLast = data.lastWeek.length > 0
          ? data.lastWeek.reduce((s, h) => s + h.level_at_time, 0) / data.lastWeek.length : 0;
        const winRateThis = data.thisWeek.length > 0
          ? data.thisWeek.filter(h => h.won).length / data.thisWeek.length : 0;

        if (data.thisWeek.length > 0 || data.lastWeek.length > 0) {
          const change = avgLevelThis - avgLevelLast;
          const name = data.thisWeek[0]?.student_name || data.lastWeek[0]?.student_name || sid;
          changes.push({
            studentName: name,
            studentId: sid,
            domain: COGNITIVE_DOMAINS[gameType] || gameType,
            gameType,
            previousLevel: +avgLevelLast.toFixed(1),
            currentLevel: +avgLevelThis.toFixed(1),
            change: +change.toFixed(1),
            direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable',
            winRate: +(winRateThis * 100).toFixed(0),
            gamesThisWeek: data.thisWeek.length,
            gamesLastWeek: data.lastWeek.length,
          });
        }
      });
    });

    // Weekly activity trend (last 4 weeks)
    const weeklyTrend = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const weekGames = history.filter(h => {
        const d = new Date(h.created_at);
        return d >= weekStart && d < weekEnd;
      });
      const wins = weekGames.filter(h => h.won).length;
      const avgLevel = weekGames.length > 0
        ? +(weekGames.reduce((s, h) => s + h.level_at_time, 0) / weekGames.length).toFixed(1) : 0;
      weeklyTrend.push({
        week: `שבוע ${4 - w}`,
        games: weekGames.length,
        wins,
        avgLevel,
        winRate: weekGames.length > 0 ? +((wins / weekGames.length) * 100).toFixed(0) : 0,
      });
    }

    // Alerts
    const alerts: string[] = [];
    const significantDrops = changes.filter(c => c.direction === 'down' && c.change <= -1);
    significantDrops.forEach(c => {
      alerts.push(`⚠️ ${c.studentName} – ירידה ב${c.domain} (${c.change} רמות)`);
    });
    const inactiveThisWeek = changes.filter(c => c.gamesThisWeek === 0 && c.gamesLastWeek >= 3);
    inactiveThisWeek.forEach(c => {
      alerts.push(`💤 ${c.studentName} – הפסיק לשחק ${c.domain} (${c.gamesLastWeek} משחקים שבוע שעבר)`);
    });
    const bigImprovements = changes.filter(c => c.direction === 'up' && c.change >= 2);
    bigImprovements.forEach(c => {
      alerts.push(`🌟 ${c.studentName} – קפיצה משמעותית ב${c.domain} (+${c.change} רמות!)`);
    });

    return { changes: changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)), weeklyTrend, alerts };
  }, [history]);


  const cognitiveProfile = useMemo(() => {
    if (selectedStudent === 'all') return null;
    const studentScores = scores.filter(s => s.student_id === selectedStudent);
    if (studentScores.length === 0) return null;
    return Object.keys(COGNITIVE_DOMAINS).map(type => {
      const s = studentScores.find(sc => sc.game_type === type);
      return {
        domain: COGNITIVE_DOMAINS[type],
        level: s ? s.max_level_reached : 0,
        fullMark: 10,
      };
    });
  }, [scores, selectedStudent]);

  // Students with activity
  const activeStudentsList = useMemo(() => {
    const uniqueIds = new Set(scores.filter(s => s.student_id).map(s => s.student_id!));
    return students.filter(s => uniqueIds.has(s.id));
  }, [scores, students]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 max-w-5xl mx-auto flex items-center justify-center" dir="rtl">
        <p className="text-muted-foreground">טוען נתוני אימון מוח...</p>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-primary hover:underline flex items-center gap-1">
        <ArrowRight size={14} /> חזור לדשבורד
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[hsl(265,50%,92%)] flex items-center justify-center">
          <Brain size={20} className="text-[hsl(265,45%,45%)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">התקדמות אימון מוח</h2>
          <p className="text-xs text-muted-foreground">{summary.activeStudents} תלמידים פעילים</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-center shadow-sm">
          <Users size={18} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{summary.activeStudents}/{summary.totalStudents}</p>
          <p className="text-xs text-muted-foreground">תלמידים פעילים</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-center shadow-sm">
          <Flame size={18} className="text-[hsl(35,90%,55%)] mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{summary.totalGames}</p>
          <p className="text-xs text-muted-foreground">סה"כ משחקים</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-center shadow-sm">
          <TrendingUp size={18} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{summary.avgLevel}</p>
          <p className="text-xs text-muted-foreground">ממוצע רמה</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-center shadow-sm">
          <Trophy size={18} className="text-[hsl(35,90%,55%)] mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{summary.highPerformers}</p>
          <p className="text-xs text-muted-foreground">מצטיינים (5+)</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-center shadow-sm">
          <Brain size={18} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{Object.keys(GAME_LABELS).length}</p>
          <p className="text-xs text-muted-foreground">משחקים זמינים</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm mb-5">
        <p className="text-xs font-bold text-muted-foreground mb-3">סינון</p>
        <select
          value={selectedStudent}
          onChange={e => setSelectedStudent(e.target.value)}
          className="w-full md:w-64 px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm"
        >
          <option value="all">כל התלמידים</option>
          {activeStudentsList.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      {/* Cognitive Profile for selected student */}
      {cognitiveProfile && selectedStudent !== 'all' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-reset p-5 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Brain size={16} className="text-primary" />
            פרופיל קוגניטיבי – {activeStudentsList.find(s => s.id === selectedStudent)?.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={cognitiveProfile}>
                <PolarGrid stroke="hsl(210, 20%, 92%)" />
                <PolarAngleAxis dataKey="domain" fontSize={9} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={9} />
                <Radar dataKey="level" stroke="hsl(210, 60%, 45%)" fill="hsl(210, 60%, 45%)" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {cognitiveProfile.filter(c => c.level > 0).sort((a, b) => b.level - a.level).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{c.domain}</span>
                      <span className={`text-xs font-bold ${getLevelColor(c.level)}`}>רמה {c.level}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.level / 10) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {cognitiveProfile.filter(c => c.level === 0).length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  ⚡ עדיין לא ניסה: {cognitiveProfile.filter(c => c.level === 0).map(c => c.domain).join(', ')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Game Popularity */}
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">פופולריות משחקים</h3>
          {gamePopularity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gamePopularity} layout="vertical">
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="name" type="category" width={80} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" name="משחקים" radius={[0, 6, 6, 0]}>
                  {gamePopularity.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>

        {/* Avg Level Radar */}
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">ממוצע רמה לפי יכולת</h3>
          {avgLevelByGame.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={avgLevelByGame}>
                <PolarGrid stroke="hsl(210, 20%, 92%)" />
                <PolarAngleAxis dataKey="game" fontSize={9} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={9} />
                <Radar dataKey="level" stroke="hsl(142, 50%, 45%)" fill="hsl(142, 50%, 45%)" fillOpacity={0.3} name="ממוצע רמה" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>
      </div>

      {/* 🧠 Cognitive Changes Detection Section */}
      {history.length > 0 && (
        <div className="space-y-4 mb-6">
          {/* Alerts */}
          {cognitiveChanges.alerts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-reset p-5 border-r-4 border-warning">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning" />
                שינויים קוגניטיביים שזוהו
              </h3>
              <div className="space-y-2">
                {cognitiveChanges.alerts.map((alert, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-sm text-foreground bg-secondary/50 rounded-lg px-3 py-2"
                  >
                    {alert}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}

          {/* Weekly Trend Chart */}
          <div className="card-reset p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              מגמה שבועית – 4 שבועות אחרונים
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={cognitiveChanges.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" fontSize={11} />
                <YAxis yAxisId="left" fontSize={11} />
                <YAxis yAxisId="right" orientation="left" fontSize={11} hide />
                <Tooltip />
                <Legend fontSize={10} />
                <Line yAxisId="left" type="monotone" dataKey="games" name="משחקים" stroke="hsl(210, 60%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left" type="monotone" dataKey="wins" name="ניצחונות" stroke="hsl(142, 50%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left" type="monotone" dataKey="avgLevel" name="ממוצע רמה" stroke="hsl(35, 90%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Significant Changes Table */}
          {cognitiveChanges.changes.filter(c => c.direction !== 'stable').length > 0 && (
            <div className="card-reset p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                שינויים בולטים – השוואה שבועית
              </h3>
              <div className="space-y-2">
                {cognitiveChanges.changes
                  .filter(c => c.direction !== 'stable')
                  .slice(0, 15)
                  .map((c, i) => (
                    <motion.div
                      key={`${c.studentId}-${c.gameType}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        c.direction === 'up' ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'
                      }`}
                    >
                      {c.direction === 'up' ? (
                        <TrendingUp size={18} className="text-green-600 shrink-0" />
                      ) : (
                        <TrendingDown size={18} className="text-destructive shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{c.studentName}</p>
                        <p className="text-xs text-muted-foreground">{c.domain}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">שבוע קודם</p>
                        <p className="text-sm font-bold text-foreground">{c.previousLevel || '–'}</p>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">השבוע</p>
                        <p className="text-sm font-bold text-foreground">{c.currentLevel || '–'}</p>
                      </div>
                      <div className={`text-sm font-bold px-2 py-1 rounded-lg ${
                        c.direction === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-destructive dark:bg-red-900/30'
                      }`}>
                        {c.change > 0 ? '+' : ''}{c.change}
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="text-xs text-muted-foreground">אחוז ניצחון</p>
                        <p className="text-sm font-bold text-foreground">{c.winRate}%</p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}


      <div className="card-reset p-5">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Users size={18} className="text-primary" />
          התקדמות תלמידים – פירוט אישי
        </h3>

        {studentProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">אין נתונים עדיין</p>
        ) : (
          <div className="space-y-2">
            {studentProgress.map((sp, idx) => (
              <div key={sp.id || idx} className="border border-border rounded-xl overflow-hidden">
                {/* Student Row */}
                <button
                  onClick={() => setExpandedStudent(expandedStudent === sp.id ? null : sp.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors text-right"
                >
                  <span className={`text-sm font-bold w-6 text-center ${idx < 3 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{sp.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {sp.strongAreas.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                          💪 {sp.strongAreas.slice(0, 2).join(', ')}
                        </span>
                      )}
                      {sp.weakAreas.length > 0 && (
                        <span className="text-xs bg-warning/10 text-warning rounded-full px-2 py-0.5">
                          📈 לחזק: {sp.weakAreas.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-primary">{sp.totalScore}</p>
                      <p className="text-[10px] text-muted-foreground">ניקוד</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">{sp.totalGames}</p>
                      <p className="text-[10px] text-muted-foreground">משחקים</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${getLevelColor(sp.maxLevel)}`}>{sp.maxLevel}</p>
                      <p className="text-[10px] text-muted-foreground">רמה מקס׳</p>
                    </div>
                    {expandedStudent === sp.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {expandedStudent === sp.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 pt-0 border-t border-border bg-secondary/20">
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {Object.entries(sp.gamesPlayed).map(([type, data]) => (
                            <div key={type} className={`rounded-lg p-2.5 text-center ${getLevelBg(data.maxLevel)}`}>
                              <p className="text-xs font-bold text-foreground">{GAME_LABELS[type]}</p>
                              <p className={`text-lg font-bold ${getLevelColor(data.maxLevel)}`}>{data.maxLevel}</p>
                              <p className="text-[10px] text-muted-foreground">{data.games} משחקים</p>
                              <div className="h-1.5 rounded-full bg-background/50 mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${(data.maxLevel / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Not tried games */}
                        {(() => {
                          const notTried = Object.keys(GAME_LABELS).filter(t => !sp.gamesPlayed[t]);
                          return notTried.length > 0 ? (
                            <p className="text-xs text-muted-foreground mt-3">
                              ⚡ עדיין לא ניסה: {notTried.map(t => GAME_LABELS[t]).join(', ')}
                            </p>
                          ) : null;
                        })()}
                        {onSelectStudent && sp.id && (
                          <button
                            onClick={() => onSelectStudent(sp.id)}
                            className="mt-3 text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                          >
                            <Eye size={14} /> צפה בפרופיל המלא
                          </button>
                        )}
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
