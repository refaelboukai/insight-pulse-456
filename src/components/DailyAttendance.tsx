import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ABSENCE_REASON_LABELS } from '@/lib/constants';
import { CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];

interface AttendanceRecord {
  student_id: string;
  is_present: boolean;
  absence_reason: string | null;
}

interface DailyAttendanceProps {
  onAttendanceChange?: (absentStudentIds: Set<string>) => void;
}

const CLASS_OPTIONS = ['טלי', 'עדן'];

export default function DailyAttendance({ onAttendanceChange }: DailyAttendanceProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [studentsRes, attendanceRes] = await Promise.all([
      supabase.from('students').select('*').eq('is_active', true).order('last_name'),
      supabase.from('daily_attendance').select('*').eq('attendance_date', today),
    ]);

    if (studentsRes.data) setStudents(studentsRes.data);

    const map = new Map<string, AttendanceRecord>();
    if (attendanceRes.data) {
      attendanceRes.data.forEach((r: any) => {
        map.set(r.student_id, {
          student_id: r.student_id,
          is_present: r.is_present,
          absence_reason: r.absence_reason,
        });
      });
    }
    setAttendance(map);
    notifyAbsent(map);
    setLoading(false);
  };

  const notifyAbsent = (map: Map<string, AttendanceRecord>) => {
    const absentIds = new Set<string>();
    map.forEach((rec, id) => {
      if (!rec.is_present) absentIds.add(id);
    });
    onAttendanceChange?.(absentIds);
  };

  const togglePresence = async (studentId: string) => {
    if (!user) return;
    const current = attendance.get(studentId);
    const wasPresent = current?.is_present ?? true;
    const newPresent = !wasPresent;

    const newMap = new Map(attendance);
    newMap.set(studentId, {
      student_id: studentId,
      is_present: newPresent,
      absence_reason: newPresent ? null : current?.absence_reason ?? null,
    });
    setAttendance(newMap);
    notifyAbsent(newMap);

    const { error } = await supabase.from('daily_attendance').upsert({
      student_id: studentId,
      attendance_date: today,
      is_present: newPresent,
      absence_reason: newPresent ? null : (current?.absence_reason as any) ?? null,
      recorded_by: user.id,
    }, { onConflict: 'student_id,attendance_date' });

    if (error) {
      toast.error('שגיאה בשמירת נוכחות');
      console.error(error);
    }
  };

  const setAbsenceReason = async (studentId: string, reason: string) => {
    if (!user) return;
    const newMap = new Map(attendance);
    newMap.set(studentId, {
      student_id: studentId,
      is_present: false,
      absence_reason: reason,
    });
    setAttendance(newMap);

    const { error } = await supabase.from('daily_attendance').upsert({
      student_id: studentId,
      attendance_date: today,
      is_present: false,
      absence_reason: reason as any,
      recorded_by: user.id,
    }, { onConflict: 'student_id,attendance_date' });

    if (error) {
      toast.error('שגיאה בשמירת סיבת היעדרות');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const presentCount = students.filter(s => {
    const rec = attendance.get(s.id);
    return !rec || rec.is_present;
  }).length;

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-primary/10 border border-primary/20">
        <p className="text-sm font-semibold text-primary">
          📅 ביקור סדיר · {new Date().toLocaleDateString('he-IL')}
        </p>
        <Badge variant="secondary" className="text-sm px-3">
          {presentCount}/{students.length} נוכחים
        </Badge>
      </div>

      {CLASS_OPTIONS.map(cls => {
        const classStudents = students.filter(s => s.class_name === cls);
        if (classStudents.length === 0) return null;
        const classPresentCount = classStudents.filter(s => {
          const rec = attendance.get(s.id);
          return !rec || rec.is_present;
        }).length;
        const classAbsent = classStudents.filter(s => {
          const rec = attendance.get(s.id);
          return rec && !rec.is_present;
        });

        return (
          <div key={cls} className="card-styled rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold text-foreground">הכיתה של {cls}</p>
              <Badge variant="secondary" className="text-xs px-2.5">
                {classPresentCount}/{classStudents.length} נוכחים
              </Badge>
            </div>
            <div className="space-y-2">
              {classStudents.map(s => {
                const rec = attendance.get(s.id);
                const isPresent = !rec || rec.is_present;
                const isAbsent = rec && !rec.is_present;

                return (
                  <div key={s.id}>
                    <button
                      onClick={() => togglePresence(s.id)}
                      className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl border-2 transition-all ${
                        isPresent
                          ? 'border-success/30 bg-success/5 text-foreground'
                          : 'border-destructive/30 bg-destructive/5 text-muted-foreground'
                      }`}
                    >
                      <span className="font-medium text-sm">
                        {s.first_name} {s.last_name}
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs ${
                        isPresent ? 'text-success' : 'text-destructive'
                      }`}>
                        {isPresent ? (
                          <><CheckCircle2 className="h-4 w-4" /> הגיע לבית הספר</>
                        ) : (
                          <><XCircle className="h-4 w-4" /> לא הגיע לבית הספר</>
                        )}
                      </span>
                    </button>

                    {isAbsent && (
                      <div className="mt-1.5 mr-3 flex flex-wrap gap-1.5 animate-fade-in">
                        {Object.entries(ABSENCE_REASON_LABELS).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => setAbsenceReason(s.id, key)}
                            className={`text-xs py-1.5 px-2.5 rounded-full border transition-colors ${
                              rec?.absence_reason === key
                                ? 'bg-destructive/15 border-destructive/40 text-destructive font-medium'
                                : 'border-border bg-card hover:border-destructive/30 text-muted-foreground'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Class absence summary */}
            {classAbsent.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <ClipboardCheck className="h-3.5 w-3.5 text-destructive" />
                  <p className="text-xs font-semibold text-destructive">
                    סיכום חסרים — הכיתה של {cls}
                  </p>
                </div>
                <div className="space-y-1">
                  {classAbsent.map(s => {
                    const rec = attendance.get(s.id);
                    const reason = rec?.absence_reason 
                      ? ABSENCE_REASON_LABELS[rec.absence_reason] || rec.absence_reason
                      : 'לא צוינה סיבה';
                    return (
                      <div key={s.id} className="flex items-center justify-between text-xs bg-destructive/5 rounded-lg px-3 py-1.5">
                        <span className="font-medium">{s.first_name} {s.last_name}</span>
                        <Badge variant="outline" className="text-[10px] px-2">
                          {reason}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
