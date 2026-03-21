import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ReportForm from '@/components/ReportForm';
import ExceptionalEventForm from '@/components/ExceptionalEventForm';
import DailyAttendance from '@/components/DailyAttendance';
import AdminDashboard from '@/components/AdminDashboard';
import SupportPlanForm from '@/components/SupportPlanForm';
import GradesForm from '@/components/GradesForm';
import StudentDashboard from '@/components/StudentDashboard';
import DailyReminderBanner from '@/components/DailyReminderBanner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, FileText, AlertTriangle, Shield, ClipboardCheck, HeartHandshake, GraduationCap, User } from 'lucide-react';
import logoSrc from '@/assets/logo.jpeg';

export default function Index() {
  const { role, fullName, signOut } = useAuth();
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';
  const [absentStudentIds, setAbsentStudentIds] = useState<Set<string>>(new Set());

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
      <main className="container mx-auto px-3 py-4 pb-10">
        {/* School title for non-admin, non-student */}
        {!isAdmin && !isStudent && (
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-foreground">בית ספר מרום בית אקשטיין</h2>
            <p className="text-sm text-muted-foreground">מערכת דיווח חינוכית</p>
          </div>
        )}

        {isStudent ? (
          <>
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-foreground">פורטל תלמידים</h2>
              <p className="text-sm text-muted-foreground">צפייה בדיווחים, ציונים ותכנית תמיכה</p>
            </div>
            <StudentDashboard />
          </>
        ) : isAdmin ? (
          <AdminDashboard />
        ) : (
          <Tabs defaultValue="attendance" dir="rtl">
            <TabsList className="grid w-full grid-cols-5 mb-4 h-12 p-1 rounded-xl shadow-soft bg-card">
              <TabsTrigger value="attendance" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-xs font-semibold px-1">
                <ClipboardCheck className="h-3.5 w-3.5" />
                ביקור
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-xs font-semibold px-1">
                <FileText className="h-3.5 w-3.5" />
                דיווח
              </TabsTrigger>
              <TabsTrigger value="grades" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-xs font-semibold px-1">
                <GraduationCap className="h-3.5 w-3.5" />
                ציונים
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-xs font-semibold px-1">
                <HeartHandshake className="h-3.5 w-3.5" />
                תמיכה
              </TabsTrigger>
              <TabsTrigger value="event" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-xs font-semibold px-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                אירוע
              </TabsTrigger>
            </TabsList>
            <TabsContent value="attendance" className="animate-fade-in mt-0">
              <DailyAttendance onAttendanceChange={setAbsentStudentIds} />
            </TabsContent>
            <TabsContent value="report" className="animate-fade-in mt-0">
              <ReportForm absentStudentIds={absentStudentIds} />
            </TabsContent>
            <TabsContent value="grades" className="animate-fade-in mt-0">
              <GradesForm />
            </TabsContent>
            <TabsContent value="support" className="animate-fade-in mt-0">
              <SupportPlanForm />
            </TabsContent>
            <TabsContent value="event" className="animate-fade-in mt-0">
              <ExceptionalEventForm />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
