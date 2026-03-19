import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  SUBJECTS, ATTENDANCE_LABELS, BEHAVIOR_LABELS, VIOLENCE_LABELS,
  PARTICIPATION_LABELS, SEVERITY_LABELS, PERFORMANCE_LABELS,
} from '@/lib/constants';
import { AlertTriangle, Send, Users, BookOpen, Eye, Brain, MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
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

export default function ReportForm() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [attendance, setAttendance] = useState<AttendanceStatus | ''>('');
  const [behaviors, setBehaviors] = useState<BehaviorType[]>([]);
  const [violenceTypes, setViolenceTypes] = useState<ViolenceType[]>([]);
  const [severity, setSeverity] = useState(3);
  const [participation, setParticipation] = useState<ParticipationLevel | ''>('');
  const [performance, setPerformance] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const resetForm = () => {
    setStudentId('');
    setSubject('');
    setAttendance('');
    setBehaviors([]);
    setViolenceTypes([]);
    setSeverity(3);
    setParticipation('');
    setPerformance(3);
    setComment('');
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

    setSubmitting(true);
    const { data, error } = await supabase.from('lesson_reports').insert({
      student_id: studentId,
      staff_user_id: user.id,
      lesson_subject: subject,
      attendance: attendance as AttendanceStatus,
      behavior_types: behaviors,
      violence_subtypes: hasViolent ? violenceTypes : [],
      behavior_severity: behaviors.length > 0 ? severity : null,
      participation: participation || null,
      performance_score: participation ? performance : null,
      comment: comment || null,
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
      toast.success('הדיווח נשמר בהצלחה! ✨');
      resetForm();
    }
    setSubmitting(false);
  };

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.includes(searchQuery)
  );

  const selectedStudent = students.find(s => s.id === studentId);
  const classes = [...new Set(filteredStudents.map(s => s.class_name))].filter(Boolean);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Selected student banner */}
      {selectedStudent && (
        <div className="rounded-xl p-3 flex items-center justify-between animate-fade-in" style={{ background: 'var(--gradient-primary)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-primary-foreground text-sm">{selectedStudent.first_name} {selectedStudent.last_name}</p>
              <p className="text-xs text-primary-foreground/70">הכיתה של {selectedStudent.class_name}</p>
            </div>
          </div>
          <button onClick={() => setStudentId('')} className="text-primary-foreground/60 hover:text-primary-foreground text-xs underline">
            שנה בחירה
          </button>
        </div>
      )}

      {/* Student selection */}
      {!selectedStudent && (
        <div className="card-styled rounded-2xl overflow-hidden animate-slide-up">
          <div className="h-1 w-full" style={{ background: 'var(--gradient-primary)' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base">בחירת תלמיד/ה</h3>
            </div>
            <Input
              placeholder="🔍 חיפוש לפי שם..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mb-4 rounded-xl h-11 border-2"
            />
            <Accordion type="multiple" defaultValue={classes as string[]} className="space-y-2">
              {classes.map(cls => {
                const classStudents = filteredStudents.filter(s => s.class_name === cls);
                if (classStudents.length === 0) return null;
                return (
                  <AccordionItem key={cls!} value={cls!} className="border-2 rounded-xl px-3 overflow-hidden">
                    <AccordionTrigger className="text-sm font-semibold py-3 hover:no-underline">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        הכיתה של {cls}
                        <Badge variant="secondary" className="text-xs font-normal rounded-full px-2">
                          {classStudents.length}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="grid grid-cols-2 gap-2">
                        {classStudents.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setStudentId(s.id)}
                            className="selection-chip selection-chip-inactive text-right"
                          >
                            <div className="font-medium text-sm">{s.first_name} {s.last_name}</div>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="space-y-4">
          {/* Subject */}
          <div className="card-styled rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base">מקצוע</h3>
            </div>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="rounded-xl h-11 border-2">
                <SelectValue placeholder="בחר/י מקצוע" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attendance */}
          <div className="card-styled rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base">נוכחות</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ATTENDANCE_LABELS) as [AttendanceStatus, string][]).map(([key, label]) => {
                const Icon = ATTENDANCE_ICONS[key];
                const isActive = attendance === key;
                return (
                  <button
                    key={key}
                    onClick={() => setAttendance(key)}
                    className={`selection-chip flex flex-col items-center gap-1.5 py-4 ${
                      isActive
                        ? key === 'full' ? 'border-success bg-[hsl(var(--success)/0.08)]'
                          : key === 'partial' ? 'border-accent bg-[hsl(var(--warning)/0.08)]'
                          : 'border-destructive bg-destructive/8'
                        : 'selection-chip-inactive'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${
                      isActive
                        ? key === 'full' ? 'text-success' : key === 'partial' ? 'text-accent' : 'text-destructive'
                        : 'text-muted-foreground'
                    }`} />
                    <span className="text-xs">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Behavior */}
          <div className="card-styled rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base">התנהגות</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(BEHAVIOR_LABELS) as [BehaviorType, string][]).map(([key, label]) => (
                <label
                  key={key}
                  className={`selection-chip flex items-center gap-2.5 cursor-pointer ${
                    behaviors.includes(key)
                      ? key === 'violent' ? 'border-destructive bg-destructive/8'
                        : 'selection-chip-active'
                      : 'selection-chip-inactive'
                  }`}
                >
                  <Checkbox
                    checked={behaviors.includes(key)}
                    onCheckedChange={() => toggleBehavior(key)}
                  />
                  <span className="text-sm flex-1">{label}</span>
                  {key === 'violent' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </label>
              ))}
            </div>

            {hasViolent && (
              <div className="mt-4 p-4 rounded-xl bg-destructive/5 border-2 border-destructive/15 space-y-3 animate-scale-in">
                <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  סיווג אלימות (חובה)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(VIOLENCE_LABELS) as [ViolenceType, string][]).map(([key, label]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer text-sm transition-all ${
                        violenceTypes.includes(key)
                          ? 'bg-destructive/10 border-destructive/40'
                          : 'bg-card border-transparent'
                      }`}
                    >
                      <Checkbox
                        checked={violenceTypes.includes(key)}
                        onCheckedChange={() => toggleViolence(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {behaviors.length > 0 && (
              <div className="mt-4 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">רמת חומרה</span>
                  <Badge className={`severity-badge-${severity} rounded-full px-3`}>
                    {severity} — {SEVERITY_LABELS[severity]}
                  </Badge>
                </div>
                <Slider
                  value={[severity]}
                  onValueChange={([v]) => setSeverity(v)}
                  min={1}
                  max={5}
                  step={1}
                  dir="ltr"
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/60 px-1" dir="ltr">
                  <span>קל</span>
                  <span>חמור</span>
                </div>
              </div>
            )}
          </div>

          {/* Participation */}
          <div className="card-styled rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base">למידה והשתתפות</h3>
            </div>
            <div className="space-y-2">
              {(Object.entries(PARTICIPATION_LABELS) as [ParticipationLevel, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setParticipation(key)}
                  className={`w-full selection-chip text-right ${
                    participation === key ? 'selection-chip-active' : 'selection-chip-inactive'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {participation && (
              <div className="mt-4 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">רמת ביצועים</span>
                  <Badge variant="secondary" className="rounded-full px-3">
                    {performance} — {PERFORMANCE_LABELS[performance]}
                  </Badge>
                </div>
                <Slider
                  value={[performance]}
                  onValueChange={([v]) => setPerformance(v)}
                  min={1}
                  max={5}
                  step={1}
                  dir="ltr"
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/60 px-1" dir="ltr">
                  <span>נמוך</span>
                  <span>מצוין</span>
                </div>
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="card-styled rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base">הערות</h3>
              <span className="text-xs text-muted-foreground">(אופציונלי)</span>
            </div>
            <Textarea
              placeholder="הוסף/י הערה קצרה..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              className="rounded-xl border-2 resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 text-lg font-semibold rounded-xl btn-primary-gradient border-0 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Send className="ml-2 h-5 w-5" />
            {submitting ? 'שומר...' : 'שלח דיווח'}
          </Button>
        </div>
      )}
    </div>
  );
}
