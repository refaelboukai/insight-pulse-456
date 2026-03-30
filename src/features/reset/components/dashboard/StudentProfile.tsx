import { useMemo, useState, useEffect } from 'react';
import { Student, ActivityLog } from '@reset/types';
import { skills } from '@reset/data/skills';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Clock, MessageSquare, Activity, BarChart3, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { supabase } from '@reset/integrations/supabase/client';

interface Props {
  student: Student;
  activities: ActivityLog[];
  onBack: () => void;
}

const CHART_COLORS = [
  'hsl(210, 60%, 45%)', 'hsl(142, 50%, 45%)', 'hsl(35, 90%, 55%)',
  'hsl(265, 45%, 50%)', 'hsl(350, 60%, 55%)', 'hsl(174, 42%, 50%)',
];

const COGNITIVE_DOMAINS: Record<string, string> = {
  memory: 'זיכרון עבודה', reaction: 'מהירות עיבוד', series: 'חשיבה לוגית',
  math: 'חשיבה מתמטית', reading: 'הבנה מילולית', coordination: 'קואורדינציה',
  spatial: 'תפיסה מרחבית', tetris: 'תכנון וארגון', differences: 'קשב וריכוז',
};

const GAME_LABELS: Record<string, string> = {
  memory: 'זיכרון', reaction: 'תגובה', series: 'סדרות', tetris: 'טטריס',
  math: 'חשבון', reading: 'חידון הגיון', coordination: 'קואורדינציה',
  spatial: 'מרחבי', differences: 'הבדלים',
};

