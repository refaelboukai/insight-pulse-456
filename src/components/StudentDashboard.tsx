import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StudentScheduleView from '@/components/StudentScheduleView';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS,
} from '@/lib/constants';
import { FileText, GraduationCap, HeartHandshake, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];
type Report = Database['public']['Tables']['lesson_reports']['Row'];

const SUPPORT_LABELS: Record<string, string> = {
  social: 'חברתית', emotional: 'רגשית', academic: 'לימודית', behavioral: 'התנהגותית',
};

const SEMESTER_LABELS: Record<string, string> = {
  semester_a: 'סמסטר א׳', semester_b: 'סמסטר ב׳', summer: 'סמסטר קיץ',
};

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

  const isLocked = !!lockedStudentId;

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (isLocked) {
      // Locked mode: only fetch this student
      supabase.from('students').select('*').eq('id', lockedStudentId!).maybeSingle()
        .then(({ data }) => { if (data) setStudents([data]); setSelectedStudentId(data?.id || ''); setLoading(false); });
    } else {
      // Generic mode: show all students for selection
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

      {/* Today's Reports */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="הדיווחים שלי — היום" icon={FileText} count={reports.length} sectionKey="reports" />
        {expandedSections.reports && (
          <div className="px-3 pb-3 space-y-1.5">
            {reports.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">אין דיווחים להיום</p>
            ) : (
              reports.map(r => (
                <div key={r.id} className="p-2.5 rounded-lg border bg-card">
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="font-medium text-sm">{r.lesson_subject}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.report_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {r.attendance === 'full' && <CheckCircle2 className="h-2.5 w-2.5 ml-0.5" />}
                      {r.attendance === 'partial' && <Clock className="h-2.5 w-2.5 ml-0.5" />}
                      {r.attendance === 'absent' && <XCircle className="h-2.5 w-2.5 ml-0.5" />}
                      {ATTENDANCE_LABELS[r.attendance]}
                    </Badge>
                    {r.behavior_types?.map(b => (
                      <Badge key={b} variant={b === 'violent' ? 'destructive' : 'outline'} className="text-xs px-1.5 py-0">
                        {BEHAVIOR_LABELS[b]}
                      </Badge>
                    ))}
                    {r.participation && r.participation.length > 0 && r.participation.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs px-1.5 py-0">{PARTICIPATION_LABELS[p]}</Badge>
                    ))}
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-1.5">{r.comment}</p>}
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
