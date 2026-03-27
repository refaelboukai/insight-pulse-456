import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SUBJECTS } from '@/lib/constants';
import { Send, Sparkles, GraduationCap, ChevronDown, ChevronUp, CheckCircle2, Heart, Users2, Plus, X } from 'lucide-react';
import { g } from '@/lib/genderUtils';

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string | null;
  is_active: boolean;
  gender?: string | null;
};

type SubGrade = { grade: string; weight: string };

const CLASS_OPTIONS = ['טלי', 'עדן'];
const SCHOOL_YEARS = ['תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט'];

const SEMESTER_OPTIONS = [
  { value: 'semester_a', label: 'סמסטר א׳' },
  { value: 'semester_b', label: 'סמסטר ב׳' },
  { value: 'summer', label: 'סמסטר קיץ' },
];

const RATING_OPTIONS = ['מצטיין/ת', 'טוב מאוד', 'טוב', 'דורש/ת שיפור'];

const TEAM_CATEGORIES_SECTIONS = [
  {
    title: 'תפקוד והתנהגות',
    items: [
      { key: 'behavior', label: 'התנהגות כללית' },
      { key: 'studentship', label: 'תלמידאות ותפקוד' },
      { key: 'group_work', label: 'עבודה בקבוצה ועזרה לאחרים' },
      { key: 'independent_work', label: 'עבודה עצמאית והתמדה' },
    ],
  },
  {
    title: 'מיומנויות רגשיות וקוגניטיביות',
    items: [
      { key: 'emotional_regulation', label: 'ויסות רגשי ומסוגלות' },
      { key: 'cognitive_flexibility', label: 'גמישות מחשבתית ופתרון בעיות' },
    ],
  },
] as const;

const ALL_TEAM_KEYS = TEAM_CATEGORIES_SECTIONS.flatMap(s => s.items.map(i => i.key));

