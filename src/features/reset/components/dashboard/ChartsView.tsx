import { useMemo } from 'react';
import { ActivityLog } from '@reset/types';
import { skills } from '@reset/data/skills';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

interface Props {
  activities: ActivityLog[];
  onBack: () => void;
}

const CHART_COLORS = [
  'hsl(210, 60%, 45%)', 'hsl(142, 50%, 45%)', 'hsl(35, 90%, 55%)',
  'hsl(265, 45%, 50%)', 'hsl(350, 60%, 55%)', 'hsl(174, 42%, 50%)',
  'hsl(0, 85%, 60%)', 'hsl(210, 80%, 60%)',
];

export default function ChartsView({ activities, onBack }: Props) {
  const emotionDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => { if (a.selectedState) counts[a.selectedState] = (counts[a.selectedState] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [activities]);

  const skillUsageData = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => {
      if (a.skillUsed) {
        const name = skills.find(s => s.id === a.skillUsed)?.name || a.skillUsed;
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [activities]);

  const weeklyTrend = useMemo(() => {
    const weeks: Record<string, { total: number; intensity: number; count: number }> = {};
    activities.forEach(a => {
      const d = new Date(a.timestamp);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
      if (!weeks[key]) weeks[key] = { total: 0, intensity: 0, count: 0 };
      weeks[key].total++;
      if (a.intensityScore) { weeks[key].intensity += a.intensityScore; weeks[key].count++; }
    });
    return Object.entries(weeks).map(([week, data]) => ({
      week, checkins: data.total,
      avgIntensity: data.count > 0 ? +(data.intensity / data.count).toFixed(1) : 0,
    }));
  }, [activities]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">
      <button onClick={onBack} className="btn-secondary text-sm mb-4 flex items-center gap-1">
        <ArrowRight size={14} /> חזור
      </button>
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">גרפים ותרשימים – תמונה כוללת</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">התפלגות רגשות</h3>
          {emotionDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={emotionDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {emotionDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>

        <div className="card-reset p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">שימוש בכלים</h3>
          {skillUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={skillUsageData} layout="vertical">
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="name" type="category" width={80} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(210, 60%, 45%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>

        <div className="card-reset p-5 md:col-span-2">
          <h3 className="text-sm font-bold text-foreground mb-4">מגמה שבועית – בדיקות וממוצע עוצמה</h3>
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 92%)" />
                <XAxis dataKey="week" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="checkins" stroke="hsl(210, 60%, 45%)" strokeWidth={2} name="בדיקות" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="avgIntensity" stroke="hsl(0, 85%, 60%)" strokeWidth={2} name="ממוצע עוצמה" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">אין נתונים</p>}
        </div>
      </div>
    </div>
  );
}
