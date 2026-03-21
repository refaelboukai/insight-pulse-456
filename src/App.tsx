import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Student portal screens (lazy-like but direct imports for simplicity)
import StudentPortalHome from "@/components/reset/StudentPortalHome";
import QuickCheck from "@/components/reset/QuickCheck";
import IntensityScreen from "@/components/reset/IntensityScreen";
import SkillRecommendation from "@/components/reset/SkillRecommendation";
import PracticeMode from "@/components/reset/PracticeMode";
import WritingMode from "@/components/reset/WritingMode";
import PostPractice from "@/components/reset/PostPractice";
import BreathingExercise from "@/components/reset/BreathingExercise";
import GroundingExercise from "@/components/reset/GroundingExercise";
import CalmMode from "@/components/reset/CalmMode";
import PositiveFlow from "@/components/reset/PositiveFlow";
import SkillsLibrary from "@/components/reset/SkillsLibrary";
import ContactAdult from "@/components/reset/ContactAdult";
import SelfReminders from "@/components/reset/SelfReminders";
import InfoTips from "@/components/reset/InfoTips";
import ToolsHistory from "@/components/reset/ToolsHistory";
import BrainTraining from "@/components/reset/BrainTraining";
import DailyReflection from "@/components/reset/DailyReflection";

const queryClient = new QueryClient();

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-full bg-primary/30" />
          </div>
          <p className="text-muted-foreground text-sm">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />

      {/* Student Reset Portal */}
      <Route path="/student" element={<StudentPortalHome />} />
      <Route path="/student/quick-check" element={<QuickCheck />} />
      <Route path="/student/intensity/:stateId" element={<IntensityScreen />} />
      <Route path="/student/recommendation/:stateId/:intensity" element={<SkillRecommendation />} />
      <Route path="/student/practice/:skillId/:stateId/:intensity" element={<PracticeMode />} />
      <Route path="/student/writing/:skillId/:stateId/:intensity" element={<WritingMode />} />
      <Route path="/student/post-practice" element={<PostPractice />} />
      <Route path="/student/breathing" element={<BreathingExercise />} />
      <Route path="/student/grounding" element={<GroundingExercise />} />
      <Route path="/student/calm" element={<CalmMode />} />
      <Route path="/student/positive" element={<PositiveFlow />} />
      <Route path="/student/skills" element={<SkillsLibrary />} />
      <Route path="/student/contact" element={<ContactAdult />} />
      <Route path="/student/reminders" element={<SelfReminders />} />
      <Route path="/student/info" element={<InfoTips />} />
      <Route path="/student/history" element={<ToolsHistory />} />
      <Route path="/student/brain-training" element={<BrainTraining />} />
      <Route path="/student/daily-reflection" element={<DailyReflection />} />
      <Route path="/student/dashboard" element={<Index />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AuthGate />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
