import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ReportForm from '@/components/ReportForm';
import ExceptionalEventForm from '@/components/ExceptionalEventForm';
import AdminDashboard from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, LogOut, FileText, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Index() {
  const { user, role, fullName, signOut } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">מערכת דיווח</h1>
              <p className="text-xs text-muted-foreground">{fullName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 ml-1" />
            יציאה
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="report" dir="rtl">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} mb-6`}>
            <TabsTrigger value="report" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">דיווח שיעור</span>
              <span className="sm:hidden">דיווח</span>
            </TabsTrigger>
            <TabsTrigger value="event" className="gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">אירוע חריג</span>
              <span className="sm:hidden">אירוע</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="dashboard" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">לוח בקרה</span>
                <span className="sm:hidden">בקרה</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="report">
            <ReportForm />
          </TabsContent>
          <TabsContent value="event">
            <ExceptionalEventForm />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
