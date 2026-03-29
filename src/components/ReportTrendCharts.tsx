import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ATTENDANCE_LABELS, BEHAVIOR_LABELS, PARTICIPATION_LABELS } from '@/lib/constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

type Report = {
  id: string;
  lesson_subject: string;
  report_date: string;
  attendance: string;
  behavior_types: string[];
  participation: string[];
  performance_score?: number | null;
  comment?: string | null;
  [key: string]: any;
};

interface ReportTrendChartsProps {
  reports: Report[];
  subjects?: { id: string; name: string }[];
}

type MetricKey = 'attendance' | 'behavior' | 'participation';

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: 'attendance', label: 'נוכחות' },
  { key: 'behavior', label: 'התנהגות' },
  { key: 'participation', label: 'תפקוד לימודי' },
];

// Score mappers
function attendanceScore(val: string): number {
  if (val === 'full') return 3;
  if (val === 'partial') return 2;
  return 1; // absent
}

function behaviorScore(types: string[]): number {
  if (types.includes('violent')) return 1;
  if (types.includes('disruptive')) return 2;
  if (types.includes('non_respectful')) return 2.5;
  if (types.includes('respectful')) return 4;
  return 3;
}

function participationScore(levels: string[]): number {
  if (levels.includes('active_participation') && levels.includes('completed_tasks')) return 4;
  if (levels.includes('active_participation')) return 3.5;
  if (levels.includes('completed_tasks')) return 3;
  if (levels.includes('no_participation')) return 2;
  if (levels.includes('no_function')) return 1;
  return 2.5;
}

const METRIC_Y_LABELS: Record<MetricKey, Record<number, string>> = {
  attendance: { 1: 'חיסור', 2: 'חלקית', 3: 'מלאה' },
  behavior: { 1: 'אלימה', 2: 'מפריעה', 3: 'סבירה', 4: 'מכבדת' },
  participation: { 1: 'אין תפקוד', 2: 'חלקי', 3: 'משימות', 4: 'פעיל' },
};

const METRIC_LABELS: Record<MetricKey, Record<number, string>> = {
  attendance: { 1: 'חיסור', 2: 'חלקית', 3: 'מלאה' },
  behavior: { 1: 'אלימה', 2: 'מפריעה', 3: 'בינונית', 4: 'מכבדת' },
  participation: { 1: 'אין תפקוד', 2: 'חלקי', 3: 'ביצוע משימות', 4: 'פעיל מלא' },
};

export default function ReportTrendCharts({ reports, subjects }: ReportTrendChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('attendance');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Get unique subjects from reports
  const reportSubjects = useMemo(() => {
    const set = new Set(reports.map(r => r.lesson_subject));
    return Array.from(set).sort();
  }, [reports]);

  // Filter and build chart data
  const chartData = useMemo(() => {
    const filtered = selectedSubject === 'all'
      ? reports
      : reports.filter(r => r.lesson_subject === selectedSubject);

    // Sort by date ascending
    const sorted = [...filtered].sort((a, b) =>
      new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
    );

    // Group by date
    const grouped: Record<string, { scores: number[]; date: string }> = {};
    sorted.forEach(r => {
      const dateKey = format(new Date(r.report_date), 'dd/MM', { locale: he });
      if (!grouped[dateKey]) grouped[dateKey] = { scores: [], date: dateKey };
      let score: number;
      switch (selectedMetric) {
        case 'attendance': score = attendanceScore(r.attendance); break;
        case 'behavior': score = behaviorScore(r.behavior_types || []); break;
        case 'participation': score = participationScore(r.participation || []); break;
      }
      grouped[dateKey].scores.push(score);
    });

    return Object.values(grouped).map(g => ({
      date: g.date,
      score: Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 10) / 10,
    }));
  }, [reports, selectedSubject, selectedMetric]);

  const yLabels = METRIC_Y_LABELS[selectedMetric];
  const formatYTick = (value: number) => yLabels[value] || '';

  if (reports.length < 2) return null;

  const maxY = selectedMetric === 'attendance' ? 3 : 4;
  const yTicks = selectedMetric === 'attendance' ? [1, 2, 3] : [1, 2, 3, 4];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const labels = METRIC_LABELS[selectedMetric];
    const rounded = Math.round(val);
    return (
      <div className="bg-card border rounded-lg p-2 shadow-md text-xs">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{labels[rounded] || val} ({val})</p>
      </div>
    );
  };

  return (
    <Card className="border-primary/10">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">מגמות לאורך זמן</span>
        </div>

        {/* Subject filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
              selectedSubject === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            כל המקצועות
          </button>
          {reportSubjects.map(subj => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                selectedSubject === subj
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Metric filter */}
        <div className="flex gap-1.5">
          {METRIC_OPTIONS.map(m => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                selectedMetric === m.key
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/20'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {chartData.length < 2 ? (
          <p className="text-xs text-muted-foreground text-center py-4">אין מספיק נתונים להצגת מגמה</p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[1, maxY]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
