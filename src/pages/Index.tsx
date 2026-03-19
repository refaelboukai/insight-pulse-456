import { useAuth } from '@/hooks/useAuth';
import ReportForm from '@/components/ReportForm';
import ExceptionalEventForm from '@/components/ExceptionalEventForm';
import AdminDashboard from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, LogOut, FileText, AlertTriangle, BarChart3, Shield } from 'lucide-react';

export default function Index() {
  const { role, fullName, signOut } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-warm)' }}>
      {/* Header */}
      <header className="header-gradient sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-primary-foreground text-base">מערכת דיווח</h1>
              <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
                {isAdmin && <Shield className="w-3 h-3" />}
                {fullName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4 ml-1" />
            יציאה
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 pb-12">
        <Tabs defaultValue="report" dir="rtl">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} mb-6 h-12 p-1 rounded-xl shadow-soft bg-card`}>
            <TabsTrigger value="report" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-sm font-medium">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">דיווח שיעור</span>
              <span className="sm:hidden">דיווח</span>
            </TabsTrigger>
            <TabsTrigger value="event" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">אירוע חריג</span>
              <span className="sm:hidden">אירוע</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="dashboard" className="gap-1.5 rounded-lg data-[state=active]:shadow-sm text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">לוח בקרה</span>
                <span className="sm:hidden">בקרה</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="report" className="animate-fade-in">
            <ReportForm />
          </TabsContent>
          <TabsContent value="event" className="animate-fade-in">
            <ExceptionalEventForm />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="dashboard" className="animate-fade-in">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
