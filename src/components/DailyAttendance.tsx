import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ABSENCE_REASON_LABELS, LONG_ABSENT_REASONS } from '@/lib/constants';
import { CheckCircle2, XCircle, ClipboardCheck, ChevronDown, ChevronUp, Phone, Home, BookOpen, AlertTriangle } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];

interface AttendanceRecord {
  student_id: string;
  is_present: boolean;
  absence_reason: string | null;
  other_reason_text?: string | null;
}

interface DailyAttendanceProps {
  onAttendanceChange?: (absentStudentIds: Set<string>) => void;
}

interface LongAbsentStudent {
  student: Student;
  consecutiveDays: number;
  reason: string;
}

interface FollowupRecord {
  student_id: string;
  week_start: string;
  phone_contact: boolean;
  home_visit: boolean;
  materials_sent: boolean;
  notes: string | null;
  id?: string;
}

const CLASS_OPTIONS = ['טלי', 'עדן'];

export default function DailyAttendance({ onAttendanceChange }: DailyAttendanceProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [longAbsentStudents, setLongAbsentStudents] = useState<LongAbsentStudent[]>([]);
  const [followups, setFollowups] = useState<Map<string, FollowupRecord>>(new Map());
  const [longAbsentExpanded, setLongAbsentExpanded] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const toggleClass = (cls: string) =>
    setExpandedClasses(prev => ({ ...prev, [cls]: !prev[cls] }));

  const getWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

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
          other_reason_text: r.other_reason_text,
        });
      });
    }
    setAttendance(map);
    notifyAbsent(map);
    setLoading(false);

    if (studentsRes.data) {
      await loadLongAbsentStudents(studentsRes.data);
    }
  };

  const loadLongAbsentStudents = async (allStudents: Student[]) => {
    // Check last 7 days of attendance for consecutive absences
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];

    const { data: recentAttendance } = await supabase
      .from('daily_attendance')
      .select('*')
      .gte('attendance_date', fromDate)
      .eq('is_present', false)
      .order('attendance_date', { ascending: false });

    if (!recentAttendance) return;

    const studentAbsences = new Map<string, { count: number; reason: string }>();

    for (const student of allStudents) {
      const studentRecords = recentAttendance
        .filter((r: any) => r.student_id === student.id)
        .sort((a: any, b: any) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());

      let consecutive = 0;
      let lastReason = '';

      for (const rec of studentRecords) {
        if (LONG_ABSENT_REASONS.includes(rec.absence_reason as any)) {
          consecutive++;
          if (!lastReason) lastReason = rec.absence_reason || '';
        } else {
          break;
        }
      }

      if (consecutive >= 5) {
        studentAbsences.set(student.id, { count: consecutive, reason: lastReason });
      }
    }

    const longAbsent: LongAbsentStudent[] = [];
    studentAbsences.forEach((data, studentId) => {
      const student = allStudents.find(s => s.id === studentId);
      if (student) {
        longAbsent.push({
          student,
          consecutiveDays: data.count,
          reason: ABSENCE_REASON_LABELS[data.reason] || data.reason,
        });
      }
    });

    setLongAbsentStudents(longAbsent);

    if (longAbsent.length > 0) {
      const weekStart = getWeekStart();
      const { data: followupData } = await supabase
        .from('absent_student_followups' as any)
        .select('*')
        .eq('week_start', weekStart);

      if (followupData) {
        const fMap = new Map<string, FollowupRecord>();
        (followupData as any[]).forEach((f: any) => {
          fMap.set(f.student_id, f);
        });
        setFollowups(fMap);
      }
    }
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

    if (!newPresent) {
      const newMap = new Map(attendance);
      newMap.set(studentId, {
        student_id: studentId,
        is_present: false,
        absence_reason: null,
      });
      setAttendance(newMap);
      notifyAbsent(newMap);
      return;
    }

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
      other_reason_text: null,
      recorded_by: user.id,
    } as any, { onConflict: 'student_id,attendance_date' });

    if (error) {
      toast.error('שגיאה בשמירת נוכחות');
      console.error(error);
    }
  };

  const setAbsenceReason = async (studentId: string, reason: string) => {
    if (!user) return;
    const current = attendance.get(studentId);
    const newMap = new Map(attendance);
    newMap.set(studentId, {
      student_id: studentId,
      is_present: false,
      absence_reason: reason,
      other_reason_text: reason === 'other' ? (current?.other_reason_text || '') : null,
    });
    setAttendance(newMap);

    if (reason !== 'other') {
      const { error } = await supabase.from('daily_attendance').upsert({
        student_id: studentId,
        attendance_date: today,
        is_present: false,
        absence_reason: reason as any,
        other_reason_text: null,
        recorded_by: user.id,
      } as any, { onConflict: 'student_id,attendance_date' });

      if (error) {
        toast.error('שגיאה בשמירת סיבת היעדרות');
      } else {
        toast.success('סיבת היעדרות נשמרה');
      }
    }
  };

  const saveOtherReasonText = async (studentId: string, text: string) => {
    if (!user) return;
    const newMap = new Map(attendance);
    const current = newMap.get(studentId);
    if (current) {
      current.other_reason_text = text;
      newMap.set(studentId, { ...current });
      setAttendance(newMap);
    }

    const { error } = await supabase.from('daily_attendance').upsert({
      student_id: studentId,
      attendance_date: today,
      is_present: false,
      absence_reason: 'other' as any,
      other_reason_text: text,
      recorded_by: user.id,
    } as any, { onConflict: 'student_id,attendance_date' });

    if (error) {
      toast.error('שגיאה בשמירת פרטי היעדרות');
    } else {
      toast.success('פרטי היעדרות נשמרו');
    }
  };

  const updateFollowup = async (studentId: string, field: 'phone_contact' | 'home_visit' | 'materials_sent', value: boolean) => {
    if (!user) return;
    const weekStart = getWeekStart();
    const existing = followups.get(studentId);

    const record = {
      student_id: studentId,
      week_start: weekStart,
      phone_contact: existing?.phone_contact || false,
      home_visit: existing?.home_visit || false,
      materials_sent: existing?.materials_sent || false,
      recorded_by: user.id,
      [field]: value,
    };

    const { error } = await supabase.from('absent_student_followups' as any).upsert(
      record as any,
      { onConflict: 'student_id,week_start' }
    );

    if (error) {
      toast.error('שגיאה בעדכון מעקב');
      console.error(error);
    } else {
      const newFollowups = new Map(followups);
      newFollowups.set(studentId, { ...record, notes: existing?.notes || null } as FollowupRecord);
      setFollowups(newFollowups);
      toast.success('מעקב עודכן');
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
      <div className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-primary/10 border border-primary/20">
        <p className="text-base font-bold text-primary">
          📅 ביקור סדיר · {new Date().toLocaleDateString('he-IL')}
        </p>
        <Badge variant="secondary" className="text-sm px-3 py-1.5 font-bold">
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
        const missingReason = classAbsent.some(s => {
          const rec = attendance.get(s.id);
          return rec && !rec.is_present && !rec.absence_reason;
        });

        return (
          <div key={cls} className="card-styled rounded-2xl overflow-hidden">
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
                  <Badge variant="destructive" className="text-xs px-1.5 py-0 animate-pulse">חסרה סיבה!</Badge>
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
                          {/* Free text input when "other" is selected */}
                          {rec?.absence_reason === 'other' && (
                            <div className="mt-2">
                              <Input
                                placeholder="פרט/י את סיבת ההיעדרות..."
                                value={rec?.other_reason_text || ''}
                                onChange={(e) => {
                                  const newMap = new Map(attendance);
                                  const current = newMap.get(s.id);
                                  if (current) {
                                    newMap.set(s.id, { ...current, other_reason_text: e.target.value });
                                    setAttendance(newMap);
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value.trim()) {
                                    saveOtherReasonText(s.id, e.target.value.trim());
                                  }
                                }}
                                className="text-sm"
                                dir="rtl"
                              />
                            </div>
                          )}
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
                        let reason = rec?.absence_reason
                          ? ABSENCE_REASON_LABELS[rec.absence_reason] || rec.absence_reason
                          : '⚠️ לא צוינה סיבה';
                        if (rec?.absence_reason === 'other' && rec?.other_reason_text) {
                          reason = `אחר: ${rec.other_reason_text}`;
                        }
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

      {/* Long-absent students tracking section */}
      {longAbsentStudents.length > 0 && (
        <div className="card-styled rounded-2xl overflow-hidden border-2 border-amber-500/30">
          <button
            onClick={() => setLongAbsentExpanded(!longAbsentExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors bg-amber-500/5"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-lg font-bold text-amber-700">תלמידים שלא מגיעים לבית הספר</span>
              <Badge variant="secondary" className="text-sm px-2.5 py-0.5 bg-amber-100 text-amber-800">
                {longAbsentStudents.length}
              </Badge>
            </div>
            {longAbsentExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </button>

          {longAbsentExpanded && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                למעקב ושמירה על קשר טלפוני, ביקורי בית ושליחת חומרים (2-3 פעמים בשבוע)
              </p>
              {longAbsentStudents.map(({ student, consecutiveDays, reason }) => {
                const followup = followups.get(student.id);
                return (
                  <div key={student.id} className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-base">{student.first_name} {student.last_name}</span>
                        <span className="text-xs text-muted-foreground mr-2">({student.class_name})</span>
                      </div>
                      <div className="text-left">
                        <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                          {consecutiveDays} ימים רצוף
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={followup?.phone_contact || false}
                          onCheckedChange={(checked) => updateFollowup(student.id, 'phone_contact', !!checked)}
                        />
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">קשר טלפוני</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={followup?.home_visit || false}
                          onCheckedChange={(checked) => updateFollowup(student.id, 'home_visit', !!checked)}
                        />
                        <div className="flex items-center gap-1">
                          <Home className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">ביקור בית</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={followup?.materials_sent || false}
                          onCheckedChange={(checked) => updateFollowup(student.id, 'materials_sent', !!checked)}
                        />
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">שליחת חומרים</span>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
