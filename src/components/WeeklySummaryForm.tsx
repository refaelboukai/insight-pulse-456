import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string | null;
};

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

export default function WeeklySummaryForm() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [enriching, setEnriching] = useState(false);
  const weekStart = getWeekStart();

  useEffect(() => {
    supabase
      .from('students')
      .select('id, first_name, last_name, class_name')
      .eq('is_active', true)
      .order('class_name')
      .order('last_name')
      .then(({ data }) => {
        if (data) setStudents(data);
      });
    // Load existing summaries for this week
    loadExistingSummaries();
  }, []);

  const loadExistingSummaries = async () => {
    const { data } = await supabase
      .from('weekly_summaries' as any)
      .select('student_id, summary_text')
      .eq('week_start', weekStart);
    if (data) {
      const ids = new Set((data as any[]).map((d: any) => d.student_id));
      setSavedIds(ids);
    }
  };

  useEffect(() => {
    if (!selectedStudentId) { setSummaryText(''); return; }
    // Load existing summary for selected student this week
    supabase
      .from('weekly_summaries' as any)
      .select('summary_text')
      .eq('student_id', selectedStudentId)
      .eq('week_start', weekStart)
      .maybeSingle()
      .then(({ data }: any) => {
        setSummaryText(data?.summary_text || '');
      });
  }, [selectedStudentId]);

  const handleSubmit = async () => {
    if (!user || !selectedStudentId || !summaryText.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('weekly_summaries' as any)
        .upsert({
          student_id: selectedStudentId,
          staff_user_id: user.id,
          week_start: weekStart,
          summary_text: summaryText.trim(),
        } as any, { onConflict: 'student_id,week_start' });
      if (error) throw error;
      toast.success('הסיכום נשמר בהצלחה');
      setSavedIds(prev => new Set(prev).add(selectedStudentId));
      // Auto-advance to next student in same class
      const currentStudent = students.find(s => s.id === selectedStudentId);
      if (currentStudent?.class_name) {
        const classStudents = students.filter(s => s.class_name === currentStudent.class_name);
        const currentIdx = classStudents.findIndex(s => s.id === selectedStudentId);
        const nextStudent = classStudents.find((s, i) => i > currentIdx && !savedIds.has(s.id) && s.id !== selectedStudentId);
        const fallback = classStudents.find((s, i) => i > currentIdx && s.id !== selectedStudentId);
        const next = nextStudent || fallback;
        if (next) {
          setSelectedStudentId(next.id);
          toast.info(`עובר ל${next.first_name} ${next.last_name}`);
        }
      }
    } catch (e: any) {
      toast.error('שגיאה בשמירה: ' + (e.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const classes = [...new Set(students.map(s => s.class_name).filter(Boolean))].sort();

  return (
    <div className="space-y-4" dir="rtl">
      <p className="text-xs text-muted-foreground">
        סיכום שבועי לשבוע המתחיל ב-{new Date(weekStart).toLocaleDateString('he-IL')}
      </p>

      {/* Student selector grouped by class */}
      <div className="space-y-2">
        <label className="text-sm font-medium">בחר תלמיד/ה</label>
        <select
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
          className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
        >
          <option value="">— בחר —</option>
          {classes.map(cls => (
            <optgroup key={cls} label={`כיתת ${cls}`}>
              {students.filter(s => s.class_name === cls).map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} {savedIds.has(s.id) ? '✓' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {selectedStudentId && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">סיכום מילולי שבועי</label>
            <Textarea
              value={summaryText}
              onChange={e => setSummaryText(e.target.value)}
              placeholder="כתוב סיכום שבועי על התלמיד/ה..."
              className="min-h-[120px] rounded-xl text-sm"
            />
          </div>

          {/* AI Enrich button */}
          {summaryText.trim().length > 10 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const student = students.find(s => s.id === selectedStudentId);
                if (!student) return;
                setEnriching(true);
                try {
                  const { data, error } = await supabase.functions.invoke('enrich-weekly-summary', {
                    body: {
                      studentId: selectedStudentId,
                      studentName: `${student.first_name} ${student.last_name}`,
                      summaryText: summaryText.trim(),
                      weekStart,
                    },
                  });
                  if (error) throw error;
                  if (data?.error) {
                    toast.error(data.error);
                  } else if (data?.enrichedSummary) {
                    setSummaryText(data.enrichedSummary);
                    toast.success('הסיכום הועשר בהמלצות להורים');
                  }
                } catch (e: any) {
                  toast.error('שגיאה בהעשרת הסיכום');
                  console.error(e);
                } finally {
                  setEnriching(false);
                }
              }}
              disabled={enriching}
              className="gap-1.5 text-xs w-full"
            >
              {enriching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {enriching ? 'מעשיר בהמלצות...' : 'העשר בהמלצות AI להורים'}
            </Button>
          )}

          {savedIds.has(selectedStudentId) && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" /> נשמר סיכום לשבוע זה
            </Badge>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || !summaryText.trim()}
            className="w-full gap-2 rounded-xl"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {savedIds.has(selectedStudentId) ? 'עדכן סיכום' : 'שמור סיכום'}
          </Button>
        </>
      )}
    </div>
  );
}
