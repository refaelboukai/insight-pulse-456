/**
 * WelcomeAdminModule - embeds the Welcome admin dashboard inside Insight's AdminDashboard.
 * Provides full Welcome management: sessions, questionnaires, profiles, AI analysis.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from '@welcome/pages/admin/Dashboard';
import StudentProfile from '@welcome/pages/admin/StudentProfile';
import NewIntake from '@welcome/pages/admin/NewIntake';
import StaffFlow from '@welcome/pages/StaffFlow';

const welcomeAdminQueryClient = new QueryClient();

export default function WelcomeAdminModule() {
  return (
    <QueryClientProvider client={welcomeAdminQueryClient}>
      <div className="rounded-2xl overflow-hidden">
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/new" element={<NewIntake />} />
            <Route path="/admin/student/:sessionId" element={<StudentProfile />} />
            <Route path="/staff" element={<StaffFlow />} />
            <Route path="/staff/:sessionId" element={<StaffFlow />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </MemoryRouter>
      </div>
    </QueryClientProvider>
  );
}
