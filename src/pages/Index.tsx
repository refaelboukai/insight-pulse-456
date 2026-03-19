import { useAuth } from '@/hooks/useAuth';
import ReportForm from '@/components/ReportForm';
import ExceptionalEventForm from '@/components/ExceptionalEventForm';
import AdminDashboard from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, FileText, AlertTriangle, BarChart3, Shield } from 'lucide-react';
import logoSrc from '@/assets/logo.jpeg';

export default function Index() {
  const { role, fullName, signOut } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-warm)' }}>
      {/* Header */}
      <header className="header-gradient sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoSrc} alt="לוגו" className="h-9 w-auto rounded-lg" />
            <div>
              <h1 className="font-bold text-primary-foreground text-sm leading-tight">מערכת דיווח</h1>
              <p className="text-[10px] text-primary-foreground/70 flex items-center gap-1">
                {isAdmin && <Shield className="w-2.5 h-2.5" />}
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
        <Tabs defaultValue="report" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-10 p-1 rounded-xl shadow-soft bg-card">
            <TabsTrigger value="report" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-xs font-medium">
              <FileText className="h-3.5 w-3.5" />
              דיווח שיעור
            </TabsTrigger>
            <TabsTrigger value="event" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              אירוע חריג
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1 rounded-lg data-[state=active]:shadow-sm text-xs font-medium">
              <BarChart3 className="h-3.5 w-3.5" />
              לוח בקרה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="animate-fade-in mt-0">
            <ReportForm />
          </TabsContent>
          <TabsContent value="event" className="animate-fade-in mt-0">
            <ExceptionalEventForm />
          </TabsContent>
          <TabsContent value="dashboard" className="animate-fade-in mt-0">
            <AdminDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}