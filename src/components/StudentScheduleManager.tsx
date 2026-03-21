import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Trash2, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'] as const;

const SCHOOL_SLOTS = [
  { id: '1', label: 'שיעור 1', time: '08:00–08:50' },
  { id: '2', label: 'שיעור 2', time: '08:50–09:40' },
  { id: 'b1', label: 'הפסקה 1', time: '09:40–10:00' },
  { id: '3', label: 'שיעור 3', time: '10:00–10:45' },
  { id: '4', label: 'שיעור 4', time: '10:45–11:30' },
  { id: 'b2', label: 'הפסקה 2', time: '11:30–11:45' },
  { id: '5', label: 'שיעור 5', time: '11:45–12:30' },
  { id: '6', label: 'שיעור 6', time: '12:30–13:15' },
  { id: 'lunch', label: 'ארוחת צהריים', time: '13:15–14:00' },
  { id: '8', label: 'שיעור 8', time: '14:00–14:45' },
  { id: '9', label: 'שיעור 9', time: '14:45–15:30' },
] as const;

const SLOT_ORDER: string[] = SCHOOL_SLOTS.map(s => s.id);

interface ScheduleEntry {
  day: string;
  hour: string;
  activity: string;
  type: 'lesson' | 'therapy' | 'break' | 'other';
}

interface Props {
  student: { id: string; first_name: string; last_name: string };
  schedule: { id?: string; is_enabled: boolean; schedule_data: ScheduleEntry[] } | null;
  onSave: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  lesson: 'שיעור', therapy: 'טיפול', break: 'הפסקה', other: 'אחר',
};

const TYPE_COLORS: Record<string, string> = {
  lesson: 'bg-primary/10 text-primary border-primary/20',
  therapy: 'bg-accent/10 text-accent border-accent/20',
  break: 'bg-muted text-muted-foreground border-border',
  other: 'bg-secondary text-secondary-foreground border-border',
};

export default function StudentScheduleManager({ student, schedule, onSave }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(schedule?.is_enabled ?? false);
  const [entries, setEntries] = useState<ScheduleEntry[]>(schedule?.schedule_data ?? []);
  const [saving, setSaving] = useState(false);

  // New entry form
  const [newDay, setNewDay] = useState<string>(DAYS[0]);
  const [newHour, setNewHour] = useState<string>(SCHOOL_SLOTS[0].id);
  const [newActivity, setNewActivity] = useState('');
  const [newType, setNewType] = useState<string>('lesson');

  const addEntry = () => {
    if (!newActivity.trim()) { toast.error('נא להזין שם פעילות'); return; }
    const exists = entries.some(e => e.day === newDay && e.hour === newHour);
    if (exists) { toast.error('כבר קיימת פעילות ביום ושעה זו'); return; }
    setEntries([...entries, { day: newDay, hour: newHour, activity: newActivity.trim(), type: newType as any }]);
    setNewActivity('');
  };

  const removeEntry = (idx: number) => {
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      student_id: student.id,
      is_enabled: enabled,
      schedule_data: entries,
      created_by: user.id,
    };

    let error;
    if (schedule?.id) {
      ({ error } = await supabase.from('student_schedules' as any).update({
        is_enabled: enabled,
        schedule_data: entries,
      } as any).eq('id', schedule.id));
    } else {
      ({ error } = await supabase.from('student_schedules' as any).insert(payload as any));
    }

    if (error) {
      console.error(error);
      toast.error('שגיאה בשמירת המערכת');
    } else {
      toast.success('מערכת השעות נשמרה');
      onSave();
      setOpen(false);
    }
    setSaving(false);
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day as any) - DAYS.indexOf(b.day as any);
    return dayDiff !== 0 ? dayDiff : SLOT_ORDER.indexOf(a.hour) - SLOT_ORDER.indexOf(b.hour);
  });

  const getSlotLabel = (id: string) => {
    const slot = SCHOOL_SLOTS.find(s => s.id === id);
    return slot ? `${slot.time}` : id;
  };

  return (
    <>
      <Button
        size="sm"
        variant={schedule?.is_enabled ? 'default' : 'outline'}
        className="gap-1 text-[10px] h-7 px-2"
        onClick={() => setOpen(true)}
      >
        <Calendar className="h-3 w-3" />
        {schedule?.is_enabled ? 'מערכת פעילה' : 'מערכת שעות'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              מערכת שעות — {student.first_name} {student.last_name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              הגדר מערכת שעות אישית. כשמופעל, התלמיד יראה את המערכת בפורטל האישי.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Enable toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div>
                <p className="text-sm font-semibold">הצג לתלמיד</p>
                <p className="text-xs text-muted-foreground">כשמופעל, המערכת מוצגת בפורטל התלמיד</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {/* Add new entry */}
            <div className="p-3 rounded-lg border bg-card space-y-2">
              <p className="text-xs font-semibold">הוסף פעילות</p>
              <div className="grid grid-cols-3 gap-1.5">
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newHour} onValueChange={setNewHour}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCHOOL_SLOTS.map(s => <SelectItem key={s.id} value={s.id}>{s.label} ({s.time})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-1.5">
                <Input
                  value={newActivity}
                  onChange={e => setNewActivity(e.target.value)}
                  placeholder="שם הפעילות (למשל: מתמטיקה, טיפול רגשי...)"
                  className="h-8 text-xs flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') addEntry(); }}
                />
                <Button size="sm" className="h-8 gap-1 text-xs" onClick={addEntry}>
                  <Plus className="h-3 w-3" />
                  הוסף
                </Button>
              </div>
            </div>

            {/* Schedule view */}
            {sortedEntries.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold">מערכת נוכחית ({sortedEntries.length} פעילויות)</p>
                {DAYS.map(day => {
                  const dayEntries = sortedEntries.filter(e => e.day === day);
                  if (dayEntries.length === 0) return null;
                  return (
                    <div key={day} className="mb-2">
                      <p className="text-[10px] font-bold text-muted-foreground mb-0.5">יום {day}</p>
                      {dayEntries.map((entry, idx) => {
                        const originalIdx = entries.indexOf(entry);
                        return (
                          <div key={idx} className={`flex items-center justify-between p-1.5 rounded-md border mb-0.5 ${TYPE_COLORS[entry.type]}`}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 whitespace-nowrap">{getSlotLabel(entry.hour)}</Badge>
                              <span className="text-xs font-medium">{entry.activity}</span>
                              <Badge variant="secondary" className="text-[9px] px-1">{TYPE_LABELS[entry.type]}</Badge>
                            </div>
                            <button onClick={() => removeEntry(originalIdx)} className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-xs py-4">אין פעילויות במערכת. הוסף פעילויות למעלה.</p>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {saving ? 'שומר...' : 'שמור מערכת שעות'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
