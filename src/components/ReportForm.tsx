import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  SUBJECTS, ATTENDANCE_LABELS, BEHAVIOR_LABELS, VIOLENCE_LABELS,
  PARTICIPATION_LABELS,
} from '@/lib/constants';
import { AlertTriangle, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];
type BehaviorType = Database['public']['Enums']['behavior_type'];
type ViolenceType = Database['public']['Enums']['violence_type'];
type AttendanceStatus = Database['public']['Enums']['attendance_status'];
type ParticipationLevel = Database['public']['Enums']['participation_level'];

const ATTENDANCE_ICONS: Record<string, typeof CheckCircle2> = {
  full: CheckCircle2,
  partial: Clock,
  absent: XCircle,
};

interface ReportFormProps {
  absentStudentIds?: Set<string>;
}

export default function ReportForm({ absentStudentIds = new Set() }: ReportFormProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [attendance, setAttendance] = useState<AttendanceStatus | ''>('');
  const [behaviors, setBehaviors] = useState<BehaviorType[]>([]);
  const [violenceTypes, setViolenceTypes] = useState<ViolenceType[]>([]);
  const [participations, setParticipations] = useState<ParticipationLevel[]>([]);
  const [violenceComment, setViolenceComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportedStudentIds, setReportedStudentIds] = useState<Set<string>>(new Set());
  const [lastClassName, setLastClassName] = useState<string | null>(null);
  useEffect(() => {
    supabase.from('students').select('*').eq('is_active', true).order('last_name')
      .then(({ data }) => { if (data) setStudents(data); });
  }, []);

  const toggleBehavior = (b: BehaviorType) => {
    setBehaviors(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
    if (b === 'violent' && behaviors.includes('violent')) {
      setViolenceTypes([]);
    }
  };

  const toggleViolence = (v: ViolenceType) => {
    setViolenceTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const hasViolent = behaviors.includes('violent');

  const resetForm = (keepContext = false) => {
    const prevStudentClass = students.find(s => s.id === studentId)?.class_name ?? null;
    if (keepContext) {
      setLastClassName(prevStudentClass);
    } else {
      setLastClassName(null);
      setSubject('');
      setReportedStudentIds(new Set());
    }
    setStudentId('');
    setAttendance('');
    setBehaviors([]);
    setViolenceTypes([]);
    setParticipations([]);
    setViolenceComment('');
  };

  const handleSubmit = async () => {
    if (!studentId || !subject || !attendance || !user) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }
    if (hasViolent && violenceTypes.length === 0) {
      toast.error('נא לבחור סוג אלימות');
      return;
    }
    if (hasViolent && !violenceComment.trim()) {
      toast.error('נא לכתוב הערה לתיאור האלימות');
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.from('lesson_reports').insert({
      student_id: studentId,
      staff_user_id: user.id,
      lesson_subject: subject,
      attendance: attendance as AttendanceStatus,
      behavior_types: behaviors,
      violence_subtypes: hasViolent ? violenceTypes : [],
      participation: participations,
      comment: hasViolent ? violenceComment : null,
    }).select().single();

    if (error) {
      toast.error('שגיאה בשמירת הדיווח');
      console.error(error);
    } else {
      if (hasViolent && data) {
        await supabase.from('alerts').insert({
          student_id: studentId,
          alert_type: 'violent_behavior',
          description: `התנהגות אלימה דווחה: ${violenceTypes.map(v => VIOLENCE_LABELS[v]).join(', ')}`,
          related_report_id: data.id,
        });
      }
      setReportedStudentIds(prev => new Set(prev).add(studentId));
      toast.success('הדיווח נשמר בהצלחה! ✨');
      resetForm(true);
    }
    setSubmitting(false);
  };

  const selectedStudent = students.find(s => s.id === studentId);
  const classes = [...new Set(students.map(s => s.class_name))].filter(Boolean);

  // If we have a lastClassName from previous report, show that class first
  const sortedClasses = lastClassName
    ? [lastClassName, ...classes.filter(c => c !== lastClassName)]
    : classes;

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Step 1: Student */}
      {selectedStudent ? (
        <div className="rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: 'var(--gradient-primary)' }}>
          <p className="font-semibold text-primary-foreground text-sm">
            {selectedStudent.first_name} {selectedStudent.last_name}
            <span className="text-primary-foreground/60 font-normal mr-2 text-xs">הכיתה של {selectedStudent.class_name}</span>
          </p>
          <button onClick={() => setStudentId('')} className="text-primary-foreground/70 hover:text-primary-foreground text-xs underline">
            שנה
          </button>
        </div>
      ) : (
        <div className="card-styled rounded-2xl p-3">
          {sortedClasses.map(cls => (
            <div key={cls!} className="mb-3 last:mb-0">
              <p className="text-sm font-bold text-foreground mb-1.5">הכיתה של {cls}</p>
              <div className="flex flex-wrap gap-1">
                {students.filter(s => s.class_name === cls && !absentStudentIds.has(s.id)).map(s => {
                  const reported = reportedStudentIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => !reported && setStudentId(s.id)}
                      disabled={reported}
                      className={`text-sm py-2 px-3 rounded-lg border transition-colors ${
                        reported
                          ? 'border-success/30 bg-success/10 text-success line-through cursor-default'
                          : 'border-border bg-card hover:bg-primary/10 hover:border-primary/30'
                      }`}
                    >
                      {reported && '✓ '}{s.first_name} {s.last_name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick context bar */}
      {reportedStudentIds.size > 0 && !selectedStudent && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-success/10 border border-success/20">
          <p className="text-xs text-success font-medium">
            ✓ דווחו {reportedStudentIds.size} תלמידים · {subject}
          </p>
          <button
            onClick={() => resetForm(false)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            סיום שיעור
          </button>
        </div>
      )}

      {selectedStudent && (
        <>
          {/* Step 2: Subject — pill buttons */}
          <div className="card-styled rounded-2xl p-3">
            <p className="text-sm font-semibold mb-2">מקצוע</p>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`text-sm py-2 px-3 rounded-full border transition-colors ${
                    subject === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Attendance */}
          <div className="card-styled rounded-2xl p-3">
            <p className="text-sm font-semibold mb-2">נוכחות</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(ATTENDANCE_LABELS) as [AttendanceStatus, string][]).map(([key, label]) => {
                const Icon = ATTENDANCE_ICONS[key];
                const isActive = attendance === key;
                return (
                  <button
                    key={key}
                    onClick={() => setAttendance(key)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                      isActive
                        ? key === 'full' ? 'border-success bg-[hsl(var(--success)/0.1)] text-success'
                          : key === 'partial' ? 'border-accent bg-[hsl(var(--warning)/0.1)] text-accent'
                          : 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Participation */}
          <div className="card-styled rounded-2xl p-3">
            <p className="text-sm font-semibold mb-2">השתתפות</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(PARTICIPATION_LABELS) as [ParticipationLevel, string][]).map(([key, label]) => {
                const isActive = participation === key;
                const colorClass = isActive
                  ? key === 'no_function' ? 'bg-destructive/10 text-destructive border-destructive/40'
                    : key === 'no_participation' ? 'bg-[hsl(var(--warning)/0.12)] text-accent border-accent/40'
                    : 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-card hover:border-primary/30';
                return (
                  <button
                    key={key}
                    onClick={() => setParticipation(prev => prev === key ? '' : key)}
                    className={`text-sm py-2 px-3 rounded-full border transition-colors ${colorClass}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Behavior */}
          <div className="card-styled rounded-2xl p-3">
            <p className="text-sm font-semibold mb-2">התנהגות</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(BEHAVIOR_LABELS) as [BehaviorType, string][]).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 cursor-pointer py-2 px-2.5 rounded-xl border-2 transition-all text-xs ${
                    behaviors.includes(key)
                      ? key === 'violent' ? 'border-destructive bg-destructive/8 text-destructive'
                        : key === 'disruptive' ? 'border-accent/50 bg-[hsl(var(--warning)/0.1)] text-accent'
                        : key === 'non_respectful' ? 'border-yellow-400/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'border-primary bg-primary/8 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40'
                  }`}
                >
                  <Checkbox
                    checked={behaviors.includes(key)}
                    onCheckedChange={() => toggleBehavior(key)}
                    className="h-3.5 w-3.5"
                  />
                  {label}
                  {key === 'violent' && <AlertTriangle className="h-3 w-3 mr-auto" />}
                </label>
              ))}
            </div>

            {hasViolent && (
              <div className="mt-2 p-2.5 rounded-xl bg-destructive/5 border border-destructive/15 animate-scale-in space-y-2">
                <p className="text-xs font-semibold text-destructive mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  סיווג אלימות (חובה)
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.entries(VIOLENCE_LABELS) as [ViolenceType, string][]).map(([key, label]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                        violenceTypes.includes(key)
                          ? 'bg-destructive/10 border-destructive/40'
                          : 'bg-card border-transparent'
                      }`}
                    >
                      <Checkbox
                        checked={violenceTypes.includes(key)}
                        onCheckedChange={() => toggleViolence(key)}
                        className="h-3 w-3"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <Textarea
                  placeholder="תאר/י את האירוע (חובה)..."
                  value={violenceComment}
                  onChange={e => setViolenceComment(e.target.value)}
                  rows={2}
                  className="rounded-lg border-destructive/20 resize-none text-xs mt-1.5"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-11 text-sm font-semibold rounded-xl btn-primary-gradient border-0"
          >
            <Send className="ml-2 h-4 w-4" />
            {submitting ? 'שומר...' : 'שלח דיווח'}
          </Button>
        </>
      )}
    </div>
  );
}
