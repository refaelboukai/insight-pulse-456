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
import { CalendarIcon, CheckCircle2, Clock, XCircle, FileText, ClipboardCheck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

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

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    if (student && open) {
      fetchStudentData();
    }
  }, [student, open, dateStr]);

  const fetchStudentData = async () => {
    if (!student) return;
    setLoading(true);

    const [reportsRes, attendanceRes] = await Promise.all([
      supabase.from('lesson_reports')
        .select('*')
        .eq('student_id', student.id)
        .eq('report_date', dateStr)
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

        {/* Date selector */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {quickDays.map((d, i) => {
              const dStr = format(d, 'yyyy-MM-dd');
              const isActive = dateStr === dStr;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  className={`text-xs py-1.5 px-3 rounded-full border transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  {i === 0 ? 'היום' : i === 1 ? 'אתמול' : format(d, 'dd/MM', { locale: he })}
                </button>
              );
            })}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-full">
                  <CalendarIcon className="h-3 w-3" />
                  תאריך אחר
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  disabled={(d) => d > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <p className="text-xs text-muted-foreground">
            📅 {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
          </p>
        </div>

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
                        {r.participation && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {PARTICIPATION_LABELS[r.participation]}
                          </Badge>
                        )}
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
