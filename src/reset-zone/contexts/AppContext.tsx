import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ResetStudent, ActivityLog } from '@/reset-zone/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ScheduleData {
  schedule: Record<string, string[]>;
  date: string;
  completedItems: string[];
}

interface ResetAppContextType {
  isLoggedIn: boolean;
  role: 'student' | 'staff' | null;
  student: ResetStudent | null;
  logout: () => void;
  activities: ActivityLog[];
  logActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  favoriteSkills: string[];
  toggleFavorite: (skillId: string) => void;
  completedReminders: string[];
  toggleReminder: (reminder: string) => void;
  resetReminders: () => void;
  refreshData: () => Promise<void>;
  todaySchedule: ScheduleData | null;
  setTodaySchedule: (schedule: ScheduleData | null) => void;
  toggleScheduleItem: (item: string) => void;
}

const ResetAppContext = createContext<ResetAppContextType | null>(null);

const FAVORITES_KEY = 'reset_app_favorites';
const REMINDERS_KEY = 'reset_app_reminders';
const SCHEDULE_KEY = 'reset_app_schedule';

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

export function ResetAppProvider({ children }: { children: React.ReactNode }) {
  const { lockedStudentId, role: authRole } = useAuth();
  const [student, setStudent] = useState<ResetStudent | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
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

  // Load student from current app's auth system
  useEffect(() => {
    if (!lockedStudentId) return;
    supabase
      .from('students')
      .select('*')
      .eq('id', lockedStudentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStudent({
            id: data.id,
            name: `${data.first_name} ${data.last_name}`,
            accessCode: data.student_code,
            className: data.class_name || undefined,
            grade: data.grade || undefined,
            active: data.is_active,
          });
        }
      });
  }, [lockedStudentId]);

  const refreshData = useCallback(async () => {
    const { data: activitiesData } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (activitiesData) setActivities(activitiesData.map(dbToActivity));
  }, []);

  useEffect(() => {
    refreshData();
    const channel = supabase
      .channel('reset_activity_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        const newLog = dbToActivity(payload.new as any);
        setActivities(prev => [newLog, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    const { data } = await supabase
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
    if (data) {
      setActivities(prev => [dbToActivity(data), ...prev]);
    }
  }, []);

  const toggleFavorite = useCallback((skillId: string) => {
    setFavoriteSkills(prev => prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]);
  }, []);

  const toggleReminder = useCallback((reminder: string) => {
    setCompletedReminders(prev => prev.includes(reminder) ? prev.filter(r => r !== reminder) : [...prev, reminder]);
  }, []);

  const resetReminders = useCallback(() => setCompletedReminders([]), []);

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
      const updated = { ...prev, completedItems: completed };
      const allItems = Object.values(prev.schedule).flat();
      if (completed.length >= allItems.length && allItems.length > 0) {
        localStorage.removeItem(SCHEDULE_KEY);
        return null;
      }
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isLoggedIn = !!student || authRole === 'staff' || authRole === 'admin';
  const role = authRole === 'student' ? 'student' : (authRole === 'staff' || authRole === 'admin') ? 'staff' : null;

  return (
    <ResetAppContext.Provider value={{
      isLoggedIn, role, student,
      logout: () => {},
      activities, logActivity,
      favoriteSkills, toggleFavorite,
      completedReminders, toggleReminder, resetReminders,
      refreshData,
      todaySchedule, setTodaySchedule, toggleScheduleItem,
    }}>
      {children}
    </ResetAppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(ResetAppContext);
  if (!ctx) throw new Error('useApp must be used within ResetAppProvider');
  return ctx;
}
