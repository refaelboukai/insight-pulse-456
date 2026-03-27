import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import ReportForm from '@/components/ReportForm';
import ExceptionalEventForm from '@/components/ExceptionalEventForm';
import SharedCalendar from '@/components/SharedCalendar';
import DailyAttendance from '@/components/DailyAttendance';
import AdminDashboard from '@/components/AdminDashboard';
import SupportPlanForm from '@/components/SupportPlanForm';
import GradesForm from '@/components/GradesForm';
import PedagogyForm from '@/components/PedagogyForm';
import WeeklySummaryForm from '@/components/WeeklySummaryForm';
import StudentDashboard from '@/components/StudentDashboard';
import ParentDashboard from '@/components/ParentDashboard';
import DailyReminderBanner from '@/components/DailyReminderBanner';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, AlertTriangle, Shield, ClipboardCheck, HeartHandshake, GraduationCap, User, BookOpen, ChevronLeft, Calendar, UserRound, MessageSquareText } from 'lucide-react';
import logoSrc from '@/assets/logo.jpeg';

type StaffPanel = 'attendance' | 'report' | 'pedagogy' | 'grades' | 'support' | 'event' | 'calendar' | 'weekly_summary' | null;

const staffCards: { key: StaffPanel & string; icon: React.ElementType; label: string; iconBg: string; iconColor: string; activeBg: string }[] = [
  { key: 'attendance', icon: ClipboardCheck, label: 'ביקור', iconBg: 'bg-[hsl(168,40%,92%)]', iconColor: 'text-[hsl(168,50%,30%)]', activeBg: 'bg-[hsl(168,40%,92%)]' },
  { key: 'report', icon: FileText, label: 'דיווח', iconBg: 'bg-[hsl(220,45%,92%)]', iconColor: 'text-[hsl(220,45%,35%)]', activeBg: 'bg-[hsl(220,45%,92%)]' },
  { key: 'pedagogy', icon: BookOpen, label: 'פדגוגיה', iconBg: 'bg-[hsl(270,40%,92%)]', iconColor: 'text-[hsl(270,40%,35%)]', activeBg: 'bg-[hsl(270,40%,92%)]' },
  { key: 'grades', icon: GraduationCap, label: 'ציונים', iconBg: 'bg-[hsl(35,60%,90%)]', iconColor: 'text-[hsl(35,60%,30%)]', activeBg: 'bg-[hsl(35,60%,90%)]' },
  { key: 'support', icon: HeartHandshake, label: 'תמיכה', iconBg: 'bg-[hsl(145,40%,90%)]', iconColor: 'text-[hsl(145,40%,30%)]', activeBg: 'bg-[hsl(145,40%,90%)]' },
  { key: 'event', icon: AlertTriangle, label: 'אירוע חריג', iconBg: 'bg-[hsl(0,55%,92%)]', iconColor: 'text-[hsl(0,55%,35%)]', activeBg: 'bg-[hsl(0,55%,92%)]' },
  { key: 'calendar', icon: Calendar, label: 'לוח שנה', iconBg: 'bg-[hsl(200,45%,92%)]', iconColor: 'text-[hsl(200,45%,35%)]', activeBg: 'bg-[hsl(200,45%,92%)]' },
];

export default function Index() {
  const { role, fullName, signOut } = useAuth();
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';
  const isParent = role === 'parent';
  const [absentStudentIds, setAbsentStudentIds] = useState<Set<string>>(new Set());
  const [staffPanel, setStaffPanel] = useState<StaffPanel>(null);

  const renderStaffContent = () => {
    if (!staffPanel) {
      return (
        <div className="space-y-4" dir="rtl">
          <DailyReminderBanner />
          <div className="grid grid-cols-3 gap-2.5">
            {staffCards.map(card => (
              <button key={card.key} onClick={() => setStaffPanel(card.key as StaffPanel)}
                className="rounded-2xl p-4 text-center border bg-card hover:shadow-md hover:border-primary/20 transition-all cursor-pointer active:scale-[0.97]">
                <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${card.iconBg}`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <p className="text-sm font-bold text-foreground">{card.label}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const panelComponents: Record<string, React.ReactNode> = {
      attendance: <DailyAttendance onAttendanceChange={setAbsentStudentIds} />,
      report: <ReportForm absentStudentIds={absentStudentIds} />,
      pedagogy: <PedagogyForm />,
      grades: <GradesForm />,
      support: <SupportPlanForm />,
      event: <ExceptionalEventForm />,
      calendar: <SharedCalendar />,
    };

    const currentCard = staffCards.find(c => c.key === staffPanel);

    return (
      <div className="space-y-2 animate-fade-in" dir="rtl">
        <button onClick={() => setStaffPanel(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" /> חזרה לתפריט
        </button>
        <h3 className="text-sm font-bold flex items-center gap-2">
          {currentCard && <currentCard.icon className={`h-4 w-4 ${currentCard.iconColor}`} />}
          {currentCard?.label}
        </h3>
        {panelComponents[staffPanel]}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-warm)' }}>
      {/* Header */}
      <header className="header-gradient sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoSrc} alt="לוגו" className="h-10 w-auto rounded-lg" />
            <div>
              <h1 className="font-bold text-primary-foreground text-base leading-tight">בית ספר מרום בית אקשטיין</h1>
              <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
                {isAdmin && <Shield className="w-3 h-3" />}
                {isStudent && <User className="w-3 h-3" />}
                {isParent && <UserRound className="w-3 h-3" />}
                {fullName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 text-xs"
          >
            <LogOut className="h-3.5 w-3.5 ml-1" />
            יציאה
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 pb-10 max-w-4xl">
        {isParent ? (
          <ParentDashboard />
        ) : isStudent ? (
          <StudentDashboard />
        ) : isAdmin ? (
          <AdminDashboard />
        ) : (
          renderStaffContent()
        )}
      </main>
    </div>
  );
}