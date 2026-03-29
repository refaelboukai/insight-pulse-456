import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, Clock, User, Plus, X, CalendarCheck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  social: 'חברתית',
  emotional: 'רגשית',
  academic: 'לימודית',
  behavioral: 'התנהגותית',
};

const HEBREW_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

interface StaffMember {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  student_id: string;
  staff_member_id: string;
  support_types: string[];
  frequency: string;
  frequency_count: number;
  target_date: string | null;
  staff_members: { name: string } | null;
  support_description?: string;
}

interface Completion {
  id: string;
  assignment_id: string;
  completion_date: string;
  is_completed: boolean;
}

export default function SupportPlanForm() {
  const { user } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [staffRes, studentsRes] = await Promise.all([
        supabase.from('staff_members').select('*').eq('is_active', true).order('name'),
        supabase.from('students').select('*').eq('is_active', true).order('last_name'),
      ]);
      if (studentsRes.data) setStudents(studentsRes.data);
      if (staffRes.data) {
        const { data: assignData } = await supabase
          .from('support_assignments')
          .select('staff_member_id')
          .eq('is_active', true);
        const assignedIds = new Set((assignData || []).map(a => a.staff_member_id));
        setStaffMembers(staffRes.data.filter(sm => assignedIds.has(sm.id)));
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedStaffId) { setAssignments([]); setCompletions([]); return; }
    const load = async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const [assignRes, compRes] = await Promise.all([
        supabase.from('support_assignments').select('*, staff_members(name)')
          .eq('staff_member_id', selectedStaffId)
          .eq('is_active', true) as any,
        supabase.from('support_completions').select('*')
          .gte('completion_date', weekStartStr)
          .lte('completion_date', todayStr),
      ]);
      if (assignRes.data) setAssignments(assignRes.data as any[]);
      if (compRes.data) setCompletions(compRes.data as any[]);
    };
    load();
  }, [selectedStaffId]);

  const studentName = (id: string) => {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'לא ידוע';
  };

  const getAssignmentCompletions = (assignmentId: string) => {
    return completions
      .filter(c => c.assignment_id === assignmentId && c.is_completed)
      .sort((a, b) => a.completion_date.localeCompare(b.completion_date));
  };

  const getCompletionCount = (assignment: Assignment) => {
    const today = new Date().toISOString().split('T')[0];
    if (assignment.frequency === 'daily') {
      return completions.filter(c => c.assignment_id === assignment.id && c.is_completed && c.completion_date === today).length;
    }
    return completions.filter(c => c.assignment_id === assignment.id && c.is_completed).length;
  };

  const formatCompletionDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = HEBREW_DAYS[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return { dayName, formatted: `${day}/${month}`, full: `יום ${dayName} ${day}/${month}` };
  };

  const handleAddCompletion = async (assignmentId: string) => {
    if (!user) return;
    setSubmitting(assignmentId);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('support_completions').insert({
      assignment_id: assignmentId,
      completion_date: today,
      is_completed: true,
      completed_by: user.id,
      notes: null,
    } as any).select().single();

    if (error) {
      console.error(error);
      toast.error('שגיאה בעדכון');
    } else if (data) {
      setCompletions(prev => [...prev, data as any]);
      toast.success('ביצוע נרשם בהצלחה');
    }
    setSubmitting(null);
  };

  const handleRemoveCompletion = async (completionId: string, assignmentId: string) => {
    if (!user) return;
    setSubmitting(assignmentId);
    await supabase.from('support_completions').delete().eq('id', completionId);
    setCompletions(prev => prev.filter(c => c.id !== completionId));
    toast.success('ביצוע הוסר');
    setSubmitting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (staffMembers.length === 0) {
    return (
      <div className="card-styled rounded-2xl p-6 text-center max-w-2xl mx-auto">
        <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-semibold mb-1">אין ספקי תמיכה מוגדרים</p>
        <p className="text-xs text-muted-foreground">המנהל צריך להגדיר אנשי צוות ולשייך תלמידים בדשבורד הניהול</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {!selectedStaffId ? (
        <div className="space-y-3">
          <p className="text-sm font-bold text-center">בחר/י את שמך</p>
          <div className="grid grid-cols-3 gap-2">
            {staffMembers.map(sm => (
              <button
                key={sm.id}
                onClick={() => setSelectedStaffId(sm.id)}
                className="card-styled rounded-2xl p-4 text-center transition-all hover:shadow-md hover:border-primary/40 hover:bg-primary/5 active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  {sm.name.charAt(0)}
                </div>
                <p className="text-sm font-semibold leading-tight">{sm.name}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setSelectedStaffId('')}
            className="card-styled rounded-2xl p-2.5 flex items-center gap-2 w-full hover:bg-muted/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              {staffMembers.find(s => s.id === selectedStaffId)?.name.charAt(0)}
            </div>
            <p className="text-sm font-bold flex-1 text-right">{staffMembers.find(s => s.id === selectedStaffId)?.name}</p>
            <span className="text-xs text-muted-foreground">החלף ←</span>
          </button>

          {assignments.length === 0 && (
            <div className="card-styled rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">אין תלמידים משויכים</p>
            </div>
          )}

          {assignments.map(a => {
            const assignmentCompletions = getAssignmentCompletions(a.id);
            const count = getCompletionCount(a);
            const required = a.frequency_count || 1;
            const allDone = count >= required;
            const todayStr = new Date().toISOString().split('T')[0];
            const alreadyDoneToday = assignmentCompletions.some(c => c.completion_date === todayStr);

            return (
              <div
                key={a.id}
                className={`card-styled rounded-2xl p-3 transition-all ${allDone ? 'border-success/30 bg-success/5' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-base">{studentName(a.student_id)}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {a.frequency === 'daily' ? 'יומי' : 'שבועי'} · {required} {a.frequency === 'daily' ? 'ביום' : 'בשבוע'}
                      </Badge>
                      {a.target_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(a.target_date).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {(a.support_types || []).map((t: string) => (
                    <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0">
                      {SUPPORT_TYPE_LABELS[t] || t}
                    </Badge>
                  ))}
                </div>

                {a.support_description && (
                  <p className="text-xs text-foreground/80 mb-2">📝 {a.support_description}</p>
                )}

                {/* Completion dates timeline */}
                <div className={`rounded-xl px-3 py-2.5 ${allDone ? 'bg-success/10 border border-success/30' : 'bg-muted/50 border border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <CalendarCheck className={`h-4 w-4 ${allDone ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-bold ${allDone ? 'text-success' : 'text-foreground'}`}>
                        {count}/{required}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        בוצעו {a.frequency === 'daily' ? 'היום' : 'השבוע'}
                      </span>
                    </div>
                    {!allDone && !(a.frequency === 'daily' && alreadyDoneToday) && (
                      <Button
                        size="sm"
                        variant={allDone ? 'default' : 'outline'}
                        className="h-7 text-xs gap-1 rounded-full"
                        disabled={submitting === a.id}
                        onClick={() => handleAddCompletion(a.id)}
                      >
                        {submitting === a.id ? (
                          <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            סמן ביצוע היום
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Date chips */}
                  {assignmentCompletions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {assignmentCompletions.map(c => {
                        const { dayName, formatted } = formatCompletionDate(c.completion_date);
                        return (
                          <div
                            key={c.id}
                            className="flex items-center gap-1 bg-background rounded-lg px-2 py-1 border border-success/30 text-xs"
                          >
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            <span className="font-medium">יום {dayName}</span>
                            <span className="text-muted-foreground">{formatted}</span>
                            <button
                              onClick={() => handleRemoveCompletion(c.id, a.id)}
                              className="mr-0.5 text-muted-foreground hover:text-destructive transition-colors"
                              disabled={submitting === a.id}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {assignmentCompletions.length === 0 && (
                    <p className="text-xs text-muted-foreground">טרם בוצעו מפגשים {a.frequency === 'daily' ? 'היום' : 'השבוע'}</p>
                  )}
                </div>
              </div>
            );
          })}

          {assignments.length > 0 && (
            <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-primary/5 border border-primary/20">
              <p className="text-xs font-medium text-primary">
                {assignments.filter(a => getCompletionCount(a) >= (a.frequency_count || 1)).length}/{assignments.length} הושלמו {assignments.some(a => a.frequency === 'weekly') ? 'השבוע' : 'היום'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
