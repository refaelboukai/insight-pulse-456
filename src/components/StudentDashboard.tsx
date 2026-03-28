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
import { FileText, GraduationCap, HeartHandshake, ChevronDown, ChevronUp, ChevronLeft, Loader2, Sparkles, BookOpen, CalendarDays, Sun, Moon, CloudSun, Calendar, Heart, Brain, PenLine, Leaf, Smile, Star, Pin, PinOff, MessageSquareText } from 'lucide-react';
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
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [pinnedPanels, setPinnedPanels] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('student-pinned-panels');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const togglePin = (key: string) => {
    setPinnedPanels(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem('student-pinned-panels', JSON.stringify([...next]));
      return next;
    });
  };
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
  const [weeklySummaries, setWeeklySummaries] = useState<any[]>([]);

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
      // Load weekly summaries
      const { data: summariesData } = await supabase
        .from('weekly_summaries' as any)
        .select('*')
        .eq('student_id', selectedStudentId)
        .order('week_start', { ascending: false })
        .limit(4);
      setWeeklySummaries(summariesData || []);
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
          <p className="text-muted-foreground text-sm">לא נמצא חשבון משויך.</p>
          <p className="text-muted-foreground text-xs mt-1">יש לפנות למנהל המערכת.</p>
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

  // ===== PANEL RENDERERS =====
  const renderBackButton = () => (
    <button onClick={() => setActivePanel(null)}
      className="flex items-center gap-1.5 text-sm font-medium text-primary mb-3 hover:underline">
      <ChevronLeft className="h-4 w-4" /> חזרה לתפריט
    </button>
  );

  const renderRemindersPanel = () => (
    <div className="space-y-3">
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
          <span className="text-sm font-medium">תרגול מיומנויות ויסות רגשי</span>
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
          <span className="text-sm font-medium">תרגול אימוני מוח</span>
        </div>
        {dailyChecks.brain && <Badge variant="default" className="text-[10px] px-2 py-0 rounded-full bg-primary/80">בוצע ✓</Badge>}
      </label>
      {/* Upcoming exam reminders */}
      {examSchedule.filter(e => {
        const examDate = new Date(e.exam_date);
        const today = new Date(); today.setHours(0,0,0,0);
        const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000*60*60*24));
        return daysUntil >= 0 && daysUntil <= 7;
      }).map((e: any) => {
        const examDate = new Date(e.exam_date);
        const today = new Date(); today.setHours(0,0,0,0);
        const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000*60*60*24));
        const isToday = daysUntil === 0;
        const isTomorrow = daysUntil === 1;
        const dayLabel = isToday ? 'היום!' : isTomorrow ? 'מחר' : `בעוד ${daysUntil} ימים`;
        return (
          <div key={e.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isToday ? 'border-destructive/40 bg-destructive/5' : 'border-accent/30 bg-accent/5'}`}>
            <div className="flex items-center gap-2 flex-1">
              <GraduationCap className={`h-4 w-4 ${isToday ? 'text-destructive' : 'text-accent'}`} />
              <div className="flex-1">
                <span className="text-sm font-medium">{managedSubjects[e.subject_id] || 'מקצוע'}{e.sub_subject ? ` (${e.sub_subject})` : ''}</span>
                {e.exam_description && <span className="text-xs text-muted-foreground mr-1.5">- {e.exam_description}</span>}
              </div>
            </div>
            <Badge variant={isToday ? 'destructive' : 'secondary'} className="text-xs rounded-md">📝 {dayLabel}</Badge>
          </div>
        );
      })}
    </div>
  );

  const renderReflectionPanel = () => (
    <div className="space-y-5">
      {reflectionSaved ? (
        <div className="rounded-xl p-5 space-y-4 animate-scale-in border border-primary/20 bg-primary/5">
          <p className="text-base font-medium text-foreground text-center">
            {(() => {
              const avg = (dailyReflection.class_presence + dailyReflection.behavior + dailyReflection.social_interaction + dailyReflection.academic_tasks) / 4;
              if (avg >= 4.5) return 'יום חזק — כל הכבוד.';
              if (avg >= 3.5) return 'יום טוב. תמשיך ככה.';
              if (avg >= 2.5) return 'יום סביר. מחר הזדמנות חדשה.';
              return 'לא היום הכי קל — זה בסדר, מחר מתחילים מחדש.';
            })()}
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {[{ key: 'class_presence', label: 'נוכחות' }, { key: 'behavior', label: 'התנהגות' }, { key: 'social_interaction', label: 'חברתי' }, { key: 'academic_tasks', label: 'לימודים' }].map(item => (
              <div key={item.key} className="text-center rounded-xl bg-background/60 p-2.5">
                <span className="text-xs text-muted-foreground block mb-0.5">{item.label}</span>
                <span className="font-bold text-base text-foreground">{dailyReflection[item.key as keyof typeof dailyReflection]}/5</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {[
            { key: 'class_presence', label: 'נוכחות', descriptions: ['לא הייתי', 'הייתי קצת', 'חצי מהזמן', 'רוב הזמן', 'כל הזמן'] },
            { key: 'behavior', label: 'התנהגות', descriptions: ['קשה מאוד', 'קשה', 'בסדר', 'טוב', 'מצוין'] },
            { key: 'social_interaction', label: 'חברתי', descriptions: ['לבד', 'מעט קשר', 'הייתי בקשר', 'שיתפתי פעולה', 'יזמתי ועזרתי'] },
            { key: 'academic_tasks', label: 'לימודים', descriptions: ['לא עשיתי', 'עשיתי מעט', 'עשיתי חלק', 'רוב המשימות', 'הכל'] },
          ].map(item => {
            const currentVal = dailyReflection[item.key as keyof typeof dailyReflection];
            return (
              <div key={item.key} className="rounded-xl border border-border/40 bg-muted/15 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-full">{item.descriptions[currentVal - 1]}</span>
                </div>
                <div className="flex gap-1.5 bg-muted/30 rounded-xl p-1.5">
                  {[1,2,3,4,5].map(val => (
                    <button key={val} type="button" onClick={() => setDailyReflection(prev => ({ ...prev, [item.key]: val }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 ${val === currentVal ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}>
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <Button className="w-full btn-primary-gradient text-primary-foreground rounded-xl h-11 text-sm font-bold" disabled={reflectionSaving}
            onClick={async () => {
              if (!selectedStudentId || !selectedStudent) return;
              setReflectionSaving(true);
              const { error } = await supabase.from('daily_reflections').insert({ student_id: selectedStudentId, student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`, ...dailyReflection });
              setReflectionSaving(false);
              if (error) { toast.error('שגיאה בשמירה'); return; }
              setReflectionSaved(true);
              toast.success('נשמר בהצלחה');
            }}>
            {reflectionSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור'}
          </Button>
        </>
      )}

      {/* Insights section integrated into reflection */}
      <div className="border-t border-border/40 pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold">תובנות שלי על היום</span>
        </div>
        <Textarea value={insightText} onChange={(e) => setInsightText(e.target.value)}
          placeholder={`${terms.write} כאן מה עבר עליך היום, מה למדת על עצמך, מה הרגשת...`}
          className="min-h-[100px] rounded-xl border-muted text-sm resize-none" disabled={insightSaved} />
        {!insightSaved ? (
          <Button size="sm" className="w-full btn-primary-gradient text-primary-foreground rounded-lg h-9" disabled={insightSaving || !insightText.trim()}
            onClick={async () => {
              if (!selectedStudentId || !selectedStudent) return;
              setInsightSaving(true);
              const { error } = await (supabase.from as any)('student_insights').insert({ student_id: selectedStudentId, content: insightText.trim() });
              setInsightSaving(false);
              if (error) { toast.error('שגיאה בשמירה'); return; }
              setInsightSaved(true);
              toast.success('התובנה נשמרה!');
            }}>
            {insightSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור תובנה'}
          </Button>
        ) : (
          <p className="text-xs text-center text-muted-foreground">✓ התובנה נשמרה להיום</p>
        )}
      </div>
    </div>
  );

  const renderInsightsPanel = () => (
    <div className="space-y-3">
      <Textarea value={insightText} onChange={(e) => setInsightText(e.target.value)}
        placeholder={`${terms.write} כאן מה עבר עליך היום, מה למדת על עצמך, מה הרגשת...`}
        className="min-h-[100px] rounded-xl border-muted text-sm resize-none" disabled={insightSaved} />
      {!insightSaved ? (
        <Button size="sm" className="w-full btn-primary-gradient text-primary-foreground rounded-lg h-9" disabled={insightSaving || !insightText.trim()}
          onClick={async () => {
            if (!selectedStudentId || !selectedStudent) return;
            setInsightSaving(true);
            const { error } = await (supabase.from as any)('student_insights').insert({ student_id: selectedStudentId, content: insightText.trim() });
            setInsightSaving(false);
            if (error) { toast.error('שגיאה בשמירה'); return; }
            setInsightSaved(true);
            toast.success('התובנה נשמרה!');
          }}>
          {insightSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור תובנה'}
        </Button>
      ) : (
        <p className="text-xs text-center text-muted-foreground">✓ התובנה נשמרה להיום</p>
      )}
    </div>
  );

  const renderReportsPanel = () => (
    <div className="space-y-2">
      {reports.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><FileText className="h-5 w-5 text-muted-foreground" /></div>
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
              <Badge variant="outline" className="text-xs rounded-md">{ATTENDANCE_LABELS[r.attendance]}</Badge>
              {r.behavior_types?.map(b => <Badge key={b} variant={b === 'respectful' ? 'default' : 'destructive'} className="text-xs rounded-md">{BEHAVIOR_LABELS[b]}</Badge>)}
              {r.participation?.map(p => <Badge key={p} variant="secondary" className="text-xs rounded-md">{PARTICIPATION_LABELS[p]}</Badge>)}
            </div>
            {r.comment && <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg px-3 py-2 border leading-relaxed">{r.comment}</p>}
          </div>
        ))
      )}
      {/* AI Summary */}
      {reports.length > 0 && (
        <div className="mt-3 p-3 rounded-xl border bg-muted/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-accent" /> סיכום יומי חכם</span>
            <Button onClick={generateSummary} disabled={summaryLoading} size="sm" className="gap-1 text-[10px] h-7 px-2.5 rounded-lg">
              {summaryLoading ? <><Loader2 className="h-3 w-3 animate-spin" /> מכין...</> : 'צור סיכום'}
            </Button>
          </div>
          {dailySummary && <p className="text-sm leading-relaxed text-foreground whitespace-pre-line rounded-lg border bg-card p-3">{dailySummary}</p>}
        </div>
      )}
    </div>
  );

  const renderGradesPanel = () => (
    <div className="space-y-1.5">
      {grades.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><GraduationCap className="h-5 w-5 text-muted-foreground" /></div>
          <p className="text-sm text-muted-foreground">אין ציונים עדיין</p>
        </div>
      ) : (
        grades.map(g => (
          <div key={g.id} className="p-3 rounded-xl border bg-card flex items-center justify-between hover:shadow-sm transition-shadow">
            <div>
              <span className="font-medium text-sm">{g.subject}</span>
              <span className="text-[10px] text-muted-foreground mr-1.5">{SEMESTER_LABELS[g.semester] || g.semester}</span>
            </div>
            <div className="flex items-center gap-2">
              {g.grade !== null && <div className="w-16"><Progress value={g.grade} className="h-1.5 rounded-full" /></div>}
              <Badge variant="default" className="text-sm px-3 py-0.5 rounded-lg min-w-[40px] text-center">{g.grade ?? '—'}</Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPedagogyPanel = () => (
    <div className="space-y-1.5">
      {pedagogyGoals.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><BookOpen className="h-5 w-5 text-muted-foreground" /></div>
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
  );

  const renderExamsPanel = () => (
    <div className="space-y-1.5">
      {examSchedule.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><CalendarDays className="h-5 w-5 text-muted-foreground" /></div>
          <p className="text-sm text-muted-foreground">אין מבחנים קרובים</p>
        </div>
      ) : (
        examSchedule.map((e: any) => (
          <div key={e.id} className="p-3 rounded-xl border bg-card flex items-center justify-between hover:shadow-sm transition-shadow">
            <div>
              <span className="font-medium text-sm">{managedSubjects[e.subject_id] || 'מקצוע'}{e.sub_subject ? ` (${e.sub_subject})` : ''}</span>
              {e.exam_description && <span className="text-xs text-muted-foreground mr-2">- {e.exam_description}</span>}
            </div>
            <Badge variant="outline" className="text-xs rounded-md">{new Date(e.exam_date).toLocaleDateString('he-IL')}</Badge>
          </div>
        ))
      )}
    </div>
  );

  const renderSupportPanel = () => (
    <div className="space-y-1.5">
      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><HeartHandshake className="h-5 w-5 text-muted-foreground" /></div>
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
              {(a.support_types || []).map((t: string) => <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0 rounded-md">{SUPPORT_LABELS[t] || t}</Badge>)}
            </div>
            {a.support_description && <p className="text-xs text-foreground/80 mt-1.5">📝 {a.support_description}</p>}
            {a.target_date && <p className="text-xs text-muted-foreground mt-1">תאריך יעד: {new Date(a.target_date).toLocaleDateString('he-IL')}</p>}
          </div>
        ))
      )}
    </div>
  );

  const renderSchedulePanel = () => <StudentScheduleView studentId={selectedStudent.id} />;

  const renderWeeklySummaryPanel = () => (
    <div className="space-y-2">
      {weeklySummaries.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><MessageSquareText className="h-5 w-5 text-muted-foreground" /></div>
          <p className="text-sm text-muted-foreground">אין סיכומים שבועיים עדיין</p>
        </div>
      ) : (
        weeklySummaries.map((s: any) => (
          <div key={s.id} className="p-3 rounded-xl border bg-card space-y-1.5 hover:shadow-sm transition-shadow">
            <Badge variant="outline" className="text-xs rounded-md">
              שבוע {new Date(s.week_start).toLocaleDateString('he-IL')}
            </Badge>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{s.summary_text}</p>
          </div>
        ))
      )}
    </div>
  );

  // ===== CARD GRID DEFINITION =====
  type StudentCard = { key: string; icon: React.ElementType; label: string; value?: string | number; iconBg: string; iconColor: string };

  const studentCards: StudentCard[] = [
    { key: 'reflection', icon: Smile, label: 'היום שלי', iconBg: 'bg-primary/10', iconColor: 'text-primary', value: reflectionSaved ? '✓' : undefined },
    { key: 'reports', icon: FileText, label: 'דיווחים', value: reports.length, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { key: 'grades', icon: GraduationCap, label: 'ציונים', value: grades.length, iconBg: 'bg-[hsl(35,60%,90%)]', iconColor: 'text-[hsl(35,60%,30%)]' },
    { key: 'pedagogy', icon: BookOpen, label: 'יעדים פדגוגיים', value: pedagogyGoals.length, iconBg: 'bg-[hsl(270,40%,92%)]', iconColor: 'text-[hsl(270,40%,35%)]' },
    { key: 'exams', icon: CalendarDays, label: 'לוח מבחנים', value: examSchedule.length, iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
    { key: 'support', icon: HeartHandshake, label: 'תכנית תמיכה', value: assignments.length, iconBg: 'bg-[hsl(145,40%,90%)]', iconColor: 'text-[hsl(145,40%,30%)]' },
    { key: 'schedule', icon: Calendar, label: 'מערכת שעות', iconBg: 'bg-[hsl(220,45%,92%)]', iconColor: 'text-[hsl(220,45%,35%)]' },
    ...(weeklySummaries.length > 0 ? [{ key: 'weekly_summary', icon: MessageSquareText, label: 'סיכום מחנכות', value: weeklySummaries.length, iconBg: 'bg-[hsl(50,55%,90%)]', iconColor: 'text-[hsl(50,55%,30%)]' }] : []),
  ];

  // If a panel is open, render it
  if (activePanel) {
    const panelContent: Record<string, React.ReactNode> = {
      reminders: renderRemindersPanel(),
      reflection: renderReflectionPanel(),
      insights: renderInsightsPanel(),
      reports: renderReportsPanel(),
      grades: renderGradesPanel(),
      pedagogy: renderPedagogyPanel(),
      exams: renderExamsPanel(),
      support: renderSupportPanel(),
      schedule: renderSchedulePanel(),
      weekly_summary: renderWeeklySummaryPanel(),
    };
    const panelLabels: Record<string, string> = {
      reminders: 'תזכורות להיום', reflection: 'היום שלי', insights: 'תובנות שלי על היום',
      reports: 'הדיווחים שלי — היום', grades: 'הציונים שלי', pedagogy: 'יעדים פדגוגיים',
      exams: 'לוח מבחנים', support: 'תכנית התמיכה שלי', schedule: 'מערכת שעות',
      weekly_summary: 'סיכום שבועי מהמחנכת',
    };
    const currentCard = studentCards.find(c => c.key === activePanel);
    const isPinned = pinnedPanels.has(activePanel);
    return (
      <div className="space-y-2 max-w-2xl mx-auto animate-fade-in">
        {renderBackButton()}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            {currentCard && <currentCard.icon className={`h-4 w-4 ${currentCard.iconColor}`} />}
            {panelLabels[activePanel] || activePanel}
          </h3>
          <button onClick={() => togglePin(activePanel)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${isPinned ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'}`}>
            {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            {isPinned ? 'בטל נעיצה' : 'נעץ למסך הראשי'}
          </button>
        </div>
        <div className="rounded-2xl border bg-card p-4">{panelContent[activePanel]}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'var(--gradient-primary)' }}>
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
            {selectedStudent.class_name && <><span className="mx-1">·</span><span>כיתה {selectedStudent.class_name}</span></>}
          </div>
          {!isLocked && (
            <button onClick={() => setSelectedStudentId('')} className="mt-2 text-primary-foreground/70 hover:text-primary-foreground text-xs underline">
              {terms.switchStudent}
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

      {/* Learning Style Questionnaire */}
      {showLearningStyle && !learningStyleCompleted && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2">
            <span className="text-destructive text-xs font-bold">⚠️ שאלון זה ייעלם ממסך הכניסה לאחר המילוי — ניתן למלא פעם אחת בלבד.</span>
          </div>
          <LearningStyleQuestionnaire studentId={selectedStudentId} gender={gender} onComplete={() => { setLearningStyleCompleted(true); setShowLearningStyle(false); }} />
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {studentCards.map(card => (
          <button key={card.key} onClick={() => setActivePanel(card.key)}
            className={`relative rounded-2xl p-4 text-center border bg-card hover:shadow-md hover:border-primary/20 transition-all cursor-pointer active:scale-[0.97] ${pinnedPanels.has(card.key) ? 'ring-2 ring-primary/30' : ''}`}>
            {pinnedPanels.has(card.key) && <Pin className="absolute top-2 left-2 h-3 w-3 text-primary/50" />}
            <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${card.iconBg}`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            {card.value !== undefined && <p className="text-lg font-bold leading-tight">{card.value}</p>}
            <p className="text-sm font-bold text-foreground">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Pinned panels */}
      {pinnedPanels.size > 0 && (() => {
        const pinnedRenderers: Record<string, () => React.ReactNode> = {
          reminders: renderRemindersPanel, reflection: renderReflectionPanel,
          insights: renderInsightsPanel, reports: renderReportsPanel,
          grades: renderGradesPanel, pedagogy: renderPedagogyPanel,
          exams: renderExamsPanel, support: renderSupportPanel,
          schedule: renderSchedulePanel,
          weekly_summary: renderWeeklySummaryPanel,
        };
        const pinnedLabels: Record<string, string> = {
          reminders: 'תזכורות להיום', reflection: 'היום שלי', insights: 'תובנות שלי על היום',
          reports: 'הדיווחים שלי — היום', grades: 'הציונים שלי', pedagogy: 'יעדים פדגוגיים',
          exams: 'לוח מבחנים', support: 'תכנית התמיכה שלי', schedule: 'מערכת שעות',
          weekly_summary: 'סיכום שבועי מהמחנכת',
        };
        return [...pinnedPanels].map(key => {
          const card = studentCards.find(c => c.key === key);
          if (!card || !pinnedRenderers[key]) return null;
          return (
            <div key={key} className="rounded-2xl border bg-card p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                  {pinnedLabels[key]}
                </h3>
                <button onClick={() => togglePin(key)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors">
                  <PinOff className="h-3 w-3" />
                  בטל נעיצה
                </button>
              </div>
              {pinnedRenderers[key]()}
            </div>
          );
        });
      })()}
    </div>
  );
}