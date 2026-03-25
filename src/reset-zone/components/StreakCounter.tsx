import { useApp } from '@/reset-zone/contexts/AppContext';

export default function StreakCounter() {
  const { activities } = useApp();
  const days = new Set(activities.map(a => new Date(a.timestamp).toDateString()));
  const count = days.size;
  if (count === 0) return null;
  return (
    <div className="inline-flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5 text-xs font-semibold text-primary">
      🔥 {count} ימים פעילים
    </div>
  );
}
