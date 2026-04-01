import { useState, useEffect } from 'react';
import { useApp } from '@reset/contexts/AppContext';
import { LogOut, AlertTriangle, BarChart3, FileText, Users, Shield, Activity, Key, Brain, Star, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { resetSupabase } from '../supabase';
import DashboardStats from '@reset/components/dashboard/DashboardStats';
import StudentProfile from '@reset/components/dashboard/StudentProfile';
import AlertsView, { useAlerts } from '@reset/components/dashboard/AlertsView';
import ChartsView from '@reset/components/dashboard/ChartsView';
import PeriodicReports from '@reset/components/dashboard/PeriodicReports';
import ManageStudents from '@reset/components/dashboard/ManageStudents';
import RecentActivityFeed from '@reset/components/dashboard/RecentActivityFeed';
import ManageSpecialCodes from '@reset/components/dashboard/ManageSpecialCodes';
import BrainTrainingDashboard from '@reset/components/dashboard/BrainTrainingDashboard';
import ReflectionsDashboard from '@reset/components/dashboard/ReflectionsDashboard';

type ViewType = 'overview' | 'student' | 'manage' | 'alerts' | 'charts' | 'reports' | 'activity' | 'codes' | 'brain' | 'reflections';

export default function StaffDashboard() {
  const { students, activities, logout, setStudents, refreshData, specialCodes, refreshSpecialCodes } = useApp();

  useEffect(() => {
    const interval = setInterval(() => refreshData(), 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const [view, setView] = useState<ViewType>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const alerts = useAlerts(students, activities);

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setView('student');
  };

  const goOverview = () => setView('overview');

  const exportActivities = () => {
    if (activities.length === 0) return;
    const rows = activities.map(a => ({
      תלמיד: a.studentName, רגש: a.selectedState,
      עוצמה: a.intensityScore || '', בקשת_עזרה: a.supportRequested ? 'כן' : 'לא',
      תאריך: new Date(a.timestamp).toLocaleString('he-IL'),
    }));
    const headers = Object.keys(rows[0]).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'activities.csv'; a.click();
  };

  // Sub-views
  if (view === 'student' && selectedStudentId) {
    const student = students.find(s => s.id === selectedStudentId);
    if (student) return <StudentProfile student={student} activities={activities} onBack={goOverview} />;
  }
  if (view === 'alerts') return <AlertsView students={students} activities={activities} onBack={goOverview} onSelectStudent={handleSelectStudent} />;
  if (view === 'charts') return <ChartsView activities={activities} onBack={goOverview} />;
  if (view === 'reports') return <PeriodicReports students={students} activities={activities} onBack={goOverview} onSelectStudent={handleSelectStudent} />;
  if (view === 'manage') return <ManageStudents students={students} activities={activities} setStudents={setStudents} refreshData={refreshData} onBack={goOverview} />;
  if (view === 'activity') return <RecentActivityFeed students={students} activities={activities} onBack={goOverview} onSelectStudent={handleSelectStudent} />;
  if (view === 'codes') return <ManageSpecialCodes specialCodes={specialCodes} refreshSpecialCodes={refreshSpecialCodes} onBack={goOverview} />;
  if (view === 'brain') return <BrainTrainingDashboard students={students} onBack={goOverview} onSelectStudent={handleSelectStudent} />;
  if (view === 'reflections') return <ReflectionsDashboard students={students} onBack={goOverview} onSelectStudent={handleSelectStudent} />;

  const menuItems: { key: ViewType; icon: typeof Activity; label: string; iconBg: string; iconColor: string; badge?: number }[] = [
    { key: 'activity', icon: Activity, label: 'פעילות אחרונה', iconBg: 'bg-[hsl(210,80%,93%)]', iconColor: 'text-[hsl(210,70%,45%)]', badge: activities.length || undefined },
    { key: 'alerts', icon: Shield, label: 'התראות חכמות', iconBg: 'bg-[hsl(0,80%,93%)]', iconColor: 'text-[hsl(0,70%,50%)]', badge: alerts.length || undefined },
    { key: 'charts', icon: BarChart3, label: 'גרפים ותרשימים', iconBg: 'bg-[hsl(142,45%,91%)]', iconColor: 'text-[hsl(142,50%,35%)]' },
    { key: 'brain', icon: Brain, label: 'אימון מוח', iconBg: 'bg-[hsl(265,50%,92%)]', iconColor: 'text-[hsl(265,45%,45%)]' },
    { key: 'reports', icon: FileText, label: 'דוחות תקופתיים', iconBg: 'bg-[hsl(35,50%,90%)]', iconColor: 'text-[hsl(35,60%,35%)]' },
    { key: 'reflections', icon: Star, label: 'התבוננות עצמית', iconBg: 'bg-[hsl(45,80%,90%)]', iconColor: 'text-[hsl(45,70%,35%)]' },
  ];

  const managementItems: typeof menuItems = [
    { key: 'manage', icon: Users, label: 'ניהול תלמידים', iconBg: 'bg-[hsl(174,40%,90%)]', iconColor: 'text-[hsl(174,42%,35%)]' },
    { key: 'codes', icon: Key, label: 'קודים מיוחדים', iconBg: 'bg-[hsl(290,40%,92%)]', iconColor: 'text-[hsl(290,40%,40%)]' },
  ];

  const renderCard = (item: typeof menuItems[0]) => {
    const Icon = item.icon;
    return (
      <motion.button
        key={item.key}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setView(item.key)}
        className="relative rounded-2xl bg-card border border-border/60 p-5 flex flex-col items-center gap-3 text-center cursor-pointer transition-shadow hover:shadow-md"
      >
        <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center`}>
          <Icon size={22} className={item.iconColor} />
        </div>
        <span className="text-sm font-semibold text-foreground leading-tight">{item.label}</span>
        {item.badge && item.badge > 0 && (
          <span className="absolute top-2 left-2 min-w-[22px] h-[22px] flex items-center justify-center text-[11px] font-bold bg-primary text-primary-foreground rounded-full px-1.5">
            {item.badge}
          </span>
        )}
      </motion.button>
    );
  };

  // ---- MAIN OVERVIEW ----
  return (
    <div className="bg-background p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-center">
          <p className="text-2xl font-extrabold text-primary">{students.length}</p>
          <p className="text-xs text-muted-foreground mt-1">תלמידים</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-center">
          <p className="text-2xl font-extrabold text-[hsl(210,70%,45%)]">{activities.length}</p>
          <p className="text-xs text-muted-foreground mt-1">פעילויות</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 p-4 text-center">
          <p className="text-2xl font-extrabold text-[hsl(0,70%,50%)]">{alerts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">התראות</p>
        </div>
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 mb-6 border border-destructive/20 bg-destructive/5 cursor-pointer"
          onClick={() => setView('alerts')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{alerts.length} התראות דורשות תשומת לב</p>
              <p className="text-xs text-muted-foreground">לחץ לצפייה בפרטים</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monitoring & Reports */}
      <div className="mb-5 rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
          <BarChart3 size={13} /> מעקב ודוחות
        </p>
        <div className="grid grid-cols-3 gap-3">
          {menuItems.map(renderCard)}
        </div>
      </div>

      {/* Management */}
      <div className="mb-5 rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
          <Users size={13} /> ניהול
        </p>
        <div className="grid grid-cols-3 gap-3">
          {managementItems.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
