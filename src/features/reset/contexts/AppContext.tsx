import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, UserRole, ActivityLog, SpecialCode } from '@reset/types';
import { supabase } from '@reset/integrations/supabase/client';

interface ScheduleData {
  schedule: Record<string, string[]>;
  date: string; // the date this schedule is FOR (tomorrow when created)
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

export const AppContext = createContext<AppContextType | null>(null);

const REMEMBER_KEY = 'reset_app_remember';
const FAVORITES_KEY = 'reset_app_favorites';
const REMINDERS_KEY = 'reset_app_reminders';
const SCHEDULE_KEY = 'reset_app_schedule';

// Map DB row to app Student type
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

// Map DB row to app ActivityLog type
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [specialCodes, setSpecialCodes] = useState<SpecialCode[]>([]);
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
      // Only show if the schedule date is today
      if (parsed.date === new Date().toDateString()) return parsed;
      return null;
    }
    return null;
  });

  // Fetch special codes
  const refreshSpecialCodes = useCallback(async () => {
    const { data } = await supabase
      .from('special_codes')
      .select('*');
    if (data) setSpecialCodes(data.map((r: any) => ({
      id: r.id, code: r.code, label: r.label, role: r.role,
      active: r.active, expiresAt: r.expires_at || undefined, createdAt: r.created_at,
    })));
  }, []);

  // Fetch data from Supabase
  const refreshData = useCallback(async () => {
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .order('name');
    if (studentsData) setStudents(studentsData.map(dbToStudent));

    const { data: activitiesData } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (activitiesData) setActivities(activitiesData.map(dbToActivity));

    await refreshSpecialCodes();
  }, [refreshSpecialCodes]);

  // Fetch on mount + subscribe to realtime updates
  useEffect(() => {
    refreshData();

    // Subscribe to realtime inserts on activity_logs for instant dashboard updates
    const channel = supabase
      .channel('activity_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          const newLog = dbToActivity(payload.new as any);
          setActivities(prev => [newLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  // Auto-login from remembered session
  useEffect(() => {
    if (students.length === 0) return;
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      try {
        const { code, hash } = JSON.parse(remembered);
        if (btoa(code) === hash) {
          performLogin(code, false);
        }
      } catch {
        localStorage.removeItem(REMEMBER_KEY);
      }
    }
  }, [students]);

  // Auto-login from URL parameter (cross-app integration)
  useEffect(() => {
    if (students.length === 0 || isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    const autoCode = params.get('auto_login');
    if (autoCode) {
      performLogin(autoCode, false);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [students, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteSkills));
  }, [favoriteSkills]);

  useEffect(() => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({
      date: new Date().toDateString(),
      items: completedReminders,
    }));
  }, [completedReminders]);

  async function performLogin(code: string, remember?: boolean): Promise<string | null> {
    const trimmed = code.trim().toUpperCase();

    // Check special codes from DB
    const matchedSpecial = specialCodes.find(sc => sc.code === trimmed);
    if (matchedSpecial) {
      if (!matchedSpecial.active) {
        return 'קוד זה מושבת כרגע. יש לפנות לאיש צוות.';
      }
      if (matchedSpecial.expiresAt && new Date(matchedSpecial.expiresAt) < new Date()) {
        return 'תוקף הקוד פג. יש לפנות לאיש צוות.';
      }
      setRole(matchedSpecial.role as UserRole);
      setIsLoggedIn(true);
      setStudent(null);
      if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ code: trimmed, hash: btoa(trimmed) }));
      return null;
    }

    const found = students.find(s => s.accessCode === trimmed && s.active);
    if (found) {
      setRole('student');
      setIsLoggedIn(true);
      setStudent(found);

      // Update last login in DB
      await supabase
        .from('students')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', found.id);

      setStudents(prev => prev.map(s => s.id === found.id ? { ...s, lastLoginAt: new Date().toISOString() } : s));
      if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ code: trimmed, hash: btoa(trimmed) }));
      return null;
    }

    return 'הקוד שהוזן אינו מוכר במערכת. יש לפנות לאיש צוות.';
  }

  const login = useCallback(async (code: string, remember?: boolean) => {
    return performLogin(code, remember || false);
  }, [students, specialCodes]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setRole(null);
    setStudent(null);
  }, []);

  const logActivity = useCallback(async (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    // Insert into Supabase
    const { data, error } = await supabase
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
    } else if (!error) {
      // Fallback: add locally
      const newActivity: ActivityLog = {
        ...activity,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      setActivities(prev => [newActivity, ...prev]);
    }
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
    if (schedule) {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    } else {
      localStorage.removeItem(SCHEDULE_KEY);
    }
  }, []);

  const toggleScheduleItem = useCallback((item: string) => {
    setTodayScheduleState(prev => {
      if (!prev) return prev;
      const completed = prev.completedItems.includes(item)
        ? prev.completedItems.filter(i => i !== item)
        : [...prev.completedItems, item];
      const updated = { ...prev, completedItems: completed };
      
      // Check if all items are completed
      const allItems = Object.values(prev.schedule).flat();
      if (completed.length >= allItems.length && allItems.length > 0) {
        // All done - clear schedule
        localStorage.removeItem(SCHEDULE_KEY);
        return null;
      }
      
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetReminders = useCallback(() => {
    setCompletedReminders([]);
  }, []);

  return (
    <AppContext.Provider value={{
      isLoggedIn, role, student,
      login,
      logout,
      students, setStudents,
      activities, logActivity,
      favoriteSkills, toggleFavorite,
      completedReminders, toggleReminder, resetReminders,
      refreshData,
      specialCodes, refreshSpecialCodes,
      todaySchedule, setTodaySchedule, toggleScheduleItem,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
