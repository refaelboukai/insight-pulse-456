import { useEffect, useState } from 'react';
import StudentDetailDialog from '@/components/StudentDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS, INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS, ABSENCE_REASON_LABELS,
} from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import {
  AlertTriangle, TrendingUp, Users, FileText, Bell, UserPlus, ShieldAlert,
  ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Report = Database['public']['Tables']['lesson_reports']['Row'];
type Student = Database['public']['Tables']['students']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];
type ExceptionalEvent = Database['public']['Tables']['exceptional_events']['Row'];

const CHART_COLORS = ['hsl(168, 50%, 40%)', 'hsl(140, 45%, 42%)', 'hsl(35, 80%, 55%)', 'hsl(15, 70%, 52%)', 'hsl(0, 65%, 52%)'];

const CLASS_OPTIONS = ['טלי', 'עדן'];

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<ExceptionalEvent[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dailyAttendance: false, alerts: false, events: false, students: false, reports: false,
  });

  // Add student form
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const fetchAll = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [reportsRes, studentsRes, alertsRes, eventsRes, attendanceRes] = await Promise.all([
      supabase.from('lesson_reports').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('students').select('*').order('class_name').order('last_name'),
      supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('exceptional_events').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('daily_attendance').select('*').eq('attendance_date', today),
    ]);
    if (reportsRes.data) setReports(reportsRes.data);
    if (studentsRes.data) setStudents(studentsRes.data);
    if (alertsRes.data) setAlerts(alertsRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (attendanceRes.data) setDailyAttendance(attendanceRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddStudent = async () => {
    if (!newFirstName.trim() || !newLastName.trim() || !newClass) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    setAddingStudent(true);
    const code = `${newClass === 'טלי' ? 'T' : 'E'}${String(students.length + 1).padStart(3, '0')}`;
    const { error } = await supabase.from('students').insert({
      student_code: code,
      first_name: newFirstName.trim(),
      last_name: newLastName.trim(),
      grade: newClass,
      class_name: newClass,
    });
    if (error) {
      toast.error('שגיאה בהוספת תלמיד/ה');
    } else {
      toast.success(`${newFirstName} ${newLastName} נוסף/ה בהצלחה`);
      setNewFirstName('');
      setNewLastName('');
      setNewClass('');
      setShowAddStudent(false);
      fetchAll();
    }
    setAddingStudent(false);
  };

  // Analytics
  const behaviorDist = (() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => r.behavior_types?.forEach(b => {
      counts[b] = (counts[b] || 0) + 1;
    }));
    return Object.entries(counts).map(([name, value]) => ({
      name: BEHAVIOR_LABELS[name] || name, value,
    }));
  })();

  const attendanceDist = (() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.attendance] = (counts[r.attendance] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: ATTENDANCE_LABELS[name] || name, value,
    }));
  })();

  const studentName = (id: string) => {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'לא ידוע';
  };

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const avgPerformance = reports.filter(r => r.performance_score).length > 0
    ? (reports.reduce((s, r) => s + (r.performance_score || 0), 0) / reports.filter(r => r.performance_score).length).toFixed(1)
    : '—';

  const recentReports = reports.slice(0, 15);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const SectionHeader = ({ title, icon: Icon, count, badge, sectionKey, color = 'text-primary' }: {
    title: string; icon: React.ElementType; count?: number; badge?: string;
    sectionKey: string; color?: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'text-destructive' ? 'bg-destructive/10' : color === 'text-accent' ? 'bg-accent/10' : 'bg-primary/10'}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="font-semibold text-sm">{title}</span>
        {count !== undefined && (
          <Badge variant={badge === 'destructive' ? 'destructive' : 'secondary'} className="text-xs rounded-full px-2">
            {count}
          </Badge>
        )}
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="space-y-3 max-w-2xl mx-auto animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Users, value: students.length, label: 'תלמידים', color: 'bg-primary/10 text-primary' },
          { icon: FileText, value: reports.length, label: 'דיווחים', color: 'bg-primary/10 text-primary' },
          { icon: Bell, value: unreadAlerts.length, label: 'התראות', color: 'bg-accent/10 text-accent' },
          { icon: TrendingUp, value: avgPerformance, label: 'ממוצע', color: 'bg-success/10 text-success' },
        ].map((stat, i) => (
          <div key={i} className="card-styled rounded-xl p-3 text-center">
            <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Daily Attendance */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="ביקור סדיר — היום" icon={ClipboardCheck} count={dailyAttendance.filter(a => !a.is_present).length} badge={dailyAttendance.filter(a => !a.is_present).length > 0 ? 'destructive' : undefined} sectionKey="dailyAttendance" />
        {expandedSections.dailyAttendance && (
          <div className="px-3 pb-3">
            {(() => {
              const absentRecords = dailyAttendance.filter(a => !a.is_present);
              const presentCount = students.length - absentRecords.length;
              if (absentRecords.length === 0) {
                return (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1.5" />
                    <p className="text-xs text-success font-medium">כל התלמידים נוכחים היום!</p>
                    <p className="text-[10px] text-muted-foreground">{presentCount}/{students.length}</p>
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>📅 {new Date().toLocaleDateString('he-IL')}</span>
                    <span>{presentCount}/{students.length} נוכחים</span>
                  </div>
                  {CLASS_OPTIONS.map(cls => {
                    const classAbsent = absentRecords.filter(a => {
                      const s = students.find(st => st.id === a.student_id);
                      return s?.class_name === cls;
                    });
                    if (classAbsent.length === 0) return null;
                    return (
                      <div key={cls}>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">הכיתה של {cls}</p>
                        {classAbsent.map(a => {
                          const s = students.find(st => st.id === a.student_id);
                          if (!s) return null;
                          const reason = a.absence_reason
                            ? ABSENCE_REASON_LABELS[a.absence_reason] || a.absence_reason
                            : 'לא צוינה סיבה';
                          return (
                            <div key={a.student_id} className="flex items-center justify-between text-xs bg-destructive/5 rounded-lg px-3 py-1.5 mb-1">
                              <span className="font-medium">{s.first_name} {s.last_name}</span>
                              <Badge variant="outline" className="text-[10px] px-2">{reason}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="card-styled rounded-2xl overflow-hidden border-destructive/20">
          <SectionHeader title="התראות" icon={AlertTriangle} count={unreadAlerts.length} badge="destructive" sectionKey="alerts" color="text-destructive" />
          {expandedSections.alerts && (
            <div className="px-3 pb-3 space-y-1.5">
              {unreadAlerts.slice(0, 5).map(a => (
                <div key={a.id} className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs">{studentName(a.student_id)}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Exceptional Events */}
      {events.length > 0 && (
        <div className="card-styled rounded-2xl overflow-hidden border-accent/20">
          <SectionHeader title="אירועים חריגים" icon={ShieldAlert} count={events.length} sectionKey="events" color="text-accent" />
          {expandedSections.events && (
            <div className="px-3 pb-3 space-y-1.5">
              {events.slice(0, 5).map(ev => (
                <div key={ev.id} className="p-2.5 rounded-lg bg-accent/5 border border-accent/10">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {INCIDENT_TYPE_LABELS[ev.incident_type] || ev.incident_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ev.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2">{ev.description}</p>
                  {ev.people_involved && (
                    <p className="text-[10px] text-muted-foreground mt-1">מעורבים: {ev.people_involved}</p>
                  )}
                  {ev.followup_required && (
                    <Badge variant="destructive" className="text-[10px] mt-1 px-1.5 py-0">נדרש מעקב</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card-styled rounded-2xl p-3">
          <h4 className="text-xs font-semibold mb-2 text-center">התנהגות</h4>
          {behaviorDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={behaviorDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={25}>
                  {behaviorDist.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground text-xs py-8">אין נתונים</p>
          )}
        </div>

        <div className="card-styled rounded-2xl p-3">
          <h4 className="text-xs font-semibold mb-2 text-center">נוכחות</h4>
          {attendanceDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={attendanceDist} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <XAxis dataKey="name" fontSize={9} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={9} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ fontSize: 11, direction: 'rtl' }} />
                <Bar dataKey="value" fill="hsl(168, 50%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground text-xs py-8">אין נתונים</p>
          )}
        </div>
      </div>

      {/* Students */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-1">
          <SectionHeader title="תלמידים" icon={Users} count={students.length} sectionKey="students" />
          <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="gap-1 text-xs h-8 ml-2">
                <UserPlus className="h-3.5 w-3.5" />
                הוספה
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-sm">הוספת תלמיד/ה</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-1">
                <Input placeholder="שם פרטי" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="h-10 text-sm" />
                <Input placeholder="שם משפחה" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="h-10 text-sm" />
                <Select value={newClass} onValueChange={setNewClass}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר/י כיתה" /></SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map(c => (<SelectItem key={c} value={c}>הכיתה של {c}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddStudent} disabled={addingStudent} className="w-full h-10 text-sm">
                  {addingStudent ? 'מוסיף...' : 'הוספה'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {expandedSections.students && (
          <div className="px-3 pb-3">
            {CLASS_OPTIONS.map(cls => {
              const classStudents = students.filter(s => s.class_name === cls);
              return (
                <div key={cls} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">הכיתה של {cls} ({classStudents.length})</p>
                  <div className="space-y-1">
                    {classStudents.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className="w-full text-right text-xs p-2.5 rounded-lg bg-secondary/50 border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{s.first_name} {s.last_name}</span>
                          <div className="flex items-center gap-1.5">
                            {(s as any).gender && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{(s as any).gender === 'ז' ? '👦' : '👧'}</Badge>}
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">שכבה {s.grade}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                          {(s as any).city && <span>🏠 {(s as any).city}</span>}
                          {(s as any).date_of_birth && <span>🎂 {new Date((s as any).date_of_birth).toLocaleDateString('he-IL')}</span>}
                          {(s as any).mother_name && <span>👩 {(s as any).mother_name} {(s as any).mother_phone ? `(${(s as any).mother_phone})` : ''}</span>}
                          {(s as any).father_name && (s as any).father_name !== 'אין קשר אב' && <span>👨 {(s as any).father_name} {(s as any).father_phone ? `(${(s as any).father_phone})` : ''}</span>}
                        </div>
                        {s.student_code && <p className="text-[9px] text-muted-foreground/60 mt-1">ת.ז: {s.student_code}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent reports */}
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="דיווחים אחרונים" icon={FileText} count={reports.length} sectionKey="reports" />
        {expandedSections.reports && (
          <div className="px-3 pb-3 space-y-1.5">
            {recentReports.map(r => (
              <div key={r.id} className="p-2.5 rounded-lg border bg-card">
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <button onClick={() => { const s = students.find(st => st.id === r.student_id); if (s) setSelectedStudent(s); }} className="font-medium text-xs text-primary hover:underline text-right">{studentName(r.student_id)}</button>
                    <p className="text-[10px] text-muted-foreground">{r.lesson_subject}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.report_date).toLocaleDateString('he-IL')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {r.attendance === 'full' && <CheckCircle2 className="h-2.5 w-2.5 ml-0.5" />}
                    {r.attendance === 'partial' && <Clock className="h-2.5 w-2.5 ml-0.5" />}
                    {r.attendance === 'absent' && <XCircle className="h-2.5 w-2.5 ml-0.5" />}
                    {ATTENDANCE_LABELS[r.attendance]}
                  </Badge>
                  {r.behavior_types?.map(b => (
                    <Badge key={b} variant={b === 'violent' ? 'destructive' : 'outline'} className="text-[10px] px-1.5 py-0">
                      {BEHAVIOR_LABELS[b]}
                    </Badge>
                  ))}
                  {r.behavior_severity && (
                    <Badge className={`severity-badge-${r.behavior_severity} text-[10px] px-1.5 py-0`}>
                      חומרה {r.behavior_severity}
                    </Badge>
                  )}
                  {r.participation && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{PARTICIPATION_LABELS[r.participation]}</Badge>
                  )}
                  {r.performance_score && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">ביצועים: {r.performance_score}</Badge>
                  )}
                </div>
                {r.comment && <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-1">{r.comment}</p>}
              </div>
            ))}
            {recentReports.length === 0 && (
              <p className="text-center text-muted-foreground text-xs py-6">אין דיווחים עדיין</p>
            )}
          </div>
        )}
      </div>

      {/* Student Detail Dialog */}
      <StudentDetailDialog
        student={selectedStudent}
        open={!!selectedStudent}
        onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}
      />
    </div>
  );
}