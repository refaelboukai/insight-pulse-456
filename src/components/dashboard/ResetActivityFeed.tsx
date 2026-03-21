import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { skills } from '@/data/skills';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, User, AlertTriangle, Wrench, Smile, ChevronDown, ChevronUp, Hash, ArrowRight } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

interface StudentSummary {
  studentId: string;
  studentName: string;
  activities: ActivityLog[];
  totalActivities: number;
  lastActivity: string;
  supportRequests: number;
  avgIntensity: number | null;
  skillsUsed: string[];
  positiveReflections: number;
  dominantState: string;
}

interface Props {
  onBack: () => void;
  onSelectStudent?: (id: string) => void;
}

export default function ResetActivityFeed({ onBack, onSelectStudent }: Props) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => { if (data) setActivities(data); setLoading(false); });
  }, []);

  const groupedByStudent = useMemo(() => {
    const map = new Map<string, ActivityLog[]>();
    activities.forEach(a => {
      const key = a.student_id || a.student_name;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });

    const summaries: StudentSummary[] = [];
    map.forEach((acts, key) => {
      const sorted = [...acts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const intensities = acts.filter(a => a.intensity_score).map(a => a.intensity_score!);
      const stateCount = new Map<string, number>();
      acts.forEach(a => stateCount.set(a.selected_state, (stateCount.get(a.selected_state) || 0) + 1));
      const dominantState = [...stateCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      const uniqueSkills = [...new Set(acts.filter(a => a.skill_used).map(a => a.skill_used!))];

      summaries.push({
        studentId: key,
        studentName: sorted[0].student_name,
        activities: sorted,
        totalActivities: acts.length,
        lastActivity: sorted[0].created_at,
        supportRequests: acts.filter(a => a.support_requested).length,
        avgIntensity: intensities.length > 0 ? Math.round(intensities.reduce((s, v) => s + v, 0) / intensities.length * 10) / 10 : null,
        skillsUsed: uniqueSkills,
        positiveReflections: acts.filter(a => a.is_positive_reflection).length,
        dominantState,
      });
    });

    return summaries.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [activities]);

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'הרגע';
    if (mins < 60) return `לפני ${mins} דקות`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    return `לפני ${Math.floor(hours / 24)} ימים`;
  };

  const getIntensityColor = (score?: number | null) => {
    if (!score) return '';
    if (score >= 7) return 'bg-destructive/10 text-destructive';
    if (score >= 4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground text-sm">טוען פעילות...</div>;

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">פעילות אחרונה – פורטל Reset</h3>
        <span className="text-xs text-muted-foreground">({groupedByStudent.length} תלמידים)</span>
      </div>

      {groupedByStudent.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-muted-foreground text-sm">אין פעילות עדיין</p>
        </div>
      ) : (
        groupedByStudent.map((summary, i) => (
          <motion.div key={summary.studentId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }} className="rounded-xl border bg-card overflow-hidden">
            <div className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedStudent(expandedStudent === summary.studentId ? null : summary.studentId)}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User size={13} className="text-primary" />
                    <span className="font-bold text-xs text-foreground">{summary.studentName}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock size={9} /> {timeAgo(summary.lastActivity)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] bg-secondary rounded-full px-1.5 py-0.5"><Hash size={9} className="inline" /> {summary.totalActivities} פעולות</span>
                    {summary.avgIntensity !== null && (
                      <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${getIntensityColor(summary.avgIntensity)}`}>עוצמה {summary.avgIntensity}</span>
                    )}
                    {summary.supportRequests > 0 && (
                      <span className="text-[10px] bg-destructive/10 text-destructive rounded-full px-1.5 py-0.5">
                        <AlertTriangle size={9} className="inline" /> {summary.supportRequests} בקשות עזרה
                      </span>
                    )}
                    {summary.positiveReflections > 0 && (
                      <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5">
                        <Smile size={9} className="inline" /> {summary.positiveReflections} חיובי
                      </span>
                    )}
                    {summary.skillsUsed.length > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                        <Wrench size={9} className="inline" /> {summary.skillsUsed.length} כלים
                      </span>
                    )}
                  </div>
                </div>
                {expandedStudent === summary.studentId ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </div>
            </div>

            <AnimatePresence>
              {expandedStudent === summary.studentId && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t px-3 py-2 space-y-1.5 bg-muted/20 max-h-[250px] overflow-y-auto">
                    {summary.activities.slice(0, 20).map(a => (
                      <div key={a.id} className="text-[11px] bg-card rounded-lg p-2 border">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{a.selected_state}</span>
                            {a.intensity_score && <span className={`px-1.5 py-0.5 rounded-full ${getIntensityColor(a.intensity_score)}`}>עוצמה {a.intensity_score}</span>}
                          </div>
                          <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString('he-IL')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.skill_used && <span className="text-primary">🔧 {skills.find(s => s.id === a.skill_used)?.name || a.skill_used}{a.skill_helpful === true ? ' ✅' : a.skill_helpful === false ? ' ❌' : ''}</span>}
                          {a.support_requested && <span className="text-destructive">⚠ בקשת עזרה</span>}
                          {a.adult_contact_name && <span className="text-muted-foreground">👤 {a.adult_contact_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))
      )}
    </div>
  );
}
