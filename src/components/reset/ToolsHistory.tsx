import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { skills } from '@/data/skills';
import { motion } from 'framer-motion';
import { Home, Star, TrendingUp } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

export default function ToolsHistory() {
  const navigate = useNavigate();
  const { lockedStudentId } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!lockedStudentId) return;
    supabase.from('activity_logs').select('*').eq('student_id', lockedStudentId).order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { if (data) setActivities(data); });
  }, [lockedStudentId]);

  const skillCounts: Record<string, { count: number; lastUsed: string }> = {};
  activities.forEach(a => {
    if (a.skill_used) {
      if (!skillCounts[a.skill_used]) skillCounts[a.skill_used] = { count: 0, lastUsed: a.created_at };
      skillCounts[a.skill_used].count++;
      if (a.created_at > skillCounts[a.skill_used].lastUsed) skillCounts[a.skill_used].lastUsed = a.created_at;
    }
  });
  const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1].count - a[1].count);
  const totalDays = new Set(activities.map(a => new Date(a.created_at).toDateString())).size;

  return (
    <PageTransition>
      <div className="min-h-screen p-4 pb-20" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">מה עזר לי בעבר</h2>
        </div>

        {(totalDays > 0 || sortedSkills.length > 0) && (
          <div className="rounded-2xl p-4 mb-6 bg-sky-50 border max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-sky-500" />
              <span className="text-sm font-semibold text-sky-700">תובנות אישיות</span>
            </div>
            {sortedSkills[0] && (
              <p className="text-sm text-sky-600">
                הכלי {skills.find(s => s.id === sortedSkills[0][0])?.name || sortedSkills[0][0]} עוזר לך. השתמשת בו {sortedSkills[0][1].count} פעמים.
              </p>
            )}
            {totalDays > 0 && <p className="text-sm text-sky-600 mt-1">השתמשת באפליקציה {totalDays} ימים.</p>}
          </div>
        )}

        <h3 className="text-base font-bold text-foreground mb-3 max-w-md mx-auto">שימוש בכלים</h3>
        {sortedSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">עדיין אין נתונים. התחל להשתמש בכלים!</p>
        ) : (
          <div className="space-y-2 mb-8 max-w-md mx-auto">
            {sortedSkills.map(([skillId, data]) => {
              const skill = skills.find(s => s.id === skillId);
              return (
                <div key={skillId} className="rounded-2xl border bg-card p-3 flex justify-between items-center shadow-sm">
                  <span className="text-sm font-medium text-foreground">{skill?.name || skillId}</span>
                  <div className="text-left">
                    <span className="text-xs text-muted-foreground">{data.count} פעמים</span><br />
                    <span className="text-xs text-muted-foreground">{new Date(data.lastUsed).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
