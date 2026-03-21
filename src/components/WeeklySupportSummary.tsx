import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, HeartHandshake } from 'lucide-react';

const SUPPORT_LABELS: Record<string, string> = {
  social: 'חברתית', emotional: 'רגשית', academic: 'לימודית', behavioral: 'התנהגותית',
};

interface Props {
  studentIds: Set<string>;
  students: { id: string; first_name: string; last_name: string }[];
  staffMembers: { id: string; name: string }[];
}

interface AssignmentWithCompletion {
  id: string;
  student_id: string;
  staff_member_id: string;
  support_types: string[];
  frequency: string;
  frequency_count: number;
  staff_name: string;
  completionCount: number;
  support_description: string | null;
}

export default function WeeklySupportSummary({ studentIds, students, staffMembers }: Props) {
  const [data, setData] = useState<AssignmentWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get week start (Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const [assignRes, completionsRes] = await Promise.all([
        supabase.from('support_assignments').select('*, staff_members(name)').eq('is_active', true),
        supabase.from('support_completions').select('*').gte('completion_date', weekStartStr),
      ]);

      if (!assignRes.data) { setLoading(false); return; }

      const completions = completionsRes.data || [];
      const filtered = assignRes.data
        .filter((a: any) => studentIds.has(a.student_id))
        .map((a: any) => ({
          id: a.id,
          student_id: a.student_id,
          staff_member_id: a.staff_member_id,
          support_types: a.support_types || [],
          frequency: a.frequency,
          frequency_count: a.frequency_count,
          staff_name: a.staff_members?.name || '—',
          support_description: a.support_description,
          completionCount: completions.filter((c: any) => c.assignment_id === a.id).length,
        }));

      setData(filtered);
      setLoading(false);
    };
    fetchData();
  }, [studentIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return <p className="text-center text-muted-foreground text-xs py-6">אין שיוכי תמיכה פעילים</p>;
  }

  const studentName = (id: string) => {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'לא ידוע';
  };

  // Group by staff
  const byStaff = data.reduce<Record<string, AssignmentWithCompletion[]>>((acc, a) => {
    const key = a.staff_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const totalExpected = data.reduce((s, a) => {
    if (a.frequency === 'daily') {
      const daysPassed = Math.min(new Date().getDay() + 1, 5);
      return s + a.frequency_count * daysPassed;
    }
    return s + a.frequency_count;
  }, 0);
  const totalDone = data.reduce((s, a) => s + a.completionCount, 0);

  return (
    <div className="space-y-3">
      {/* Overall progress */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
        <div className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">סה״כ השבוע</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={totalDone >= totalExpected ? 'default' : 'secondary'} className="text-xs">
            {totalDone}/{totalExpected} בוצעו
          </Badge>
        </div>
      </div>

      {Object.entries(byStaff).map(([staffName, assignments]) => (
        <div key={staffName} className="space-y-1.5">
          <p className="text-xs font-bold text-foreground/80">👤 {staffName}</p>
          {assignments.map(a => {
            let expected = a.frequency_count;
            if (a.frequency === 'daily') {
              expected = a.frequency_count * Math.min(new Date().getDay() + 1, 5);
            }
            const done = a.completionCount;
            const isComplete = done >= expected;

            return (
              <div key={a.id} className={`p-2 rounded-lg border text-xs ${isComplete ? 'bg-success/5 border-success/20' : 'bg-card'}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium">{studentName(a.student_id)}</span>
                  <div className="flex items-center gap-1">
                    {isComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={`font-bold ${isComplete ? 'text-success' : 'text-foreground'}`}>
                      {done}/{expected}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.support_types.map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {SUPPORT_LABELS[t] || t}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px]">{a.frequency === 'daily' ? 'יומי' : 'שבועי'}</Badge>
                </div>
                {a.support_description && <p className="text-[10px] text-muted-foreground mt-0.5">📝 {a.support_description}</p>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