export default function StudentProfile({ student, activities, onBack }: Props) {
  const [brainScores, setBrainScores] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('brain_training_scores')
      .select('*')
      .eq('student_id', student.id)
      .then(({ data }) => { if (data) setBrainScores(data); });
  }, [student.id]);

  const studentActs = useMemo(() =>
    activities
      .filter(a => a.studentId === student.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [activities, student.id]
  );

  // Emotion distribution
  const emotionDist = useMemo(() => {
    const counts: Record<string, number> = {};
    studentActs.forEach(a => {
      if (a.selectedState) counts[a.selectedState] = (counts[a.selectedState] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [studentActs]);

  // Intensity over time
  const intensityTimeline = useMemo(() => {
    return studentActs
      .filter(a => a.intensityScore)
      .map(a => ({
        date: new Date(a.timestamp).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
        fullDate: new Date(a.timestamp).toLocaleString('he-IL'),
        intensity: a.intensityScore!,
        emotion: a.selectedState,
      }));
  }, [studentActs]);

  // Skill usage
  const skillUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    studentActs.forEach(a => {
      if (a.skillUsed) {
        const name = skills.find(s => s.id === a.skillUsed)?.name || a.skillUsed;
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [studentActs]);

  // Hour of day distribution
  const hourDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, label: `${i}:00` }));
    studentActs.forEach(a => {
      const h = new Date(a.timestamp).getHours();
      hours[h].count++;
    });
    return hours.filter(h => h.count > 0 || (h.hour >= 7 && h.hour <= 18));
  }, [studentActs]);

  // Day of week distribution
  const dayDistribution = useMemo(() => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const counts = days.map((name, i) => ({ name, day: i, count: 0 }));
    studentActs.forEach(a => {
      const d = new Date(a.timestamp).getDay();
      counts[d].count++;
    });
    return counts;
  }, [studentActs]);

  // Support contacts
  const supportContacts = useMemo(() => {
    return studentActs
      .filter(a => a.supportRequested || a.adultContactName)
      .map(a => ({
        date: new Date(a.timestamp).toLocaleString('he-IL'),
        contactName: a.adultContactName || '—',
        category: a.adultContactCategory || '—',
        emotion: a.selectedState,
        intensity: a.intensityScore,
      }));
  }, [studentActs]);

  // Recurring patterns
  const patterns = useMemo(() => {
    const result: string[] = [];
    
    // Most common emotion
    if (emotionDist.length > 0) {
      const top = emotionDist[0];
      const pct = Math.round((top.value / studentActs.length) * 100);
      result.push(`הרגש הנפוץ ביותר: "${top.name}" (${pct}% מהבדיקות)`);
    }

    // Intensity trend
    if (intensityTimeline.length >= 3) {
      const recent = intensityTimeline.slice(-3);
      const earlier = intensityTimeline.slice(0, Math.min(3, intensityTimeline.length));
      const recentAvg = recent.reduce((s, v) => s + v.intensity, 0) / recent.length;
      const earlierAvg = earlier.reduce((s, v) => s + v.intensity, 0) / earlier.length;
      if (recentAvg > earlierAvg + 1) result.push(`מגמת עלייה ברמת העוצמה (${earlierAvg.toFixed(1)} → ${recentAvg.toFixed(1)})`);
      else if (recentAvg < earlierAvg - 1) result.push(`מגמת ירידה ברמת העוצמה (${earlierAvg.toFixed(1)} → ${recentAvg.toFixed(1)}) 👍`);
      else result.push(`רמת עוצמה יציבה (ממוצע ${recentAvg.toFixed(1)})`);
    }

    // Preferred time
    const peakHour = hourDistribution.reduce((max, h) => h.count > max.count ? h : max, { hour: 0, count: 0, label: '' });
    if (peakHour.count > 1) result.push(`שעת שיא פעילות: ${peakHour.label}`);

    // Preferred skill
    if (skillUsage.length > 0) result.push(`כלי מועדף: ${skillUsage[0].name} (${skillUsage[0].value} שימושים)`);

    // Support frequency
    const supportCount = studentActs.filter(a => a.supportRequested).length;
    if (supportCount > 0) {
      const ratio = Math.round((supportCount / studentActs.length) * 100);
      result.push(`ביקש עזרה ב-${ratio}% מהבדיקות (${supportCount} פעמים)`);
    }

    // Helpful skills
    const helpfulCount = studentActs.filter(a => a.skillHelpful === true).length;
    const notHelpfulCount = studentActs.filter(a => a.skillHelpful === false).length;
    if (helpfulCount + notHelpfulCount > 0) {
      const helpfulPct = Math.round((helpfulCount / (helpfulCount + notHelpfulCount)) * 100);
      result.push(`${helpfulPct}% מהכלים דווחו כמועילים`);
    }

    return result;
  }, [emotionDist, intensityTimeline, hourDistribution, skillUsage, studentActs]);

  // Trend icon
  const trendIcon = useMemo(() => {
    if (intensityTimeline.length < 3) return <Minus size={16} className="text-muted-foreground" />;
    const recent = intensityTimeline.slice(-3);
    const earlier = intensityTimeline.slice(0, 3);
    const recentAvg = recent.reduce((s, v) => s + v.intensity, 0) / recent.length;
    const earlierAvg = earlier.reduce((s, v) => s + v.intensity, 0) / earlier.length;
    if (recentAvg > earlierAvg + 1) return <TrendingUp size={16} className="text-destructive" />;
    if (recentAvg < earlierAvg - 1) return <TrendingDown size={16} className="text-green-600" />;
    return <Minus size={16} className="text-muted-foreground" />;
  }, [intensityTimeline]);

  const totalIntensity = studentActs.filter(a => a.intensityScore).reduce((s, a) => s + a.intensityScore!, 0);
  const intensityCount = studentActs.filter(a => a.intensityScore).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">
      <button onClick={onBack} className="btn-secondary text-sm mb-4 flex items-center gap-1">
        <ArrowRight size={14} /> חזור לדשבורד
      </button>

      {/* Header */}
      <div className="card-reset p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
            <p className="text-sm text-muted-foreground">
              {student.className && `כיתה: ${student.className} | `}
              ת.ז: {student.nationalId} | קוד: {student.accessCode}
              {student.homeroomTeacher && ` | מחנכ/ת: ${student.homeroomTeacher}`}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {trendIcon}
            <span>מגמה</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="card-reset p-4 text-center">
          <p className="text-2xl font-bold text-primary">{studentActs.length}</p>
          <p className="text-xs text-muted-foreground">בדיקות</p>
        </div>
        <div className="card-reset p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{intensityCount > 0 ? (totalIntensity / intensityCount).toFixed(1) : '—'}</p>
          <p className="text-xs text-muted-foreground">ממוצע עוצמה</p>
        </div>
        <div className="card-reset p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{studentActs.filter(a => a.supportRequested).length}</p>
          <p className="text-xs text-muted-foreground">בקשות עזרה</p>
        </div>
        <div className="card-reset p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{skillUsage.length}</p>
          <p className="text-xs text-muted-foreground">כלים שונים</p>
        </div>
        <div className="card-reset p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleDateString('he-IL') : '—'}
          </p>
          <p className="text-xs text-muted-foreground">כניסה אחרונה</p>
        </div>
      </div>

      {/* Patterns Section */}
      {patterns.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-reset p-5 mb-6">
          <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Activity size={16} className="text-primary" /> דפוסים וממצאים
          </h3>
          <ul className="space-y-2">
            {patterns.map((p, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Intensity Timeline */}
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> רמת עוצמה לאורך זמן
          </h3>
          {intensityTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={intensityTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 92%)" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis domain={[0, 10]} fontSize={10} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-md">
                        <p className="font-bold">{d.fullDate}</p>
                        <p>עוצמה: {d.intensity}</p>
                        <p>רגש: {d.emotion}</p>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="intensity" stroke="hsl(210, 60%, 45%)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(210, 60%, 45%)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>

        {/* Emotion Distribution */}
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">התפלגות רגשות</h3>
          {emotionDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={emotionDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {emotionDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>

        {/* Hour of day */}
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock size={14} className="text-primary" /> פעילות לפי שעה ביום
          </h3>
          {hourDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourDistribution}>
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(210, 60%, 45%)" radius={[4, 4, 0, 0]} name="בדיקות" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>

        {/* Day of week */}
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">פעילות לפי יום בשבוע</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayDistribution}>
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(142, 50%, 45%)" radius={[4, 4, 0, 0]} name="בדיקות" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill usage */}
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" /> שימוש בכלים
          </h3>
          {skillUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={skillUsage} layout="vertical">
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="name" type="category" width={80} fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(265, 45%, 50%)" radius={[0, 6, 6, 0]} name="שימושים" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>

        {/* Support contacts */}
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare size={14} className="text-destructive" /> פניות לצוות
          </h3>
          {supportContacts.length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {supportContacts.map((c, i) => (
                <div key={i} className="text-xs bg-secondary/50 rounded-lg p-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">{c.contactName}</span>
                    <span className="text-muted-foreground">{c.date}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {c.category !== '—' && `${c.category} | `}
                    {c.emotion}{c.intensity && ` (עוצמה ${c.intensity})`}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין פניות</p>}
        </div>
      </div>

      {/* Brain Training Progress */}
      {brainScores.length > 0 && (
        <div className="card-reset p-5 mb-6">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Brain size={18} className="text-primary" /> אימון מוח – פרופיל קוגניטיבי
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={Object.keys(COGNITIVE_DOMAINS).map(type => {
                const s = brainScores.find((sc: any) => sc.game_type === type);
                return { domain: COGNITIVE_DOMAINS[type], level: s ? s.max_level_reached : 0, fullMark: 10 };
              })}>
                <PolarGrid stroke="hsl(210, 20%, 92%)" />
                <PolarAngleAxis dataKey="domain" fontSize={9} />
                <PolarRadiusAxis domain={[0, 10]} fontSize={9} />
                <Radar dataKey="level" stroke="hsl(210, 60%, 45%)" fill="hsl(210, 60%, 45%)" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {brainScores
                .sort((a: any, b: any) => b.max_level_reached - a.max_level_reached)
                .map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground w-20 truncate">{GAME_LABELS[s.game_type]}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.max_level_reached / 10) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <span className={`text-xs font-bold w-8 text-left ${
                    s.max_level_reached >= 8 ? 'text-green-600' :
                    s.max_level_reached >= 5 ? 'text-primary' :
                    s.max_level_reached >= 3 ? 'text-warning' : 'text-muted-foreground'
                  }`}>{s.max_level_reached}/10</span>
                </div>
              ))}
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span>סה"כ ניקוד: <b className="text-foreground">{brainScores.reduce((s: number, r: any) => s + r.score, 0)}</b></span>
                <span>משחקים: <b className="text-foreground">{brainScores.reduce((s: number, r: any) => s + r.total_games_played, 0)}</b></span>
              </div>
              {(() => {
                const notTried = Object.keys(GAME_LABELS).filter(t => !brainScores.find((s: any) => s.game_type === t));
                return notTried.length > 0 ? (
                  <p className="text-xs text-muted-foreground">⚡ עדיין לא ניסה: {notTried.map(t => GAME_LABELS[t]).join(', ')}</p>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="card-reset p-5">
        <h3 className="text-base font-bold text-foreground mb-3">היסטוריית פעילות מלאה</h3>
        {studentActs.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין פעילות עדיין.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {[...studentActs].reverse().map(a => (
              <div key={a.id} className="bg-secondary/30 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{a.selectedState}</span>
                    {a.intensityScore && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.intensityScore >= 7 ? 'bg-destructive/10 text-destructive' :
                        a.intensityScore >= 4 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        עוצמה {a.intensityScore}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString('he-IL')}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {a.skillUsed && (
                    <span className="text-xs text-muted-foreground">
                      🔧 {skills.find(s => s.id === a.skillUsed)?.name || a.skillUsed}
                      {a.skillHelpful === true && ' ✅'}
                      {a.skillHelpful === false && ' ❌'}
                    </span>
                  )}
                  {a.supportRequested && <span className="text-xs text-destructive">⚠ בקשת עזרה</span>}
                  {a.adultContactName && <span className="text-xs text-muted-foreground">👤 {a.adultContactName}</span>}
                  {a.resultAfterPractice && <span className="text-xs text-muted-foreground">📝 {a.resultAfterPractice}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
