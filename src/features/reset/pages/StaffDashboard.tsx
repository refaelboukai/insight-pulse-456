import { useState, useEffect } from 'react';
import { useApp } from '@reset/contexts/AppContext';
import { LogOut, AlertTriangle, BarChart3, FileText, Users, Shield, Activity, Key, Brain, Star } from 'lucide-react';
import { motion } from 'framer-motion';
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

  // ---- MAIN OVERVIEW ----
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">דשבורד צוות</h1>
          <p className="text-sm text-muted-foreground">בית ספר מרום בית אקשטיין</p>
        </div>
        <button onClick={logout} className="btn-secondary text-sm flex items-center gap-1">
          <LogOut size={14} /> התנתקות
        </button>
      </div>

      <DashboardStats students={students} activities={activities} />

      {/* Alert banner */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-reset p-4 mb-6 border border-destructive/20 bg-destructive/5 cursor-pointer"
          onClick={() => setView('alerts')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{alerts.length} התראות דורשות תשומת לב</p>
              <p className="text-xs text-muted-foreground">לחץ לצפייה בפרטים</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upper group: Monitoring & Reports */}
      <p className="text-xs font-bold text-muted-foreground mb-2">📊 מעקב ודוחות</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button onClick={() => setView('activity')} className="card-reset p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-secondary/50">
          <Activity size={22} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">פעילות אחרונה</span>
          {activities.length > 0 && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{activities.length}</span>}
        </button>
        <button onClick={() => setView('alerts')} className="card-reset p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-secondary/50">
          <Shield size={22} className="text-destructive" />
          <span className="text-xs font-semibold text-foreground">התראות חכמות</span>
          {alerts.length > 0 && <span className="text-xs bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">{alerts.length}</span>}
        </button>
        <button onClick={() => setView('charts')} className="card-reset p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-secondary/50">
          <BarChart3 size={22} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">גרפים ותרשימים</span>
        </button>
        <button onClick={() => setView('brain')} className="card-reset p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-secondary/50">
          <Brain size={22} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">אימון מוח</span>
        </button>
        <button onClick={() => setView('reports')} className="card-reset p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-secondary/50">
          <FileText size={22} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">דוחות תקופתיים</span>
        </button>
        <button onClick={() => setView('reflections')} className="card-reset p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-secondary/50">
          <Star size={22} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">התבוננות עצמית</span>
        </button>
      </div>

      {/* Lower group: Management */}
      <p className="text-xs font-bold text-muted-foreground mb-2">👥 ניהול ותלמידים</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button onClick={() => setView('manage')} className="card-reset p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-secondary/50">
          <Users size={22} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">ניהול תלמידים</span>
        </button>
        <button onClick={() => setView('codes')} className="card-reset p-4 flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-secondary/50">
          <Key size={22} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">קודים מיוחדים</span>
        </button>
      </div>

    </div>
  );
}
