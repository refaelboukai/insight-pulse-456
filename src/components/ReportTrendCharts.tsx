import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Customized, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { TrendingUp, BarChart3 } from 'lucide-react';

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
  compact?: boolean;
  title?: string;
}

type MetricKey = 'attendance' | 'behavior' | 'participation';

const METRIC_OPTIONS: { key: MetricKey; label: string; icon: string }[] = [
  { key: 'attendance', label: 'נוכחות', icon: '📋' },
  { key: 'behavior', label: 'התנהגות', icon: '🤝' },
  { key: 'participation', label: 'תפקוד לימודי', icon: '📚' },
];

function attendanceScore(val: string): number {
  if (val === 'full') return 3;
  if (val === 'partial') return 2;
  return 1;
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

const METRIC_TOOLTIP_LABELS: Record<MetricKey, Record<number, string>> = {
  attendance: { 1: 'חיסור', 2: 'נוכחות חלקית', 3: 'נוכחות מלאה' },
  behavior: { 1: 'אלימה', 2: 'מפריעה', 3: 'בינונית', 4: 'מכבדת' },
  participation: { 1: 'אין תפקוד', 2: 'תפקוד חלקי', 3: 'ביצוע משימות', 4: 'פעיל מלא' },
};

const ZONE_COLORS = {
  good: { bg: 'rgba(22, 163, 74, 0.06)', border: 'rgba(22, 163, 74, 0.15)', line: '#16a34a' },
  mid: { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', line: '#f59e0b' },
  bad: { bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.15)', line: '#ef4444' },
};

function getScoreColor(score: number, maxY: number): string {
  const range = maxY - 1;
  const pos = (score - 1) / range;
  if (pos >= 0.667) return ZONE_COLORS.good.line;
  if (pos >= 0.333) return ZONE_COLORS.mid.line;
  return ZONE_COLORS.bad.line;
}

export default function ReportTrendCharts({ reports, subjects, compact, title }: ReportTrendChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('attendance');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const reportSubjects = useMemo(() => {
    const set = new Set(reports.map(r => r.lesson_subject));
    return Array.from(set).sort();
  }, [reports]);

  const chartData = useMemo(() => {
    const filtered = selectedSubject === 'all'
      ? reports
      : reports.filter(r => r.lesson_subject === selectedSubject);

    const sorted = [...filtered].sort((a, b) =>
      new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
    );

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

  const maxY = selectedMetric === 'attendance' ? 3 : 4;
  const yTicks = selectedMetric === 'attendance' ? [1, 2, 3] : [1, 2, 3, 4];
  const yLabels = METRIC_Y_LABELS[selectedMetric];

  // Compute average score for summary badge
  const avgScore = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.round((chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length) * 10) / 10;
  }, [chartData]);

  if (reports.length < 2) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const labels = METRIC_TOOLTIP_LABELS[selectedMetric];
    const rounded = Math.round(val);
    const color = getScoreColor(val, maxY);
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 shadow-xl text-xs">
        <p className="font-semibold text-foreground mb-0.5">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium" style={{ color }}>{labels[rounded] || val}</span>
        </div>
      </div>
    );
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const color = getScoreColor(payload.score, maxY);
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.12} />
        <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="white" strokeWidth={2} />
      </g>
    );
  };

  // Zone background bands rendered via Customized
  const ZoneBands = (props: any) => {
    const { yAxisMap, xAxisMap, offset } = props;
    if (!yAxisMap || !xAxisMap) return null;
    const yAxis = Object.values(yAxisMap)[0] as any;
    const xAxis = Object.values(xAxisMap)[0] as any;
    if (!yAxis || !xAxis) return null;
    
    const scale = yAxis.scale;
    const left = offset?.left ?? xAxis.x;
    const width = (offset?.width ?? xAxis.width);
    const range = maxY - 1;
    const thresholdLow = 1 + range * 0.333;
    const thresholdHigh = 1 + range * 0.667;

    const yTop = scale(maxY);
    const yHigh = scale(thresholdHigh);
    const yLow = scale(thresholdLow);
    const yBottom = scale(1);

    return (
      <g>
        {/* Good zone */}
        <rect x={left} y={yTop} width={width} height={yHigh - yTop} fill={ZONE_COLORS.good.bg} />
        {/* Mid zone */}
        <rect x={left} y={yHigh} width={width} height={yLow - yHigh} fill={ZONE_COLORS.mid.bg} />
        {/* Bad zone */}
        <rect x={left} y={yLow} width={width} height={yBottom - yLow} fill={ZONE_COLORS.bad.bg} />
        {/* Threshold lines */}
        <line x1={left} x2={left + width} y1={yHigh} y2={yHigh} stroke={ZONE_COLORS.good.border} strokeDasharray="4 3" strokeWidth={1} />
        <line x1={left} x2={left + width} y1={yLow} y2={yLow} stroke={ZONE_COLORS.bad.border} strokeDasharray="4 3" strokeWidth={1} />
      </g>
    );
  };

  // Colored segments
  const ColoredSegments = (props: any) => {
    const { formattedGraphicalItems } = props;
    if (!formattedGraphicalItems?.length) return null;
    const lineItem = formattedGraphicalItems[0];
    const points = lineItem?.props?.points;
    if (!points || points.length < 2) return null;
    return (
      <g>
        {points.map((point: any, i: number) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const avgSc = (chartData[i - 1].score + chartData[i].score) / 2;
          const color = getScoreColor(avgSc, maxY);
          return (
            <line
              key={`seg-${i}`}
              x1={prev.x} y1={prev.y}
              x2={point.x} y2={point.y}
              stroke={color} strokeWidth={3} strokeLinecap="round"
            />
          );
        })}
      </g>
    );
  };

  const avgColor = getScoreColor(avgScore, maxY);
  const chartHeight = compact ? 'h-44' : 'h-56';

  return (
    <Card className="border-border/40 shadow-sm overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">{title || 'מגמות לאורך זמן'}</span>
          </div>
          {chartData.length >= 2 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" 
                 style={{ backgroundColor: `${avgColor}15`, color: avgColor }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: avgColor }} />
              ממוצע: {avgScore}
            </div>
          )}
        </div>

        {/* Subject filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
              selectedSubject === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            כל המקצועות
          </button>
          {reportSubjects.map(subj => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                selectedSubject === subj
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/50'
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
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1 ${
                selectedMetric === m.key
                  ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                  : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/20 hover:bg-muted/50'
              }`}
            >
              <span className="text-[10px]">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: ZONE_COLORS.good.line }} />
            <span>טוב</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: ZONE_COLORS.mid.line }} />
            <span>בינוני</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: ZONE_COLORS.bad.line }} />
            <span>נמוך</span>
          </div>
        </div>

        {chartData.length < 2 ? (
          <p className="text-xs text-muted-foreground text-center py-6">אין מספיק נתונים להצגת מגמה</p>
        ) : (
          <div className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                {/* Zone background bands */}
                <Customized component={ZoneBands} />
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  domain={[1, maxY]}
                  ticks={yTicks}
                  tickFormatter={(value: number) => yLabels[value] || ''}
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--foreground))' }}
                  width={80}
                  tickMargin={16}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Invisible line for tooltip + coordinate system */}
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="transparent"
                  strokeWidth={0}
                  dot={<CustomDot />}
                  activeDot={{ r: 8, stroke: 'white', strokeWidth: 3 }}
                  isAnimationActive={false}
                />
                {/* Colored line segments */}
                <Customized component={ColoredSegments} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
