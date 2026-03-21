import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

const CATEGORY_LABELS: Record<string, string> = {
  academic_tasks: 'משימות לימודיות',
  class_presence: 'נוכחות בכיתה',
  behavior: 'התנהגות',
  social_interaction: 'אינטראקציה חברתית',
};

interface Reflection {
  id: string;
  student_id: string | null;
  student_name: string;
  academic_tasks: number;
  class_presence: number;
  behavior: number;
  social_interaction: number;
  created_at: string;
}

export default function ResetReflectionsDashboard() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('daily_reflections').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReflections(data as Reflection[]); setLoading(false); });
  }, []);

  const classAverages = useMemo(() => {
    if (reflections.length === 0) return [];
    const cats = ['academic_tasks', 'class_presence', 'behavior', 'social_interaction'] as const;
    return cats.map(cat => ({
      name: CATEGORY_LABELS[cat],
      avg: Math.round(reflections.reduce((s, r) => s + r[cat], 0) / reflections.length * 10) / 10,
    }));
  }, [reflections]);

  const dailyTrend = useMemo(() => {
    const dayMap = new Map<string, { total: number; count: number }>();
    reflections.forEach(r => {
      const date = r.created_at.split('T')[0];
      if (!dayMap.has(date)) dayMap.set(date, { total: 0, count: 0 });
      const entry = dayMap.get(date)!;
      entry.total += (r.academic_tasks + r.class_presence + r.behavior + r.social_interaction) / 4;
      entry.count++;
    });
    return [...dayMap.entries()]
      .map(([date, { total, count }]) => ({
        date: new Date(date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }),
        avg: Math.round(total / count * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [reflections]);

  const studentSummaries = useMemo(() => {
    const map = new Map<string, Reflection[]>();
    reflections.forEach(r => {
      const key = r.student_id || r.student_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    return [...map.entries()].map(([studentId, refs]) => {
      const latest = refs[0];
      const avg = Math.round(
        refs.reduce((s, r) => s + (r.academic_tasks + r.class_presence + r.behavior + r.social_interaction) / 4, 0) / refs.length * 10
      ) / 10;
      return { studentId, studentName: latest.student_name, totalReflections: refs.length, avg, latest };
    }).sort((a, b) => a.avg - b.avg);
  }, [reflections]);

  const today = new Date().toISOString().split('T')[0];
  const todayCount = reflections.filter(r => r.created_at.startsWith(today)).length;

  const getRatingColor = (avg: number) => {
    if (avg >= 4) return 'text-green-600';
    if (avg >= 3) return 'text-primary';
    if (avg >= 2) return 'text-amber-500';
    return 'text-destructive';
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground text-sm">טוען נתונים...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Star size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">היום שלי – התבוננות עצמית</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-xl font-bold text-primary">{reflections.length}</p>
          <p className="text-[10px] text-muted-foreground">דיווחים</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{studentSummaries.length}</p>
          <p className="text-[10px] text-muted-foreground">תלמידים</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-xl font-bold text-primary">{todayCount}</p>
          <p className="text-[10px] text-muted-foreground">היום</p>
        </div>
      </div>

      {classAverages.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-3">ממוצע כיתתי</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={classAverages}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis domain={[0, 5]} fontSize={9} />
              <Tooltip />
              <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="ממוצע" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {dailyTrend.length > 1 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1">
            <TrendingUp size={13} className="text-primary" /> מגמה יומית
          </h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={9} />
              <YAxis domain={[0, 5]} fontSize={9} />
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke="hsl(142, 50%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="ממוצע" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
        <User size={13} className="text-primary" /> סיכום לפי תלמיד
      </h4>
      <div className="space-y-1.5">
        {studentSummaries.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-muted-foreground text-sm">אין דיווחים עדיין</p>
          </div>
        ) : (
          studentSummaries.map((s, i) => (
            <motion.div key={s.studentId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-foreground">{s.studentName}</span>
                <span className={`text-base font-bold ${getRatingColor(s.avg)}`}>{s.avg}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-secondary rounded-full px-1.5 py-0.5 text-muted-foreground">{s.totalReflections} דיווחים</span>
                <span className="text-[10px] bg-secondary rounded-full px-1.5 py-0.5 text-muted-foreground">
                  📚{s.latest.academic_tasks} 🏫{s.latest.class_presence} 🌟{s.latest.behavior} 🤝{s.latest.social_interaction}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
