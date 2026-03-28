import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Cake, X } from 'lucide-react';
import { getBirthdaysForMonth, type BirthdayEntry } from '@/lib/hebrewCalendar';

export default function BirthdayBanner() {
  const { user, role } = useAuth();
  const [birthdays, setBirthdays] = useState<BirthdayEntry[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || (role !== 'staff' && role !== 'admin')) return;

    const fetchBirthdays = async () => {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth')
        .eq('is_active', true)
        .not('date_of_birth', 'is', null);

      if (data) {
        const now = new Date();
        const bdays = getBirthdaysForMonth(data, now.getFullYear(), now.getMonth());
        setBirthdays(bdays);
      }
    };

    fetchBirthdays();
  }, [user, role]);

  if (dismissed || birthdays.length === 0) return null;

  const today = new Date().getDate();
  const todayBirthdays = birthdays.filter(b => b.dayOfMonth === today);
  const upcomingBirthdays = birthdays.filter(b => b.dayOfMonth > today).slice(0, 5);

  if (todayBirthdays.length === 0 && upcomingBirthdays.length === 0) return null;

  return (
    <div className="relative rounded-xl border border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 mb-3 animate-fade-in" dir="rtl">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 left-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
          <Cake className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">🎂 ימי הולדת החודש</p>
          {todayBirthdays.length > 0 && (
            <div className="space-y-0.5">
              {todayBirthdays.map(b => (
                <p key={b.id} className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  🎉 היום! {b.name} – בן/בת {b.age}
                </p>
              ))}
            </div>
          )}
          {upcomingBirthdays.length > 0 && (
            <div className="space-y-0.5">
              {upcomingBirthdays.map(b => (
                <p key={b.id} className="text-xs text-muted-foreground">
                  {b.dayOfMonth} לחודש – {b.name} (בן/בת {b.age})
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
