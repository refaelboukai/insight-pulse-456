import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ABSENCE_REASON_LABELS } from '@/lib/constants';
import { CheckCircle2, XCircle, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const toggleClass = (cls: string) =>
    setExpandedClasses(prev => ({ ...prev, [cls]: !prev[cls] }));

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

    // If marking as absent, don't save yet — wait for reason
    if (!newPresent) {
      const newMap = new Map(attendance);
      newMap.set(studentId, {
        student_id: studentId,
        is_present: false,
        absence_reason: null, // will be required
      });
      setAttendance(newMap);
      notifyAbsent(newMap);
      return;
    }

    // Marking as present — save immediately
    const newMap = new Map(attendance);
    newMap.set(studentId, {
      student_id: studentId,
      is_present: true,
      absence_reason: null,
    });
    setAttendance(newMap);
    notifyAbsent(newMap);

    const { error } = await supabase.from('daily_attendance').upsert({
      student_id: studentId,
      attendance_date: today,
      is_present: true,
      absence_reason: null,
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
    } else {
      toast.success('סיבת היעדרות נשמרה');
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
        <p className="text-base font-bold text-primary">
          📅 ביקור סדיר · {new Date().toLocaleDateString('he-IL')}
        </p>
        <Badge variant="secondary" className="text-sm px-3 py-1">
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
        const isExpanded = expandedClasses[cls] ?? false;
        // Check if any absent student is missing a reason
        const missingReason = classAbsent.some(s => {
          const rec = attendance.get(s.id);
          return rec && !rec.is_present && !rec.absence_reason;
        });

        return (
          <div key={cls} className="card-styled rounded-2xl overflow-hidden">
            {/* Accordion header */}
            <button
              onClick={() => toggleClass(cls)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-bold text-primary">🏫 הכיתה של {cls}</span>
                <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                  {classPresentCount}/{classStudents.length}
                </Badge>
                {missingReason && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">חסרה סיבה!</Badge>
                )}
              </div>
              {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {classStudents.map(s => {
                  const rec = attendance.get(s.id);
                  const isPresent = !rec || rec.is_present;
                  const isAbsent = rec && !rec.is_present;
                  const needsReason = isAbsent && !rec?.absence_reason;

                  return (
                    <div key={s.id}>
                      <button
                        onClick={() => togglePresence(s.id)}
                        className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border-2 transition-all ${
                          isPresent
                            ? 'border-success/30 bg-success/5 text-foreground'
                            : needsReason
                              ? 'border-destructive/50 bg-destructive/10 text-foreground ring-2 ring-destructive/30'
                              : 'border-destructive/30 bg-destructive/5 text-muted-foreground'
                        }`}
                      >
                        <span className="font-semibold text-base">
                          {s.first_name} {s.last_name}
                        </span>
                        <span className={`flex items-center gap-1.5 text-sm font-medium ${
                          isPresent ? 'text-success' : 'text-destructive'
                        }`}>
                          {isPresent ? (
                            <><CheckCircle2 className="h-5 w-5" /> נוכח/ת</>
                          ) : (
                            <><XCircle className="h-5 w-5" /> חסר/ה</>
                          )}
                        </span>
                      </button>

                      {isAbsent && (
                        <div className="mt-2 mr-3 animate-fade-in">
                          <p className={`text-sm font-semibold mb-1.5 ${needsReason ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {needsReason ? '⚠️ חובה לבחור סיבת היעדרות:' : 'סיבת היעדרות:'}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(ABSENCE_REASON_LABELS).map(([key, label]) => (
                              <button
                                key={key}
                                onClick={() => setAbsenceReason(s.id, key)}
                                className={`text-sm py-2 px-3 rounded-full border transition-colors ${
                                  rec?.absence_reason === key
                                    ? 'bg-destructive/15 border-destructive/40 text-destructive font-semibold'
                                    : 'border-border bg-card hover:border-destructive/30 text-muted-foreground'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Class absence summary */}
                {classAbsent.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClipboardCheck className="h-4 w-4 text-destructive" />
                      <p className="text-sm font-bold text-destructive">
                        סיכום חסרים — הכיתה של {cls}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {classAbsent.map(s => {
                        const rec = attendance.get(s.id);
                        const reason = rec?.absence_reason
                          ? ABSENCE_REASON_LABELS[rec.absence_reason] || rec.absence_reason
                          : '⚠️ לא צוינה סיבה';
                        return (
                          <div key={s.id} className="flex items-center justify-between text-sm bg-destructive/5 rounded-lg px-3 py-2">
                            <span className="font-semibold">{s.first_name} {s.last_name}</span>
                            <Badge variant={rec?.absence_reason ? 'outline' : 'destructive'} className="text-xs px-2">
                              {reason}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
