import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, VIOLENCE_LABELS,
  SEVERITY_LABELS, PARTICIPATION_LABELS, PERFORMANCE_LABELS,
} from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertTriangle, TrendingUp, Users, FileText, Bell } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Report = Database['public']['Tables']['lesson_reports']['Row'];
type Student = Database['public']['Tables']['students']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];

const CHART_COLORS = ['hsl(168, 45%, 40%)', 'hsl(140, 40%, 45%)', 'hsl(35, 80%, 55%)', 'hsl(20, 70%, 55%)', 'hsl(0, 65%, 55%)'];

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [reportsRes, studentsRes, alertsRes] = await Promise.all([
        supabase.from('lesson_reports').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('students').select('*'),
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (reportsRes.data) setReports(reportsRes.data);
      if (studentsRes.data) setStudents(studentsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Analytics
  const behaviorDist = (() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => r.behavior_types?.forEach(b => {
      counts[b] = (counts[b] || 0) + 1;
    }));
    return Object.entries(counts).map(([name, value]) => ({
      name: BEHAVIOR_LABELS[name] || name,
      value,
    }));
  })();

  const attendanceDist = (() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      counts[r.attendance] = (counts[r.attendance] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: ATTENDANCE_LABELS[name] || name,
      value,
    }));
  })();

  const recentReports = reports.slice(0, 20);

  const studentName = (id: string) => {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'לא ידוע';
  };

  const unreadAlerts = alerts.filter(a => !a.is_read);

  if (loading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">תלמידים</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-sm text-muted-foreground">דיווחים</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{unreadAlerts.length}</p>
                <p className="text-sm text-muted-foreground">התראות חדשות</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {reports.length > 0 ? (reports.reduce((s, r) => s + (r.performance_score || 0), 0) / reports.filter(r => r.performance_score).length).toFixed(1) : '—'}
                </p>
                <p className="text-sm text-muted-foreground">ממוצע ביצועים</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              התראות ({unreadAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {unreadAlerts.map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{studentName(a.student_id)}</p>
                        <p className="text-sm text-muted-foreground">{a.description}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {new Date(a.created_at).toLocaleDateString('he-IL')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">התפלגות התנהגות</CardTitle>
          </CardHeader>
          <CardContent>
            {behaviorDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={behaviorDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {behaviorDist.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">אין נתונים עדיין</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">התפלגות נוכחות</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(168, 45%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">אין נתונים עדיין</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">דיווחים אחרונים</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {recentReports.map(r => (
                <div key={r.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{studentName(r.student_id)}</p>
                      <p className="text-sm text-muted-foreground">{r.lesson_subject}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.report_date).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{ATTENDANCE_LABELS[r.attendance]}</Badge>
                    {r.behavior_types?.map(b => (
                      <Badge key={b} variant={b === 'violent' ? 'destructive' : 'outline'}>
                        {BEHAVIOR_LABELS[b]}
                      </Badge>
                    ))}
                    {r.participation && (
                      <Badge variant="secondary">{PARTICIPATION_LABELS[r.participation]}</Badge>
                    )}
                    {r.performance_score && (
                      <Badge variant="outline">ביצועים: {r.performance_score}</Badge>
                    )}
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
                </div>
              ))}
              {recentReports.length === 0 && (
                <p className="text-center text-muted-foreground py-8">אין דיווחים עדיין</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
