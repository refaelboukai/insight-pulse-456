import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StudentScheduleView from '@/components/StudentScheduleView';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS,
} from '@/lib/constants';
import { FileText, GraduationCap, HeartHandshake, ExternalLink, ChevronDown, ChevronUp, Loader2, Sparkles, BookOpen, CalendarDays } from 'lucide-react';
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

// removed score/emoji helpers

export default function StudentDashboard() {
  const { lockedStudentId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(lockedStudentId || '');
  const [reports, setReports] = useState<Report[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    reports: true, grades: false, support: false, pedagogy: false, exams: false,
  });
  const [pedagogyGoals, setPedagogyGoals] = useState<any[]>([]);
  const [examSchedule, setExamSchedule] = useState<any[]>([]);
  const [managedSubjects, setManagedSubjects] = useState<Record<string, string>>({});
  const [selectedYear, setSelectedYear] = useState('תשפ"ו');
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
      const [reportsRes, gradesRes, assignRes, pedRes, examRes, subjRes] = await Promise.all([
        supabase.from('lesson_reports').select('*')
          .eq('student_id', selectedStudentId)
          .gte('report_date', `${today}T00:00:00`)
          .lte('report_date', `${today}T23:59:59`)
          .order('created_at', { ascending: false }),
        supabase.from('student_grades').select('*')
          .eq('student_id', selectedStudentId)
          .eq('school_year', selectedYear),
        supabase.from('support_assignments').select('*, staff_members(name)')
          .eq('student_id', selectedStudentId)
          .eq('is_active', true),
        supabase.from('pedagogical_goals').select('*')
          .eq('student_id', selectedStudentId)
          .eq('school_year', selectedYear)
          .order('month'),
        supabase.from('exam_schedule').select('*')
          .eq('student_id', selectedStudentId)
          .eq('school_year', selectedYear)
          .order('exam_date'),
        supabase.from('managed_subjects').select('id, name').eq('is_active', true),
      ]);
      if (reportsRes.data) setReports(reportsRes.data);
      if (gradesRes.data) setGrades(gradesRes.data);
      if (assignRes.data) setAssignments(assignRes.data as any[]);
      if (pedRes.data) setPedagogyGoals(pedRes.data as any[]);
      if (examRes.data) setExamSchedule(examRes.data as any[]);
      if (subjRes.data) {
        const map: Record<string, string> = {};
        (subjRes.data as any[]).forEach((s: any) => { map[s.id] = s.name; });
        setManagedSubjects(map);
      }
    };
    fetchData();
  }, [selectedStudentId, selectedYear]);

  const generateSummary = useCallback(async () => {
    if (!selectedStudent || reports.length === 0) return;
    setSummaryLoading(true);
    setDailySummary(null);
    const normalizedReports = reports.map(r => ({
      subject: r.lesson_subject,
      attendance: ATTENDANCE_LABELS[r.attendance] || r.attendance,
      behavior: r.behavior_types?.map(b => BEHAVIOR_LABELS[b] || b).join(', '),
      participation: r.participation?.map(p => PARTICIPATION_LABELS[p] || p).join(', '),
      comment: r.comment || '',
    }));
    try {
      const { data, error } = await supabase.functions.invoke('student-daily-summary', {
        body: {
          studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
          reports: normalizedReports,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else if (data?.summary) {
        setDailySummary(data.summary);
      }
    } catch (e) {
      toast.error('שגיאה ביצירת הסיכום');
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedStudent, reports]);

  // Reset summary when student changes
  useEffect(() => {
    setDailySummary(null);
  }, [selectedStudentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">לא נמצא תלמיד משויך לחשבון שלך.</p>
          <p className="text-muted-foreground text-xs mt-1">פנה/י למנהל המערכת.</p>
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
      {/* Year selector */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">שנת לימודים:</span>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {reports.length > 0 && (
        <div className="text-center py-2 space-y-2">
          <p className="text-sm text-muted-foreground">{reports.length} שיעורים דווחו היום</p>
          <Button
            onClick={generateSummary}
            disabled={summaryLoading}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            {summaryLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> מכין סיכום...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> סיכום היום שלי</>
            )}
          </Button>
        </div>
      )}

      {/* AI Summary Display */}
      {dailySummary && (
        <div className="card-styled rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">סיכום היום</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{dailySummary}</p>
        </div>
      )}

      {/* Today's Reports */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="הדיווחים שלי — היום" icon={FileText} count={reports.length} sectionKey="reports" />
        {expandedSections.reports && (
          <div className="px-3 pb-3 space-y-2">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">עדיין אין דיווחים להיום</p>
              </div>
            ) : (
              reports.map(r => (
                <div key={r.id} className="p-3 rounded-xl border bg-card">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-sm">{r.lesson_subject}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.report_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {ATTENDANCE_LABELS[r.attendance]}
                    </Badge>
                    {r.behavior_types?.map(b => (
                      <Badge key={b} variant={b === 'respectful' ? 'default' : 'destructive'} className="text-xs">
                        {BEHAVIOR_LABELS[b]}
                      </Badge>
                    ))}
                    {r.participation?.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {PARTICIPATION_LABELS[p]}
                      </Badge>
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 border">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))
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

      {/* Pedagogical Goals */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="יעדים פדגוגיים" icon={BookOpen} count={pedagogyGoals.length} sectionKey="pedagogy" />
        {expandedSections.pedagogy && (
          <div className="px-3 pb-3 space-y-1.5">
            {pedagogyGoals.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">אין יעדים פדגוגיים עדיין</p>
            ) : (
              pedagogyGoals.map((g: any) => (
                <div key={g.id} className="p-2.5 rounded-lg border bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{managedSubjects[g.subject_id] || 'מקצוע'}{g.sub_subject ? ` (${g.sub_subject})` : ''}</span>
                    <Badge variant="secondary" className="text-xs">{g.month}</Badge>
                  </div>
                  {g.learning_goals && <p className="text-xs text-foreground/80">🎯 {g.learning_goals}</p>}
                  {g.current_status && <p className="text-xs text-muted-foreground">מצב נוכחי: {g.current_status}</p>}
                  {g.what_was_done && <p className="text-xs text-muted-foreground">✅ {g.what_was_done}</p>}
                  {g.teacher_notes && <p className="text-xs text-muted-foreground">📝 {g.teacher_notes}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Exam Schedule */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="לוח מבחנים" icon={CalendarDays} count={examSchedule.length} sectionKey="exams" />
        {expandedSections.exams && (
          <div className="px-3 pb-3 space-y-1.5">
            {examSchedule.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">אין מבחנים קרובים</p>
            ) : (
              examSchedule.map((e: any) => (
                <div key={e.id} className="p-2.5 rounded-lg border bg-card flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{managedSubjects[e.subject_id] || 'מקצוע'}{e.sub_subject ? ` (${e.sub_subject})` : ''}</span>
                    {e.exam_description && <span className="text-xs text-muted-foreground mr-2">- {e.exam_description}</span>}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(e.exam_date).toLocaleDateString('he-IL')}
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

      {/* Reset link removed - now available as a tab */}
    </div>
  );
}
