import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, X } from 'lucide-react';

export default function DailyReminderBanner() {
  const { user, role } = useAuth();
  const [show, setShow] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (!user || role !== 'staff') return;

    const checkReports = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('lesson_reports')
        .select('*', { count: 'exact', head: true })
        .eq('staff_user_id', user.id)
        .gte('report_date', `${today}T00:00:00`)
        .lte('report_date', `${today}T23:59:59`);

      setReportCount(count || 0);
      // Show banner if no reports submitted today
      if ((count || 0) === 0) {
        setShow(true);
      }
    };

    checkReports();
  }, [user, role]);

  if (!show) return null;

  return (
    <div className="relative rounded-xl border border-accent/30 bg-accent/10 p-3 mb-3 animate-fade-in" dir="rtl">
      <button
        onClick={() => setShow(false)}
        className="absolute top-2 left-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/20 shrink-0">
          <AlertTriangle className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">תזכורת דיווח יומי</p>
          <p className="text-xs text-muted-foreground">
            {reportCount === 0
              ? 'טרם הוגשו דיווחים היום. אל תשכח/י למלא דיווח לאחר כל שיעור!'
              : `הגשת ${reportCount} דיווחים היום.`}
          </p>
        </div>
      </div>
    </div>
  );
}
