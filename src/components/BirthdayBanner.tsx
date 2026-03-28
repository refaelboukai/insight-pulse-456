import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Cake, X } from 'lucide-react';

interface BirthdayEntry {
  id: string;
  name: string;
  dayOfMonth: number;
  age: number;
  type: 'student' | 'staff';
}

export default function BirthdayBanner() {
  const { user, role } = useAuth();
  const [birthdays, setBirthdays] = useState<BirthdayEntry[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || (role !== 'staff' && role !== 'admin')) return;

    const fetchBirthdays = async () => {
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-indexed
      const currentYear = now.getFullYear();

      const [{ data: students }, { data: staff }] = await Promise.all([
        supabase
          .from('students')
          .select('id, first_name, last_name, date_of_birth')
          .eq('is_active', true)
          .not('date_of_birth', 'is', null),
        supabase
          .from('staff_members')
          .select('id, name, date_of_birth')
          .eq('is_active', true)
          .not('date_of_birth', 'is', null),
      ]);

      const entries: BirthdayEntry[] = [];

      (students || []).forEach(s => {
        if (!s.date_of_birth) return;
        const dob = new Date(s.date_of_birth);
        if (dob.getMonth() === currentMonth) {
          entries.push({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            dayOfMonth: dob.getDate(),
            age: currentYear - dob.getFullYear(),
            type: 'student',
          });
        }
      });

      (staff || []).forEach((s: any) => {
        if (!s.date_of_birth) return;
        const dob = new Date(s.date_of_birth);
        if (dob.getMonth() === currentMonth) {
          entries.push({
            id: s.id,
            name: s.name,
            dayOfMonth: dob.getDate(),
            age: currentYear - dob.getFullYear(),
            type: 'staff',
          });
        }
      });

      entries.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
      setBirthdays(entries);
    };

    fetchBirthdays();
  }, [user, role]);

  if (dismissed || birthdays.length === 0) return null;

  const today = new Date().getDate();
  const todayBirthdays = birthdays.filter(b => b.dayOfMonth === today);
  const upcomingBirthdays = birthdays.filter(b => b.dayOfMonth > today).slice(0, 5);

  if (todayBirthdays.length === 0 && upcomingBirthdays.length === 0) return null;

  return (
    <div className="relative rounded-xl border border-accent/30 bg-accent/10 p-3 mb-3 animate-fade-in" dir="rtl">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 left-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/20 shrink-0">
          <Cake className="h-4 w-4 text-accent-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">🎂 ימי הולדת החודש</p>
          {todayBirthdays.length > 0 && (
            <div className="space-y-0.5">
              {todayBirthdays.map(b => (
                <p key={b.id} className="text-xs font-bold text-primary">
                  🎉 היום! {b.name} {b.type === 'staff' ? '(צוות)' : ''} – בן/בת {b.age}
                </p>
              ))}
            </div>
          )}
          {upcomingBirthdays.length > 0 && (
            <div className="space-y-0.5">
              {upcomingBirthdays.map(b => (
                <p key={b.id} className="text-xs text-muted-foreground">
                  {b.dayOfMonth} לחודש – {b.name} {b.type === 'staff' ? '(צוות)' : ''} (בן/בת {b.age})
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
