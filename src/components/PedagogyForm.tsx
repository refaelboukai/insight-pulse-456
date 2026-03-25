import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { BookOpen, Save, Plus, Trash2, CalendarDays, Brain } from 'lucide-react';
import { format } from 'date-fns';
import LearningStyleResults from '@/components/LearningStyleResults';

type Student = { id: string; first_name: string; last_name: string; class_name: string | null; is_active: boolean };
type ManagedSubject = { id: string; name: string; has_sub_subjects: boolean; sub_subjects: string[]; is_active: boolean };
type PedagogicalGoal = {
  id: string; student_id: string; subject_id: string; sub_subject: string | null;
  month: string; learning_style: string | null; current_status: string | null;
  learning_goals: string | null; measurement_methods: string | null;
  what_was_done: string | null; what_was_not_done: string | null;
  teacher_notes: string | null; admin_notes: string | null; staff_user_id: string;
};
type ExamEntry = {
  id: string; student_id: string; subject_id: string; sub_subject: string | null;
  exam_date: string; exam_description: string | null; created_by: string;
};

const CLASS_OPTIONS = ['טלי', 'עדן'];
const SCHOOL_YEARS = ['תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט'];
const MONTHS = [
  'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
];

export default function PedagogyForm() {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<ManagedSubject[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSubSubject, setSelectedSubSubject] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth() >= 8 ? new Date().getMonth() - 8 : new Date().getMonth() + 4] || MONTHS[0]);
  const [goal, setGoal] = useState<Partial<PedagogicalGoal>>({});
  const [existingGoalId, setExistingGoalId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState(SCHOOL_YEARS[0]);

  // Exam schedule
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');

  useEffect(() => {
    loadStudents();
    loadSubjects();
  }, []);

  const loadStudents = async () => {
    const { data } = await supabase.from('students').select('id, first_name, last_name, class_name, is_active').eq('is_active', true).order('first_name');
    if (data) setStudents(data);
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from('managed_subjects').select('*').eq('is_active', true).order('name');
    if (data) setSubjects(data as ManagedSubject[]);
  };

  const loadGoal = useCallback(async () => {
    if (!selectedStudentId || !selectedSubjectId || !selectedMonth) return;
    const query = supabase.from('pedagogical_goals')
      .select('*')
      .eq('student_id', selectedStudentId)
      .eq('subject_id', selectedSubjectId)
      .eq('month', selectedMonth)
      .eq('school_year', selectedYear);

    if (selectedSubSubject) {
      query.eq('sub_subject', selectedSubSubject);
    } else {
      query.is('sub_subject', null);
    }

    const { data } = await query.maybeSingle();
    if (data) {
      setGoal(data as PedagogicalGoal);
      setExistingGoalId(data.id);
    } else {
      setGoal({});
      setExistingGoalId(null);
    }
  }, [selectedStudentId, selectedSubjectId, selectedSubSubject, selectedMonth, selectedYear]);

  const loadExams = useCallback(async () => {
    if (!selectedStudentId || !selectedSubjectId) return;
    const query = supabase.from('exam_schedule')
      .select('*')
      .eq('student_id', selectedStudentId)
      .eq('subject_id', selectedSubjectId)
      .eq('school_year', selectedYear)
      .order('exam_date');

    if (selectedSubSubject) {
      query.eq('sub_subject', selectedSubSubject);
    } else {
      query.is('sub_subject', null);
    }

    const { data } = await query;
    if (data) setExams(data as ExamEntry[]);
  }, [selectedStudentId, selectedSubjectId, selectedSubSubject, selectedYear]);

  useEffect(() => {
    loadGoal();
    loadExams();
  }, [loadGoal, loadExams]);

  const handleSave = async () => {
    if (!user || !selectedStudentId || !selectedSubjectId || !selectedMonth) {
      toast.error('יש למלא תלמיד, מקצוע וחודש');
      return;
    }
    setSaving(true);
    const payload = {
      student_id: selectedStudentId,
      subject_id: selectedSubjectId,
      sub_subject: selectedSubSubject || null,
      month: selectedMonth,
      school_year: selectedYear,
      learning_style: goal.learning_style || null,
      current_status: goal.current_status || null,
      learning_goals: goal.learning_goals || null,
      measurement_methods: goal.measurement_methods || null,
      what_was_done: goal.what_was_done || null,
      what_was_not_done: goal.what_was_not_done || null,
      teacher_notes: goal.teacher_notes || null,
      admin_notes: goal.admin_notes || null,
      staff_user_id: user.id,
    };

    let error;
    if (existingGoalId) {
      ({ error } = await supabase.from('pedagogical_goals').update(payload).eq('id', existingGoalId));
    } else {
      ({ error } = await supabase.from('pedagogical_goals').insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error('שגיאה בשמירה: ' + error.message);
    } else {
      toast.success('היעד הפדגוגי נשמר בהצלחה');
      loadGoal();
    }
  };

  const handleAddExam = async () => {
    if (!user || !selectedStudentId || !selectedSubjectId || !newExamDate) {
      toast.error('יש לבחור תאריך מבחן');
      return;
    }
    const { error } = await supabase.from('exam_schedule').insert({
      student_id: selectedStudentId,
      subject_id: selectedSubjectId,
      sub_subject: selectedSubSubject || null,
      exam_date: newExamDate,
      exam_description: newExamDesc || null,
      school_year: selectedYear,
      created_by: user.id,
    });
    if (error) {
      toast.error('שגיאה בהוספת מבחן');
    } else {
      toast.success('מבחן נוסף בהצלחה');
      setNewExamDate('');
      setNewExamDesc('');
      loadExams();
    }
  };

  const handleDeleteExam = async (id: string) => {
    const { error } = await supabase.from('exam_schedule').delete().eq('id', id);
    if (error) toast.error('שגיאה במחיקה');
    else loadExams();
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const filteredStudents = selectedClass ? students.filter(s => s.class_name === selectedClass) : students;

  const updateField = (field: string, value: string) => {
    setGoal(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="shadow-soft border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          יעדים פדגוגיים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Year + Student selection */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1 block">שנת לימודים</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCHOOL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">כיתה</Label>
            <Select value={selectedClass || ''} onValueChange={v => { setSelectedClass(v || null); setSelectedStudentId(''); }}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="בחר כיתה" /></SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">תלמיד/ה</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="בחר תלמיד/ה" /></SelectTrigger>
              <SelectContent>
                {filteredStudents.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedStudentId && (
          <>
            {/* Learning Style Profile */}
            <LearningStyleResults
              studentId={selectedStudentId}
              studentName={filteredStudents.find(s => s.id === selectedStudentId)
                ? `${filteredStudents.find(s => s.id === selectedStudentId)!.first_name} ${filteredStudents.find(s => s.id === selectedStudentId)!.last_name}`
                : ''}
              isEditable={true}
            />

            {/* Subject + month selection */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1 block">מקצוע</Label>
                <Select value={selectedSubjectId} onValueChange={v => { setSelectedSubjectId(v); setSelectedSubSubject(null); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="בחר מקצוע" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selectedSubject?.has_sub_subjects && selectedSubject.sub_subjects.length > 0 && (
                <div>
                  <Label className="text-xs mb-1 block">תת-מקצוע</Label>
                  <Select value={selectedSubSubject || ''} onValueChange={v => setSelectedSubSubject(v || null)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      {selectedSubject.sub_subjects.map(ss => <SelectItem key={ss} value={ss}>{ss}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs mb-1 block">חודש</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSubjectId && (
              <Accordion type="multiple" defaultValue={['goals', 'exams']} className="space-y-2">
                {/* Pedagogical Goals */}
                <AccordionItem value="goals" className="border rounded-lg bg-card">
                  <AccordionTrigger className="px-4 py-2 text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      יעד פדגוגי - {selectedSubject?.name} {selectedSubSubject ? `(${selectedSubSubject})` : ''} - {selectedMonth}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-3">
                    <div>
                      <Label className="text-xs">סגנון הלמידה</Label>
                      <Textarea className="mt-1 text-sm min-h-[60px]" value={goal.learning_style || ''} onChange={e => updateField('learning_style', e.target.value)} placeholder="תאר/י את סגנון הלמידה של התלמיד/ה..." />
                    </div>
                    <div>
                      <Label className="text-xs">מצב נוכחי</Label>
                      <Textarea className="mt-1 text-sm min-h-[60px]" value={goal.current_status || ''} onChange={e => updateField('current_status', e.target.value)} placeholder="מהו המצב הנוכחי של התלמיד/ה במקצוע..." />
                    </div>
                    <div>
                      <Label className="text-xs">יעדים לימודיים</Label>
                      <Textarea className="mt-1 text-sm min-h-[60px]" value={goal.learning_goals || ''} onChange={e => updateField('learning_goals', e.target.value)} placeholder="מהם היעדים הלימודיים..." />
                    </div>
                    <div>
                      <Label className="text-xs">דרכי מדידה</Label>
                      <Textarea className="mt-1 text-sm min-h-[60px]" value={goal.measurement_methods || ''} onChange={e => updateField('measurement_methods', e.target.value)} placeholder="כיצד נמדוד את ההתקדמות..." />
                    </div>
                    <div>
                      <Label className="text-xs">מה נעשה (ביצוע בפועל)</Label>
                      <Textarea className="mt-1 text-sm min-h-[60px]" value={goal.what_was_done || ''} onChange={e => updateField('what_was_done', e.target.value)} placeholder="מה בוצע בפועל..." />
                    </div>
                    <div>
                      <Label className="text-xs">מה לא נעשה ומדוע (פערים)</Label>
                      <Textarea className="mt-1 text-sm min-h-[60px]" value={goal.what_was_not_done || ''} onChange={e => updateField('what_was_not_done', e.target.value)} placeholder="מה לא בוצע ומה הסיבות..." />
                    </div>
                    <div>
                      <Label className="text-xs">הערות מורה</Label>
                      <Textarea className="mt-1 text-sm min-h-[60px]" value={goal.teacher_notes || ''} onChange={e => updateField('teacher_notes', e.target.value)} placeholder="הערות נוספות..." />
                    </div>
                    {isAdmin && (
                      <div>
                        <Label className="text-xs">הערות מנהל/סגנית</Label>
                        <Textarea className="mt-1 text-sm min-h-[60px]" value={goal.admin_notes || ''} onChange={e => updateField('admin_notes', e.target.value)} placeholder="הערות הנהלה..." />
                      </div>
                    )}
                    <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? 'שומר...' : existingGoalId ? 'עדכן יעד' : 'שמור יעד'}
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Exam Schedule */}
                <AccordionItem value="exams" className="border rounded-lg bg-card">
                  <AccordionTrigger className="px-4 py-2 text-sm font-semibold hover:no-underline">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      לוח מבחנים - {selectedSubject?.name} {selectedSubSubject ? `(${selectedSubSubject})` : ''}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-3">
                    {exams.length > 0 && (
                      <div className="space-y-2">
                        {exams.map(exam => (
                          <div key={exam.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2 text-sm">
                            <div>
                              <span className="font-medium">{format(new Date(exam.exam_date), 'dd/MM/yyyy')}</span>
                              {exam.exam_description && <span className="text-muted-foreground mr-2">- {exam.exam_description}</span>}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExam(exam.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">תאריך מבחן</Label>
                        <Input type="date" className="mt-1 h-9 text-sm" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">תיאור (אופציונלי)</Label>
                        <Input className="mt-1 h-9 text-sm" value={newExamDesc} onChange={e => setNewExamDesc(e.target.value)} placeholder="סוג המבחן..." />
                      </div>
                      <Button size="sm" onClick={handleAddExam} className="gap-1 h-9">
                        <Plus className="h-3.5 w-3.5" />
                        הוסף
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
