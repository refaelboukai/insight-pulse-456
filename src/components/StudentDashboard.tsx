import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StudentScheduleView from '@/components/StudentScheduleView';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS,
} from '@/lib/constants';
import { FileText, GraduationCap, HeartHandshake, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Star, ThumbsUp, Sparkles, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Student = Database['public']['Tables']['students']['Row'];
type Report = Database['public']['Tables']['lesson_reports']['Row'];

const SUPPORT_LABELS: Record<string, string> = {
  social: 'חברתית', emotional: 'רגשית', academic: 'לימודית', behavioral: 'התנהגותית',
};

const SEMESTER_LABELS: Record<string, string> = {
  semester_a: 'סמסטר א׳', semester_b: 'סמסטר ב׳', summer: 'סמסטר קיץ',
};

function computeDailyScore(reports: Report[]) {
  if (reports.length === 0) return { score: 0, stars: 0, message: '', emoji: '📚' };

  let totalPoints = 0;
  let maxPoints = 0;

  for (const r of reports) {
    maxPoints += 3;
    if (r.attendance === 'full') totalPoints += 3;
    else if (r.attendance === 'partial') totalPoints += 1;

    maxPoints += 3;
    const bestBehavior = r.behavior_types?.[0];
    if (bestBehavior === 'respectful') totalPoints += 3;
    else if (bestBehavior === 'non_respectful') totalPoints += 1;

    maxPoints += 3;
    const bestPart = r.participation?.[0];
    if (bestPart === 'active_participation' || bestPart === 'completed_tasks') totalPoints += 3;
    else if (bestPart === 'no_participation') totalPoints += 1;
  }

  const ratio = maxPoints > 0 ? totalPoints / maxPoints : 0;
  const stars = Math.round(ratio * 5);

  let message = '';
  let emoji = '📚';
  if (ratio >= 0.9) { message = 'יום מצוין! אפשר להיות גאה! 🌟'; emoji = '🏆'; }
  else if (ratio >= 0.7) { message = 'יום טוב מאוד! כל הכבוד! 💪'; emoji = '⭐'; }
  else if (ratio >= 0.5) { message = 'יום סביר, אפשר לשפר מחר! 🌱'; emoji = '🌤️'; }
  else if (ratio >= 0.3) { message = 'היה קשה היום, מחר יום חדש! 🌈'; emoji = '💙'; }
  else { message = 'יום מאתגר, אנחנו מאמינים בך! ❤️'; emoji = '🤗'; }

  return { score: Math.round(ratio * 100), stars, message, emoji };
}

function getAttendanceVisual(att: string) {
  if (att === 'full') return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: '✅' };
  if (att === 'partial') return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: '⏰' };
  return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: '❌' };
}

