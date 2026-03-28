import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ClipboardPaste, X, Download, Upload, Cake } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { getHebrewDay, getJewishHolidaysForMonth, getBirthdaysForMonth, type BirthdayEntry } from '@/lib/hebrewCalendar';
import { HDate } from '@hebcal/core';

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
  color: string;
  created_by: string;
  created_at: string;
}

const EVENT_COLORS = [
  { key: 'blue', label: 'כחול', bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { key: 'green', label: 'ירוק', bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { key: 'red', label: 'אדום', bg: 'bg-red-100 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  { key: 'purple', label: 'סגול', bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { key: 'orange', label: 'כתום', bg: 'bg-orange-100 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { key: 'yellow', label: 'צהוב', bg: 'bg-yellow-100 dark:bg-yellow-950/40', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
];

const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const HEBREW_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function getColorConfig(color: string) {
  return EVENT_COLORS.find(c => c.key === color) || EVENT_COLORS[0];
}

interface SharedCalendarProps {
  editable?: boolean;
}

export default function SharedCalendar({ editable = false }: SharedCalendarProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Add/Edit dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [saving, setSaving] = useState(false);

  // Paste dialog
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedEvents, setParsedEvents] = useState<{ title: string; date: string; time: string }[]>([]);
  const [importing, setImporting] = useState(false);

  // Day detail
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hebrew holidays and birthdays
  const [hebrewHolidays, setHebrewHolidays] = useState<Map<string, string[]>>(new Map());
  const [birthdays, setBirthdays] = useState<BirthdayEntry[]>([]);

  const fetchEvents = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

    // Fetch manual calendar events
    const { data: calData } = await supabase
      .from('calendar_events' as any)
      .select('*')
      .gte('event_date', from)
      .lte('event_date', to)
      .order('event_date')
      .order('event_time');

    // Fetch exam schedule entries for the same month
    const { data: examData } = await supabase
      .from('exam_schedule')
      .select('*, students(first_name, last_name), managed_subjects(name)')
      .gte('exam_date', from)
      .lte('exam_date', to)
      .order('exam_date');

    // Fetch students and staff for birthdays
    const [{ data: studentsData }, { data: staffData }] = await Promise.all([
      supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth')
        .eq('is_active', true)
        .not('date_of_birth', 'is', null),
      supabase
        .from('staff_members')
        .select('id, name, date_of_birth')
        .eq('is_active', true)
        .not('date_of_birth', 'is', null),
    ]);

    // Hebrew holidays
    const holidays = getJewishHolidaysForMonth(year, month);
    const holidayMap = new Map<string, string[]>();
    for (const h of holidays) {
      const existing = holidayMap.get(h.date) || [];
      existing.push(`${h.emoji} ${h.title}`);
      holidayMap.set(h.date, existing);
    }
    setHebrewHolidays(holidayMap);

    // Holiday events as CalendarEvent entries
    const holidayEvents: CalendarEvent[] = holidays.map((h, i) => ({
      id: `holiday-${h.date}-${i}`,
      title: `${h.emoji} ${h.title}`,
      event_date: h.date,
      event_time: null,
      description: h.isYomTov ? 'יום טוב' : h.isErev ? 'ערב חג' : null,
      color: h.isYomTov ? 'purple' : h.isErev ? 'yellow' : 'blue',
      created_by: '',
      created_at: '',
    }));

    // Birthday events - students
    const studentBdays = getBirthdaysForMonth(studentsData || [], year, month);
    // Birthday events - staff
    const currentYear = new Date().getFullYear();
    const staffBdays: BirthdayEntry[] = (staffData || [])
      .filter((s: any) => {
        if (!s.date_of_birth) return false;
        const dob = new Date(s.date_of_birth);
        return dob.getMonth() === month;
      })
      .map((s: any) => {
        const dob = new Date(s.date_of_birth);
        return {
          id: s.id,
          name: s.name,
          date_of_birth: s.date_of_birth,
          dayOfMonth: dob.getDate(),
          age: currentYear - dob.getFullYear(),
        };
      });

    const allBdays = [...studentBdays, ...staffBdays].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    setBirthdays(allBdays);

    const birthdayEvents: CalendarEvent[] = allBdays.map(b => ({
      id: `bday-${b.id}`,
      title: `🎂 יום הולדת: ${b.name}`,
      event_date: `${year}-${String(month + 1).padStart(2, '0')}-${String(b.dayOfMonth).padStart(2, '0')}`,
      event_time: null,
      description: `בן/בת ${b.age}`,
      color: 'green',
      created_by: '',
      created_at: '',
    }));

    // Convert exams to CalendarEvent format
    const examEvents: CalendarEvent[] = (examData || []).map((exam: any) => {
      const studentName = exam.students ? `${exam.students.first_name} ${exam.students.last_name}` : '';
      const subjectName = exam.managed_subjects?.name || '';
      const subSubject = exam.sub_subject ? ` - ${exam.sub_subject}` : '';
      const desc = exam.exam_description ? `\n${exam.exam_description}` : '';
      return {
        id: `exam-${exam.id}`,
        title: `📝 בחינה: ${subjectName}${subSubject}`,
        event_date: exam.exam_date,
        event_time: null,
        description: `${studentName}${desc}`,
        color: 'orange',
        created_by: exam.created_by,
        created_at: exam.created_at,
      };
    });

    const allEvents = [...((calData as any as CalendarEvent[]) || []), ...examEvents, ...holidayEvents, ...birthdayEvents]
      .sort((a, b) => a.event_date.localeCompare(b.event_date));

    setEvents(allEvents);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const openAddDialog = (date?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDate(date || new Date().toISOString().split('T')[0]);
    setFormTime('');
    setFormDescription('');
    setFormColor('blue');
    setShowDialog(true);
  };

  const openEditDialog = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormDate(ev.event_date);
    setFormTime(ev.event_time || '');
    setFormDescription(ev.description || '');
    setFormColor(ev.color || 'blue');
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formDate) { toast.error('יש למלא כותרת ותאריך'); return; }
    setSaving(true);
    try {
      if (editingEvent) {
        await supabase.from('calendar_events' as any).update({
          title: formTitle.trim(),
          event_date: formDate,
          event_time: formTime || null,
          description: formDescription.trim() || null,
          color: formColor,
          updated_at: new Date().toISOString(),
        } as any).eq('id', editingEvent.id);
        toast.success('אירוע עודכן');
      } else {
        await supabase.from('calendar_events' as any).insert({
          title: formTitle.trim(),
          event_date: formDate,
          event_time: formTime || null,
          description: formDescription.trim() || null,
          color: formColor,
          created_by: user?.id,
        } as any);
        toast.success('אירוע נוסף');
      }
      setShowDialog(false);
      fetchEvents();
    } catch { toast.error('שגיאה בשמירה'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('calendar_events' as any).delete().eq('id', id);
    toast.success('אירוע נמחק');
    fetchEvents();
    setSelectedDay(null);
  };

  // Parse pasted text for dates and events
  const handleParse = () => {
    const lines = pasteText.split('\n').filter(l => l.trim());
    const parsed: { title: string; date: string; time: string }[] = [];

    // Common patterns: "DD/MM/YYYY - Event title", "DD.MM.YYYY Event", "YYYY-MM-DD Event"
    for (const line of lines) {
      let match: RegExpMatchArray | null;

      // DD/MM/YYYY or DD.MM.YYYY with optional time HH:MM
      match = line.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})\s*[-–]?\s*(?:(\d{1,2}:\d{2})\s*[-–]?\s*)?(.+)/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) year = '20' + year;
        const time = match[4] || '';
        const title = match[5].trim();
        if (title) parsed.push({ title, date: `${year}-${month}-${day}`, time });
        continue;
      }

      // YYYY-MM-DD
      match = line.match(/(\d{4})-(\d{2})-(\d{2})\s*[-–]?\s*(?:(\d{1,2}:\d{2})\s*[-–]?\s*)?(.+)/);
      if (match) {
        const time = match[4] || '';
        const title = match[5].trim();
        if (title) parsed.push({ title, date: `${match[1]}-${match[2]}-${match[3]}`, time });
        continue;
      }
    }

    setParsedEvents(parsed);
    if (parsed.length === 0 && pasteText.trim()) {
      toast.error('לא זוהו תאריכים בטקסט. פורמט מומלץ: DD/MM/YYYY - אירוע');
    }
  };

  const handleImportParsed = async () => {
    if (parsedEvents.length === 0) return;
    setImporting(true);
    try {
      const rows = parsedEvents.map(ev => ({
        title: ev.title,
        event_date: ev.date,
        event_time: ev.time || null,
        color: 'blue',
        created_by: user?.id,
      }));
      await supabase.from('calendar_events' as any).insert(rows as any);
      toast.success(`${parsedEvents.length} אירועים נוספו ללוח`);
      setShowPaste(false);
      setPasteText('');
      setParsedEvents([]);
      fetchEvents();
    } catch { toast.error('שגיאה בייבוא'); }
    setImporting(false);
  };

  // Excel template download
  const handleDownloadTemplate = () => {
    const templateData = [
      ['כותרת', 'תאריך (DD/MM/YYYY)', 'שעה (HH:MM)', 'תיאור', 'צבע (blue/green/red/purple/orange/yellow)'],
      ['ישיבת צוות', '15/09/2025', '10:00', 'ישיבת צוות שבועית', 'blue'],
      ['יום הורים', '20/09/2025', '17:00', 'מפגש הורים כיתתי', 'green'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'אירועים');
    XLSX.writeFile(wb, 'תבנית_לוח_שנה.xlsx');
    toast.success('תבנית הורדה בהצלחה');
  };

  // Excel file upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Skip header row
      const eventsToInsert: { title: string; event_date: string; event_time: string | null; description: string | null; color: string; created_by: string }[] = [];
      const validColors = EVENT_COLORS.map(c => c.key);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0] || !row[1]) continue;

        const title = String(row[0]).trim();
        const rawDate = String(row[1]).trim();
        const time = row[2] ? String(row[2]).trim() : null;
        const description = row[3] ? String(row[3]).trim() : null;
        const color = row[4] && validColors.includes(String(row[4]).trim().toLowerCase()) ? String(row[4]).trim().toLowerCase() : 'blue';

        // Parse date: DD/MM/YYYY or DD.MM.YYYY
        let eventDate = '';
        const dateMatch = rawDate.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          let year = dateMatch[3];
          if (year.length === 2) year = '20' + year;
          eventDate = `${year}-${month}-${day}`;
        } else {
          // Try YYYY-MM-DD
          const isoMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (isoMatch) {
            eventDate = rawDate;
          } else {
            // Try Excel serial number
            const serial = Number(rawDate);
            if (!isNaN(serial) && serial > 40000) {
              const excelEpoch = new Date(1899, 11, 30);
              const jsDate = new Date(excelEpoch.getTime() + serial * 86400000);
              eventDate = jsDate.toISOString().split('T')[0];
            } else {
              continue; // Skip invalid date
            }
          }
        }

        if (title && eventDate) {
          eventsToInsert.push({
            title,
            event_date: eventDate,
            event_time: time,
            description,
            color,
            created_by: user.id,
          });
        }
      }

      if (eventsToInsert.length === 0) {
        toast.error('לא נמצאו אירועים תקינים בקובץ');
        return;
      }

      const { error } = await supabase.from('calendar_events' as any).insert(eventsToInsert as any);
      if (error) {
        toast.error('שגיאה בייבוא אירועים');
        console.error(error);
      } else {
        toast.success(`${eventsToInsert.length} אירועים יובאו בהצלחה!`);
        fetchEvents();
      }
    } catch (err) {
      toast.error('שגיאה בקריאת הקובץ');
      console.error(err);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.event_date === dateStr);
  };

  const getDayStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedDayEvents = selectedDay ? events.filter(e => e.event_date === selectedDay) : [];

  // Check if a day is Shabbat (Saturday)
  const isShabbat = (day: number) => new Date(year, month, day).getDay() === 6;
  // Check if day has a holiday
  const getDayHolidays = (day: number) => {
    const dateStr = getDayStr(day);
    return hebrewHolidays.get(dateStr) || [];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-primary/10 transition-all active:scale-95">
              <ChevronRight className="h-4 w-4 text-primary" />
            </button>
            <div className="text-center min-w-[130px]">
              <h3 className="text-base font-bold text-foreground">{HEBREW_MONTHS[month]}</h3>
              <p className="text-[10px] text-muted-foreground">{year}</p>
            </div>
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-primary/10 transition-all active:scale-95">
              <ChevronLeft className="h-4 w-4 text-primary" />
            </button>
          </div>
          {editable && (
            <div className="flex gap-1 flex-wrap justify-end">
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-primary" onClick={handleDownloadTemplate}>
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-primary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3 w-3" />
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-primary" onClick={() => { setShowPaste(true); setPasteText(''); setParsedEvents([]); }}>
                <ClipboardPaste className="h-3 w-3" />
              </Button>
              <Button size="sm" className="h-7 text-[10px] gap-1 rounded-lg" onClick={() => openAddDialog()}>
                <Plus className="h-3 w-3" /> הוסף
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid bg-primary/5" style={{ gridTemplateColumns: 'repeat(5, 1fr) 0.6fr 0.6fr' }}>
          {HEBREW_DAYS.map((d, idx) => (
            <div key={d} className={`text-center text-[10px] font-bold py-2 ${idx === 6 ? 'text-primary' : idx === 5 ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid gap-px bg-border/20" style={{ gridTemplateColumns: 'repeat(5, 1fr) 0.6fr 0.6fr' }}>
          {calendarDays.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[56px] bg-muted/5" />;

            const dayStr = getDayStr(day);
            const dayEvents = getEventsForDay(day);
            const isToday = dayStr === todayStr;
            const isSelected = dayStr === selectedDay;
            const isSat = isShabbat(day);
            const holidays = getDayHolidays(day);
            const hasHoliday = holidays.length > 0;
            const hasBirthday = dayEvents.some(e => e.id.startsWith('bday-'));

            return (
              <button
                key={i}
                onClick={() => {
                  if (dayEvents.length > 0 || editable) {
                    setSelectedDay(dayStr === selectedDay ? null : dayStr);
                  }
                }}
                className={`min-h-[56px] p-1 text-right transition-all relative bg-card
                  ${isSelected ? 'bg-primary/8 ring-1 ring-primary/30 ring-inset' : 'hover:bg-muted/30'}
                  ${isSat ? 'bg-primary/3' : ''}
                  ${hasHoliday ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}
                `}
              >
                {/* Date numbers row */}
                <div className="flex items-start justify-between mb-0.5">
                  <span className="text-[7px] text-muted-foreground/60 leading-none mt-0.5 font-medium">
                    {getHebrewDay(year, month, day)}
                  </span>
                  <span className={`text-[11px] font-semibold leading-none inline-flex items-center justify-center rounded-full
                    ${isToday ? 'w-6 h-6 bg-primary text-primary-foreground shadow-sm' : 
                      isSat ? 'text-primary' : 'text-foreground'}`}>
                    {day}
                  </span>
                </div>

                {/* Event dots & indicators */}
                <div className="flex flex-col gap-0.5 mt-auto">
                  {hasBirthday && (
                    <span className="text-[8px] leading-none">🎂</span>
                  )}
                  {dayEvents.filter(e => !e.id.startsWith('bday-')).length > 0 && (
                    <div className="flex gap-[2px] flex-wrap">
                      {dayEvents.filter(e => !e.id.startsWith('bday-')).slice(0, 4).map(ev => (
                        <div key={ev.id} className={`w-[5px] h-[5px] rounded-full ${getColorConfig(ev.color).dot} opacity-80`} />
                      ))}
                      {dayEvents.filter(e => !e.id.startsWith('bday-')).length > 4 && (
                        <span className="text-[7px] text-muted-foreground font-medium">+{dayEvents.filter(e => !e.id.startsWith('bday-')).length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {(() => {
                  const d = new Date(selectedDay + 'T00:00:00');
                  return getHebrewDay(d.getFullYear(), d.getMonth(), d.getDate());
                })()}
              </p>
            </div>
            {editable && (
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 rounded-lg" onClick={() => openAddDialog(selectedDay)}>
                <Plus className="h-3 w-3" /> הוסף אירוע
              </Button>
            )}
          </div>
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">✨ אין אירועים ביום זה</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map(ev => {
                const color = getColorConfig(ev.color);
                return (
                  <div key={ev.id} className={`rounded-xl p-3 ${color.bg} flex items-start justify-between gap-2 transition-all`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                        <p className={`text-xs font-bold ${color.text}`}>{ev.title}</p>
                      </div>
                      {ev.event_time && (
                        <p className={`text-[10px] ${color.text} opacity-70 mr-4 mt-0.5`}>🕐 {ev.event_time}</p>
                      )}
                      {ev.description && (
                        <p className="text-[10px] text-foreground/50 mr-4 mt-1 whitespace-pre-line leading-relaxed">{ev.description}</p>
                      )}
                    </div>
                    {editable && !ev.id.startsWith('exam-') && !ev.id.startsWith('holiday-') && !ev.id.startsWith('bday-') && (
                      <div className="flex gap-0.5 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); openEditDialog(ev); }} className="p-1.5 rounded-lg hover:bg-background/60 transition-colors">
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }} className="p-1.5 rounded-lg hover:bg-background/60 transition-colors">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming events - collapsible */}
      {(() => {
        const upcoming = events
          .filter(e => e.event_date >= todayStr && !e.id.startsWith('holiday-'))
          .sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.event_time || '').localeCompare(b.event_time || ''));

        if (upcoming.length === 0) return null;
        return (
          <details className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden group">
            <summary className="flex items-center gap-1.5 cursor-pointer p-3 hover:bg-muted/30 transition-colors list-none [&::-webkit-details-marker]:hidden">
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:-rotate-90" />
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-muted-foreground">אירועים קרובים</span>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 mr-auto">{upcoming.length}</Badge>
            </summary>
            <div className="px-3 pb-3 space-y-1.5">
              {upcoming.slice(0, 8).map(ev => {
                const color = getColorConfig(ev.color);
                return (
                  <div key={ev.id} className={`rounded-xl p-2.5 ${color.bg} flex items-center gap-2.5 transition-all hover:shadow-sm`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold ${color.text} truncate`}>{ev.title}</p>
                      <p className={`text-[10px] ${color.text} opacity-60`}>
                        {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {ev.event_time && ` · ${ev.event_time}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })()}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingEvent ? 'עריכת אירוע' : 'הוספת אירוע'}</DialogTitle>
            <DialogDescription className="text-xs">הגדר פרטי אירוע ביומן</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="כותרת האירוע" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="h-10 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="h-10 text-sm" />
              <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="h-10 text-sm" placeholder="שעה (אופציונלי)" />
            </div>
            <Textarea placeholder="תיאור (אופציונלי)" value={formDescription} onChange={e => setFormDescription(e.target.value)} className="text-sm min-h-[60px]" />
            <div>
              <p className="text-xs font-semibold mb-1.5">צבע</p>
              <div className="flex gap-1.5">
                {EVENT_COLORS.map(c => (
                  <button key={c.key} onClick={() => setFormColor(c.key)}
                    className={`w-7 h-7 rounded-full ${c.dot} transition-all ${formColor === c.key ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-60 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>ביטול</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paste Dialog */}
      <Dialog open={showPaste} onOpenChange={setShowPaste}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4" /> הדבקת אירועים מטקסט
            </DialogTitle>
            <DialogDescription className="text-xs">
              הדבק טקסט עם תאריכים ואירועים. פורמט מומלץ: כל שורה בפורמט DD/MM/YYYY - כותרת האירוע
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder={`דוגמה:\n15/04/2026 - ישיבת צוות\n20/04/2026 10:00 - יום הורים\n01/05/2026 - טיול שנתי`}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="text-sm min-h-[120px] font-mono"
              dir="ltr"
            />
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleParse}>
              זהה אירועים בטקסט
            </Button>

            {parsedEvents.length > 0 && (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                <p className="text-xs font-bold text-primary">זוהו {parsedEvents.length} אירועים:</p>
                {parsedEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                    <div>
                      <p className="text-xs font-medium">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(ev.date + 'T00:00:00').toLocaleDateString('he-IL')} {ev.time && `· ${ev.time}`}</p>
                    </div>
                    <button onClick={() => setParsedEvents(prev => prev.filter((_, j) => j !== i))} className="p-1 hover:bg-muted rounded">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setShowPaste(false)}>ביטול</Button>
            <Button size="sm" onClick={handleImportParsed} disabled={importing || parsedEvents.length === 0}>
              {importing ? 'מייבא...' : `ייבא ${parsedEvents.length} אירועים`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
