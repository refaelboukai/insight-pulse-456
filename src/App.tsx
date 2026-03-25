import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ResetAppProvider } from "@/reset-zone/contexts/AppContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Reset Zone pages
import ResetHome from "@/reset-zone/pages/Home";
import QuickCheck from "@/reset-zone/pages/QuickCheck";
import IntensityScreen from "@/reset-zone/pages/IntensityScreen";
import SkillRecommendation from "@/reset-zone/pages/SkillRecommendation";
import BreathingExercise from "@/reset-zone/pages/BreathingExercise";
import GroundingExercise from "@/reset-zone/pages/GroundingExercise";
import PracticeMode from "@/reset-zone/pages/PracticeMode";
import WritingMode from "@/reset-zone/pages/WritingMode";
import PostPractice from "@/reset-zone/pages/PostPractice";
import CalmMode from "@/reset-zone/pages/CalmMode";
import PositiveFlow from "@/reset-zone/pages/PositiveFlow";
import SkillsLibrary from "@/reset-zone/pages/SkillsLibrary";
import ContactAdult from "@/reset-zone/pages/ContactAdult";
import ToolsHistory from "@/reset-zone/pages/ToolsHistory";
import DailyReflection from "@/reset-zone/pages/DailyReflection";
import BrainTraining from "@/reset-zone/pages/BrainTraining";
import SelfReminders from "@/reset-zone/pages/SelfReminders";
import InfoTips from "@/reset-zone/pages/InfoTips";

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
    <ResetAppProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Reset Zone routes */}
        <Route path="/reset" element={<ResetHome />} />
        <Route path="/reset/home" element={<ResetHome />} />
        <Route path="/reset/quick-check" element={<QuickCheck />} />
        <Route path="/reset/intensity" element={<IntensityScreen />} />
        <Route path="/reset/skill-recommendation" element={<SkillRecommendation />} />
        <Route path="/reset/breathing" element={<BreathingExercise />} />
        <Route path="/reset/grounding" element={<GroundingExercise />} />
        <Route path="/reset/practice" element={<PracticeMode />} />
        <Route path="/reset/writing" element={<WritingMode />} />
        <Route path="/reset/post-practice" element={<PostPractice />} />
        <Route path="/reset/calm" element={<CalmMode />} />
        <Route path="/reset/positive" element={<PositiveFlow />} />
        <Route path="/reset/skills-library" element={<SkillsLibrary />} />
        <Route path="/reset/contact" element={<ContactAdult />} />
        <Route path="/reset/history" element={<ToolsHistory />} />
        <Route path="/reset/reflection" element={<DailyReflection />} />
        <Route path="/reset/brain-training" element={<BrainTraining />} />
        <Route path="/reset/reminders" element={<SelfReminders />} />
        <Route path="/reset/info" element={<InfoTips />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ResetAppProvider>
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
