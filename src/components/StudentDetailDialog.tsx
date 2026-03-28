import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS,
  VIOLENCE_LABELS, ABSENCE_REASON_LABELS,
} from '@/lib/constants';
import { CalendarIcon, CheckCircle2, Clock, XCircle, FileText, ClipboardCheck, Sparkles, Download, Loader2, Share2, Brain } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { g } from '@/lib/genderUtils';

type Report = Database['public']['Tables']['lesson_reports']['Row'];
type Student = Database['public']['Tables']['students']['Row'];

interface StudentDetailDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentDetailDialog({ student, open, onOpenChange }: StudentDetailDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reports, setReports] = useState<Report[]>([]);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [patterns, setPatterns] = useState<string | null>(null);
  const [generatingPatterns, setGeneratingPatterns] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'week' | '2weeks' | 'month' | 'all' | 'custom'>('all');
  const [customFromDate, setCustomFromDate] = useState<Date | undefined>(undefined);
  const [customToDate, setCustomToDate] = useState<Date | undefined>(undefined);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    if (student && open) {
      fetchStudentData();
      setAiSummary(null);
    }
  }, [student, open, dateStr]);

  const fetchStudentData = async () => {
    if (!student) return;
    setLoading(true);

    const [reportsRes, attendanceRes] = await Promise.all([
      supabase.from('lesson_reports')
        .select('*')
        .eq('student_id', student.id)
        .gte('report_date', `${dateStr}T00:00:00`)
        .lte('report_date', `${dateStr}T23:59:59`)
        .order('created_at', { ascending: false }),
      supabase.from('daily_attendance')
        .select('*')
        .eq('student_id', student.id)
        .eq('attendance_date', dateStr)
        .maybeSingle(),
    ]);

    setReports(reportsRes.data || []);
    setAttendanceRecord(attendanceRes.data);
    setLoading(false);
  };

  const generateAiSummary = async () => {
    if (!student) return;
    setGeneratingSummary(true);
    setAiSummary(null);

    try {
      // Calculate date filter based on period
      let fromDate: string | null = null;
      let toDate: string | null = null;
      const now = new Date();
      if (summaryPeriod === 'today') {
        fromDate = format(now, 'yyyy-MM-dd');
        toDate = format(now, 'yyyy-MM-dd');
      } else if (summaryPeriod === 'week') {
        const d = new Date(now); d.setDate(d.getDate() - 7);
        fromDate = format(d, 'yyyy-MM-dd');
      } else if (summaryPeriod === '2weeks') {
        const d = new Date(now); d.setDate(d.getDate() - 14);
        fromDate = format(d, 'yyyy-MM-dd');
      } else if (summaryPeriod === 'month') {
        const d = new Date(now); d.setMonth(d.getMonth() - 1);
        fromDate = format(d, 'yyyy-MM-dd');
      } else if (summaryPeriod === 'custom') {
        if (customFromDate) fromDate = format(customFromDate, 'yyyy-MM-dd');
        if (customToDate) toDate = format(customToDate, 'yyyy-MM-dd');
      }

      let reportsQuery = supabase.from('lesson_reports').select('*').eq('student_id', student.id).order('report_date', { ascending: false });
      let attendanceQuery = supabase.from('daily_attendance').select('*').eq('student_id', student.id).order('attendance_date', { ascending: false });
      let eventsQuery = supabase.from('exceptional_events').select('*').order('created_at', { ascending: false });

      if (fromDate) {
        reportsQuery = reportsQuery.gte('report_date', fromDate);
        attendanceQuery = attendanceQuery.gte('attendance_date', fromDate);
        eventsQuery = eventsQuery.gte('created_at', fromDate);
      }
      if (toDate) {
        reportsQuery = reportsQuery.lte('report_date', `${toDate}T23:59:59`);
        attendanceQuery = attendanceQuery.lte('attendance_date', toDate);
        eventsQuery = eventsQuery.lte('created_at', `${toDate}T23:59:59`);
      }

      const [allReports, allAttendance, allEvents] = await Promise.all([
        reportsQuery, attendanceQuery, eventsQuery,
      ]);

      const reportsData = (allReports.data || []).map(r => ({
        date: r.report_date,
        subject: r.lesson_subject,
        attendance: ATTENDANCE_LABELS[r.attendance],
        behaviors: r.behavior_types?.map(b => BEHAVIOR_LABELS[b]),
        participation: r.participation && r.participation.length > 0 ? r.participation.map(p => PARTICIPATION_LABELS[p]).join(', ') : null,
        violence: r.violence_subtypes?.map(v => VIOLENCE_LABELS[v]),
        comment: r.comment,
        severity: r.behavior_severity,
      }));

      const attendanceData = (allAttendance.data || []).map(a => ({
        date: a.attendance_date,
        present: a.is_present,
        reason: a.absence_reason ? ABSENCE_REASON_LABELS[a.absence_reason] : null,
      }));

      const { data, error } = await supabase.functions.invoke('student-summary', {
        body: {
          studentName: `${student.first_name} ${student.last_name}`,
          studentCode: student.student_code,
          className: student.class_name,
          grade: student.grade,
          period: summaryPeriod === 'today' ? 'היום' : summaryPeriod === 'week' ? 'שבוע אחרון' : summaryPeriod === '2weeks' ? 'שבועיים אחרונים' : summaryPeriod === 'month' ? 'חודש אחרון' : summaryPeriod === 'custom' ? `תאריכים מותאמים` : 'כל התקופה',
          reports: reportsData,
          attendance: attendanceData,
          events: allEvents.data || [],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiSummary(data.summary);
    } catch (e: any) {
      console.error('AI summary error:', e);
      toast.error('שגיאה ביצירת הסיכום');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const downloadSummary = async () => {
    if (!aiSummary || !student) return;
    const header = `סיכום ${g(student.gender, 'תלמיד', 'תלמידה')}: ${student.first_name} ${student.last_name}\nכיתה: ${student.class_name || 'לא ידוע'}\nתאריך הפקה: ${format(new Date(), 'dd/MM/yyyy', { locale: he })}\n${'='.repeat(50)}\n\n`;
    const { downloadBlob } = await import('@/lib/downloadFile');
    const blob = new Blob([header + aiSummary], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `סיכום_${student.first_name}_${student.last_name}_${format(new Date(), 'yyyy-MM-dd')}.txt`);
  };

  const shareSummary = async () => {
    if (!aiSummary || !student) return;
    const title = `סיכום תפקוד - ${student.first_name} ${student.last_name}`;
    const text = aiSummary;

    const { shareOrDownloadText } = await import('@/lib/downloadFile');
    await shareOrDownloadText(text, `סיכום_${student.first_name}_${student.last_name}.txt`, title);
    toast.info('הקובץ הורד בהצלחה');
  };

  const generatePatterns = async () => {
    if (!student) return;
    setGeneratingPatterns(true);
    setPatterns(null);
    try {
      const { data, error } = await supabase.functions.invoke('detect-patterns', {
        body: { studentId: student.id, studentName: `${student.first_name} ${student.last_name}` },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setPatterns(data.patterns);
    } catch (e) {
      toast.error('שגיאה בזיהוי דפוסים');
      console.error(e);
    } finally {
      setGeneratingPatterns(false);
    }
  };

  const quickDays = [0, 1, 2, 3, 4].map(d => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date;
  });

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {student.first_name} {student.last_name}
            <Badge variant="secondary" className="text-xs font-normal">
              הכיתה של {student.class_name}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Period Selection */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {([
              { key: 'today' as const, label: 'היום' },
              { key: 'week' as const, label: 'שבוע' },
              { key: '2weeks' as const, label: 'שבועיים' },
              { key: 'month' as const, label: 'חודש' },
              { key: 'all' as const, label: 'הכל' },
              { key: 'custom' as const, label: 'תאריך מותאם' },
            ]).map(p => (
              <button
                key={p.key}
                onClick={() => { setSummaryPeriod(p.key); setAiSummary(null); }}
                className={`text-xs py-1.5 px-3 rounded-full border transition-colors ${
                  summaryPeriod === p.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {summaryPeriod === 'custom' && (
            <div className="flex gap-2 items-center flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {customFromDate ? format(customFromDate, 'dd/MM/yyyy') : 'מתאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customFromDate}
                    onSelect={setCustomFromDate}
                    disabled={(d) => d > new Date()}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">עד</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {customToDate ? format(customToDate, 'dd/MM/yyyy') : 'עד תאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customToDate}
                    onSelect={setCustomToDate}
                    disabled={(d) => d > new Date()}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* AI Summary Button */}
        <div className="flex gap-2">
          <Button
            onClick={generateAiSummary}
            disabled={generatingSummary}
            size="sm"
            className="gap-1.5 flex-1"
          >
            {generatingSummary ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> מייצר סיכום...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> סיכום {summaryPeriod === 'today' ? 'יומי' : summaryPeriod === 'week' ? 'שבועי' : summaryPeriod === '2weeks' ? 'שבועיים' : summaryPeriod === 'month' ? 'חודשי' : summaryPeriod === 'custom' ? 'מותאם' : 'מלא'}</>
            )}
          </Button>
          {aiSummary && (
            <>
              <Button onClick={shareSummary} size="sm" variant="default" className="gap-1.5 bg-[#25D366] hover:bg-[#1da851] text-white">
                <Share2 className="h-3.5 w-3.5" /> שיתוף
              </Button>
              <Button onClick={downloadSummary} size="sm" variant="outline" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> הורדה
              </Button>
            </>
          )}
        </div>

        {/* AI Summary Display */}
        {aiSummary && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold text-primary">סיכום AI</p>
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {aiSummary}
            </div>
          </div>
        )}

        {/* Pattern Recognition */}
        <div className="flex gap-2">
          <Button onClick={generatePatterns} disabled={generatingPatterns} size="sm" variant="outline" className="gap-1.5 flex-1">
            {generatingPatterns ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> מנתח דפוסים...</>
            ) : (
              <><Brain className="h-3.5 w-3.5" /> זיהוי דפוסים (14 ימים)</>
            )}
          </Button>
        </div>
        {patterns && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="h-3.5 w-3.5 text-amber-600" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">דפוסים שזוהו</p>
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">{patterns}</div>
          </div>
        )}


        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Daily attendance */}
            <div className="rounded-xl border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold">ביקור סדיר</p>
              </div>
              {attendanceRecord ? (
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${
                    attendanceRecord.is_present ? 'text-success' : 'text-destructive'
                  }`}>
                    {attendanceRecord.is_present ? (
                      <><CheckCircle2 className="h-4 w-4" /> הגיע לבית הספר</>
                    ) : (
                      <><XCircle className="h-4 w-4" /> לא הגיע לבית הספר</>
                    )}
                  </span>
                  {!attendanceRecord.is_present && attendanceRecord.absence_reason && (
                    <Badge variant="outline" className="text-[10px]">
                      {ABSENCE_REASON_LABELS[attendanceRecord.absence_reason] || attendanceRecord.absence_reason}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">לא דווח</p>
              )}
            </div>

            {/* Reports */}
            <div className="rounded-xl border p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold">דיווחי שיעור</p>
                <Badge variant="secondary" className="text-[10px] mr-auto">{reports.length}</Badge>
              </div>

              {reports.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">אין דיווחים לתאריך זה</p>
              ) : (
                <div className="space-y-2">
                  {reports.map(r => (
                    <div key={r.id} className="p-2.5 rounded-lg bg-muted/50 border">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="font-medium text-xs">{r.lesson_subject}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {r.attendance === 'full' && <CheckCircle2 className="h-2.5 w-2.5 ml-0.5" />}
                          {r.attendance === 'partial' && <Clock className="h-2.5 w-2.5 ml-0.5" />}
                          {r.attendance === 'absent' && <XCircle className="h-2.5 w-2.5 ml-0.5" />}
                          {ATTENDANCE_LABELS[r.attendance]}
                        </Badge>
                        {r.behavior_types?.map(b => (
                          <Badge key={b} variant={b === 'violent' ? 'destructive' : 'outline'} className="text-[10px] px-1.5 py-0">
                            {BEHAVIOR_LABELS[b]}
                          </Badge>
                        ))}
                        {r.participation && r.participation.length > 0 && r.participation.map(p => (
                          <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {PARTICIPATION_LABELS[p]}
                          </Badge>
                        ))}
                        {r.violence_subtypes && r.violence_subtypes.length > 0 && (
                          r.violence_subtypes.map(v => (
                            <Badge key={v} variant="destructive" className="text-[10px] px-1.5 py-0">
                              {VIOLENCE_LABELS[v]}
                            </Badge>
                          ))
                        )}
                      </div>
                      {r.comment && (
                        <p className="text-[10px] text-muted-foreground mt-1.5 bg-card rounded px-2 py-1 border">
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
