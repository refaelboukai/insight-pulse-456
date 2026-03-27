import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ClipboardPaste, X, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';

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

    const allEvents = [...((calData as any as CalendarEvent[]) || []), ...examEvents]
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

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-bold min-w-[120px] text-center">
            {HEBREW_MONTHS[month]} {year}
          </h3>
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        {editable && (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleDownloadTemplate}>
              <Download className="h-3 w-3" /> תבנית
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3 w-3" /> טען אקסל
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => { setShowPaste(true); setPasteText(''); setParsedEvents([]); }}>
              <ClipboardPaste className="h-3 w-3" /> הדבק
            </Button>
            <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => openAddDialog()}>
              <Plus className="h-3 w-3" /> הוסף
            </Button>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {HEBREW_DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1.5">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={i} className="border-t border-border/30 min-h-[52px] bg-muted/10" />;

            const dayStr = getDayStr(day);
            const dayEvents = getEventsForDay(day);
            const isToday = dayStr === todayStr;
            const isSelected = dayStr === selectedDay;

            return (
              <button
                key={i}
                onClick={() => {
                  if (dayEvents.length > 0 || editable) {
                    setSelectedDay(dayStr === selectedDay ? null : dayStr);
                  }
                }}
                className={`border-t border-border/30 min-h-[52px] p-1 text-right transition-colors relative ${
                  isSelected ? 'bg-primary/10' : 'hover:bg-muted/40'
                }`}
              >
                <span className={`text-[11px] font-medium inline-flex items-center justify-center w-5 h-5 rounded-full ${
                  isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                }`}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} className={`w-1.5 h-1.5 rounded-full ${getColorConfig(ev.color).dot}`} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="rounded-xl border bg-card p-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold">
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h4>
            {editable && (
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => openAddDialog(selectedDay)}>
                <Plus className="h-3 w-3" /> הוסף אירוע
              </Button>
            )}
          </div>
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">אין אירועים ביום זה</p>
          ) : (
            <div className="space-y-1.5">
              {selectedDayEvents.map(ev => {
                const color = getColorConfig(ev.color);
                return (
                  <div key={ev.id} className={`rounded-lg p-2.5 ${color.bg} flex items-start justify-between gap-2`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                        <p className={`text-xs font-bold ${color.text} truncate`}>{ev.title}</p>
                      </div>
                      {ev.event_time && (
                        <p className={`text-[10px] ${color.text} opacity-70 mr-3.5`}>{ev.event_time}</p>
                      )}
                      {ev.description && (
                        <p className="text-[10px] text-foreground/60 mr-3.5 mt-0.5 whitespace-pre-line">{ev.description}</p>
                      )}
                    </div>
                    {editable && !ev.id.startsWith('exam-') && (
                      <div className="flex gap-0.5 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); openEditDialog(ev); }} className="p-1 rounded hover:bg-background/50">
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }} className="p-1 rounded hover:bg-background/50">
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

      {/* Upcoming events list */}
      {(() => {
        const upcoming = events
          .filter(e => e.event_date >= todayStr)
          .sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.event_time || '').localeCompare(b.event_time || ''));

        if (upcoming.length === 0) return null;
        return (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-muted-foreground">אירועים קרובים</h4>
            {upcoming.slice(0, 5).map(ev => {
              const color = getColorConfig(ev.color);
              return (
                <div key={ev.id} className={`rounded-lg p-2 ${color.bg} flex items-center gap-2`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold ${color.text} truncate`}>{ev.title}</p>
                    <p className={`text-[10px] ${color.text} opacity-70`}>
                      {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                      {ev.event_time && ` · ${ev.event_time}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
