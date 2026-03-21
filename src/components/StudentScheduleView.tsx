import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

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

const TYPE_COLORS: Record<string, string> = {
  lesson: 'bg-primary/10 border-primary/20',
  therapy: 'bg-accent/10 border-accent/20',
  break: 'bg-muted border-border',
  other: 'bg-secondary/50 border-border',
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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('student_schedules' as any)
        .select('*')
        .eq('student_id', studentId)
        .eq('is_enabled', true)
        .maybeSingle();

      if (data) {
        setSchedule((data as any).schedule_data || []);
      } else {
        setSchedule(null);
      }
      setLoading(false);
    };
    fetch();
  }, [studentId]);

  if (loading) return null;
  if (!schedule || schedule.length === 0) return null;

  const today = DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay() === 6 ? 4 : new Date().getDay() - 1];

  const sortedEntries = [...schedule].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day as any) - DAYS.indexOf(b.day as any);
    return dayDiff !== 0 ? dayDiff : Number(a.hour) - Number(b.hour);
  });

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
          <Badge variant="secondary" className="text-xs rounded-full px-2">{schedule.length}</Badge>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {DAYS.map(day => {
            const dayEntries = sortedEntries.filter(e => e.day === day);
            if (dayEntries.length === 0) return null;
            const isToday = day === today;
            return (
              <div key={day} className={`rounded-lg p-2 ${isToday ? 'bg-primary/5 border border-primary/20' : ''}`}>
                <p className={`text-[10px] font-bold mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  יום {day} {isToday && '(היום)'}
                </p>
                <div className="space-y-0.5">
                  {dayEntries.map((entry, i) => (
                    <div key={i} className={`flex items-center gap-2 p-1.5 rounded-md border ${TYPE_COLORS[entry.type] || TYPE_COLORS.other}`}>
                      <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">{entry.hour}</Badge>
                      <span className="text-xs font-medium flex-1">{entry.activity}</span>
                      <Badge variant="secondary" className="text-[9px] px-1">{TYPE_LABELS[entry.type] || entry.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
