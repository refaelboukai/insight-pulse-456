import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, CheckCircle2, Clock, User } from 'lucide-react';
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
  target_date: string | null;
  staff_members: { name: string } | null;
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
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Load staff members that have assignments
  useEffect(() => {
    const load = async () => {
      const [staffRes, studentsRes] = await Promise.all([
        supabase.from('staff_members').select('*').eq('is_active', true).order('name'),
        supabase.from('students').select('*').eq('is_active', true).order('last_name'),
      ]);
      if (studentsRes.data) setStudents(studentsRes.data);

      // Only show staff members that have active assignments
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

  // Load assignments & completions when staff selected
  useEffect(() => {
    if (!selectedStaffId) { setAssignments([]); setCompletions([]); return; }
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [assignRes, compRes] = await Promise.all([
        supabase.from('support_assignments').select('*, staff_members(name)')
          .eq('staff_member_id', selectedStaffId)
          .eq('is_active', true),
        supabase.from('support_completions').select('*')
          .eq('completion_date', today),
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

  const isCompletedToday = (assignmentId: string) => {
    return completions.some(c => c.assignment_id === assignmentId && c.is_completed);
  };

  const handleToggleCompletion = async (assignmentId: string) => {
    if (!user) return;
    const completed = isCompletedToday(assignmentId);
    setSubmitting(assignmentId);

    if (completed) {
      // Remove completion
      const comp = completions.find(c => c.assignment_id === assignmentId);
      if (comp) {
        await supabase.from('support_completions').delete().eq('id', comp.id);
        setCompletions(prev => prev.filter(c => c.id !== comp.id));
      }
    } else {
      // Add completion
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('support_completions').insert({
        assignment_id: assignmentId,
        completion_date: today,
        is_completed: true,
        completed_by: user.id,
        notes: notes[assignmentId] || null,
      } as any).select().single();

      if (error) {
        console.error(error);
        toast.error('שגיאה בעדכון');
      } else if (data) {
        setCompletions(prev => [...prev, data as any]);
        toast.success('עודכן בהצלחה');
      }
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
      {/* Staff member selector */}
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

      {/* Assignments list */}
      {selectedStaffId && assignments.length === 0 && (
        <div className="card-styled rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground">אין תלמידים משויכים</p>
        </div>
      )}

      {assignments.map(a => {
        const completed = isCompletedToday(a.id);
        return (
          <div
            key={a.id}
            className={`card-styled rounded-2xl p-3 transition-all ${completed ? 'border-success/30 bg-success/5' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{studentName(a.student_id)}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-xs">{a.frequency === 'daily' ? 'יומי' : 'שבועי'}</Badge>
                  {a.target_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(a.target_date).toLocaleDateString('he-IL')}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant={completed ? 'default' : 'outline'}
                className={`gap-1 text-xs h-8 ${completed ? 'bg-success hover:bg-success/90 text-white' : ''}`}
                disabled={submitting === a.id}
                onClick={() => handleToggleCompletion(a.id)}
              >
                {submitting === a.id ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {completed ? 'בוצע ✓' : 'סמן כבוצע'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(a.support_types || []).map((t: string) => (
                <Badge key={t} variant="secondary" className="text-xs px-1.5 py-0">
                  {SUPPORT_TYPE_LABELS[t] || t}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}

      {/* Summary */}
      {selectedStaffId && assignments.length > 0 && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2 bg-primary/5 border border-primary/20">
          <p className="text-xs font-medium text-primary">
            {completions.filter(c => c.is_completed && assignments.some(a => a.id === c.assignment_id)).length}/{assignments.length} בוצעו היום
          </p>
        </div>
      )}
    </div>
  );
}
