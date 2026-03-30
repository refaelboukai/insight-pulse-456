/**
 * ResetAdminDashboard - embeds Reset's staff/admin dashboard inside Insight's AdminDashboard.
 * Loads all students and activities from Reset's Supabase without needing a logged-in student.
 */
import { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { resetSupabase } from './supabase';
import { AppContext } from '@reset/contexts/AppContext';
import StaffDashboard from '@reset/pages/StaffDashboard';

function dbToStudent(row: any) {
  return {
    id: row.id, name: row.name, nationalId: row.national_id,
    accessCode: row.access_code, className: row.class_name || undefined,
    grade: row.grade || undefined, homeroomTeacher: row.homeroom_teacher || undefined,
    createdAt: row.created_at, lastLoginAt: row.last_login_at || undefined, active: row.active,
  };
}

function dbToActivity(row: any) {
  return {
    id: row.id, studentId: row.student_id, studentName: row.student_name,
    selectedState: row.selected_state, intensityScore: row.intensity_score || undefined,
    intensityLabel: row.intensity_label || undefined, skillUsed: row.skill_used || undefined,
    skillHelpful: row.skill_helpful || undefined, resultAfterPractice: row.result_after_practice || undefined,
    supportRequested: row.support_requested, adultContactName: row.adult_contact_name || undefined,
    adultContactCategory: row.adult_contact_category || undefined,
    optionalContextText: row.optional_context_text || undefined,
    timestamp: row.created_at, isPositiveReflection: row.is_positive_reflection || undefined,
    positiveSource: row.positive_source || undefined,
  };
}

function ResetAdminProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [specialCodes, setSpecialCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const [studentsRes, activitiesRes] = await Promise.all([
      resetSupabase.from('students').select('*').order('name'),
      resetSupabase.from('activity_logs').select('*').order('created_at', { ascending: false }),
    ]);
    if (studentsRes.data) setStudents(studentsRes.data.map(dbToStudent));
    if (activitiesRes.data) setActivities(activitiesRes.data.map(dbToActivity));
    setLoading(false);
  }, []);

  const refreshSpecialCodes = useCallback(async () => {
    const { data } = await resetSupabase.from('special_codes').select('*');
    if (data) setSpecialCodes(data.map((r: any) => ({
      id: r.id, code: r.code, label: r.label, role: r.role,
      active: r.active, expiresAt: r.expires_at || undefined, createdAt: r.created_at,
    })));
  }, []);

  useEffect(() => {
    refreshData();
    refreshSpecialCodes();

    const channel = resetSupabase
      .channel('reset_admin_activity_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => setActivities(prev => [dbToActivity(payload.new), ...prev])
      ).subscribe();

    return () => { resetSupabase.removeChannel(channel); };
  }, [refreshData, refreshSpecialCodes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ctx: any = {
    isLoggedIn: true,
    role: 'dashboard',
    student: null,
    login: async () => null,
    logout: () => {},
    students, setStudents,
    activities,
    logActivity: async () => {},
    favoriteSkills: [],
    toggleFavorite: () => {},
    completedReminders: [],
    toggleReminder: () => {},
    resetReminders: () => {},
    refreshData,
    specialCodes, refreshSpecialCodes,
    todaySchedule: null,
    setTodaySchedule: () => {},
    toggleScheduleItem: () => {},
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

const adminQueryClient = new QueryClient();

export default function ResetAdminDashboard() {
  return (
    <QueryClientProvider client={adminQueryClient}>
      <ResetAdminProvider>
        <StaffDashboard />
      </ResetAdminProvider>
    </QueryClientProvider>
  );
}