export default function StudentDashboard() {
  const { lockedStudentId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(lockedStudentId || '');
  const [reports, setReports] = useState<Report[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    reports: true, grades: false, support: false,
  });
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const isLocked = !!lockedStudentId;

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (isLocked) {
      supabase.from('students').select('*').eq('id', lockedStudentId!).maybeSingle()
        .then(({ data }) => { if (data) setStudents([data]); setSelectedStudentId(data?.id || ''); setLoading(false); });
    } else {
      supabase.from('students').select('*').eq('is_active', true).order('last_name')
        .then(({ data }) => { if (data) setStudents(data); setLoading(false); });
    }
  }, [lockedStudentId]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    if (!selectedStudentId) return;
    const fetchData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [reportsRes, gradesRes, assignRes] = await Promise.all([
        supabase.from('lesson_reports').select('*')
          .eq('student_id', selectedStudentId)
          .gte('report_date', `${today}T00:00:00`)
          .lte('report_date', `${today}T23:59:59`)
          .order('created_at', { ascending: false }),
        supabase.from('student_grades').select('*')
          .eq('student_id', selectedStudentId),
        supabase.from('support_assignments').select('*, staff_members(name)')
          .eq('student_id', selectedStudentId)
          .eq('is_active', true),
      ]);
      if (reportsRes.data) setReports(reportsRes.data);
      if (gradesRes.data) setGrades(gradesRes.data);
      if (assignRes.data) setAssignments(assignRes.data as any[]);
    };
    fetchData();
  }, [selectedStudentId]);

  const dailyScore = useMemo(() => computeDailyScore(reports), [reports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!selectedStudent) {
    const classes = [...new Set(students.map(s => s.class_name).filter(Boolean))];
    return (
      <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">בחר/י את שמך</h2>
          <p className="text-sm text-muted-foreground">כדי לראות את הדיווחים שלך</p>
        </div>
        <div className="card-styled rounded-2xl p-3">
          {classes.map(cls => (
            <div key={cls!} className="mb-3 last:mb-0">
              <p className="text-sm font-bold text-foreground mb-1.5">הכיתה של {cls}</p>
              <div className="flex flex-wrap gap-1.5">
                {students.filter(s => s.class_name === cls).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className="text-sm py-2 px-3 rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    {s.first_name} {s.last_name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const SectionHeader = ({ title, icon: Icon, count, sectionKey }: {
    title: string; icon: React.ElementType; count?: number; sectionKey: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-sm">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs rounded-full px-2">{count}</Badge>
        )}
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="space-y-3 max-w-2xl mx-auto animate-fade-in">
      {/* Student header */}
      <div className="rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: 'var(--gradient-primary)' }}>
        <p className="font-semibold text-primary-foreground text-sm">
          {selectedStudent.first_name} {selectedStudent.last_name}
          <span className="text-primary-foreground/60 font-normal mr-2 text-xs">הכיתה של {selectedStudent.class_name}</span>
        </p>
        {!isLocked && (
          <button onClick={() => setSelectedStudentId('')} className="text-primary-foreground/70 hover:text-primary-foreground text-xs underline">
            החלף
          </button>
        )}
      </div>

      {/* Daily Score Card */}
      {reports.length > 0 && (
        <div className={`p-4 text-center space-y-2 rounded-2xl animate-fade-in ${
          dailyScore.score >= 70
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-2 border-emerald-200/50'
            : dailyScore.score >= 40
            ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-2 border-amber-200/50'
            : 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-200/50'
        }`}>
          <div className="text-3xl mb-1">{dailyScore.emoji}</div>
          <div className="flex items-center justify-center gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`h-5 w-5 transition-all duration-300 ${
                  i <= dailyScore.stars
                    ? 'text-amber-400 fill-amber-400 scale-110'
                    : 'text-muted-foreground/20'
                }`}
              />
            ))}
          </div>
          <p className="font-bold text-base text-foreground">{dailyScore.message}</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="text-center">
              <p className="text-2xl font-black text-primary">{dailyScore.score}</p>
              <p className="text-[10px] text-muted-foreground font-medium">ציון יומי</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-primary">{reports.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium">שיעורים</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Reports */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="הדיווחים שלי — היום" icon={FileText} count={reports.length} sectionKey="reports" />
        {expandedSections.reports && (
          <div className="px-3 pb-3 space-y-2">
            {reports.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="text-4xl">📚</div>
                <p className="text-sm font-semibold text-foreground">עדיין אין דיווחים להיום</p>
                <p className="text-xs text-muted-foreground">הדיווחים יופיעו כאן אחרי כל שיעור</p>
              </div>
            ) : (
              reports.map(r => {
                const attVis = getAttendanceVisual(r.attendance);
                const isGreat = r.attendance === 'full' && r.behavior_types?.includes('respectful');

                return (
                  <div
                    key={r.id}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                      isGreat
                        ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-l from-emerald-50/50 to-transparent dark:from-emerald-950/20'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{isGreat ? '🌟' : '📖'}</span>
                        <p className="font-bold text-sm">{r.lesson_subject}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(r.report_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {/* Attendance */}
                      <div className={`rounded-lg p-2 text-center ${attVis.bg}`}>
                        <p className="text-base mb-0.5">{attVis.icon}</p>
                        <p className={`text-[10px] font-bold ${attVis.text}`}>
                          {ATTENDANCE_LABELS[r.attendance]}
                        </p>
                      </div>

                      {/* Behavior */}
                      <div className={`rounded-lg p-2 text-center ${
                        r.behavior_types?.includes('respectful')
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : r.behavior_types?.includes('violent')
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        <p className="text-base mb-0.5">
                          {r.behavior_types?.includes('respectful') ? '👏' : r.behavior_types?.includes('violent') ? '⚠️' : '💭'}
                        </p>
                        <p className={`text-[10px] font-bold ${
                          r.behavior_types?.includes('respectful')
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : r.behavior_types?.includes('violent')
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {r.behavior_types?.map(b => BEHAVIOR_LABELS[b]).join(', ') || '—'}
                        </p>
                      </div>

                      {/* Participation */}
                      <div className={`rounded-lg p-2 text-center ${
                        r.participation?.some(p => p === 'active_participation' || p === 'completed_tasks')
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : r.participation?.includes('no_function')
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        <p className="text-base mb-0.5">
                          {r.participation?.some(p => p === 'active_participation' || p === 'completed_tasks') ? '🚀' : r.participation?.includes('no_function') ? '😔' : '🔄'}
                        </p>
                        <p className={`text-[10px] font-bold ${
                          r.participation?.some(p => p === 'active_participation' || p === 'completed_tasks')
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : r.participation?.includes('no_function')
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {r.participation?.map(p => PARTICIPATION_LABELS[p]).join(', ') || '—'}
                        </p>
                      </div>
                    </div>

                    {isGreat && (
                      <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50">
                        <ThumbsUp className="h-3 w-3 text-emerald-600" />
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">שיעור מעולה! המשך/י ככה! 💪</p>
                      </div>
                    )}

                    {r.comment && (
                      <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 border">
                        💬 {r.comment}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Grades */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="הציונים שלי" icon={GraduationCap} count={grades.length} sectionKey="grades" />
        {expandedSections.grades && (
          <div className="px-3 pb-3 space-y-1.5">
            {grades.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">אין ציונים עדיין</p>
            ) : (
              grades.map(g => (
                <div key={g.id} className="p-2.5 rounded-lg border bg-card flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{g.subject}</span>
                    <span className="text-[10px] text-muted-foreground mr-1.5">
                      {SEMESTER_LABELS[g.semester] || g.semester}
                    </span>
                  </div>
                  <Badge variant="default" className="text-sm px-3 py-0.5">
                    {g.grade ?? '—'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Support Plan */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="תכנית התמיכה שלי" icon={HeartHandshake} count={assignments.length} sectionKey="support" />
        {expandedSections.support && (
          <div className="px-3 pb-3 space-y-1.5">
            {assignments.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">אין תכנית תמיכה מוגדרת</p>
            ) : (
              assignments.map((a: any) => (
                <div key={a.id} className="p-2.5 rounded-lg border bg-card">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{a.staff_members?.name || 'לא ידוע'}</span>
                    <Badge variant="outline" className="text-xs">{a.frequency === 'daily' ? 'יומי' : 'שבועי'}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(a.support_types || []).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0">
                        {SUPPORT_LABELS[t] || t}
                      </Badge>
                    ))}
                  </div>
                  {a.support_description && (
                    <p className="text-xs text-foreground/80 mt-1">📝 {a.support_description}</p>
                  )}
                  {a.target_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      תאריך יעד: {new Date(a.target_date).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Personal Schedule */}
      <StudentScheduleView studentId={selectedStudent.id} />

      {/* External App Link */}
      <a
        href={`https://reset-calm-zone.lovable.app/?auto_login=${selectedStudent.student_code}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="card-styled rounded-2xl p-4 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer border-primary/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
              <ExternalLink className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">אזור הרגעה</p>
              <p className="text-xs text-muted-foreground">מעבר לאפליקציית Reset Calm Zone</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
      </a>
    </div>
  );
}
