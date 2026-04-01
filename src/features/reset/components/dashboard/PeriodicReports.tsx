import { useMemo, useState } from 'react';
import { Student, ActivityLog } from '@reset/types';
import { skills } from '@reset/data/skills';
import { ArrowRight, Download, FileText, TrendingUp, Users, User } from 'lucide-react';

interface Props {
  students: Student[];
  activities: ActivityLog[];
  onBack: () => void;
  onSelectStudent: (id: string) => void;
}

type Period = 'week' | 'month';
type ReportScope = 'all' | 'student';

export default function PeriodicReports({ students, activities, onBack, onSelectStudent }: Props) {
  const [period, setPeriod] = useState<Period>('week');
  const [scope, setScope] = useState<ReportScope>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const periodLabel = period === 'week' ? 'שבועי' : 'חודשי';

  const filteredActivities = useMemo(() => {
    const cutoff = Date.now() - periodMs;
    let acts = activities.filter(a => new Date(a.timestamp).getTime() > cutoff);
    if (scope === 'student' && selectedStudentId) {
      acts = acts.filter(a => a.studentId === selectedStudentId);
    }
    return acts;
  }, [activities, periodMs, scope, selectedStudentId]);

  const report = useMemo(() => {
    const acts = filteredActivities;
    const activeStudents = new Set(acts.map(a => a.studentId)).size;
    const totalCheckins = acts.length;
    const supportReqs = acts.filter(a => a.supportRequested).length;
    const intensities = acts.filter(a => a.intensityScore).map(a => a.intensityScore!);
    const avgIntensity = intensities.length > 0 ? (intensities.reduce((s, v) => s + v, 0) / intensities.length).toFixed(1) : '—';
    const maxIntensity = intensities.length > 0 ? Math.max(...intensities) : 0;

    const emotionCounts: Record<string, number> = {};
    acts.forEach(a => { if (a.selectedState) emotionCounts[a.selectedState] = (emotionCounts[a.selectedState] || 0) + 1; });
    const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const skillCounts: Record<string, number> = {};
    acts.forEach(a => {
      if (a.skillUsed) {
        const name = skills.find(s => s.id === a.skillUsed)?.name || a.skillUsed;
        skillCounts[name] = (skillCounts[name] || 0) + 1;
      }
    });
    const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const helpfulCount = acts.filter(a => a.skillHelpful === true).length;
    const notHelpfulCount = acts.filter(a => a.skillHelpful === false).length;
    const helpfulPct = helpfulCount + notHelpfulCount > 0 ? Math.round((helpfulCount / (helpfulCount + notHelpfulCount)) * 100) : null;

    const studentIntensities: Record<string, { name: string; total: number; count: number; support: number }> = {};
    acts.forEach(a => {
      if (!studentIntensities[a.studentId]) studentIntensities[a.studentId] = { name: a.studentName, total: 0, count: 0, support: 0 };
      if (a.intensityScore) { studentIntensities[a.studentId].total += a.intensityScore; studentIntensities[a.studentId].count++; }
      if (a.supportRequested) studentIntensities[a.studentId].support++;
    });
    const needAttention = Object.entries(studentIntensities)
      .filter(([, d]) => (d.count > 0 && d.total / d.count > 6) || d.support >= 2)
      .map(([id, d]) => ({ id, name: d.name, avgIntensity: d.count > 0 ? (d.total / d.count).toFixed(1) : '—', supportCount: d.support }));

    const positiveCount = acts.filter(a => a.isPositiveReflection).length;

    return { activeStudents, totalCheckins, supportReqs, avgIntensity, maxIntensity, topEmotions, topSkills, helpfulPct, needAttention, positiveCount };
  }, [filteredActivities]);

  const exportCSV = () => {
    const rows = filteredActivities.map(a => ({
      תלמיד: a.studentName, רגש: a.selectedState, עוצמה: a.intensityScore || '',
      כלי: a.skillUsed ? (skills.find(s => s.id === a.skillUsed)?.name || a.skillUsed) : '',
      מועיל: a.skillHelpful === true ? 'כן' : a.skillHelpful === false ? 'לא' : '',
      בקשת_עזרה: a.supportRequested ? 'כן' : 'לא',
      איש_קשר: a.adultContactName || '',
      תאריך: new Date(a.timestamp).toLocaleString('he-IL'),
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report-${periodLabel}-${scope === 'student' ? selectedStudentId : 'all'}.csv`; a.click();
  };

  return (
    <div className="bg-background p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-primary hover:underline flex items-center gap-1">
        <ArrowRight size={14} /> חזור לדשבורד
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[hsl(35,50%,90%)] flex items-center justify-center">
          <FileText size={20} className="text-[hsl(35,60%,35%)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">דוחות תקופתיים</h2>
          <p className="text-xs text-muted-foreground">סיכום {periodLabel} של הפעילות</p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm mb-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">תקופה</label>
            <div className="flex gap-2">
              <button onClick={() => setPeriod('week')} className={`text-xs py-1.5 px-3 rounded-lg ${period === 'week' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>שבועי</button>
              <button onClick={() => setPeriod('month')} className={`text-xs py-1.5 px-3 rounded-lg ${period === 'month' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>חודשי</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">היקף</label>
            <div className="flex gap-2">
              <button onClick={() => { setScope('all'); setSelectedStudentId(''); }} className={`text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 ${scope === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                <Users size={12} /> כלל התלמידים
              </button>
              <button onClick={() => setScope('student')} className={`text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 ${scope === 'student' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                <User size={12} /> תלמיד ספציפי
              </button>
            </div>
          </div>
          {scope === 'student' && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground block mb-1">בחר תלמיד</label>
              <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— בחר —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm mb-5">
        <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
          <TrendingUp size={13} /> סיכום {periodLabel}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/40 bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> נתונים עיקריים
            </h3>
            <div className="space-y-3">
              {scope === 'all' && <Row label="תלמידים פעילים" value={`${report.activeStudents} / ${students.length}`} />}
              <Row label="סה״כ בדיקות" value={report.totalCheckins} />
              <Row label="ממוצע עוצמה" value={report.avgIntensity} />
              <Row label="עוצמה מקסימלית" value={report.maxIntensity || '—'} />
              <Row label="בקשות עזרה" value={report.supportReqs} highlight />
              <Row label="שיקופים חיוביים" value={report.positiveCount} />
              {report.helpfulPct !== null && <Row label="אחוז כלים מועילים" value={`${report.helpfulPct}%`} />}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border/40 bg-card p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">רגשות נפוצים</h3>
              <div className="space-y-2">
                {report.topEmotions.length === 0 && <p className="text-sm text-muted-foreground">אין נתונים</p>}
                {report.topEmotions.map(([name, count], i) => (
                  <div key={name} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{i + 1}. {name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(count / filteredActivities.length) * 100}%` }} />
                      </div>
                      <span className="text-muted-foreground text-xs w-8 text-left">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">כלים נפוצים</h3>
              <div className="space-y-2">
                {report.topSkills.length === 0 && <p className="text-sm text-muted-foreground">אין נתונים</p>}
                {report.topSkills.map(([name, count], i) => (
                  <div key={name} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{i + 1}. {name}</span>
                    <span className="text-muted-foreground text-xs">{count} שימושים</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {scope === 'all' && report.needAttention.length > 0 && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 mt-4">
            <h3 className="text-sm font-bold text-foreground mb-3">⚠️ תלמידים לתשומת לב</h3>
            <div className="space-y-2">
              {report.needAttention.map(s => (
                <div key={s.id} className="flex justify-between items-center text-sm bg-card rounded-lg p-2">
                  <button onClick={() => onSelectStudent(s.id)} className="font-medium text-foreground hover:text-primary hover:underline">
                    {s.name}
                  </button>
                  <div className="text-xs text-muted-foreground">
                    ממוצע {s.avgIntensity} | {s.supportCount} בקשות עזרה
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={exportCSV} className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold text-sm flex items-center justify-center gap-2">
        <Download size={14} /> ייצוא דוח {periodLabel} ל-CSV
      </button>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${highlight ? 'text-destructive' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}
