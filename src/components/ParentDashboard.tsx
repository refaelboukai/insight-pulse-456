import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS } from '@/lib/constants';
import { FileText, Calendar as CalendarIcon, BookOpen, Clock, CheckCircle2, XCircle, CalendarDays, MessageSquareText } from 'lucide-react';
import { format, startOfDay, subDays, startOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type DateFilter = 'today' | 'yesterday' | 'week' | 'custom';

export default function ParentDashboard() {
  const { lockedStudentId } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'exams'>('reports');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!lockedStudentId) return;
    fetchData();
  }, [lockedStudentId]);

  const fetchData = async () => {
    if (!lockedStudentId) return;
    setLoading(true);

    const [studentRes, reportsRes, examsRes, subjectsRes] = await Promise.all([
      (supabase.from('students') as any).select('*').eq('id', lockedStudentId).maybeSingle(),
      supabase.from('lesson_reports').select('*').eq('student_id', lockedStudentId).order('report_date', { ascending: false }).limit(200),
      supabase.from('exam_schedule').select('*').eq('student_id', lockedStudentId).gte('exam_date', new Date().toISOString().split('T')[0]).order('exam_date', { ascending: true }),
      supabase.from('managed_subjects').select('*'),
    ]);

    setStudent(studentRes.data);
    const showReports = studentRes.data?.parent_show_reports !== false;
    const showCalendar = studentRes.data?.parent_show_calendar !== false;
    setAllReports(showReports ? (reportsRes.data || []) : []);
    setExams(showCalendar ? (examsRes.data || []) : []);
    setSubjects(subjectsRes.data || []);
    if (!showReports && activeTab === 'reports') setActiveTab('exams');
    if (!showCalendar && activeTab === 'exams') setActiveTab('reports');
    setLoading(false);
  };

  const getSubjectName = (id: string) => subjects.find((s: any) => s.id === id)?.name || id;
  const showReports = student?.parent_show_reports !== false;
  const showCalendar = student?.parent_show_calendar !== false;

  // Filter reports by date
  const filteredReports = allReports.filter(r => {
    const reportDate = startOfDay(new Date(r.report_date));
    const today = startOfDay(new Date());

    switch (dateFilter) {
      case 'today':
        return reportDate.getTime() === today.getTime();
      case 'yesterday':
        return reportDate.getTime() === subDays(today, 1).getTime();
      case 'week': {
        const weekStart = startOfWeek(today, { weekStartsOn: 0 });
        return reportDate >= weekStart && reportDate <= today;
      }
      case 'custom':
        if (!customFrom && !customTo) return true;
        const from = customFrom ? startOfDay(customFrom) : new Date(0);
        const to = customTo ? startOfDay(customTo) : new Date(9999, 11, 31);
        return reportDate >= from && reportDate <= to;
      default:
        return true;
    }
  });

  // Build greeting with parent first names only (no family status)
  const getGreeting = () => {
    if (!student) return '';
    const names: string[] = [];
    if (student.mother_name) {
      const firstName = student.mother_name.trim().split(/\s+/)[0];
      names.push(firstName);
    }
    if (student.father_name) {
      const firstName = student.father_name.trim().split(/\s+/)[0];
      names.push(firstName);
    }
    if (names.length > 0) {
      return `שלום ${names.join(' ו')} 👋`;
    }
    return `שלום 👋`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-full bg-primary/30" />
          </div>
          <p className="text-muted-foreground text-sm">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  const attendanceIcon = (status: string) => {
    if (status === 'full') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (status === 'partial') return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  };

  const behaviorColor = (types: string[]) => {
    if (types.includes('violent')) return 'text-red-600';
    if (types.includes('disruptive')) return 'text-amber-600';
    if (types.includes('non_respectful')) return 'text-orange-500';
    return 'text-green-600';
  };

  const filterButtons: { key: DateFilter; label: string }[] = [
    { key: 'today', label: 'היום' },
    { key: 'yesterday', label: 'אתמול' },
    { key: 'week', label: 'השבוע' },
    { key: 'custom', label: 'טווח תאריכים' },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Welcome card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <h2 className="text-lg font-bold text-foreground">{getGreeting()}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            הנתונים של {student?.first_name} {student?.last_name} מתעדכנים בזמן אמת
          </p>
        </CardContent>
      </Card>

      {/* Tab buttons */}
      <div className="flex gap-2">
        {showReports && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 rounded-xl p-3 text-center border transition-all ${
              activeTab === 'reports' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card hover:shadow-sm'
            }`}
          >
            <FileText className={`h-5 w-5 mx-auto mb-1 ${activeTab === 'reports' ? '' : 'text-muted-foreground'}`} />
            <p className="text-xs font-bold">דיווחי שיעורים</p>
            <p className={`text-[10px] mt-0.5 ${activeTab === 'reports' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {allReports.length} דיווחים
            </p>
          </button>
        )}
        {showCalendar && (
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex-1 rounded-xl p-3 text-center border transition-all ${
              activeTab === 'exams' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card hover:shadow-sm'
            }`}
          >
            <CalendarIcon className={`h-5 w-5 mx-auto mb-1 ${activeTab === 'exams' ? '' : 'text-muted-foreground'}`} />
            <p className="text-xs font-bold">מבחנים קרובים</p>
            <p className={`text-[10px] mt-0.5 ${activeTab === 'exams' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {exams.length} מבחנים
            </p>
          </button>
        )}
      </div>

      {!showReports && !showCalendar && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">אין מידע זמין כרגע. הצוות החינוכי יפעיל את הנתונים בקרוב.</p>
          </CardContent>
        </Card>
      )}

      {/* Lesson Reports */}
      {activeTab === 'reports' && showReports && (
        <div className="space-y-3">
          {/* Date filter buttons */}
          <div className="flex flex-wrap gap-1.5">
            {filterButtons.map(fb => (
              <button
                key={fb.key}
                onClick={() => setDateFilter(fb.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  dateFilter === fb.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                {fb.label}
              </button>
            ))}
          </div>

          {/* Custom date range pickers */}
          {dateFilter === 'custom' && (
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs h-8 gap-1", !customFrom && "text-muted-foreground")}>
                    <CalendarDays className="h-3 w-3" />
                    {customFrom ? format(customFrom, 'dd/MM/yy') : 'מתאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">עד</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs h-8 gap-1", !customTo && "text-muted-foreground")}>
                    <CalendarDays className="h-3 w-3" />
                    {customTo ? format(customTo, 'dd/MM/yy') : 'עד תאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              {(customFrom || customTo) && (
                <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => { setCustomFrom(undefined); setCustomTo(undefined); }}>
                  נקה
                </Button>
              )}
            </div>
          )}

          {/* Reports count */}
          <p className="text-[10px] text-muted-foreground">
            {filteredReports.length === 0 ? 'אין דיווחים בתקופה זו' : `${filteredReports.length} דיווחים`}
          </p>

          {filteredReports.length === 0 ? (
            <Card><CardContent className="p-4 text-center text-muted-foreground text-sm">
              {dateFilter === 'today' ? 'אין דיווחים להיום' : dateFilter === 'yesterday' ? 'אין דיווחים מאתמול' : 'אין דיווחים בתקופה זו'}
            </CardContent></Card>
          ) : (
            filteredReports.map((r: any) => (
              <Card key={r.id} className="overflow-hidden">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-bold">{r.lesson_subject}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(r.report_date), 'dd/MM/yyyy', { locale: he })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <div className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-0.5">
                      {attendanceIcon(r.attendance)}
                      <span className="text-[10px]">{ATTENDANCE_LABELS[r.attendance] || r.attendance}</span>
                    </div>

                    {r.behavior_types?.map((bt: string) => (
                      <Badge key={bt} variant="outline" className={`text-[10px] ${behaviorColor(r.behavior_types)}`}>
                        {BEHAVIOR_LABELS[bt] || bt}
                      </Badge>
                    ))}

                    {r.participation?.map((p: string) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {PARTICIPATION_LABELS[p] || p}
                      </Badge>
                    ))}
                  </div>

                  {r.comment && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2 mt-1">
                      {r.comment}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Exams */}
      {activeTab === 'exams' && showCalendar && (
        <div className="space-y-2">
          {exams.length === 0 ? (
            <Card><CardContent className="p-4 text-center text-muted-foreground text-sm">אין מבחנים קרובים</CardContent></Card>
          ) : (
            exams.map((exam: any) => {
              const daysUntil = Math.ceil((new Date(exam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Card key={exam.id} className={daysUntil <= 3 ? 'border-amber-300 bg-amber-50/30' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-bold">{getSubjectName(exam.subject_id)}</span>
                        {exam.sub_subject && (
                          <Badge variant="secondary" className="text-[10px]">{exam.sub_subject}</Badge>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium">{format(new Date(exam.exam_date), 'dd/MM', { locale: he })}</p>
                        {daysUntil <= 7 && (
                          <p className={`text-[10px] ${daysUntil <= 3 ? 'text-amber-600 font-bold' : 'text-muted-foreground'}`}>
                            {daysUntil === 0 ? 'היום!' : daysUntil === 1 ? 'מחר' : `עוד ${daysUntil} ימים`}
                          </p>
                        )}
                      </div>
                    </div>
                    {exam.exam_description && (
                      <p className="text-xs text-muted-foreground mt-1.5">{exam.exam_description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