export default function GradesForm() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [semester, setSemester] = useState('semester_a');
  const [subject, setSubject] = useState('');
  const [subGrades, setSubGrades] = useState<SubGrade[]>([{ grade: '', weight: '100' }]);
  const [verbalEvaluation, setVerbalEvaluation] = useState('');
  const [aiEnhancedEvaluation, setAiEnhancedEvaluation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(SCHOOL_YEARS[0]);
  // Personal note state
  const [personalNote, setPersonalNote] = useState('');
  const [personalNoteEnhanced, setPersonalNoteEnhanced] = useState('');
  const [enhancingNote, setEnhancingNote] = useState(false);
  // Social-emotional summary
  const [socialEmotionalSummary, setSocialEmotionalSummary] = useState('');
  const [socialEmotionalEnhanced, setSocialEmotionalEnhanced] = useState('');
  const [enhancingSocial, setEnhancingSocial] = useState(false);

  // Team evaluation state
  const [teamRatings, setTeamRatings] = useState<Record<string, string>>({});
  const [savingEval, setSavingEval] = useState(false);
  const [evalSaved, setEvalSaved] = useState(false);
  const [educatorOpen, setEducatorOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);

  useEffect(() => {
    supabase.from('students').select('id, first_name, last_name, class_name, is_active, gender')
      .eq('is_active', true).order('class_name').order('last_name')
      .then(({ data }) => { if (data) setStudents(data); });
  }, []);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Load existing evaluation when student is selected
  useEffect(() => {
    if (!selectedStudentId) return;
    supabase.from('student_evaluations' as any).select('*')
      .eq('student_id', selectedStudentId)
      .eq('school_year', selectedYear)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          const eval_ = data[0];
          setPersonalNote(eval_.personal_note || '');
          setPersonalNoteEnhanced('');
          setSocialEmotionalSummary(eval_.social_emotional_summary || '');
          setSocialEmotionalEnhanced('');
          const ratings: Record<string, string> = {};
          ALL_TEAM_KEYS.forEach(key => {
            if (eval_[key]) ratings[key] = eval_[key];
          });
          setTeamRatings(ratings);
          setEvalSaved(true);
        } else {
          setPersonalNote('');
          setPersonalNoteEnhanced('');
          setSocialEmotionalSummary('');
          setSocialEmotionalEnhanced('');
          setTeamRatings({});
          setEvalSaved(false);
        }
      });
  }, [selectedStudentId, selectedYear]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setSubject('');
    setSubGrades([{ grade: '', weight: '100' }]);
    setVerbalEvaluation('');
    setAiEnhancedEvaluation('');
  };

  // Sub-grades management
  const addSubGrade = () => {
    if (subGrades.length >= 4) return;
    setSubGrades(prev => [...prev, { grade: '', weight: '' }]);
  };

  const removeSubGrade = (index: number) => {
    if (subGrades.length <= 1) return;
    setSubGrades(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubGrade = (index: number, field: keyof SubGrade, value: string) => {
    setSubGrades(prev => prev.map((sg, i) => i === index ? { ...sg, [field]: value } : sg));
  };

  // Calculate weighted total
  const calculateTotal = (): number | null => {
    const validGrades = subGrades.filter(sg => sg.grade && sg.weight);
    if (validGrades.length === 0) return null;
    const totalWeight = validGrades.reduce((s, sg) => s + parseFloat(sg.weight || '0'), 0);
    if (totalWeight === 0) return null;
    const weightedSum = validGrades.reduce((s, sg) => s + (parseFloat(sg.grade) * parseFloat(sg.weight)), 0);
    return Math.round(weightedSum / totalWeight);
  };

  const totalGrade = calculateTotal();
  const totalWeight = subGrades.reduce((s, sg) => s + (parseFloat(sg.weight || '0') || 0), 0);

  const handleEnhance = async () => {
    if (!verbalEvaluation.trim()) {
      toast.error('נא לכתוב הערכה מילולית לפני שיפור');
      return;
    }
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rephrase-evaluation', {
        body: {
          evaluation: verbalEvaluation.trim(),
          studentName: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : '',
          subject,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.enhanced) {
        setAiEnhancedEvaluation(data.enhanced);
        toast.success('ההערכה שופרה בהצלחה!');
      }
    } catch (e: any) {
      console.error('Enhance error:', e);
      toast.error(e?.message || 'שגיאה בשיפור הניסוח');
    } finally {
      setEnhancing(false);
    }
  };

  const handleEnhancePersonalNote = async () => {
    if (!personalNote.trim()) {
      toast.error('נא לכתוב נימה אישית לפני שיפור');
      return;
    }
    setEnhancingNote(true);
    try {
      const { data, error } = await supabase.functions.invoke('rephrase-evaluation', {
        body: {
          evaluation: personalNote.trim(),
          studentName: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : '',
          subject: 'נימה אישית מהמחנכת',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.enhanced) {
        setPersonalNoteEnhanced(data.enhanced);
        toast.success('הנימה האישית שופרה בהצלחה!');
      }
    } catch (e: any) {
      console.error('Enhance note error:', e);
      toast.error(e?.message || 'שגיאה בשיפור הניסוח');
    } finally {
      setEnhancingNote(false);
    }
  };

  const handleEnhanceSocialEmotional = async () => {
    if (!socialEmotionalSummary.trim()) {
      toast.error('נא לכתוב סיכום חברתי ורגשי לפני שיפור');
      return;
    }
    setEnhancingSocial(true);
    try {
      const { data, error } = await supabase.functions.invoke('rephrase-evaluation', {
        body: {
          evaluation: socialEmotionalSummary,
          studentName: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : '',
          subject: 'סיכום חברתי ורגשי',
        },
      });
      if (error) throw error;
      if (data?.enhanced) {
        setSocialEmotionalEnhanced(data.enhanced);
        setEvalSaved(false);
        toast.success('הניסוח שופר בהצלחה!');
      }
    } catch (e: any) {
      console.error('Enhance social-emotional error:', e);
      toast.error(e?.message || 'שגיאה בשיפור הניסוח');
    } finally {
      setEnhancingSocial(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudentId || !subject) {
      toast.error('נא לבחור תלמיד/ה ומקצוע');
      return;
    }
    if (totalGrade === null && !verbalEvaluation.trim()) {
      toast.error('נא להזין ציון או הערכה מילולית');
      return;
    }
    if (totalGrade !== null && (totalGrade < 0 || totalGrade > 100)) {
      toast.error('ציון חייב להיות בין 0 ל-100');
      return;
    }
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 1) {
      toast.error('סך המשקלים חייב להיות 100%');
      return;
    }
    setSubmitting(true);

    const subGradesData = subGrades
      .filter(sg => sg.grade)
      .map(sg => ({ grade: parseFloat(sg.grade), weight: parseFloat(sg.weight || '100') }));

    const { error } = await supabase.from('student_grades' as any).insert({
      student_id: selectedStudentId,
      staff_user_id: user!.id,
      subject,
      semester,
      school_year: selectedYear,
      grade: totalGrade,
      sub_grades: subGradesData.length > 0 ? subGradesData : null,
      verbal_evaluation: verbalEvaluation.trim() || null,
      ai_enhanced_evaluation: aiEnhancedEvaluation.trim() || null,
    });

    if (error) {
      console.error('Insert grade error:', error);
      toast.error('שגיאה בשמירת הציון');
    } else {
      toast.success(`ציון/הערכה נשמרו עבור ${selectedStudent?.first_name} ${selectedStudent?.last_name}`);
      setSubmittedIds(prev => new Set(prev).add(`${selectedStudentId}-${subject}-${semester}`));
      setSubject('');
      setSubGrades([{ grade: '', weight: '100' }]);
      setVerbalEvaluation('');
      setAiEnhancedEvaluation('');
    }
    setSubmitting(false);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedStudentId) return;
    setSavingEval(true);
    try {
      const payload: any = {
        student_id: selectedStudentId,
        staff_user_id: user!.id,
        school_year: selectedYear,
        personal_note: personalNoteEnhanced.trim() || personalNote.trim() || null,
        social_emotional_summary: socialEmotionalEnhanced.trim() || socialEmotionalSummary.trim() || null,
      };
      ALL_TEAM_KEYS.forEach(key => {
        payload[key] = teamRatings[key] || null;
      });

      // Check if evaluation already exists for this student by this staff
      const { data: existing } = await supabase.from('student_evaluations' as any)
        .select('id')
        .eq('student_id', selectedStudentId)
        .eq('staff_user_id', user!.id)
        .eq('school_year', selectedYear)
        .order('created_at', { ascending: false })
        .limit(1);

      let error;
      if (existing && (existing as any[]).length > 0) {
        // Update existing evaluation
        const result = await supabase.from('student_evaluations' as any)
          .update(payload)
          .eq('id', (existing as any[])[0].id);
        error = result.error;
      } else {
        // Insert new evaluation
        const result = await supabase.from('student_evaluations' as any).insert(payload);
        error = result.error;
      }

      if (error) throw error;
      toast.success('ההערכה הכללית נשמרה בהצלחה!');
      setEvalSaved(true);
    } catch (e: any) {
      console.error('Save evaluation error:', e);
      toast.error('שגיאה בשמירת ההערכה');
    } finally {
      setSavingEval(false);
    }
  };

  // Student selection view
  if (!selectedStudentId) {
    return (
      <div className="space-y-3">
        <div className="text-center mb-2">
          <GraduationCap className="h-6 w-6 mx-auto text-primary mb-1" />
          <h3 className="font-bold text-sm">ציונים והערכות</h3>
          <p className="text-xs text-muted-foreground">בחר/י תלמיד/ה להזנת ציון והערכה</p>
        </div>
        <div className="flex justify-center">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCHOOL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {CLASS_OPTIONS.map(cls => {
          const classStudents = students.filter(s => s.class_name === cls);
          const isExpanded = expandedClass === cls;
          return (
            <div key={cls} className="card-styled rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedClass(isExpanded ? null : cls)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">🏫 הכיתה של {cls}</span>
                  <Badge variant="secondary" className="text-xs">{classStudents.length}</Badge>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 space-y-1">
                  {classStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s.id)}
                      className="w-full text-right text-xs p-2.5 rounded-lg bg-secondary/50 border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    >
                      <span className="font-medium">{s.first_name} {s.last_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const semesterLabel = SEMESTER_OPTIONS.find(s => s.value === semester)?.label || '';

  // Grade entry form for selected student
  return (
    <div className="space-y-4">
      {/* Student header */}
      <div className="card-styled rounded-2xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <p className="font-bold text-sm">{selectedStudent?.first_name} {selectedStudent?.last_name}</p>
              <p className="text-xs text-muted-foreground">הכיתה של {selectedStudent?.class_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedStudentId('')}>
            חזרה לרשימה
          </Button>
        </div>
      </div>

      {/* Year + Semester selector */}
      <div className="card-styled rounded-2xl p-3 space-y-3">
        <div>
          <label className="text-xs font-semibold mb-2 block">שנת לימודים</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCHOOL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold mb-2 block">בחר/י סמסטר</label>
          <div className="grid grid-cols-3 gap-1.5">
            {SEMESTER_OPTIONS.map(sem => (
              <button
                key={sem.value}
                onClick={() => setSemester(sem.value)}
                className={`text-xs py-2.5 px-2 rounded-lg border transition-all font-semibold ${
                  semester === sem.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-border bg-card hover:bg-primary/10 hover:border-primary/30'
                }`}
              >
                {sem.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Accordion: דיווחי מורים מקצועיים ===== */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <button
          onClick={() => setSubjectOpen(!subjectOpen)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">דיווחי מורים מקצועיים</span>
            <Badge variant="outline" className="text-[10px]">{semesterLabel}</Badge>
          </div>
          {subjectOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {subjectOpen && (
          <div className="px-3 pb-3 space-y-4">
            {/* Subject selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">ציונים לפי מקצוע — {semesterLabel}</label>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map(s => {
                  const key = `${selectedStudentId}-${s}-${semester}`;
                  const submitted = submittedIds.has(key);
                  return (
                    <button
                      key={s}
                      onClick={() => { setSubject(s); setSubGrades([{ grade: '', weight: '100' }]); }}
                      className={`text-sm py-2 px-3 rounded-lg border transition-colors ${
                        subject === s
                          ? 'bg-primary text-primary-foreground border-primary'
                          : submitted
                          ? 'bg-success/10 border-success/30 text-success'
                          : 'bg-card border-border hover:bg-primary/10 hover:border-primary/30'
                      }`}
                    >
                      {submitted && <CheckCircle2 className="h-3 w-3 inline ml-1" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {subject && (
              <>
                {/* Sub-grades with weights */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold">ציונים ומשקלים</label>
                    {subGrades.length < 4 && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={addSubGrade}>
                        <Plus className="h-3 w-3" /> הוסף ציון
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {subGrades.map((sg, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder={`ציון ${i + 1}`}
                            value={sg.grade}
                            onChange={e => updateSubGrade(i, 'grade', e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="משקל %"
                            value={sg.weight}
                            onChange={e => updateSubGrade(i, 'weight', e.target.value)}
                            className="h-9 text-sm text-center"
                          />
                        </div>
                        {subGrades.length > 1 && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeSubGrade(i)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Total display */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">סה״כ ציון משוקלל:</span>
                      <span className={`text-sm font-bold ${totalGrade !== null ? 'text-primary' : 'text-muted-foreground'}`}>
                        {totalGrade !== null ? totalGrade : '—'}
                      </span>
                    </div>
                    <span className={`text-[10px] ${Math.abs(totalWeight - 100) > 1 && totalWeight > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      משקל: {totalWeight}%
                    </span>
                  </div>
                </div>

                {/* Verbal evaluation */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">הערכה מילולית</label>
                  <Textarea
                    placeholder="כתוב הערכה מילולית על התלמיד/ה..."
                    value={verbalEvaluation}
                    onChange={e => setVerbalEvaluation(e.target.value)}
                    className="min-h-[80px] text-sm"
                    maxLength={2000}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs w-full"
                    onClick={handleEnhance}
                    disabled={enhancing || !verbalEvaluation.trim()}
                  >
                    {enhancing ? (
                      <><div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> משפר ניסוח...</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /> שיפור ניסוח עם AI</>
                    )}
                  </Button>
                </div>

                {/* AI enhanced evaluation */}
                {aiEnhancedEvaluation && (
                  <div className="space-y-2 p-2.5 rounded-lg bg-muted/50 border border-primary/20">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <label className="text-sm font-semibold text-primary">הערכה משופרת</label>
                    </div>
                    <Textarea
                      value={aiEnhancedEvaluation}
                      onChange={e => setAiEnhancedEvaluation(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                    <p className="text-xs text-muted-foreground">ניתן לערוך את הטקסט המשופר לפני השמירה</p>
                  </div>
                )}

                {/* Submit grade */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full gap-1.5"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> שומר...</>
                  ) : (
                    <><Send className="h-4 w-4" /> שמירת ציון והערכה — {semesterLabel}</>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ===== Accordion: דיווחי מחנכת ===== */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <button
          onClick={() => setEducatorOpen(!educatorOpen)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-semibold">דיווחי מחנכת</span>
          </div>
          {educatorOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {educatorOpen && (
          <div className="px-3 pb-3 space-y-4">
            {/* Personal Note */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">ממני אלייך – נימה אישית מהמחנכת והמדריכה</label>
              <Textarea
                placeholder="כתבי מילים אישיות, מחזקות ומעודדות לתלמיד/ה..."
                value={personalNote}
                onChange={e => { setPersonalNote(e.target.value); setEvalSaved(false); }}
                className="min-h-[80px] text-sm"
                maxLength={3000}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs w-full"
                onClick={handleEnhancePersonalNote}
                disabled={enhancingNote || !personalNote.trim()}
              >
                {enhancingNote ? (
                  <><div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> משפר ניסוח...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> שיפור ניסוח עם AI</>
                )}
              </Button>
              {personalNoteEnhanced && (
                <div className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-primary">ניסוח משופר</span>
                  </div>
                  <Textarea
                    value={personalNoteEnhanced}
                    onChange={e => { setPersonalNoteEnhanced(e.target.value); setEvalSaved(false); }}
                    className="min-h-[60px] text-sm"
                  />
                </div>
              )}
            </div>

            {/* Team Evaluation Sections */}
            {TEAM_CATEGORIES_SECTIONS.map(section => (
              <div key={section.title} className="space-y-2">
                <label className="text-sm font-semibold text-foreground">{section.title}</label>
                <div className="space-y-2">
                  {section.items.map(cat => (
                    <div key={cat.key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-sm font-medium shrink-0">{cat.label}</span>
                      <Select
                        value={teamRatings[cat.key] || ''}
                        onValueChange={val => { setTeamRatings(prev => ({ ...prev, [cat.key]: val })); setEvalSaved(false); }}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="בחר דירוג" />
                        </SelectTrigger>
                        <SelectContent>
                          {RATING_OPTIONS.map(r => (
                            <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ===== Social-Emotional Summary (inside educator) ===== */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold">סיכום חברתי ורגשי מתוך שאלונים</span>
              </div>
              <Textarea
                placeholder="הדבק/י כאן סיכום חברתי ורגשי מתוך שאלונים מקצועיים..."
                value={socialEmotionalSummary}
                onChange={e => { setSocialEmotionalSummary(e.target.value); setEvalSaved(false); }}
                className="min-h-[120px] text-sm"
                maxLength={5000}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs w-full"
                onClick={handleEnhanceSocialEmotional}
                disabled={enhancingSocial || !socialEmotionalSummary.trim()}
              >
                {enhancingSocial ? (
                  <><div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> משפר ניסוח...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> שיפור ניסוח עם AI</>
                )}
              </Button>
              {socialEmotionalEnhanced && (
                <div className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-primary">ניסוח משופר</span>
                  </div>
                  <Textarea
                    value={socialEmotionalEnhanced}
                    onChange={e => { setSocialEmotionalEnhanced(e.target.value); setEvalSaved(false); }}
                    className="min-h-[100px] text-sm"
                  />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">סיכום זה יוצג בתעודה. ניתן להדביק טקסט מתוך שאלונים שמולאו.</p>
            </div>

            {/* Save evaluation button */}
            <Button
              onClick={handleSaveEvaluation}
              disabled={savingEval || evalSaved}
              variant={evalSaved ? 'outline' : 'default'}
              className="w-full gap-1.5"
            >
              {savingEval ? (
                <><div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> שומר...</>
              ) : evalSaved ? (
                <><CheckCircle2 className="h-4 w-4 text-green-500" /> הערכת מחנכת נשמרה</>
              ) : (
                <><Send className="h-4 w-4" /> שמירת הערכת מחנכת</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
