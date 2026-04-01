import { useMemo } from 'react';
import { Student, ActivityLog } from '@reset/types';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, AlertTriangle, Clock, Eye, CheckCircle } from 'lucide-react';

interface Alert {
  studentId: string;
  studentName: string;
  type: 'high-intensity' | 'single-high' | 'frequent-support' | 'inactive';
  detail: string;
  timestamp?: string;
}

interface Props {
  students: Student[];
  activities: ActivityLog[];
  onBack: () => void;
  onSelectStudent: (id: string) => void;
}

export function useAlerts(students: Student[], activities: ActivityLog[]) {
  return useMemo(() => {
    const result: Alert[] = [];
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    students.forEach(s => {
      const sActs = activities.filter(a => a.studentId === s.id);
      const recentActs = sActs.filter(a => new Date(a.timestamp).getTime() > weekAgo);

      const intensities = recentActs.filter(a => a.intensityScore).map(a => a.intensityScore!);
      if (intensities.length >= 2) {
        const avg = intensities.reduce((s, v) => s + v, 0) / intensities.length;
        if (avg > 7) result.push({ studentId: s.id, studentName: s.name, type: 'high-intensity', detail: `ממוצע עוצמה ${avg.toFixed(1)} השבוע` });
      }

      const highSingle = recentActs.filter(a => a.intensityScore && a.intensityScore >= 8);
      highSingle.forEach(a => {
        result.push({
          studentId: s.id, studentName: s.name, type: 'single-high',
          detail: `דיווח על עוצמה ${a.intensityScore} (${a.selectedState})`,
          timestamp: a.timestamp,
        });
      });

      const supportCount = recentActs.filter(a => a.supportRequested).length;
      if (supportCount >= 3) result.push({ studentId: s.id, studentName: s.name, type: 'frequent-support', detail: `${supportCount} בקשות עזרה השבוע` });

      if (s.active) {
        const lastAct = sActs.length > 0 ? Math.max(...sActs.map(a => new Date(a.timestamp).getTime())) : 0;
        const lastLogin = s.lastLoginAt ? new Date(s.lastLoginAt).getTime() : 0;
        const lastActive = Math.max(lastAct, lastLogin);
        if (lastActive > 0 && lastActive < weekAgo) {
          result.push({ studentId: s.id, studentName: s.name, type: 'inactive', detail: 'לא פעיל מעל 7 ימים' });
        }
      }
    });

    return result;
  }, [students, activities]);
}

export default function AlertsView({ students, activities, onBack, onSelectStudent }: Props) {
  const alerts = useAlerts(students, activities);

  return (
    <div className="bg-background p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-primary hover:underline flex items-center gap-1">
        <ArrowRight size={14} /> חזור לדשבורד
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[hsl(0,80%,93%)] flex items-center justify-center">
          <Shield size={20} className="text-[hsl(0,70%,50%)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">התראות חכמות</h2>
          <p className="text-xs text-muted-foreground">{alerts.length} התראות פעילות</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        {alerts.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle size={32} className="mx-auto text-primary mb-2" />
            <p className="text-base font-semibold text-primary">אין התראות כרגע</p>
            <p className="text-sm text-muted-foreground mt-1">כל התלמידים בטווח תקין</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border border-border/60 bg-card p-4 border-r-4 ${
                  alert.type === 'high-intensity' || alert.type === 'single-high' ? 'border-r-destructive' :
                  alert.type === 'frequent-support' ? 'border-r-[hsl(35,90%,55%)]' :
                  'border-r-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {(alert.type === 'high-intensity' || alert.type === 'single-high') && <AlertTriangle size={16} className="text-destructive" />}
                      {alert.type === 'frequent-support' && <AlertTriangle size={16} className="text-[hsl(35,90%,55%)]" />}
                      {alert.type === 'inactive' && <Clock size={16} className="text-muted-foreground" />}
                      <span className="font-bold text-foreground">{alert.studentName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.detail}</p>
                    {alert.timestamp && <p className="text-xs text-muted-foreground mt-0.5">{new Date(alert.timestamp).toLocaleString('he-IL')}</p>}
                  </div>
                  <button onClick={() => onSelectStudent(alert.studentId)} className="text-primary text-xs hover:underline flex items-center gap-1">
                    <Eye size={12} /> צפה בפרופיל
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
