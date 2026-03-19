import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CheckCircle2, AlertTriangle, Send, User } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];
type BehaviorType = Database['public']['Enums']['behavior_type'];
type ViolenceType = Database['public']['Enums']['violence_type'];
type AttendanceStatus = Database['public']['Enums']['attendance_status'];
type ParticipationLevel = Database['public']['Enums']['participation_level'];

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
      // Create alerts for violent behavior
      if (hasViolent && data) {
        await supabase.from('alerts').insert({
          student_id: studentId,
          alert_type: 'violent_behavior',
          description: `התנהגות אלימה דווחה: ${violenceTypes.map(v => VIOLENCE_LABELS[v]).join(', ')}`,
          related_report_id: data.id,
        });
      }
      toast.success('הדיווח נשמר בהצלחה!');
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
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            בחירת תלמיד/ה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="חיפוש לפי שם..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          <Accordion type="multiple" defaultValue={classes as string[]} className="space-y-2">
            {classes.map(cls => {
              const classStudents = filteredStudents.filter(s => s.class_name === cls);
              if (classStudents.length === 0) return null;
              return (
                <AccordionItem key={cls!} value={cls!} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-semibold py-2.5 hover:no-underline">
                    <span className="flex items-center gap-2">
                      הכיתה של {cls}
                      <Badge variant="secondary" className="text-xs font-normal">
                        {classStudents.length}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {classStudents.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setStudentId(s.id)}
                          className={`p-2.5 rounded-lg text-sm text-right transition-all border ${
                            studentId === s.id
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-card border-border hover:border-primary/50 hover:bg-secondary/50'
                          }`}
                        >
                          <div className="font-medium">{s.first_name} {s.last_name}</div>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {selectedStudent && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">שיעור</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר/י מקצוע" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">נוכחות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(ATTENDANCE_LABELS) as [AttendanceStatus, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setAttendance(key)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all border ${
                      attendance === key
                        ? key === 'full' ? 'bg-primary text-primary-foreground border-primary'
                          : key === 'partial' ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-destructive text-destructive-foreground border-destructive'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">התנהגות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(BEHAVIOR_LABELS) as [BehaviorType, string][]).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      behaviors.includes(key)
                        ? key === 'violent' ? 'bg-destructive/10 border-destructive'
                          : 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <Checkbox
                      checked={behaviors.includes(key)}
                      onCheckedChange={() => toggleBehavior(key)}
                    />
                    <span className="text-sm">{label}</span>
                    {key === 'violent' && <AlertTriangle className="h-4 w-4 text-destructive mr-auto" />}
                  </label>
                ))}
              </div>

              {hasViolent && (
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3">
                  <p className="text-sm font-medium text-destructive">סיווג אלימות (חובה):</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(VIOLENCE_LABELS) as [ViolenceType, string][]).map(([key, label]) => (
                      <label
                        key={key}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm transition-all ${
                          violenceTypes.includes(key)
                            ? 'bg-destructive/10 border-destructive'
                            : 'bg-card border-border'
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">חומרה</span>
                    <Badge className={`severity-badge-${severity}`}>
                      {severity} - {SEVERITY_LABELS[severity]}
                    </Badge>
                  </div>
                  <Slider
                    value={[severity]}
                    onValueChange={([v]) => setSeverity(v)}
                    min={1}
                    max={5}
                    step={1}
                    dir="ltr"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">למידה והשתתפות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(PARTICIPATION_LABELS) as [ParticipationLevel, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setParticipation(key)}
                    className={`p-3 rounded-lg text-sm text-right transition-all border ${
                      participation === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {participation && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ביצועים</span>
                    <Badge variant="secondary">
                      {performance} - {PERFORMANCE_LABELS[performance]}
                    </Badge>
                  </div>
                  <Slider
                    value={[performance]}
                    onValueChange={([v]) => setPerformance(v)}
                    min={1}
                    max={5}
                    step={1}
                    dir="ltr"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">הערות (אופציונלי)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="הוסף/י הערה קצרה..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
            className="w-full text-lg py-6"
          >
            <Send className="ml-2 h-5 w-5" />
            {submitting ? 'שומר...' : 'שלח דיווח'}
          </Button>
        </>
      )}
    </div>
  );
}
