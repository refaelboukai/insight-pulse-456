import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import StudentScheduleView from '@/components/StudentScheduleView';
import LearningStyleQuestionnaire from '@/components/LearningStyleQuestionnaire';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS,
} from '@/lib/constants';
import { FileText, GraduationCap, HeartHandshake, ChevronDown, ChevronUp, Loader2, Sparkles, BookOpen, CalendarDays, Sun, Moon, CloudSun, Calendar, Heart, Brain, PenLine, Leaf, Smile, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { g, genderTerms } from '@/lib/genderUtils';

type Student = Database['public']['Tables']['students']['Row'];
type Report = Database['public']['Tables']['lesson_reports']['Row'];

const SUPPORT_LABELS: Record<string, string> = {
  social: 'חברתית', emotional: 'רגשית', academic: 'לימודית', behavioral: 'התנהגותית',
};

const SEMESTER_LABELS: Record<string, string> = {
  semester_a: 'סמסטר א׳', semester_b: 'סמסטר ב׳', summer: 'סמסטר קיץ',
};

function getGreeting(): { text: string; icon: React.ElementType } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'בוקר טוב', icon: Sun };
  if (h < 17) return { text: 'צהריים טובים', icon: CloudSun };
  return { text: 'ערב טוב', icon: Moon };
}

