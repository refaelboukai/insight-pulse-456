import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Clock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
type Student = Database['public']['Tables']['students']['Row'];

interface Alert {
  studentId: string;
  studentName: string;
  type: 'high-intensity' | 'single-high' | 'frequent-support';
  detail: string;
  timestamp?: string;
}

interface Props {
  students: Student[];
}

export default function ResetAlertsView({ students }: Props) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => { if (data) setActivities(data); setLoading(false); });
  }, []);

  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Group by student
    const byStudent = new Map<string, ActivityLog[]>();
    activities.forEach(a => {
      const key = a.student_id;
      if (!byStudent.has(key)) byStudent.set(key, []);
      byStudent.get(key)!.push(a);
    });

    byStudent.forEach((acts, studentId) => {
      const name = acts[0].student_name;
      const recent = acts.filter(a => new Date(a.created_at).getTime() > weekAgo);

      // Avg intensity > 7
      const intensities = recent.filter(a => a.intensity_score).map(a => a.intensity_score!);
      if (intensities.length >= 2) {
        const avg = intensities.reduce((s, v) => s + v, 0) / intensities.length;
        if (avg > 7) result.push({ studentId, studentName: name, type: 'high-intensity', detail: `ממוצע עוצמה ${avg.toFixed(1)} השבוע` });
      }

      // Single high intensity >= 8
      recent.filter(a => a.intensity_score && a.intensity_score >= 8).forEach(a => {
        result.push({ studentId, studentName: name, type: 'single-high', detail: `דיווח על עוצמה ${a.intensity_score} (${a.selected_state})`, timestamp: a.created_at });
      });

      // Frequent support requests
      const supportCount = recent.filter(a => a.support_requested).length;
      if (supportCount >= 3) result.push({ studentId, studentName: name, type: 'frequent-support', detail: `${supportCount} בקשות עזרה השבוע` });
    });

    return result;
  }, [activities]);

  if (loading) return <div className="p-4 text-center text-muted-foreground text-sm">טוען התראות...</div>;

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={18} className="text-destructive" />
        <h3 className="text-sm font-bold text-foreground">התראות חכמות – פורטל Reset</h3>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-semibold text-primary">✓ אין התראות כרגע</p>
          <p className="text-xs text-muted-foreground mt-1">כל התלמידים בטווח תקין</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`rounded-xl border bg-card p-3 border-r-4 ${
                alert.type === 'high-intensity' || alert.type === 'single-high' ? 'border-r-destructive' : 'border-r-amber-400'
              }`}>
              <div className="flex items-center gap-2 mb-0.5">
                {alert.type !== 'frequent-support' ? <AlertTriangle size={14} className="text-destructive" /> : <Clock size={14} className="text-amber-500" />}
                <span className="font-bold text-xs text-foreground">{alert.studentName}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{alert.detail}</p>
              {alert.timestamp && <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(alert.timestamp).toLocaleString('he-IL')}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
