import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { skills } from '@/data/skills';
import { FileText, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
type Student = Database['public']['Tables']['students']['Row'];

interface Props {
  students: Student[];
}

export default function ResetPeriodicReports({ students }: Props) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(1000)
      .then(({ data }) => { if (data) setActivities(data); setLoading(false); });
  }, []);

  const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const periodLabel = period === 'week' ? 'שבועי' : 'חודשי';

  const filteredActivities = useMemo(() => {
    const cutoff = Date.now() - periodMs;
    return activities.filter(a => new Date(a.created_at).getTime() > cutoff);
  }, [activities, periodMs]);

  const report = useMemo(() => {
    const acts = filteredActivities;
    const activeStudents = new Set(acts.map(a => a.student_id)).size;
    const totalCheckins = acts.length;
    const supportReqs = acts.filter(a => a.support_requested).length;

    const intensities = acts.filter(a => a.intensity_score).map(a => a.intensity_score!);
    const avgIntensity = intensities.length > 0 ? (intensities.reduce((s, v) => s + v, 0) / intensities.length).toFixed(1) : '—';
    const maxIntensity = intensities.length > 0 ? Math.max(...intensities) : 0;

    const emotionCounts: Record<string, number> = {};
    acts.forEach(a => { emotionCounts[a.selected_state] = (emotionCounts[a.selected_state] || 0) + 1; });
    const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const skillCounts: Record<string, number> = {};
    acts.forEach(a => {
      if (a.skill_used) {
        const name = skills.find(s => s.id === a.skill_used)?.name || a.skill_used;
        skillCounts[name] = (skillCounts[name] || 0) + 1;
      }
    });
    const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const helpfulCount = acts.filter(a => a.skill_helpful === true).length;
    const notHelpfulCount = acts.filter(a => a.skill_helpful === false).length;
    const helpfulPct = helpfulCount + notHelpfulCount > 0 ? Math.round((helpfulCount / (helpfulCount + notHelpfulCount)) * 100) : null;

    const positiveCount = acts.filter(a => a.is_positive_reflection).length;

    // Students needing attention
    const studentIntensities: Record<string, { name: string; total: number; count: number; support: number }> = {};
    acts.forEach(a => {
      if (!studentIntensities[a.student_id]) studentIntensities[a.student_id] = { name: a.student_name, total: 0, count: 0, support: 0 };
      if (a.intensity_score) { studentIntensities[a.student_id].total += a.intensity_score; studentIntensities[a.student_id].count++; }
      if (a.support_requested) studentIntensities[a.student_id].support++;
    });
    const needAttention = Object.entries(studentIntensities)
      .filter(([, d]) => (d.count > 0 && d.total / d.count > 6) || d.support >= 2)
      .map(([id, d]) => ({ id, name: d.name, avgIntensity: d.count > 0 ? (d.total / d.count).toFixed(1) : '—', supportCount: d.support }));

    return { activeStudents, totalCheckins, supportReqs, avgIntensity, maxIntensity, topEmotions, topSkills, helpfulPct, needAttention, positiveCount };
  }, [filteredActivities]);

  const exportCSV = () => {
    const rows = filteredActivities.map(a => ({
      תלמיד: a.student_name, רגש: a.selected_state,
      עוצמה: a.intensity_score || '', בקשת_עזרה: a.support_requested ? 'כן' : 'לא',
      כלי: a.skill_used || '', תאריך: new Date(a.created_at).toLocaleString('he-IL'),
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reset_report_${period}.csv`; a.click();
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground text-sm">טוען דוח...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">דוחות תקופתיים – Reset</h3>
      </div>

      {/* Period toggle */}
      <div className="flex gap-2">
        <button onClick={() => setPeriod('week')} className={`text-xs py-1.5 px-3 rounded-lg ${period === 'week' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>שבועי</button>
        <button onClick={() => setPeriod('month')} className={`text-xs py-1.5 px-3 rounded-lg ${period === 'month' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>חודשי</button>
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-card p-4">
        <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1">
          <TrendingUp size={13} className="text-primary" /> סיכום {periodLabel}
        </h4>
        <div className="space-y-2">
          <Row label="תלמידים פעילים" value={`${report.activeStudents} / ${students.length}`} />
          <Row label="סה״כ בדיקות" value={report.totalCheckins} />
          <Row label="ממוצע עוצמה" value={report.avgIntensity} />
          <Row label="עוצמה מקסימלית" value={report.maxIntensity || '—'} />
          <Row label="בקשות עזרה" value={report.supportReqs} highlight />
          <Row label="שיקופים חיוביים" value={report.positiveCount} />
          {report.helpfulPct !== null && <Row label="אחוז כלים מועילים" value={`${report.helpfulPct}%`} />}
        </div>
      </div>

      {/* Top emotions */}
      {report.topEmotions.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-2">רגשות נפוצים</h4>
          <div className="space-y-1.5">
            {report.topEmotions.map(([name, count], i) => (
              <div key={name} className="flex justify-between items-center text-xs">
                <span className="text-foreground">{i + 1}. {name}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(count / filteredActivities.length) * 100}%` }} />
                  </div>
                  <span className="text-muted-foreground w-6 text-left">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top skills */}
      {report.topSkills.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-2">כלים נפוצים</h4>
          <div className="space-y-1">
            {report.topSkills.map(([name, count], i) => (
              <div key={name} className="flex justify-between text-xs">
                <span className="text-foreground">{i + 1}. {name}</span>
                <span className="text-muted-foreground">{count} שימושים</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students needing attention */}
      {report.needAttention.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-card p-4">
          <h4 className="text-xs font-bold text-foreground mb-2">⚠️ תלמידים לתשומת לב</h4>
          <div className="space-y-1.5">
            {report.needAttention.map(s => (
              <div key={s.id} className="flex justify-between items-center text-xs bg-destructive/5 rounded-lg p-2">
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="text-muted-foreground">ממוצע {s.avgIntensity} | {s.supportCount} בקשות</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={exportCSV} size="sm" variant="outline" className="w-full gap-1.5 text-xs">
        <Download size={13} /> ייצוא דוח {periodLabel} ל-CSV
      </Button>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${highlight ? 'text-destructive' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}
