import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { skills } from '@/data/skills';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

const CHART_COLORS = [
  'hsl(210, 60%, 45%)', 'hsl(142, 50%, 45%)', 'hsl(35, 90%, 55%)',
  'hsl(265, 45%, 50%)', 'hsl(350, 60%, 55%)', 'hsl(174, 42%, 50%)',
  'hsl(0, 85%, 60%)', 'hsl(210, 80%, 60%)',
];

export default function ResetChartsView() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(1000)
      .then(({ data }) => { if (data) setActivities(data); setLoading(false); });
  }, []);

  const emotionDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => { counts[a.selected_state] = (counts[a.selected_state] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [activities]);

  const skillUsageData = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => {
      if (a.skill_used) {
        const name = skills.find(s => s.id === a.skill_used)?.name || a.skill_used;
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [activities]);

  const weeklyTrend = useMemo(() => {
    const weeks: Record<string, { total: number; intensity: number; count: number }> = {};
    activities.forEach(a => {
      const d = new Date(a.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
      if (!weeks[key]) weeks[key] = { total: 0, intensity: 0, count: 0 };
      weeks[key].total++;
      if (a.intensity_score) { weeks[key].intensity += a.intensity_score; weeks[key].count++; }
    });
    return Object.entries(weeks).map(([week, data]) => ({
      week, checkins: data.total,
      avgIntensity: data.count > 0 ? +(data.intensity / data.count).toFixed(1) : 0,
    }));
  }, [activities]);

  if (loading) return <div className="p-4 text-center text-muted-foreground text-sm">טוען גרפים...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">גרפים – פורטל Reset</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-3">התפלגות רגשות</h4>
          {emotionDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={emotionDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {emotionDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-6">אין נתונים</p>}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-3">שימוש בכלים</h4>
          {skillUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={skillUsageData.slice(0, 8)} layout="vertical">
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="name" type="category" width={70} fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(210, 60%, 45%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-6">אין נתונים</p>}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-3">מגמה שבועית</h4>
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="checkins" stroke="hsl(210, 60%, 45%)" strokeWidth={2} name="בדיקות" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avgIntensity" stroke="hsl(0, 85%, 60%)" strokeWidth={2} name="ממוצע עוצמה" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-6">אין נתונים</p>}
        </div>
      </div>
    </div>
  );
}
