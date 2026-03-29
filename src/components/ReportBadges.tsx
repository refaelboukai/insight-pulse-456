import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS } from '@/lib/constants';

// Positive values that should be green with checkmark
const POSITIVE_ATTENDANCE = ['full'];
const POSITIVE_BEHAVIOR = ['respectful'];
const POSITIVE_PARTICIPATION = ['active_participation', 'completed_tasks'];
const NEGATIVE_PARTICIPATION = ['no_function'];

export function AttendanceBadge({ status }: { status: string }) {
  const isPositive = POSITIVE_ATTENDANCE.includes(status);
  return (
    <Badge
      variant="outline"
      className={`text-[10px] rounded-md gap-1 ${
        isPositive
          ? 'bg-green-50 text-green-700 border-green-200'
          : status === 'partial'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {isPositive && <CheckCircle2 className="h-3 w-3" />}
      {ATTENDANCE_LABELS[status] || status}
    </Badge>
  );
}

export function BehaviorBadge({ type, allTypes }: { type: string; allTypes?: string[] }) {
  const isPositive = POSITIVE_BEHAVIOR.includes(type);
  const colorClass = isPositive
    ? 'bg-green-50 text-green-700 border-green-200'
    : type === 'violent'
    ? 'bg-red-50 text-red-700 border-red-200'
    : type === 'disruptive'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-orange-50 text-orange-700 border-orange-200'; // non_respectful

  return (
    <Badge variant="outline" className={`text-[10px] rounded-md gap-1 ${colorClass}`}>
      {isPositive && <CheckCircle2 className="h-3 w-3" />}
      {BEHAVIOR_LABELS[type] || type}
    </Badge>
  );
}

export function ParticipationBadge({ level }: { level: string }) {
  const isPositive = POSITIVE_PARTICIPATION.includes(level);
  const isNegative = NEGATIVE_PARTICIPATION.includes(level);
  const colorClass = isPositive
    ? 'bg-green-50 text-green-700 border-green-200'
    : isNegative
    ? 'bg-orange-50 text-orange-700 border-orange-200'
    : level === 'no_participation'
    ? 'bg-red-50 text-red-700 border-red-200'
    : '';

  return (
    <Badge variant="outline" className={`text-[10px] rounded-md gap-1 ${colorClass}`}>
      {isPositive && <CheckCircle2 className="h-3 w-3" />}
      {PARTICIPATION_LABELS[level] || level}
    </Badge>
  );
}
