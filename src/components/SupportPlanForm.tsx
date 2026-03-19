import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, CheckCircle2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  social: 'חברתית',
  emotional: 'רגשית',
  academic: 'לימודית',
  behavioral: 'התנהגותית',
};

const SUPPORT_TYPES = Object.keys(SUPPORT_TYPE_LABELS) as Array<keyof typeof SUPPORT_TYPE_LABELS>;

export default function SupportPlanForm() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [providerName, setProviderName] = useState('');
  const [supportTypes, setSupportTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loggedStudentIds, setLoggedStudentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.from('students').select('*').eq('is_active', true).order('last_name')
      .then(({ data }) => { if (data) setStudents(data); });
  }, []);

  const selectedStudent = students.find(s => s.id === studentId);
  const classes = [...new Set(students.map(s => s.class_name).filter(Boolean))];

  const toggleSupportType = (t: string) => {
    setSupportTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const resetForm = () => {
    setStudentId('');
    setSupportTypes([]);
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!user || !studentId || !providerName.trim() || supportTypes.length === 0) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('support_sessions' as any).insert({
      student_id: studentId,
      staff_user_id: user.id,
      provider_name: providerName.trim(),
      support_types: supportTypes,
      notes: notes.trim() || null,
    } as any);

    if (error) {
      console.error(error);
      toast.error('שגיאה בשמירת הדיווח');
    } else {
      toast.success(`תמיכה נשמרה עבור ${selectedStudent?.first_name} ${selectedStudent?.last_name}`);
      setLoggedStudentIds(prev => new Set(prev).add(studentId));
      resetForm();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Student selection */}
      {selectedStudent ? (
        <div className="rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: 'var(--gradient-primary)' }}>
          <p className="font-semibold text-primary-foreground text-sm">
            {selectedStudent.first_name} {selectedStudent.last_name}
            <span className="text-primary-foreground/60 font-normal mr-2 text-xs">הכיתה של {selectedStudent.class_name}</span>
          </p>
          <button onClick={() => setStudentId('')} className="text-primary-foreground/70 hover:text-primary-foreground text-xs underline">
            שנה
          </button>
        </div>
      ) : (
        <div className="card-styled rounded-2xl p-3">
          {classes.map(cls => (
            <div key={cls!} className="mb-3 last:mb-0">
              <p className="text-sm font-bold text-foreground mb-1.5">הכיתה של {cls}</p>
              <div className="flex flex-wrap gap-1">
                {students.filter(s => s.class_name === cls).map(s => {
                  const logged = loggedStudentIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => !logged && setStudentId(s.id)}
                      disabled={logged}
                      className={`text-xs py-1.5 px-2.5 rounded-lg border transition-colors ${
                        logged
                          ? 'border-success/30 bg-success/10 text-success line-through cursor-default'
                          : 'border-border bg-card hover:bg-primary/10 hover:border-primary/30'
                      }`}
                    >
                      {logged && '✓ '}{s.first_name} {s.last_name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logged count */}
      {loggedStudentIds.size > 0 && !selectedStudent && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-success/10 border border-success/20">
          <p className="text-xs text-success font-medium">
            ✓ דווחו {loggedStudentIds.size} תלמידים
          </p>
          <button
            onClick={() => setLoggedStudentIds(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            איפוס
          </button>
        </div>
      )}

      {selectedStudent && (
        <>
          {/* Provider name */}
          <div className="card-styled rounded-2xl p-3">
            <p className="text-sm font-semibold mb-2">שם הספק / גורם מטפל</p>
            <Input
              placeholder="למשל: יועצת בית הספר, עו״ס..."
              value={providerName}
              onChange={e => setProviderName(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Support type */}
          <div className="card-styled rounded-2xl p-3">
            <p className="text-sm font-semibold mb-2">סוג תמיכה</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SUPPORT_TYPES.map(type => {
                const isActive = supportTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleSupportType(type)}
                    className={`text-sm py-2.5 px-3 rounded-xl border transition-all font-medium ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    {SUPPORT_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="card-styled rounded-2xl p-3">
            <p className="text-sm font-semibold mb-2">הערות (אופציונלי)</p>
            <Textarea
              placeholder="פרטים נוספים על המפגש..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !providerName.trim() || supportTypes.length === 0}
            className="w-full h-11 text-sm font-semibold gap-2 rounded-xl shadow-md"
          >
            {submitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? 'שומר...' : 'שמור דיווח תמיכה'}
          </Button>
        </>
      )}
    </div>
  );
}
