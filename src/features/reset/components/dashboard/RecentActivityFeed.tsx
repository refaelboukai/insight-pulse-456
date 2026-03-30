import { useMemo, useState } from 'react';
import { ActivityLog, Student } from '@reset/types';
import { skills } from '@reset/data/skills';
import { ArrowRight, Activity, Clock, User, AlertTriangle, Wrench, MessageSquare, Smile, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  students: Student[];
  activities: ActivityLog[];
  onBack: () => void;
  onSelectStudent: (id: string) => void;
}

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

export default function RecentActivityFeed({ students, activities, onBack, onSelectStudent }: Props) {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const groupedByStudent = useMemo(() => {
    const map = new Map<string, ActivityLog[]>();
    activities.forEach(a => {
      const key = a.studentId || a.studentName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });

    const summaries: StudentSummary[] = [];
    map.forEach((acts, key) => {
      const sorted = [...acts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const intensities = acts.filter(a => a.intensityScore).map(a => a.intensityScore!);
      const stateCount = new Map<string, number>();
      acts.forEach(a => stateCount.set(a.selectedState, (stateCount.get(a.selectedState) || 0) + 1));
      const dominantState = [...stateCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      const uniqueSkills = [...new Set(acts.filter(a => a.skillUsed).map(a => a.skillUsed!))];

      summaries.push({
        studentId: key,
        studentName: sorted[0].studentName,
        activities: sorted,
        totalActivities: acts.length,
        lastActivity: sorted[0].timestamp,
        supportRequests: acts.filter(a => a.supportRequested).length,
        avgIntensity: intensities.length > 0 ? Math.round(intensities.reduce((s, v) => s + v, 0) / intensities.length * 10) / 10 : null,
        skillsUsed: uniqueSkills,
        positiveReflections: acts.filter(a => a.isPositiveReflection).length,
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
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  };

  const getEmotionIcon = (state: string) => {
    if (state === 'good') return <Smile size={14} className="text-green-600" />;
    if (state === 'sos') return <AlertTriangle size={14} className="text-destructive" />;
    return <Activity size={14} className="text-primary" />;
  };

  const getIntensityColor = (score?: number | null) => {
    if (!score) return '';
    if (score >= 7) return 'bg-destructive/10 text-destructive';
    if (score >= 4) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStateLabel = (state: string) => {
    if (state === 'good') return 'מרגיש טוב';
    if (state === 'sos') return 'מצוקה';
    return state;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <button onClick={onBack} className="btn-secondary text-sm mb-4 flex items-center gap-1">
        <ArrowRight size={14} /> חזור לדשבורד
      </button>

      <div className="flex items-center gap-2 mb-6">
        <Activity size={20} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">פעילות אחרונה</h2>
        <span className="text-xs text-muted-foreground">({groupedByStudent.length} תלמידים)</span>
      </div>

      <div className="space-y-3">
        {groupedByStudent.length === 0 ? (
          <div className="card-reset p-8 text-center">
            <p className="text-muted-foreground">אין פעילות עדיין</p>
          </div>
        ) : (
          groupedByStudent.map((summary, i) => (
            <motion.div
              key={summary.studentId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="card-reset overflow-hidden"
            >
              {/* Student summary header */}
              <div
                className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedStudent(expandedStudent === summary.studentId ? null : summary.studentId)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-primary" />
                      <span className="font-bold text-sm text-foreground">{summary.studentName}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(summary.lastActivity)}
                      </span>
                    </div>

                    {/* Summary badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] bg-secondary rounded-full px-2 py-0.5">
                        <Hash size={10} />
                        {summary.totalActivities} פעולות
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] bg-secondary rounded-full px-2 py-0.5">
                        {getEmotionIcon(summary.dominantState)}
                        {getStateLabel(summary.dominantState)}
                      </span>

                      {summary.avgIntensity !== null && (
                        <span className={`text-[11px] rounded-full px-2 py-0.5 ${getIntensityColor(summary.avgIntensity)}`}>
                          עוצמה ממוצעת {summary.avgIntensity}
                        </span>
                      )}

                      {summary.supportRequests > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-destructive/10 text-destructive rounded-full px-2 py-0.5">
                          <AlertTriangle size={10} />
                          {summary.supportRequests} בקשות עזרה
                        </span>
                      )}

                      {summary.positiveReflections > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                          <Smile size={10} />
                          {summary.positiveReflections} שיקוף חיובי
                        </span>
                      )}

                      {summary.skillsUsed.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
                          <Wrench size={10} />
                          {summary.skillsUsed.length} כלים
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectStudent(summary.studentId); }}
                      className="text-[10px] text-primary hover:underline"
                    >
                      פרופיל
                    </button>
                    {expandedStudent === summary.studentId ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </div>
              </div>

              {/* Expanded activity list */}
              <AnimatePresence>
                {expandedStudent === summary.studentId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-4 py-2 space-y-2 bg-secondary/10">
                      {summary.activities.map((a) => (
                        <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] bg-secondary rounded-full px-2 py-0.5">
                                {getEmotionIcon(a.selectedState)}
                                {getStateLabel(a.selectedState)}
                              </span>

                              {a.intensityScore && (
                                <span className={`text-[11px] rounded-full px-2 py-0.5 ${getIntensityColor(a.intensityScore)}`}>
                                  עוצמה {a.intensityScore}/10
                                </span>
                              )}

                              {a.skillUsed && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
                                  <Wrench size={10} />
                                  {skills.find(s => s.id === a.skillUsed)?.name || a.skillUsed}
                                  {a.skillHelpful === true && ' ✅'}
                                  {a.skillHelpful === false && ' ❌'}
                                </span>
                              )}

                              {a.supportRequested && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-destructive/10 text-destructive rounded-full px-2 py-0.5">
                                  <AlertTriangle size={10} />
                                  בקשת עזרה
                                </span>
                              )}

                              {a.adultContactName && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-secondary rounded-full px-2 py-0.5 text-muted-foreground">
                                  <MessageSquare size={10} />
                                  פנה ל{a.adultContactName}
                                </span>
                              )}

                              {a.isPositiveReflection && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                                  <Smile size={10} />
                                  שיקוף חיובי
                                </span>
                              )}
                            </div>
                            {a.resultAfterPractice && (
                              <p className="text-[11px] text-muted-foreground mt-1">תוצאה: {a.resultAfterPractice}</p>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground shrink-0 text-left">
                            {new Date(a.timestamp).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                            {' '}
                            {new Date(a.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
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
    </div>
  );
}