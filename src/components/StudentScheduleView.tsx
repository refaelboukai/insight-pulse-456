import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, ChevronDown, ChevronUp, CheckCircle2, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'] as const;

const SCHOOL_SLOTS: Record<string, string> = {
  '1': '08:00–08:50', '2': '08:50–09:40', 'b1': '09:40–10:00',
  '3': '10:00–10:45', '4': '10:45–11:30', 'b2': '11:30–11:45',
  '5': '11:45–12:30', '6': '12:30–13:15', 'lunch': '13:15–14:00',
  '8': '14:00–14:45', '9': '14:45–15:30',
};
const SLOT_ORDER = Object.keys(SCHOOL_SLOTS);

const TYPE_LABELS: Record<string, string> = {
  lesson: 'שיעור', therapy: 'טיפול', break: 'הפסקה', other: 'אחר',
};

const TYPE_COLORS: Record<string, { base: string; checked: string }> = {
  lesson: { base: 'bg-primary/5 border-primary/15', checked: 'bg-primary/15 border-primary/30' },
  therapy: { base: 'bg-accent/5 border-accent/15', checked: 'bg-accent/15 border-accent/30' },
  break: { base: 'bg-muted/50 border-border', checked: 'bg-muted border-border' },
  other: { base: 'bg-secondary/30 border-border', checked: 'bg-secondary/60 border-border' },
};

interface ScheduleEntry {
  day: string;
  hour: string;
  activity: string;
  type: string;
}

interface Props {
  studentId: string;
}

export default function StudentScheduleView({ studentId }: Props) {
  const [schedule, setSchedule] = useState<ScheduleEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [checkins, setCheckins] = useState<Set<string>>(new Set());
  const today = DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay() === 6 ? 4 : new Date().getDay() - 1];
  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      const [scheduleRes, checkinsRes] = await Promise.all([
        supabase
          .from('student_schedules')
          .select('*')
          .eq('student_id', studentId)
          .eq('is_enabled', true)
          .maybeSingle(),
        supabase
          .from('schedule_checkins' as any)
          .select('day, hour')
          .eq('student_id', studentId)
          .eq('checkin_date', todayDate),
      ]);

      if (scheduleRes.data) {
        setSchedule((scheduleRes.data as any).schedule_data || []);
      } else {
        setSchedule(null);
      }

      if (checkinsRes.data) {
        const set = new Set<string>();
        (checkinsRes.data as any[]).forEach((c: any) => set.add(`${c.day}|${c.hour}`));
        setCheckins(set);
      }
      setLoading(false);
    };
    fetchData();
  }, [studentId, todayDate]);

  const toggleCheckin = useCallback(async (day: string, hour: string) => {
    const key = `${day}|${hour}`;
    const isChecked = checkins.has(key);

    // Optimistic update
    setCheckins(prev => {
      const next = new Set(prev);
      if (isChecked) next.delete(key);
      else next.add(key);
      return next;
    });

    if (isChecked) {
      const { error } = await (supabase.from('schedule_checkins' as any) as any)
        .delete()
        .eq('student_id', studentId)
        .eq('checkin_date', todayDate)
        .eq('day', day)
        .eq('hour', hour);
      if (error) {
        setCheckins(prev => { const next = new Set(prev); next.add(key); return next; });
        toast.error('שגיאה בעדכון');
      }
    } else {
      const { error } = await (supabase.from('schedule_checkins' as any) as any)
        .insert({ student_id: studentId, checkin_date: todayDate, day, hour });
      if (error) {
        setCheckins(prev => { const next = new Set(prev); next.delete(key); return next; });
        toast.error('שגיאה בעדכון');
      }
    }
  }, [checkins, studentId, todayDate]);

  if (loading) return null;
  if (!schedule || schedule.length === 0) return null;

  const sortedEntries = [...schedule].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day as any) - DAYS.indexOf(b.day as any);
    return dayDiff !== 0 ? dayDiff : SLOT_ORDER.indexOf(a.hour) - SLOT_ORDER.indexOf(b.hour);
  });

  const todayEntries = sortedEntries.filter(e => e.day === today);
  const todayChecked = todayEntries.filter(e => checkins.has(`${e.day}|${e.hour}`)).length;
  const todayTotal = todayEntries.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayChecked / todayTotal) * 100) : 0;
  const allDone = todayTotal > 0 && todayChecked === todayTotal;

  return (
    <div className="card-styled rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">המערכת שלי</span>
          {todayTotal > 0 && (
            <Badge variant={allDone ? 'default' : 'secondary'} className="text-xs rounded-full px-2 gap-1">
              {allDone && <Trophy className="h-3 w-3" />}
              {todayChecked}/{todayTotal}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Today's progress bar */}
          {todayTotal > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground">ההתקדמות שלי להיום</p>
                <span className="text-[11px] font-bold text-primary">{todayProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${todayProgress}%` }}
                />
              </div>
              {allDone && (
                <p className="text-[11px] text-green-600 font-semibold text-center flex items-center justify-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  כל הכבוד! השלמת את כל הפעילויות להיום! 🎉
                </p>
              )}
            </div>
          )}

          {DAYS.map(day => {
            const dayEntries = sortedEntries.filter(e => e.day === day);
            if (dayEntries.length === 0) return null;
            const isToday = day === today;
            const dayChecked = dayEntries.filter(e => checkins.has(`${e.day}|${e.hour}`)).length;

            return (
              <div key={day} className={`rounded-xl p-2.5 ${isToday ? 'bg-primary/5 border-2 border-primary/20' : 'border border-border/50'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className={`text-[11px] font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    יום {day} {isToday && '📍 היום'}
                  </p>
                  {isToday && dayChecked > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                      {dayChecked}/{dayEntries.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEntries.map((entry, i) => {
                    const key = `${entry.day}|${entry.hour}`;
                    const isChecked = checkins.has(key);
                    const colors = TYPE_COLORS[entry.type] || TYPE_COLORS.other;

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                          isChecked ? colors.checked : colors.base
                        } ${isToday ? 'hover:shadow-sm' : 'opacity-75'}`}
                        onClick={() => isToday && toggleCheckin(entry.day, entry.hour)}
                      >
                        {isToday && (
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleCheckin(entry.day, entry.hour)}
                            onClick={e => e.stopPropagation()}
                            className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 shrink-0 whitespace-nowrap font-mono">
                          {SCHOOL_SLOTS[entry.hour] || entry.hour}
                        </Badge>
                        <span className={`text-xs font-medium flex-1 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                          {entry.activity}
                        </span>
                        <Badge variant="secondary" className="text-[9px] px-1">
                          {TYPE_LABELS[entry.type] || entry.type}
                        </Badge>
                        {isChecked && isToday && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
