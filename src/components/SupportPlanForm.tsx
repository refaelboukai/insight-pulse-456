import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, Clock, User, Plus, Minus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'];

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  social: 'חברתית',
  emotional: 'רגשית',
  academic: 'לימודית',
  behavioral: 'התנהגותית',
};

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
      // Get start of current week (Sunday)
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

  const getCompletionCount = (assignment: Assignment) => {
    const today = new Date().toISOString().split('T')[0];
    if (assignment.frequency === 'daily') {
      return completions.filter(c => c.assignment_id === assignment.id && c.is_completed && c.completion_date === today).length;
    }
    // weekly - count all completions this week
    return completions.filter(c => c.assignment_id === assignment.id && c.is_completed).length;
  };

  const getTodayCount = (assignmentId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return completions.filter(c => c.assignment_id === assignmentId && c.is_completed && c.completion_date === today).length;
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
      toast.success('מופע נוסף בהצלחה');
    }
    setSubmitting(null);
  };

  const handleRemoveCompletion = async (assignmentId: string) => {
    if (!user) return;
    setSubmitting(assignmentId);
    const assignmentCompletions = completions.filter(
      c => c.assignment_id === assignmentId && c.is_completed
    );
    const lastCompletion = assignmentCompletions[assignmentCompletions.length - 1];
    if (lastCompletion) {
      await supabase.from('support_completions').delete().eq('id', lastCompletion.id);
      setCompletions(prev => prev.filter(c => c.id !== lastCompletion.id));
      toast.success('מופע הוסר');
    }
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
      <div className="card-styled rounded-2xl p-3">
        <p className="text-sm font-semibold mb-2">בחר/י את שמך</p>
        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
          <SelectTrigger className="h-10 text-sm">
            <SelectValue placeholder="בחר/י איש צוות" />
          </SelectTrigger>
          <SelectContent>
            {staffMembers.map(sm => (
              <SelectItem key={sm.id} value={sm.id}>{sm.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStaffId && assignments.length === 0 && (
        <div className="card-styled rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">אין תלמידים משויכים</p>
        </div>
      )}

      {assignments.map(a => {
        const count = getCompletionCount(a);
        const required = a.frequency_count || 1;
        const allDone = count >= required;
        return (
          <div
            key={a.id}
            className={`card-styled rounded-2xl p-3 transition-all ${allDone ? 'border-success/30 bg-success/5' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{studentName(a.student_id)}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
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

            {/* Completion counter */}
            <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${allDone ? 'bg-success/10 border border-success/30' : 'bg-muted/50 border border-border'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${allDone ? 'text-success' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-semibold ${allDone ? 'text-success' : 'text-foreground'}`}>
                  {count}/{required}
                </span>
                <span className="text-xs text-muted-foreground">בוצעו {a.frequency === 'daily' ? 'היום' : 'השבוע'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  disabled={submitting === a.id || count === 0}
                  onClick={() => handleRemoveCompletion(a.id)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant={allDone ? 'default' : 'outline'}
                  className={`h-8 w-8 rounded-full ${allDone ? 'bg-success hover:bg-success/90 text-white' : ''}`}
                  disabled={submitting === a.id || count >= required}
                  onClick={() => handleAddCompletion(a.id)}
                >
                  {submitting === a.id ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {selectedStaffId && assignments.length > 0 && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-primary/5 border border-primary/20">
          <p className="text-xs font-medium text-primary">
            {assignments.filter(a => getCompletionCount(a) >= (a.frequency_count || 1)).length}/{assignments.length} הושלמו {assignments.some(a => a.frequency === 'weekly') ? 'השבוע' : 'היום'}
          </p>
        </div>
      )}
    </div>
  );
}
