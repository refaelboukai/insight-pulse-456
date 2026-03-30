import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import PWAUpdatePrompt from "@reset/components/PWAUpdatePrompt";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@reset/contexts/AppContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import QuickCheck from "./pages/QuickCheck";
import IntensityScreen from "./pages/IntensityScreen";
import SkillRecommendation from "./pages/SkillRecommendation";
import BreathingExercise from "./pages/BreathingExercise";
import GroundingExercise from "./pages/GroundingExercise";
import PracticeMode from "./pages/PracticeMode";
import WritingMode from "./pages/WritingMode";
import PostPractice from "./pages/PostPractice";
import PositiveFlow from "./pages/PositiveFlow";
import CalmMode from "./pages/CalmMode";
import SkillsLibrary from "./pages/SkillsLibrary";
import ContactAdult from "./pages/ContactAdult";
import SelfReminders from "./pages/SelfReminders";
import InfoTips from "./pages/InfoTips";
import ToolsHistory from "./pages/ToolsHistory";
import StaffDashboard from "./pages/StaffDashboard";
import BrainTraining from "./pages/BrainTraining";
import DailyReflection from "./pages/DailyReflection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoggedIn, role } = useApp();

  if (!isLoggedIn) return <Login />;
  if (role === 'dashboard') return <StaffDashboard />;
  // parent role uses same student routes as staff exploration

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/quick-check" element={<QuickCheck />} />
      <Route path="/intensity/:stateId" element={<IntensityScreen />} />
      <Route path="/recommendation/:stateId/:intensity" element={<SkillRecommendation />} />
      <Route path="/breathing" element={<BreathingExercise />} />
      <Route path="/grounding" element={<GroundingExercise />} />
      <Route path="/practice/:skillId/:stateId/:intensity" element={<PracticeMode />} />
      <Route path="/writing/:skillId/:stateId/:intensity" element={<WritingMode />} />
      <Route path="/post-practice" element={<PostPractice />} />
      <Route path="/positive-flow" element={<PositiveFlow />} />
      <Route path="/calm-mode" element={<CalmMode />} />
      <Route path="/skills" element={<SkillsLibrary />} />
      <Route path="/contact" element={<ContactAdult />} />
      <Route path="/reminders" element={<SelfReminders />} />
      <Route path="/info" element={<InfoTips />} />
      <Route path="/history" element={<ToolsHistory />} />
      <Route path="/brain-training" element={<BrainTraining />} />
      <Route path="/daily-reflection" element={<DailyReflection />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <PWAUpdatePrompt />
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
