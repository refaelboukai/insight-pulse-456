import { useMemo } from 'react';
import { Student, ActivityLog } from '@reset/types';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, AlertTriangle, Clock, Eye } from 'lucide-react';

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

      // Alert for any single check-in with intensity >= 8
      const highSingle = recentActs.filter(a => a.intensityScore && a.intensityScore >= 8);
      highSingle.forEach(a => {
        result.push({
          studentId: s.id,
          studentName: s.name,
          type: 'single-high',
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
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <button onClick={onBack} className="btn-secondary text-sm mb-4 flex items-center gap-1">
        <ArrowRight size={14} /> חזור
      </button>
      <div className="flex items-center gap-2 mb-6">
        <Shield size={20} className="text-destructive" />
        <h2 className="text-xl font-bold text-foreground">התראות חכמות</h2>
      </div>

      {alerts.length === 0 ? (
        <div className="card-reset p-8 text-center">
          <p className="text-lg font-semibold text-primary">✓ אין התראות כרגע</p>
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
              className={`card-reset p-4 border-r-4 ${
                alert.type === 'high-intensity' || alert.type === 'single-high' ? 'border-r-destructive' :
                alert.type === 'frequent-support' ? 'border-r-accent' :
                'border-r-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {(alert.type === 'high-intensity' || alert.type === 'single-high') && <AlertTriangle size={16} className="text-destructive" />}
                    {alert.type === 'frequent-support' && <AlertTriangle size={16} className="text-accent-foreground" />}
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
  );
}
