import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ReportForm from '@/components/ReportForm';
import ExceptionalEventForm from '@/components/ExceptionalEventForm';
import DailyAttendance from '@/components/DailyAttendance';
import AdminDashboard from '@/components/AdminDashboard';
import SupportPlanForm from '@/components/SupportPlanForm';
import GradesForm from '@/components/GradesForm';
import PedagogyForm from '@/components/PedagogyForm';
import StudentDashboard from '@/components/StudentDashboard';
import DailyReminderBanner from '@/components/DailyReminderBanner';
import ResetCalmZone from '@/components/ResetCalmZone';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, FileText, AlertTriangle, Shield, ClipboardCheck, HeartHandshake, GraduationCap, User, Leaf, BookOpen } from 'lucide-react';
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

        {/* Daily reminder for staff */}
        {!isAdmin && !isStudent && <DailyReminderBanner />}

        {isStudent ? (
          <Tabs defaultValue="dashboard" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-12 p-1.5 rounded-2xl shadow-soft bg-card border border-border">
              <TabsTrigger value="dashboard" className="gap-1.5 rounded-xl text-xs font-bold transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-primary/5">
                <User className="h-4 w-4" />
                הפורטל שלי
              </TabsTrigger>
              <TabsTrigger value="reset" className="gap-1.5 rounded-xl text-xs font-bold transition-all duration-200 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-accent/5">
                <Leaf className="h-4 w-4" />
                אזור הרגעה
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="animate-fade-in mt-0">
              <StudentDashboard />
            </TabsContent>
            <TabsContent value="reset" className="animate-fade-in mt-0">
              <ResetCalmZone />
            </TabsContent>
          </Tabs>
        ) : isAdmin ? (
          <AdminDashboard />
        ) : (
          <Tabs defaultValue="attendance" dir="rtl">
            <TabsList className="grid w-full grid-cols-6 mb-4 h-12 p-1 rounded-xl shadow-soft bg-card">
              <TabsTrigger value="attendance" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-[10px] font-semibold px-0.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                ביקור
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-[10px] font-semibold px-0.5">
                <FileText className="h-3.5 w-3.5" />
                דיווח
              </TabsTrigger>
              <TabsTrigger value="pedagogy" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-[10px] font-semibold px-0.5">
                <BookOpen className="h-3.5 w-3.5" />
                פדגוגיה
              </TabsTrigger>
              <TabsTrigger value="grades" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-[10px] font-semibold px-0.5">
                <GraduationCap className="h-3.5 w-3.5" />
                ציונים
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-[10px] font-semibold px-0.5">
                <HeartHandshake className="h-3.5 w-3.5" />
                תמיכה
              </TabsTrigger>
              <TabsTrigger value="event" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-[10px] font-semibold px-0.5">
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
            <TabsContent value="pedagogy" className="animate-fade-in mt-0">
              <PedagogyForm />
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
