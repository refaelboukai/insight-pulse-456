import { useState, useEffect, useMemo } from 'react';
import { Student } from '@reset/types';
import { supabase } from '@reset/integrations/supabase/client';
import { ArrowRight, Star, TrendingUp, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

interface Props {
  students: Student[];
  onBack: () => void;
  onSelectStudent: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  academic_tasks: 'משימות לימודיות',
  class_presence: 'נוכחות בכיתה',
  behavior: 'התנהגות',
  social_interaction: 'אינטראקציה חברתית',
};

const CATEGORY_EMOJI: Record<string, string> = {
  academic_tasks: '📚',
  class_presence: '🏫',
  behavior: '🌟',
  social_interaction: '🤝',
};

interface Reflection {
  id: string;
  student_id: string;
  student_name: string;
  academic_tasks: number;
  class_presence: number;
  behavior: number;
  social_interaction: number;
  reflection_date: string;
  created_at: string;
}

export default function ReflectionsDashboard({ students, onBack, onSelectStudent }: Props) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('daily_reflections')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReflections(data as Reflection[]);
        setLoading(false);
      });
  }, []);

  // Class average per category
  const classAverages = useMemo(() => {
    if (reflections.length === 0) return [];
    const cats = ['academic_tasks', 'class_presence', 'behavior', 'social_interaction'] as const;
    return cats.map(cat => ({
      name: CATEGORY_LABELS[cat],
      emoji: CATEGORY_EMOJI[cat],
      avg: Math.round(reflections.reduce((s, r) => s + r[cat], 0) / reflections.length * 10) / 10,
    }));
  }, [reflections]);

  // Daily trend (last 14 days)
  const dailyTrend = useMemo(() => {
    const dayMap = new Map<string, { total: number; count: number }>();
    reflections.forEach(r => {
      const date = r.reflection_date;
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

  // Per student summary
  const studentSummaries = useMemo(() => {
    const map = new Map<string, Reflection[]>();
    reflections.forEach(r => {
      if (!map.has(r.student_id)) map.set(r.student_id, []);
      map.get(r.student_id)!.push(r);
    });

    return [...map.entries()].map(([studentId, refs]) => {
      const latest = refs[0]; // already sorted desc
      const avg = Math.round(
        refs.reduce((s, r) => s + (r.academic_tasks + r.class_presence + r.behavior + r.social_interaction) / 4, 0) / refs.length * 10
      ) / 10;
      return {
        studentId,
        studentName: latest.student_name,
        totalReflections: refs.length,
        avg,
        latest,
      };
    }).sort((a, b) => a.avg - b.avg); // lowest first for attention
  }, [reflections]);

  // Today's submissions
  const today = new Date().toISOString().split('T')[0];
  const todayCount = reflections.filter(r => r.reflection_date === today).length;

  const getRatingColor = (avg: number) => {
    if (avg >= 4) return 'text-green-600';
    if (avg >= 3) return 'text-primary';
    if (avg >= 2) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center" dir="rtl">
        <p className="text-muted-foreground">טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">
      <button onClick={onBack} className="btn-secondary text-sm mb-4 flex items-center gap-1">
        <ArrowRight size={14} /> חזור לדשבורד
      </button>

      <div className="flex items-center gap-2 mb-6">
        <Star size={20} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">היום שלי – התבוננות עצמית</h2>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-reset p-4 text-center">
          <p className="text-2xl font-bold text-primary">{reflections.length}</p>
          <p className="text-xs text-muted-foreground">דיווחים</p>
        </div>
        <div className="card-reset p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{studentSummaries.length}</p>
          <p className="text-xs text-muted-foreground">תלמידים דיווחו</p>
        </div>
        <div className="card-reset p-4 text-center">
          <p className="text-2xl font-bold text-primary">{todayCount}</p>
          <p className="text-xs text-muted-foreground">דיווחו היום</p>
        </div>
      </div>

      {/* Class averages */}
      {classAverages.length > 0 && (
        <div className="card-reset p-5 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-4">ממוצע כיתתי לפי קטגוריה</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={classAverages}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 92%)" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis domain={[0, 5]} fontSize={10} />
              <Tooltip />
              <Bar dataKey="avg" fill="hsl(210, 60%, 45%)" radius={[6, 6, 0, 0]} name="ממוצע" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily trend */}
      {dailyTrend.length > 1 && (
        <div className="card-reset p-5 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> מגמה יומית (ממוצע כללי)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 92%)" />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis domain={[0, 5]} fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke="hsl(142, 50%, 45%)" strokeWidth={2} dot={{ r: 4 }} name="ממוצע" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per student */}
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <User size={14} className="text-primary" /> סיכום לפי תלמיד
      </h3>
      <div className="space-y-2 mb-6">
        {studentSummaries.length === 0 ? (
          <div className="card-reset p-8 text-center">
            <p className="text-muted-foreground">אין דיווחים עדיין</p>
          </div>
        ) : (
          studentSummaries.map((s, i) => (
            <motion.div
              key={s.studentId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-reset p-4 hover:bg-secondary/30 cursor-pointer transition-colors"
              onClick={() => onSelectStudent(s.studentId)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-foreground">{s.studentName}</span>
                <span className={`text-lg font-bold ${getRatingColor(s.avg)}`}>{s.avg}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-[11px] bg-secondary rounded-full px-2 py-0.5 text-muted-foreground">
                  {s.totalReflections} דיווחים
                </span>
                <span className="text-[11px] bg-secondary rounded-full px-2 py-0.5 text-muted-foreground">
                  📚 {s.latest.academic_tasks} | 🏫 {s.latest.class_presence} | 🌟 {s.latest.behavior} | 🤝 {s.latest.social_interaction}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
