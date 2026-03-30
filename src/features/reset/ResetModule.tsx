/**
 * ResetModule - embeds the Reset Calm Zone app natively inside Insight.
 * The student is pre-authenticated using their student code from Insight.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { resetSupabase } from './supabase';
import type { Student, UserRole, ActivityLog, SpecialCode } from '@reset/types';
import { AppContext } from '@reset/contexts/AppContext';

import Home from '@reset/pages/Home';
import QuickCheck from '@reset/pages/QuickCheck';
import IntensityScreen from '@reset/pages/IntensityScreen';
import SkillRecommendation from '@reset/pages/SkillRecommendation';
import BreathingExercise from '@reset/pages/BreathingExercise';
import GroundingExercise from '@reset/pages/GroundingExercise';
import PracticeMode from '@reset/pages/PracticeMode';
import WritingMode from '@reset/pages/WritingMode';
import PostPractice from '@reset/pages/PostPractice';
import PositiveFlow from '@reset/pages/PositiveFlow';
import CalmMode from '@reset/pages/CalmMode';
import SkillsLibrary from '@reset/pages/SkillsLibrary';
import ContactAdult from '@reset/pages/ContactAdult';
import SelfReminders from '@reset/pages/SelfReminders';
import InfoTips from '@reset/pages/InfoTips';
import ToolsHistory from '@reset/pages/ToolsHistory';
import BrainTraining from '@reset/pages/BrainTraining';
import DailyReflection from '@reset/pages/DailyReflection';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScheduleData {
  schedule: Record<string, string[]>;
  date: string;
  completedItems: string[];
}

interface AppContextType {
  isLoggedIn: boolean;
  role: UserRole | null;
  student: Student | null;
  login: (code: string, remember?: boolean) => Promise<string | null>;
  logout: () => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  activities: ActivityLog[];
  logActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  favoriteSkills: string[];
  toggleFavorite: (skillId: string) => void;
  completedReminders: string[];
  toggleReminder: (reminder: string) => void;
  resetReminders: () => void;
  refreshData: () => Promise<void>;
  specialCodes: SpecialCode[];
  refreshSpecialCodes: () => Promise<void>;
  todaySchedule: ScheduleData | null;
  setTodaySchedule: (schedule: ScheduleData | null) => void;
  toggleScheduleItem: (item: string) => void;
}

const FAVORITES_KEY = 'reset_app_favorites';
const REMINDERS_KEY = 'reset_app_reminders';
const SCHEDULE_KEY = 'reset_app_schedule';

function dbToStudent(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    nationalId: row.national_id,
    accessCode: row.access_code,
    className: row.class_name || undefined,
    grade: row.grade || undefined,
    homeroomTeacher: row.homeroom_teacher || undefined,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
    active: row.active,
  };
}

function dbToActivity(row: any): ActivityLog {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    selectedState: row.selected_state,
    intensityScore: row.intensity_score || undefined,
    intensityLabel: row.intensity_label || undefined,
    skillUsed: row.skill_used || undefined,
    skillHelpful: row.skill_helpful || undefined,
    resultAfterPractice: row.result_after_practice || undefined,
    supportRequested: row.support_requested,
    adultContactName: row.adult_contact_name || undefined,
    adultContactCategory: row.adult_contact_category || undefined,
    optionalContextText: row.optional_context_text || undefined,
    timestamp: row.created_at,
    isPositiveReflection: row.is_positive_reflection || undefined,
    positiveSource: row.positive_source || undefined,
  };
}

interface EmbeddedProviderProps {
  studentCode: string;
  children: React.ReactNode;
}

function EmbeddedAppProvider({ studentCode, children }: EmbeddedProviderProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteSkills, setFavoriteSkills] = useState<string[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [completedReminders, setCompletedReminders] = useState<string[]>(() => {
    const saved = localStorage.getItem(REMINDERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date !== new Date().toDateString()) return [];
      return parsed.items || [];
    }
    return [];
  });
  const [todaySchedule, setTodayScheduleState] = useState<ScheduleData | null>(() => {
    const saved = localStorage.getItem(SCHEDULE_KEY);
    if (saved) {
      const parsed: ScheduleData = JSON.parse(saved);
      if (parsed.date === new Date().toDateString()) return parsed;
      return null;
    }
    return null;
  });

  // Load student and activities from Reset's Supabase
  const refreshData = useCallback(async () => {
    const code = studentCode.trim().toUpperCase();
    const { data: studentData } = await resetSupabase
      .from('students')
      .select('*')
      .eq('access_code', code)
      .eq('active', true)
      .maybeSingle();

    if (studentData) {
      setStudent(dbToStudent(studentData));
      // Update last login
      await resetSupabase
        .from('students')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', studentData.id);

      // Load activities for this student
      const { data: activitiesData } = await resetSupabase
        .from('activity_logs')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });
      if (activitiesData) setActivities(activitiesData.map(dbToActivity));
    }
    setLoading(false);
  }, [studentCode]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteSkills));
  }, [favoriteSkills]);

  useEffect(() => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({
      date: new Date().toDateString(),
      items: completedReminders,
    }));
  }, [completedReminders]);

  const logActivity = useCallback(async (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const { data } = await resetSupabase
      .from('activity_logs')
      .insert({
        student_id: activity.studentId,
        student_name: activity.studentName,
        selected_state: activity.selectedState,
        intensity_score: activity.intensityScore || null,
        intensity_label: activity.intensityLabel || null,
        skill_used: activity.skillUsed || null,
        skill_helpful: activity.skillHelpful ?? null,
        result_after_practice: activity.resultAfterPractice || null,
        support_requested: activity.supportRequested,
        adult_contact_name: activity.adultContactName || null,
        adult_contact_category: activity.adultContactCategory || null,
        optional_context_text: activity.optionalContextText || null,
        is_positive_reflection: activity.isPositiveReflection || null,
        positive_source: activity.positiveSource || null,
      })
      .select()
      .single();
    if (data) setActivities(prev => [dbToActivity(data), ...prev]);
  }, []);

  const toggleFavorite = useCallback((skillId: string) => {
    setFavoriteSkills(prev =>
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  }, []);

  const toggleReminder = useCallback((reminder: string) => {
    setCompletedReminders(prev =>
      prev.includes(reminder) ? prev.filter(r => r !== reminder) : [...prev, reminder]
    );
  }, []);

  const setTodaySchedule = useCallback((schedule: ScheduleData | null) => {
    setTodayScheduleState(schedule);
    if (schedule) localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    else localStorage.removeItem(SCHEDULE_KEY);
  }, []);

  const toggleScheduleItem = useCallback((item: string) => {
    setTodayScheduleState(prev => {
      if (!prev) return prev;
      const completed = prev.completedItems.includes(item)
        ? prev.completedItems.filter(i => i !== item)
        : [...prev.completedItems, item];
      const allItems = Object.values(prev.schedule).flat();
      if (completed.length >= allItems.length && allItems.length > 0) {
        localStorage.removeItem(SCHEDULE_KEY);
        return null;
      }
      const updated = { ...prev, completedItems: completed };
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">לא נמצא חשבון Reset לתלמיד זה.</p>
      </div>
    );
  }

  const ctx: AppContextType = {
    isLoggedIn: true,
    role: 'student',
    student,
    login: async () => null,
    logout: () => {},
    students: [student],
    setStudents: () => {},
    activities,
    logActivity,
    favoriteSkills,
    toggleFavorite,
    completedReminders,
    toggleReminder,
    resetReminders: () => setCompletedReminders([]),
    refreshData,
    specialCodes: [],
    refreshSpecialCodes: async () => {},
    todaySchedule,
    setTodaySchedule,
    toggleScheduleItem,
  };

  // Use the same AppContext from AppContext.tsx so all Reset pages can read it
  return <AppContext.Provider value={ctx as any}>{children}</AppContext.Provider>;
}

// ─── Module entry point ─────────────────────────────────────────────────────────

const resetQueryClient = new QueryClient();

interface ResetModuleProps {
  /** The student's access code from Insight (same code used in Reset) */
  studentCode: string;
}

export default function ResetModule({ studentCode }: ResetModuleProps) {
  return (
    <QueryClientProvider client={resetQueryClient}>
      <EmbeddedAppProvider studentCode={studentCode}>
        <MemoryRouter>
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
          </Routes>
        </MemoryRouter>
      </EmbeddedAppProvider>
    </QueryClientProvider>
  );
}
