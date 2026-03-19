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
import { Send, Sparkles, GraduationCap, ChevronDown, ChevronUp, CheckCircle2, Heart, Users2 } from 'lucide-react';

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string | null;
  is_active: boolean;
};

const CLASS_OPTIONS = ['טלי', 'עדן'];

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
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [verbalEvaluation, setVerbalEvaluation] = useState('');
  const [aiEnhancedEvaluation, setAiEnhancedEvaluation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  // Personal note state
  const [personalNote, setPersonalNote] = useState('');
  const [personalNoteEnhanced, setPersonalNoteEnhanced] = useState('');
  const [enhancingNote, setEnhancingNote] = useState(false);

  // Team evaluation state
  const [teamRatings, setTeamRatings] = useState<Record<string, string>>({});
  const [savingEval, setSavingEval] = useState(false);
  const [evalSaved, setEvalSaved] = useState(false);
  const [educatorOpen, setEducatorOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);

  useEffect(() => {
    supabase.from('students').select('id, first_name, last_name, class_name, is_active')
      .eq('is_active', true).order('class_name').order('last_name')
      .then(({ data }) => { if (data) setStudents(data); });
  }, []);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Load existing evaluation when student is selected
  useEffect(() => {
    if (!selectedStudentId) return;
    supabase.from('student_evaluations' as any).select('*')
      .eq('student_id', selectedStudentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          const eval_ = data[0];
          setPersonalNote(eval_.personal_note || '');
          setPersonalNoteEnhanced('');
          const ratings: Record<string, string> = {};
          ALL_TEAM_KEYS.forEach(key => {
            if (eval_[key]) ratings[key] = eval_[key];
          });
          setTeamRatings(ratings);
          setEvalSaved(true);
        } else {
          setPersonalNote('');
          setPersonalNoteEnhanced('');
          setTeamRatings({});
          setEvalSaved(false);
        }
      });
  }, [selectedStudentId]);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setSubject('');
    setGrade('');
    setVerbalEvaluation('');
    setAiEnhancedEvaluation('');
  };

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

  const handleSubmit = async () => {
    if (!selectedStudentId || !subject) {
      toast.error('נא לבחור תלמיד/ה ומקצוע');
      return;
    }
    if (!grade && !verbalEvaluation.trim()) {
      toast.error('נא להזין ציון או הערכה מילולית');
      return;
    }
    setSubmitting(true);
    const gradeNum = grade ? parseInt(grade, 10) : null;
    if (gradeNum !== null && (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100)) {
      toast.error('ציון חייב להיות בין 0 ל-100');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('student_grades' as any).insert({
      student_id: selectedStudentId,
      staff_user_id: user!.id,
      subject,
      grade: gradeNum,
      verbal_evaluation: verbalEvaluation.trim() || null,
      ai_enhanced_evaluation: aiEnhancedEvaluation.trim() || null,
    });

    if (error) {
      console.error('Insert grade error:', error);
      toast.error('שגיאה בשמירת הציון');
    } else {
      toast.success(`ציון/הערכה נשמרו עבור ${selectedStudent?.first_name} ${selectedStudent?.last_name}`);
      setSubmittedIds(prev => new Set(prev).add(`${selectedStudentId}-${subject}`));
      setSubject('');
      setGrade('');
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
        personal_note: personalNoteEnhanced.trim() || personalNote.trim() || null,
      };
      ALL_TEAM_KEYS.forEach(key => {
        payload[key] = teamRatings[key] || null;
      });

      const { error } = await supabase.from('student_evaluations' as any).insert(payload);
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
              <p className="text-[10px] text-muted-foreground">הכיתה של {selectedStudent?.class_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedStudentId('')}>
            חזרה לרשימה
          </Button>
        </div>
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
              <label className="text-xs font-semibold text-pink-700">💌 ממני אלייך – נימה אישית מהמחנכת והמדריכה</label>
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
                    <span className="text-[10px] font-semibold text-primary">ניסוח משופר</span>
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
                <label className="text-xs font-semibold">{section.title}</label>
                <div className="space-y-2">
                  {section.items.map(cat => (
                    <div key={cat.key} className="flex items-center gap-2">
                      <span className="text-sm w-6 text-center">{cat.icon}</span>
                      <span className="text-xs font-medium w-28 shrink-0">{cat.label}</span>
                      <Select
                        value={teamRatings[cat.key] || ''}
                        onValueChange={val => { setTeamRatings(prev => ({ ...prev, [cat.key]: val })); setEvalSaved(false); }}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="בחר דירוג" />
                        </SelectTrigger>
                        <SelectContent>
                          {RATING_OPTIONS.map(r => (
                            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ))}

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
                <><CheckCircle2 className="h-4 w-4 text-green-500" /> הערכה כללית נשמרה</>
              ) : (
                <><Send className="h-4 w-4" /> שמירת הערכה כללית</>
              )}
            </Button>
          </div>
        )}
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
          </div>
          {subjectOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {subjectOpen && (
          <div className="px-3 pb-3 space-y-4">
            {/* Subject selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold">ציונים לפי מקצוע</label>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map(s => {
                  const key = `${selectedStudentId}-${s}`;
                  const submitted = submittedIds.has(key);
                  return (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`text-xs py-1.5 px-2.5 rounded-lg border transition-colors ${
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
                {/* Grade input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold">ציון (0-100)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="הזן ציון"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                {/* Verbal evaluation */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold">הערכה מילולית</label>
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
                      <label className="text-xs font-semibold text-primary">הערכה משופרת</label>
                    </div>
                    <Textarea
                      value={aiEnhancedEvaluation}
                      onChange={e => setAiEnhancedEvaluation(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">ניתן לערוך את הטקסט המשופר לפני השמירה</p>
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
                    <><Send className="h-4 w-4" /> שמירת ציון והערכה</>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