function getTodayHebrew(): string {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const d = new Date();
  return `יום ${days[d.getDay()]}, ${d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}`;
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
    reports: true, grades: false, support: false, pedagogy: false, exams: false, learningStyle: false,
  });
  const [pedagogyGoals, setPedagogyGoals] = useState<any[]>([]);
  const [examSchedule, setExamSchedule] = useState<any[]>([]);
  const [managedSubjects, setManagedSubjects] = useState<Record<string, string>>({});
  const [selectedYear, setSelectedYear] = useState('תשפ"ו');
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showLearningStyle, setShowLearningStyle] = useState(false);
  const [learningStyleCompleted, setLearningStyleCompleted] = useState(false);
  const [dailyChecks, setDailyChecks] = useState<Record<string, boolean>>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`daily-checks-${today}`);
    return saved ? JSON.parse(saved) : { regulation: false, brain: false };
  });
  const [insightText, setInsightText] = useState('');
  const [insightSaving, setInsightSaving] = useState(false);
  const [insightSaved, setInsightSaved] = useState(false);
  const [dailyReflection, setDailyReflection] = useState({ class_presence: 3, behavior: 3, social_interaction: 3, academic_tasks: 3 });
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

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

  useEffect(() => {
    if (!selectedStudentId) return;
    supabase
      .from('learning_style_profiles')
      .select('is_completed, is_visible')
      .eq('student_id', selectedStudentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.is_completed) {
          setLearningStyleCompleted(true);
          setShowLearningStyle(false);
        } else {
          setLearningStyleCompleted(false);
          setShowLearningStyle(true);
        }
      });
  }, [selectedStudentId]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const gender = selectedStudent?.gender;
  const terms = genderTerms(gender);

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
      // Load today's reflection
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;
      const reflRes = await supabase.from('daily_reflections').select('*')
        .eq('student_id', selectedStudentId)
        .gte('created_at', todayStart).lte('created_at', todayEnd)
        .maybeSingle();
      if (reflRes.data) {
        setDailyReflection({
          class_presence: reflRes.data.class_presence,
          behavior: reflRes.data.behavior,
          social_interaction: reflRes.data.social_interaction,
          academic_tasks: reflRes.data.academic_tasks,
        });
        setReflectionSaved(true);
      } else {
        setDailyReflection({ class_presence: 3, behavior: 3, social_interaction: 3, academic_tasks: 3 });
        setReflectionSaved(false);
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

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const todayStr = getTodayHebrew();

  // Quick stats
  const positiveReports = reports.filter(r => r.behavior_types?.includes('respectful')).length;
  const totalReports = reports.length;

  const SectionHeader = ({ title, icon: Icon, count, sectionKey, color }: {
    title: string; icon: React.ElementType; count?: number; sectionKey: string; color?: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 rounded-xl transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color || 'bg-primary/10'}`}>
          <Icon className={`h-4.5 w-4.5 ${color ? 'text-white' : 'text-primary'}`} />
        </div>
        <div className="text-right">
          <span className="font-semibold text-sm block">{title}</span>
          {count !== undefined && (
            <span className="text-[10px] text-muted-foreground">{count} פריטים</span>
          )}
        </div>
      </div>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${expandedSections[sectionKey] ? 'bg-primary/10' : 'bg-muted'}`}>
        {expandedSections[sectionKey] ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
    </button>
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'var(--gradient-primary)' }}>
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-24 h-24 rounded-full opacity-10 bg-white -translate-x-8 -translate-y-8" />
        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white translate-x-10 translate-y-10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <GreetingIcon className="h-5 w-5 text-primary-foreground/80" />
            <span className="text-primary-foreground/70 text-sm">{greeting.text}</span>
          </div>
          <h2 className="text-xl font-bold text-primary-foreground mb-1">
            {selectedStudent.first_name} {selectedStudent.last_name}
          </h2>
          <div className="flex items-center gap-2 text-primary-foreground/60 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            <span>{todayStr}</span>
            {selectedStudent.class_name && (
              <>
                <span className="mx-1">·</span>
                <span>כיתה {selectedStudent.class_name}</span>
              </>
            )}
          </div>
          {!isLocked && (
            <button onClick={() => setSelectedStudentId('')} className="mt-2 text-primary-foreground/70 hover:text-primary-foreground text-xs underline">
              החלף תלמיד
            </button>
          )}
        </div>
      </div>


      {/* Year selector */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">שנת לימודים:</span>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="h-8 text-xs w-32 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Learning Style Questionnaire - only show if not completed */}
      {showLearningStyle && !learningStyleCompleted && (
        <LearningStyleQuestionnaire
          studentId={selectedStudentId}
          onComplete={() => {
            setLearningStyleCompleted(true);
            setShowLearningStyle(false);
          }}
        />
      )}

      {/* Daily Reminders */}
      <div className="card-styled rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--accent) / 0.12)' }}>
            <CalendarDays className="h-4 w-4 text-accent" />
          </div>
          <span className="font-semibold text-sm">תזכורות להיום</span>
        </div>
        <label className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow cursor-pointer group">
          <Checkbox
            checked={dailyChecks.regulation}
            onCheckedChange={(checked) => {
              const updated = { ...dailyChecks, regulation: !!checked };
              setDailyChecks(updated);
              const today = new Date().toISOString().split('T')[0];
              localStorage.setItem(`daily-checks-${today}`, JSON.stringify(updated));
            }}
          />
          <div className="flex items-center gap-2 flex-1">
            <Heart className="h-4 w-4 text-destructive/60" />
            <span className="text-sm font-medium group-hover:text-foreground transition-colors">תרגול מיומנויות ויסות רגשי</span>
          </div>
          {dailyChecks.regulation && <Badge variant="default" className="text-[10px] px-2 py-0 rounded-full bg-primary/80">בוצע ✓</Badge>}
        </label>
        <label className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow cursor-pointer group">
          <Checkbox
            checked={dailyChecks.brain}
            onCheckedChange={(checked) => {
              const updated = { ...dailyChecks, brain: !!checked };
              setDailyChecks(updated);
              const today = new Date().toISOString().split('T')[0];
              localStorage.setItem(`daily-checks-${today}`, JSON.stringify(updated));
            }}
          />
          <div className="flex items-center gap-2 flex-1">
            <Brain className="h-4 w-4 text-primary/60" />
            <span className="text-sm font-medium group-hover:text-foreground transition-colors">תרגול אימוני מוח</span>
          </div>
          {dailyChecks.brain && <Badge variant="default" className="text-[10px] px-2 py-0 rounded-full bg-primary/80">בוצע ✓</Badge>}
        </label>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // Switch to the reset/calm zone tab
            const resetTab = document.querySelector('[data-value="reset"]') as HTMLButtonElement | null;
            if (resetTab) resetTab.click();
          }}
          className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2 flex-1">
            <Leaf className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent group-hover:text-accent/80 transition-colors">מעבר לאזור ההרגעה 🧘</span>
          </div>
        </a>
      </div>

      {/* היום שלי - Daily Reflection */}
      <div className="card-styled rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Smile className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">היום שלי</span>
          {reflectionSaved && <Badge variant="secondary" className="text-[10px] px-2 py-0 rounded-full mr-auto">נשמר ✓</Badge>}
        </div>
        {[
          { key: 'class_presence', label: 'נוכחות בכיתה', emoji: '🏫', descriptions: ['לא הייתי', 'הייתי קצת', 'הייתי חצי מהזמן', 'הייתי רוב הזמן', 'הייתי כל הזמן'] },
          { key: 'behavior', label: 'התנהגות', emoji: '⭐', descriptions: ['קשה מאוד', 'קשה', 'בסדר', 'טוב', 'מצוין'] },
          { key: 'social_interaction', label: 'אינטראקציה חברתית', emoji: '🤝', descriptions: ['לא דיברתי עם אף אחד', 'דיברתי מעט', 'הייתי בקשר עם חברים', 'שיתפתי פעולה טוב', 'יזמתי ועזרתי לאחרים'] },
          { key: 'academic_tasks', label: 'משימות לימודיות', emoji: '📚', descriptions: ['לא עשיתי כלום', 'עשיתי מעט', 'עשיתי חלק', 'עשיתי רוב המשימות', 'השלמתי הכל'] },
        ].map(item => {
          const currentVal = dailyReflection[item.key as keyof typeof dailyReflection];
          return (
            <div key={item.key} className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/80">{item.emoji} {item.label}</span>
                <span className="text-[10px] text-muted-foreground font-medium bg-background px-2 py-0.5 rounded-full">
                  {item.descriptions[currentVal - 1]}
                </span>
              </div>
              <TooltipProvider delayDuration={0}>
                <div className="flex gap-2 justify-center py-1">
                  {[1, 2, 3, 4, 5].map(star => {
                    const isFilled = star <= currentVal;
                    return (
                      <Tooltip key={star}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            disabled={reflectionSaved}
                            onClick={() => setDailyReflection(prev => ({ ...prev, [item.key]: star }))}
                            className="p-0.5 transition-all duration-200 hover:scale-110 disabled:opacity-60 disabled:hover:scale-100"
                          >
                            <Star
                              className={`h-6 w-6 transition-all duration-200 ${
                                isFilled
                                  ? 'fill-primary/80 text-primary drop-shadow-sm'
                                  : 'fill-none text-border hover:text-primary/30'
                              }`}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[11px] max-w-[160px] text-center font-medium">
                          {item.descriptions[star - 1]}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          );
        })}
        {!reflectionSaved && (
          <Button
            size="sm"
            className="w-full btn-primary-gradient text-primary-foreground rounded-lg h-9"
            disabled={reflectionSaving}
            onClick={async () => {
              if (!selectedStudentId || !selectedStudent) return;
              setReflectionSaving(true);
              const { error } = await supabase.from('daily_reflections').insert({
                student_id: selectedStudentId,
                student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
                ...dailyReflection,
              });
              setReflectionSaving(false);
              if (error) { toast.error('שגיאה בשמירה'); return; }
              setReflectionSaved(true);
              toast.success('היום שלי נשמר בהצלחה!');
            }}
          >
            {reflectionSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור את היום שלי'}
          </Button>
        )}
      </div>

      {/* Student Insights - Free text */}
      <div className="card-styled rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <PenLine className="h-4 w-4 text-accent" />
          </div>
          <span className="font-semibold text-sm">תובנות שלי על היום</span>
        </div>
        <Textarea
          value={insightText}
          onChange={(e) => setInsightText(e.target.value)}
          placeholder="כתוב/י כאן מה עבר עליך היום, מה למדת על עצמך, מה הרגשת..."
          className="min-h-[100px] rounded-xl border-muted text-sm resize-none"
          disabled={insightSaved}
        />
        {!insightSaved ? (
          <Button
            size="sm"
            className="w-full btn-primary-gradient text-primary-foreground rounded-lg h-9"
            disabled={insightSaving || !insightText.trim()}
            onClick={async () => {
              if (!selectedStudentId || !selectedStudent) return;
              setInsightSaving(true);
              const { error } = await (supabase.from as any)('student_insights').insert({
                student_id: selectedStudentId,
                content: insightText.trim(),
              });
              setInsightSaving(false);
              if (error) { toast.error('שגיאה בשמירה'); return; }
              setInsightSaved(true);
              toast.success('התובנה נשמרה!');
            }}
          >
            {insightSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור תובנה'}
          </Button>
        ) : (
          <p className="text-xs text-center text-muted-foreground">✓ התובנה נשמרה להיום</p>
        )}
      </div>

      {/* AI Summary Section */}
      {reports.length > 0 && (
        <div className="card-styled rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center" style={{ background: 'hsl(var(--accent) / 0.12)' }}>
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <span className="font-semibold text-sm">סיכום יומי חכם</span>
            </div>
            <Button
              onClick={generateSummary}
              disabled={summaryLoading}
              size="sm"
              className="gap-1.5 btn-primary-gradient text-primary-foreground text-xs rounded-lg h-8 px-3"
            >
              {summaryLoading ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> מכין...</>
              ) : (
                <>צור סיכום</>
              )}
            </Button>
          </div>
          {dailySummary && (
            <div className="rounded-xl p-3.5 border bg-muted/30">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{dailySummary}</p>
            </div>
          )}
        </div>
      )}

      {/* Today's Reports */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="הדיווחים שלי — היום" icon={FileText} count={reports.length} sectionKey="reports" color="bg-primary" />
        {expandedSections.reports && (
          <div className="px-3 pb-3 space-y-2">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">עדיין אין דיווחים להיום</p>
                <p className="text-xs text-muted-foreground/60 mt-1">הדיווחים יופיעו כאן במהלך היום</p>
              </div>
            ) : (
              reports.map(r => (
                <div key={r.id} className="p-3.5 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center mb-2.5">
                    <p className="font-bold text-sm">{r.lesson_subject}</p>
                    <span className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-0.5">
                      {new Date(r.report_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs rounded-md">
                      {ATTENDANCE_LABELS[r.attendance]}
                    </Badge>
                    {r.behavior_types?.map(b => (
                      <Badge key={b} variant={b === 'respectful' ? 'default' : 'destructive'} className="text-xs rounded-md">
                        {BEHAVIOR_LABELS[b]}
                      </Badge>
                    ))}
                    {r.participation?.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs rounded-md">
                        {PARTICIPATION_LABELS[p]}
                      </Badge>
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg px-3 py-2 border leading-relaxed">
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
        <SectionHeader title="הציונים שלי" icon={GraduationCap} count={grades.length} sectionKey="grades" color="bg-accent" />
        {expandedSections.grades && (
          <div className="px-3 pb-3 space-y-1.5">
            {grades.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">אין ציונים עדיין</p>
              </div>
            ) : (
              grades.map(g => (
                <div key={g.id} className="p-3 rounded-xl border bg-card flex items-center justify-between hover:shadow-sm transition-shadow">
                  <div>
                    <span className="font-medium text-sm">{g.subject}</span>
                    <span className="text-[10px] text-muted-foreground mr-1.5">
                      {SEMESTER_LABELS[g.semester] || g.semester}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.grade !== null && (
                      <div className="w-16">
                        <Progress value={g.grade} className="h-1.5 rounded-full" />
                      </div>
                    )}
                    <Badge variant="default" className="text-sm px-3 py-0.5 rounded-lg min-w-[40px] text-center">
                      {g.grade ?? '—'}
                    </Badge>
                  </div>
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
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">אין יעדים פדגוגיים עדיין</p>
              </div>
            ) : (
              pedagogyGoals.map((g: any) => (
                <div key={g.id} className="p-3 rounded-xl border bg-card space-y-1.5 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{managedSubjects[g.subject_id] || 'מקצוע'}{g.sub_subject ? ` (${g.sub_subject})` : ''}</span>
                    <Badge variant="secondary" className="text-xs rounded-md">{g.month}</Badge>
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
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">אין מבחנים קרובים</p>
              </div>
            ) : (
              examSchedule.map((e: any) => (
                <div key={e.id} className="p-3 rounded-xl border bg-card flex items-center justify-between hover:shadow-sm transition-shadow">
                  <div>
                    <span className="font-medium text-sm">{managedSubjects[e.subject_id] || 'מקצוע'}{e.sub_subject ? ` (${e.sub_subject})` : ''}</span>
                    {e.exam_description && <span className="text-xs text-muted-foreground mr-2">- {e.exam_description}</span>}
                  </div>
                  <Badge variant="outline" className="text-xs rounded-md">
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
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <HeartHandshake className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">אין תכנית תמיכה מוגדרת</p>
              </div>
            ) : (
              assignments.map((a: any) => (
                <div key={a.id} className="p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-medium text-sm">{a.staff_members?.name || 'לא ידוע'}</span>
                    <Badge variant="outline" className="text-xs rounded-md">{a.frequency === 'daily' ? 'יומי' : 'שבועי'}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(a.support_types || []).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0 rounded-md">
                        {SUPPORT_LABELS[t] || t}
                      </Badge>
                    ))}
                  </div>
                  {a.support_description && (
                    <p className="text-xs text-foreground/80 mt-1.5">📝 {a.support_description}</p>
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
    </div>
  );
}
