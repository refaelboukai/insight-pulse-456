import { Student, ActivityLog } from '@reset/types';

interface Props {
  students: Student[];
  activities: ActivityLog[];
}

export default function DashboardStats({ students, activities }: Props) {
  const totalCheckins = activities.length;
  const supportRequests = activities.filter(a => a.supportRequested).length;
  const uniqueSkills = new Set(activities.filter(a => a.skillUsed).map(a => a.skillUsed)).size;
  const activeToday = new Set(
    activities
      .filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString())
      .map(a => a.studentId)
  ).size;

  const stats = [
    { label: 'תלמידים', value: students.length, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className="card-reset p-4 text-center">
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
