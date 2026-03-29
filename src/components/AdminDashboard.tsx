import { useEffect, useState } from 'react';
import StudentDetailDialog from '@/components/StudentDetailDialog';
import CodesManager from '@/components/CodesManager';
import SubjectManager from '@/components/SubjectManager';
import WeeklySupportSummary from '@/components/WeeklySupportSummary';
import StudentScheduleManager from '@/components/StudentScheduleManager';
import SmsReminderSection from '@/components/SmsReminderSection';
import ReportTrendCharts from '@/components/ReportTrendCharts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS, INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS, ABSENCE_REASON_LABELS, LONG_ABSENT_REASONS,
} from '@/lib/constants';
import {
  AlertTriangle, TrendingUp, Users, FileText, UserPlus, ShieldAlert, Shield, Download,
  ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, ClipboardCheck, HeartHandshake, Sparkles, Trash2, GraduationCap, UserCog, Plus, X, Pencil, Key, Share2, Calendar, MessageSquare, Brain, RotateCcw, BookOpen, FileSpreadsheet, Eye, Settings, BarChart3, Building2,
} from 'lucide-react';
import { generateReportCard } from '@/lib/generateReportCard';
import { generateEventPdf } from '@/lib/generateEventPdf';
import { generatePedagogyPdf, generatePedagogyTrackingPdf, type MonthlyGoalRow } from '@/lib/generatePedagogyPdf';
import { exportPedagogyToExcel } from '@/lib/exportPedagogyToExcel';
import { toast } from 'sonner';
import { exportReportsToExcel, exportFullActivityToExcel } from '@/lib/exportReportsToExcel';
import { shareOrDownload, shareOrDownloadText, downloadBlob } from '@/lib/downloadFile';
import { downloadWorkbook } from '@/lib/excelDownload';
import SharedCalendar from '@/components/SharedCalendar';
import type { Database } from '@/integrations/supabase/types';

type Report = Database['public']['Tables']['lesson_reports']['Row'];
type Student = Database['public']['Tables']['students']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];
type ExceptionalEvent = Database['public']['Tables']['exceptional_events']['Row'];

// Dynamic class list - derived from students data
const PASTEL_COLORS = [
  { activeBg: 'bg-emerald-100 dark:bg-emerald-950/40', activeText: 'text-emerald-700 dark:text-emerald-300', activeBorder: 'border-emerald-400 dark:border-emerald-600' },
  { activeBg: 'bg-sky-100 dark:bg-sky-950/40', activeText: 'text-sky-700 dark:text-sky-300', activeBorder: 'border-sky-400 dark:border-sky-600' },
  { activeBg: 'bg-rose-100 dark:bg-rose-950/40', activeText: 'text-rose-700 dark:text-rose-300', activeBorder: 'border-rose-400 dark:border-rose-600' },
  { activeBg: 'bg-amber-100 dark:bg-amber-950/40', activeText: 'text-amber-700 dark:text-amber-300', activeBorder: 'border-amber-400 dark:border-amber-600' },
  { activeBg: 'bg-purple-100 dark:bg-purple-950/40', activeText: 'text-purple-700 dark:text-purple-300', activeBorder: 'border-purple-400 dark:border-purple-600' },
  { activeBg: 'bg-teal-100 dark:bg-teal-950/40', activeText: 'text-teal-700 dark:text-teal-300', activeBorder: 'border-teal-400 dark:border-teal-600' },
];
const SCHOOL_YEARS = ['תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט'];
const PEDAGOGY_MONTHS = ['ספטמבר','אוקטובר','נובמבר','דצמבר','ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט'];

const getYearDateRange = (year: string): { from: string; to: string } => {
  const map: Record<string, number> = { 'תשפ"ו': 2025, 'תשפ"ז': 2026, 'תשפ"ח': 2027, 'תשפ"ט': 2028 };
  const startYear = map[year] || 2025;
  return { from: `${startYear}-09-01`, to: `${startYear + 1}-08-31` };
};

const SUPPORT_LABELS: Record<string, string> = {
  social: 'חברתית', emotional: 'רגשית', academic: 'לימודית', behavioral: 'התנהגותית',
};
const SUPPORT_TYPES_LIST = ['social', 'emotional', 'academic', 'behavioral'] as const;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<ExceptionalEvent[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<any[]>([]);
  const [supportSessions, setSupportSessions] = useState<any[]>([]);
  const [dailyReflections, setDailyReflections] = useState<any[]>([]);
  const [studentInsights, setStudentInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(SCHOOL_YEARS[0]);

  const [mainView, setMainView] = useState<string>('management');
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Events time filter
  const [eventsTimeFilter, setEventsTimeFilter] = useState<'today' | 'week' | 'month'>('today');

  // Reports student filter
  const [reportSelectedStudentId, setReportSelectedStudentId] = useState<string | null>(null);

  // Staff management
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffDob, setEditStaffDob] = useState('');

  // Support assignments
  const [supportAssignments, setSupportAssignments] = useState<any[]>([]);
  const [studentSchedules, setStudentSchedules] = useState<any[]>([]);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [assignClassFilter, setAssignClassFilter] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignSupportTypes, setAssignSupportTypes] = useState<string[]>([]);
  const [assignFrequency, setAssignFrequency] = useState('weekly');
  const [assignFrequencyCount, setAssignFrequencyCount] = useState(1);
  const [assignTargetDate, setAssignTargetDate] = useState('');
  const [assignNotesForParents, setAssignNotesForParents] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [addingAssignment, setAddingAssignment] = useState(false);

  // Add student form
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [customClassName, setCustomClassName] = useState('');
  const [newMotherName, setNewMotherName] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Monthly report
  const [monthlyReport, setMonthlyReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportStudentId, setReportStudentId] = useState<string | null>(null);

  // Reset
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  const RESET_CATEGORIES = [
    { key: 'lesson_reports', label: 'דיווחי שיעורים', tables: ['lesson_reports'] },
    { key: 'alerts', label: 'התראות', tables: ['alerts'] },
    { key: 'attendance', label: 'נוכחות יומית', tables: ['daily_attendance'] },
    { key: 'events', label: 'אירועים חריגים', tables: ['exceptional_events'] },
    { key: 'support', label: 'מפגשי תמיכה והשלמות', tables: ['support_sessions', 'support_completions'] },
    { key: 'grades', label: 'ציונים', tables: ['student_grades'] },
    { key: 'evaluations', label: 'הערכות תלמידים', tables: ['student_evaluations'] },
    { key: 'followups', label: 'מעקב נעדרים', tables: ['absent_student_followups'] },
    { key: 'activity', label: 'יומני פעילות (אזור רגוע)', tables: ['activity_logs'] },
    { key: 'reflections', label: 'שיקופים יומיים', tables: ['daily_reflections'] },
    { key: 'brain', label: 'אימון מוח', tables: ['brain_training_scores', 'brain_training_history'] },
    { key: 'checkins', label: 'צ׳ק-אין מערכת שעות', tables: ['schedule_checkins'] },
    { key: 'pedagogy', label: 'יעדים פדגוגיים', tables: ['pedagogical_goals'] },
    { key: 'insights', label: 'תובנות תלמיד', tables: ['student_insights'] },
    { key: 'exams', label: 'לוח מבחנים', tables: ['exam_schedule'] },
    { key: 'learning_style', label: 'פרופילי סגנון למידה', tables: ['learning_style_profiles'] },
    { key: 'weekly_summaries', label: 'סיכומים שבועיים', tables: ['weekly_summaries'] },
  ] as const;
  const [resetCategories, setResetCategories] = useState<string[]>([]);
  const [generatingCard, setGeneratingCard] = useState<string | null>(null);
  const [reportCardSemester, setReportCardSemester] = useState<string>('all');

  // Edit report
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editAttendance, setEditAttendance] = useState('');
  const [editBehaviorTypes, setEditBehaviorTypes] = useState<string[]>([]);
  const [editParticipations, setEditParticipations] = useState<string[]>([]);
  const [editComment, setEditComment] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Long-absent
  const [longAbsentStudents, setLongAbsentStudents] = useState<{ student: Student; consecutiveDays: number; reason: string }[]>([]);
  const [longAbsentFollowups, setLongAbsentFollowups] = useState<Map<string, any>>(new Map());

  // Reflections
  const [reflectionSummaryMode, setReflectionSummaryMode] = useState<Record<string, string>>({});
  const [reflectionCustomFrom, setReflectionCustomFrom] = useState<Record<string, string>>({});
  const [reflectionCustomTo, setReflectionCustomTo] = useState<Record<string, string>>({});
  const [reflectionVisibility, setReflectionVisibility] = useState<Record<string, boolean>>({});

  // Pedagogy stats
  const [pedagogyGoals, setPedagogyGoals] = useState<any[]>([]);
  const [learningProfiles, setLearningProfiles] = useState<any[]>([]);

  const fetchAll = async () => {
    const { from: yearFrom, to: yearTo } = getYearDateRange(selectedYear);
    const [reportsRes, studentsRes, alertsRes, eventsRes, attendanceRes, supportRes, staffRes, assignRes, schedulesRes, reflectionsRes, insightsRes] = await Promise.all([
      supabase.from('lesson_reports').select('*')
        .gte('report_date', `${yearFrom}T00:00:00`).lte('report_date', `${yearTo}T23:59:59`)
        .order('created_at', { ascending: false }).limit(1000),
      supabase.from('students').select('*').order('class_name').order('last_name'),
      supabase.from('alerts').select('*')
        .gte('created_at', `${yearFrom}T00:00:00`).lte('created_at', `${yearTo}T23:59:59`)
        .order('created_at', { ascending: false }).limit(500),
      supabase.from('exceptional_events').select('*')
        .gte('created_at', `${yearFrom}T00:00:00`).lte('created_at', `${yearTo}T23:59:59`)
        .order('created_at', { ascending: false }).limit(200),
      supabase.from('daily_attendance').select('*')
        .gte('attendance_date', yearFrom).lte('attendance_date', yearTo),
      supabase.from('support_sessions' as any).select('*')
        .gte('session_date', yearFrom).lte('session_date', yearTo)
        .order('created_at', { ascending: false }).limit(500),
      supabase.from('staff_members').select('*').order('name'),
      supabase.from('support_assignments').select('*, staff_members(name)').eq('is_active', true),
      supabase.from('student_schedules' as any).select('*'),
      supabase.from('daily_reflections').select('*')
        .gte('created_at', `${yearFrom}T00:00:00`).lte('created_at', `${yearTo}T23:59:59`)
        .order('created_at', { ascending: false }).limit(500),
      supabase.from('student_insights').select('*')
        .gte('created_at', `${yearFrom}T00:00:00`).lte('created_at', `${yearTo}T23:59:59`)
        .order('created_at', { ascending: false }).limit(500),
    ]);
    if (reportsRes.data) setReports(reportsRes.data);
    if (studentsRes.data) setStudents(studentsRes.data);
    if (alertsRes.data) setAlerts(alertsRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (attendanceRes.data) setDailyAttendance(attendanceRes.data);
    if (supportRes.data) setSupportSessions(supportRes.data as any[]);
    if (staffRes.data) setStaffMembers(staffRes.data);
    if (assignRes.data) setSupportAssignments(assignRes.data as any[]);
    if (schedulesRes.data) setStudentSchedules(schedulesRes.data as any[]);
    if (reflectionsRes.data) setDailyReflections(reflectionsRes.data as any[]);
    if (insightsRes.data) setStudentInsights(insightsRes.data as any[]);
    if (studentsRes.data) loadLongAbsent(studentsRes.data);
    
    // Fetch pedagogy data
    const [pedGoalsRes, learnProfilesRes] = await Promise.all([
      supabase.from('pedagogical_goals').select('student_id, subject_id').eq('school_year', selectedYear),
      supabase.from('learning_style_profiles').select('student_id, is_completed'),
    ]);
    if (pedGoalsRes.data) setPedagogyGoals(pedGoalsRes.data);
    if (learnProfilesRes.data) setLearningProfiles(learnProfilesRes.data);
    
    setLoading(false);
  };

  const loadLongAbsent = async (allStudents: Student[]) => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fromDate = fourteenDaysAgo.toISOString().split('T')[0];
    const { data: recentAttendance } = await supabase
      .from('daily_attendance').select('*').gte('attendance_date', fromDate).order('attendance_date', { ascending: false });
    if (!recentAttendance) return;
    const result: { student: Student; consecutiveDays: number; reason: string }[] = [];
    for (const student of allStudents) {
      const records = recentAttendance
        .filter((r: any) => r.student_id === student.id)
        .sort((a: any, b: any) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());
      let consecutive = 0;
      let lastReason = '';
      for (const rec of records) {
        if (rec.is_present) break;
        if (LONG_ABSENT_REASONS.includes(rec.absence_reason as any)) {
          consecutive++;
          if (!lastReason) lastReason = rec.absence_reason || '';
        } else break;
      }
      if (consecutive >= 5) {
        result.push({ student, consecutiveDays: consecutive, reason: ABSENCE_REASON_LABELS[lastReason] || lastReason });
      }
    }
    setLongAbsentStudents(result);
    if (result.length > 0) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const { data: followupData } = await supabase
        .from('absent_student_followups').select('*').gte('week_start', weekStartStr);
      if (followupData) {
        const map = new Map<string, any>();
        followupData.forEach((f: any) => map.set(f.student_id, f));
        setLongAbsentFollowups(map);
      }
    }
  };

  useEffect(() => { fetchAll(); }, [selectedYear]);

  // === Handlers ===
  const handleAddStaff = async () => {
    if (!newStaffName.trim()) { toast.error('נא להזין שם'); return; }
    setAddingStaff(true);
    const { error } = await supabase.from('staff_members').insert({ name: newStaffName.trim() } as any);
    if (error) { toast.error('שגיאה בהוספה'); } else { toast.success(`${newStaffName} נוסף/ה`); setNewStaffName(''); fetchAll(); }
    setAddingStaff(false);
  };

  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff_members').delete().eq('id', id);
    if (!error) { toast.success('נמחק'); fetchAll(); }
  };

  const handleSaveStaffEdit = async () => {
    if (!editingStaffId) return;
    const updates: any = { name: editStaffName.trim() };
    if (editStaffDob) updates.date_of_birth = editStaffDob;
    else updates.date_of_birth = null;
    const { error } = await supabase.from('staff_members').update(updates).eq('id', editingStaffId);
    if (error) { toast.error('שגיאה בעדכון'); } else { toast.success('עודכן בהצלחה'); setEditingStaffId(null); fetchAll(); }
  };
  const handleAddAssignment = async () => {
    if (!user || !assignStudentId || !assignStaffId || assignSupportTypes.length === 0) {
      toast.error('נא למלא את כל השדות'); return;
    }
    setAddingAssignment(true);
    const { error } = await supabase.from('support_assignments').insert({
      student_id: assignStudentId, staff_member_id: assignStaffId, support_types: assignSupportTypes,
      support_description: assignDescription.trim() || null, frequency: assignFrequency,
      frequency_count: assignFrequencyCount, target_date: assignTargetDate || null,
      notes_for_parents: assignNotesForParents.trim() || null, assigned_by: user.id,
    } as any);
    if (!error) {
      toast.success('תמיכה שויכה בהצלחה');
      setShowAddAssignment(false);
      setAssignStudentId(''); setAssignStaffId(''); setAssignSupportTypes([]); setAssignFrequency('weekly');
      setAssignFrequencyCount(1); setAssignTargetDate(''); setAssignNotesForParents(''); setAssignDescription('');
      fetchAll();
    }
    setAddingAssignment(false);
  };

  const handleDeleteAssignment = async (id: string) => {
    const { error } = await supabase.from('support_assignments').delete().eq('id', id);
    if (!error) { toast.success('שיוך נמחק'); fetchAll(); }
  };

  const toggleAssignSupportType = (t: string) => {
    setAssignSupportTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleAddStudent = async () => {
    const finalClass = newClass === '__custom__' ? customClassName.trim() : newClass;
    if (!newFirstName.trim() || !newLastName.trim() || !finalClass) { toast.error('נא למלא את כל השדות'); return; }
    setAddingStudent(true);
    const studentCode = generateRandomCode();
    const parentCode = 'P' + crypto.randomUUID().replace(/-/g, '').slice(0, 7);
    const { error } = await supabase.from('students').insert({
      student_code: studentCode, parent_code: parentCode,
      first_name: newFirstName.trim(), last_name: newLastName.trim(),
      grade: finalClass, class_name: finalClass,
      mother_name: newMotherName.trim() || null,
      father_name: newFatherName.trim() || null,
    });
    if (!error) {
      toast.success(`${newFirstName} ${newLastName} נוסף/ה — קוד תלמיד: ${studentCode}, קוד הורה: ${parentCode}`);
      setNewFirstName(''); setNewLastName(''); setNewClass(''); setCustomClassName(''); setNewMotherName(''); setNewFatherName(''); setShowAddStudent(false); fetchAll();
    } else {
      toast.error('שגיאה בהוספת תלמיד');
    }
    setAddingStudent(false);
  };

  const generateMonthlyReport = async (sid: string | null) => {
    setGeneratingReport(true); setMonthlyReport(null); setReportStudentId(sid);
    try {
      const { data, error } = await supabase.functions.invoke('monthly-report', { body: { studentId: sid } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMonthlyReport(data.summary);
    } catch { toast.error('שגיאה בהפקת הדוח'); } finally { setGeneratingReport(false); }
  };

  const shareMonthlyReport = async () => {
    if (!monthlyReport) return;
    const title = reportStudentId ? `דוח חודשי - ${studentName(reportStudentId)}` : 'דוח חודשי - כלל התלמידים';
    await shareOrDownloadText(monthlyReport, `דוח_חודשי.txt`, title);
    toast.info('הדוח הורד בהצלחה');
  };

  const handleResetPasswordSubmit = () => {
    if (resetCategories.length === 0) { setResetPasswordError('יש לבחור לפחות קטגוריה אחת'); return; }
    if (resetPassword !== '9020') { setResetPasswordError('קוד שגוי'); return; }
    if (resetPasswordConfirm !== '9020') { setResetPasswordError('יש להזין את הקוד פעמיים לאישור'); return; }
    setResetPasswordError(''); setShowResetPassword(false); setResetPassword(''); setResetPasswordConfirm(''); setShowResetConfirm(true);
  };

  const handleResetAllReports = async () => {
    setResetting(true); setShowResetConfirm(false);
    try {
      const selectedTables: string[] = [];
      for (const cat of RESET_CATEGORIES) {
        if (resetCategories.includes(cat.key)) {
          selectedTables.push(...cat.tables);
        }
      }
      const results = await Promise.all(
        selectedTables.map(table =>
          supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        )
      );
      const errors = results.filter(r => r.error);
      const selectedLabels = RESET_CATEGORIES.filter(c => resetCategories.includes(c.key)).map(c => c.label);
      if (errors.length > 0) toast.error('שגיאה באיפוס חלק מהנתונים');
      else toast.success(`אופסו בהצלחה: ${selectedLabels.join(', ')}`);
      setResetCategories([]);
      fetchAll();
    } catch { toast.error('שגיאה באיפוס'); } finally { setResetting(false); }
  };

  const handleFullExport = async () => {
    setExportingFull(true);
    try {
      const [gradesRes, evalsRes, pedRes, examRes, logsRes, subjectsRes] = await Promise.all([
        supabase.from('student_grades').select('*').order('created_at', { ascending: false }),
        supabase.from('student_evaluations').select('*').order('created_at', { ascending: false }),
        supabase.from('pedagogical_goals').select('*').order('month'),
        supabase.from('exam_schedule').select('*').order('exam_date'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('managed_subjects').select('id, name'),
      ]);
      await exportFullActivityToExcel({
        reports, students, alerts, events, dailyAttendance, supportSessions, supportAssignments,
        dailyReflections, studentInsights,
        grades: gradesRes.data || [],
        evaluations: evalsRes.data || [],
        pedagogyGoals: pedRes.data || [],
        examSchedule: examRes.data || [],
        activityLogs: logsRes.data || [],
        staffMembers,
        managedSubjects: subjectsRes.data || [],
      });
      toast.success('קובץ אקסל מלא הורד בהצלחה');
    } catch { toast.error('שגיאה בייצוא'); } finally { setExportingFull(false); }
  };

  const SEMESTER_LABELS: Record<string, string> = { semester_a: 'סמסטר א׳', semester_b: 'סמסטר ב׳', summer: 'סמסטר קיץ', all: 'שנתי מאוחד' };

  const handleGenerateReportCard = async (student: Student) => {
    setGeneratingCard(student.id);
    try {
      let gradesQuery = supabase.from('student_grades' as any).select('*').eq('student_id', student.id);
      if (reportCardSemester !== 'all') gradesQuery = gradesQuery.eq('semester', reportCardSemester);
      const [{ data: grades }, { data: evals }] = await Promise.all([
        gradesQuery,
        supabase.from('student_evaluations' as any).select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(1),
      ]);
      const latestEval = (evals as any)?.[0] || null;
      const isVisible = reflectionVisibility[student.id] !== false;
      let reflectionSummary = null;
      if (isVisible) {
        const mode = reflectionSummaryMode[student.id] || 'year';
        const summary = computeReflectionSummary(student.id, mode, reflectionCustomFrom[student.id], reflectionCustomTo[student.id]);
        if (summary) reflectionSummary = summary.averages;
      }
      const blob = await generateReportCard({
        studentName: `${student.first_name} ${student.last_name}`, className: student.class_name || '',
        semesterLabel: SEMESTER_LABELS[reportCardSemester] || '', gender: student.gender,
        grades: (grades || []).map((g: any) => ({ subject: g.subject, grade: g.grade, verbal_evaluation: g.verbal_evaluation, ai_enhanced_evaluation: g.ai_enhanced_evaluation })),
        personalNote: latestEval?.personal_note || null,
        teamEvaluation: latestEval ? {
          behavior: latestEval.behavior, independent_work: latestEval.independent_work, group_work: latestEval.group_work,
          emotional_regulation: latestEval.emotional_regulation, general_functioning: latestEval.general_functioning,
          helping_others: latestEval.helping_others, environmental_care: latestEval.environmental_care,
          duties_performance: latestEval.duties_performance, studentship: latestEval.studentship,
          problem_solving: latestEval.problem_solving, creative_thinking: latestEval.creative_thinking,
          perseverance: latestEval.perseverance, emotional_tools: latestEval.emotional_tools,
          cognitive_flexibility: latestEval.cognitive_flexibility, self_efficacy: latestEval.self_efficacy,
        } : null,
        reflectionSummary,
        socialEmotionalSummary: latestEval?.social_emotional_summary || null,
      });
      const semSuffix = reportCardSemester === 'all' ? 'שנתי' : SEMESTER_LABELS[reportCardSemester];
      downloadBlob(blob, `תעודה_${semSuffix}_${student.first_name}_${student.last_name}.pdf`);
      toast.success(`תעודה הופקה עבור ${student.first_name}`);
    } catch { toast.error('שגיאה בהפקת התעודה'); } finally { setGeneratingCard(null); }
  };

  const openEditReport = (r: Report) => {
    setEditingReport(r); setEditAttendance(r.attendance); setEditBehaviorTypes([...(r.behavior_types || [])]);
    setEditParticipations([...(r.participation || [])]); setEditComment(r.comment || ''); setEditSubject(r.lesson_subject);
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;
    setSavingEdit(true);
    const { error } = await supabase.from('lesson_reports').update({
      attendance: editAttendance as any, behavior_types: editBehaviorTypes as any,
      participation: editParticipations as any, comment: editComment.trim() || null, lesson_subject: editSubject,
    }).eq('id', editingReport.id);
    if (!error) { toast.success('הדיווח עודכן'); setEditingReport(null); fetchAll(); }
    setSavingEdit(false);
  };

  const handleDeleteReport = async (id: string) => {
    const { error } = await supabase.from('lesson_reports').delete().eq('id', id);
    if (!error) { toast.success('הדיווח נמחק'); setEditingReport(null); fetchAll(); }
  };

  const handleExportStudentPedagogy = async (student: Student, format: 'pdf' | 'excel') => {
    try {
      const { data: goals } = await supabase.from('pedagogical_goals').select('*').eq('student_id', student.id).eq('school_year', selectedYear);
      const { data: subjects } = await supabase.from('managed_subjects').select('id, name').eq('is_active', true);
      if (!goals || goals.length === 0) { toast.error('אין יעדים פדגוגיים לתלמיד זה'); return; }
      const subjectMap = new Map<string, string>();
      (subjects || []).forEach((s: any) => subjectMap.set(s.id, s.name));
      const groups = new Map<string, { subjectName: string; subSubject: string | null; goals: any[] }>();
      goals.forEach((g: any) => {
        const key = `${g.subject_id}_${g.sub_subject || ''}`;
        if (!groups.has(key)) groups.set(key, { subjectName: subjectMap.get(g.subject_id) || 'מקצוע', subSubject: g.sub_subject, goals: [] });
        groups.get(key)!.goals.push(g);
      });
      const sName = `${student.first_name} ${student.last_name}`;
      if (format === 'excel') {
        const XLSX = await import('xlsx');
        const allRows: any[] = [];
        for (const [, group] of groups) {
          group.goals.forEach((g: any) => {
            allRows.push({ subject: group.subSubject ? `${group.subjectName} (${group.subSubject})` : group.subjectName, month: g.month, learningStyle: g.learning_style, currentStatus: g.current_status, learningGoals: g.learning_goals, measurementMethods: g.measurement_methods, whatWasDone: g.what_was_done, whatWasNotDone: g.what_was_not_done, teacherNotes: g.teacher_notes, adminNotes: g.admin_notes });
          });
        }
        const wb = XLSX.utils.book_new();
        const data = allRows.map(r => ({ 'מקצוע': r.subject, 'חודש': r.month, 'סגנון למידה': r.learningStyle || '', 'מצב נוכחי': r.currentStatus || '', 'יעדים לימודיים': r.learningGoals || '', 'דרכי מדידה': r.measurementMethods || '', 'מה נעשה': r.whatWasDone || '', 'פערים': r.whatWasNotDone || '', 'הערות מורה': r.teacherNotes || '', 'הערות הנהלה': r.adminNotes || '' }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'יעדים פדגוגיים');
        downloadWorkbook(wb, `יעדים-פדגוגיים-${sName}-${selectedYear}.xlsx`);
        toast.success('קובץ Excel הורד');
      } else {
        const { default: jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-9999px;left:0;width:800px;font-family:Arial,sans-serif;direction:rtl;background:#fff;padding:24px;';
        let html = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:20px;"><div><div style="font-size:18px;font-weight:bold;color:#1e293b;">יעדים פדגוגיים - ${sName}</div><div style="font-size:12px;color:#64748b;">כל המקצועות | ${selectedYear}</div></div></div>`;
        for (const [, group] of groups) {
          const subjectTitle = group.subSubject ? `${group.subjectName} (${group.subSubject})` : group.subjectName;
          const monthsWithData = PEDAGOGY_MONTHS.filter(m => group.goals.some(g => g.month === m));
          if (monthsWithData.length === 0) continue;
          const fieldLabels = ['מצב נוכחי', 'יעדים', 'מה נעשה', 'פערים', 'הערות מורה'];
          const fieldKeys = ['current_status', 'learning_goals', 'what_was_done', 'what_was_not_done', 'teacher_notes'];
          const headerCells = monthsWithData.map(m => `<th style="padding:5px 6px;font-size:10px;background:#2563eb;color:#fff;text-align:center;min-width:60px;">${m}</th>`).join('');
          const bodyRows = fieldLabels.map((label, i) => {
            const key = fieldKeys[i];
            const cells = monthsWithData.map(m => { const g = group.goals.find(gl => gl.month === m); const val = (g as any)?.[key] || '-'; return `<td style="padding:4px 6px;font-size:9px;border:1px solid #e2e8f0;vertical-align:top;">${val}</td>`; }).join('');
            return `<tr><td style="padding:4px 6px;font-size:10px;font-weight:bold;background:#f1f5f9;border:1px solid #e2e8f0;">${label}</td>${cells}</tr>`;
          }).join('');
          html += `<div style="margin-bottom:20px;"><div style="font-size:13px;font-weight:bold;color:#2563eb;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">📘 ${subjectTitle}</div><table style="width:100%;border-collapse:collapse;"><thead><tr><th style="padding:5px 6px;font-size:10px;background:#1e293b;color:#fff;text-align:center;">תחום</th>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
        }
        container.innerHTML = html;
        document.body.appendChild(container);
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        document.body.removeChild(container);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = 842;
        const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [pdfWidth, Math.max(pdfHeight, 595)] });
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        const blob = pdf.output('blob');
        const fileName = `יעדים-פדגוגיים-${sName}-${selectedYear}.pdf`;
        await shareOrDownload(blob, fileName);
        toast.success('דוח PDF הופק');
      }
    } catch { toast.error('שגיאה בייצוא'); }
  };

  const studentName = (id: string) => {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'לא ידוע';
  };

  // Reflection helpers
  const REFLECTION_LABELS: Record<string, string> = {
    class_presence: 'נוכחות בשיעור', behavior: 'התנהגות', social_interaction: 'אינטראקציה חברתית', academic_tasks: 'משימות לימודיות',
  };
  const REFLECTION_STAR_LABELS: Record<string, string[]> = {
    class_presence: ['לא הייתי', 'הייתי קצת', 'הייתי חצי מהזמן', 'הייתי רוב הזמן', 'הייתי כל הזמן'],
    behavior: ['קשה מאוד', 'קשה', 'בסדר', 'טוב', 'מצוין'],
    social_interaction: ['לא דיברתי עם אף אחד', 'דיברתי מעט', 'הייתי בקשר עם חברים', 'שיתפתי פעולה טוב', 'יזמתי ועזרתי'],
    academic_tasks: ['לא עשיתי כלום', 'עשיתי מעט', 'עשיתי חלק', 'עשיתי רוב המשימות', 'השלמתי הכל'],
  };

  const getReflectionDateRange = (mode: string, customFrom?: string, customTo?: string) => {
    const now = new Date();
    let from: Date, to: Date;
    switch (mode) {
      case 'week': from = new Date(now); from.setDate(now.getDate() - 7); to = now; break;
      case 'month': from = new Date(now.getFullYear(), now.getMonth(), 1); to = now; break;
      case 'year': { const { from: yf, to: yt } = getYearDateRange(selectedYear); from = new Date(yf); to = new Date(yt); break; }
      case 'custom': from = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1); to = customTo ? new Date(customTo) : now; break;
      default: from = new Date(now); from.setDate(now.getDate() - 7); to = now;
    }
    return { from, to };
  };

  const computeReflectionSummary = (studentId: string, mode: string, customFrom?: string, customTo?: string) => {
    const { from, to } = getReflectionDateRange(mode, customFrom, customTo);
    const filtered = dailyReflections.filter(r => r.student_id === studentId && new Date(r.created_at) >= from && new Date(r.created_at) <= to);
    if (filtered.length === 0) return null;
    const sums = { class_presence: 0, behavior: 0, social_interaction: 0, academic_tasks: 0 };
    filtered.forEach(r => { sums.class_presence += r.class_presence || 0; sums.behavior += r.behavior || 0; sums.social_interaction += r.social_interaction || 0; sums.academic_tasks += r.academic_tasks || 0; });
    const count = filtered.length;
    return {
      count,
      averages: { class_presence: +(sums.class_presence / count).toFixed(1), behavior: +(sums.behavior / count).toFixed(1), social_interaction: +(sums.social_interaction / count).toFixed(1), academic_tasks: +(sums.academic_tasks / count).toFixed(1) },
      from, to,
    };
  };

  const renderStars = (value: number, max: number = 5) => (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`text-xs ${i < Math.round(value) ? 'text-primary' : 'text-muted-foreground/30'}`}>★</span>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAbsent = dailyAttendance.filter(a => !a.is_present && a.attendance_date === todayStr);
  const todayReports = reports.filter(r => r.report_date?.startsWith(todayStr));
  const activeStudents = students.filter(s => s.is_active);
  // Dynamic class list derived from active students
  const dynamicClasses = [...new Set(activeStudents.map(s => s.class_name).filter(Boolean))] as string[];

  const getClassStudents = (cls: string) => activeStudents.filter(s => s.class_name === cls);
  const getClassReports = (cls: string) => {
    const ids = new Set(getClassStudents(cls).map(s => s.id));
    return reports.filter(r => ids.has(r.student_id));
  };
  const getClassTodayReports = (cls: string) => {
    const ids = new Set(getClassStudents(cls).map(s => s.id));
    return todayReports.filter(r => ids.has(r.student_id));
  };
  const getClassAbsent = (cls: string) => {
    const ids = new Set(getClassStudents(cls).map(s => s.id));
    return todayAbsent.filter(a => ids.has(a.student_id));
  };
  const getClassAssignments = (cls: string) => {
    const ids = new Set(getClassStudents(cls).map(s => s.id));
    return supportAssignments.filter((sa: any) => ids.has(sa.student_id));
  };

  // Filter events by time
  const getFilteredEvents = () => {
    const now = new Date();
    return events.filter(ev => {
      const evDate = new Date(ev.created_at);
      if (eventsTimeFilter === 'today') {
        return evDate.toISOString().split('T')[0] === todayStr;
      } else if (eventsTimeFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return evDate >= weekAgo;
      } else {
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 30);
        return evDate >= monthAgo;
      }
    });
  };

  // ===== PANEL BACK BUTTON =====
  const renderBackButton = () => (
    <button onClick={() => setActivePanel(null)}
      className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 px-4 py-2.5 rounded-xl mb-3 hover:bg-primary/15 transition-all w-full">
      <ChevronDown className="h-4 w-4 rotate-90" /> חזרה לתפריט
    </button>
  );

  // ===== RENDER CATEGORY GRID =====
  type CategoryCard = { key: string; icon: React.ElementType; label: string; value?: string | number; iconBg: string; iconColor: string; sub?: string };

  const renderCategoryGrid = (cards: CategoryCard[]) => (
    <div className="grid grid-cols-3 gap-2.5">
      {cards.map(card => (
        <button key={card.key} onClick={() => setActivePanel(card.key)}
          className="rounded-2xl p-3.5 text-center border bg-card hover:shadow-md hover:border-primary/20 transition-all cursor-pointer active:scale-[0.97]">
          <div className={`w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center ${card.iconBg}`}>
            <card.icon className={`h-5 w-5 ${card.iconColor}`} />
          </div>
          {card.value !== undefined && <p className="text-lg font-bold leading-tight">{card.value}</p>}
          <p className="text-[11px] text-muted-foreground font-medium">{card.label}</p>
          {card.sub && <p className="text-[9px] text-muted-foreground/60 mt-0.5">{card.sub}</p>}
        </button>
      ))}
    </div>
  );

  // ===== RENDER EVENTS ACCORDION CONTENT =====
  const renderEventsContent = () => {
    const filtered = getFilteredEvents();
    return (
      <div className="space-y-3">
        {/* Time filter */}
        <div className="flex gap-1.5">
          {([['today', 'היום'], ['week', 'שבוע אחרון'], ['month', 'חודש אחרון']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setEventsTimeFilter(key)}
              className={`text-[10px] py-1.5 px-3 rounded-full border font-medium transition-all ${eventsTimeFilter === key ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-border bg-card hover:bg-muted'}`}>
              {label}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-4">אין אירועים חריגים</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filtered.map(ev => (
              <div key={ev.id} className="p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <Badge variant="destructive" className="text-[10px] px-2 py-0 mb-1">
                      {INCIDENT_TYPE_LABELS[ev.incident_type] || ev.incident_type}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.created_at).toLocaleDateString('he-IL')} · {new Date(ev.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1 text-primary" onClick={async () => {
                    try {
                      const eventData = {
                        incidentType: ev.incident_type, description: ev.description,
                        peopleInvolved: ev.people_involved || '', staffResponse: ev.staff_response || '',
                        followupRequired: ev.followup_required, followupNotes: ev.followup_notes || '',
                        date: new Date(ev.created_at).toLocaleDateString('he-IL'),
                        time: new Date(ev.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                      };
                      const blob = await generateEventPdf(eventData);
                      const fileName = `אירוע-חריג-${eventData.date}.pdf`;
                      await shareOrDownload(blob, fileName);
                    } catch { toast.error('שגיאה בהפקת הדוח'); }
                  }}>
                    <Share2 className="h-3 w-3" /> שתף
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-line">{ev.description}</p>
                {ev.people_involved && <p className="text-[10px] text-muted-foreground mt-1.5">👥 {ev.people_involved}</p>}
                {ev.staff_response && <p className="text-[10px] text-muted-foreground mt-1">🛡️ {ev.staff_response}</p>}
                {ev.followup_required && <Badge variant="outline" className="text-[10px] mt-1.5 border-accent text-accent">נדרש מעקב</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ===== RENDER SUPPORT ACCORDION CONTENT =====
  const renderSupportContent = (classFilter?: string) => {
    const filtered = classFilter ? getClassAssignments(classFilter) : supportAssignments;
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => { setAssignClassFilter(classFilter || null); setShowAddAssignment(true); }}>
            <Plus className="h-3 w-3" /> שיוך תמיכה חדשה
          </Button>
        </div>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="assignments">
            <AccordionTrigger className="text-sm font-bold py-3">
              <span className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-accent" />
                שיוכי תמיכה ({filtered.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-4">אין שיוכי תמיכה</p>
                ) : filtered.map((sa: any) => (
                  <div key={sa.id} className="p-2.5 rounded-xl border bg-card">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <button onClick={() => { const s = students.find(st => st.id === sa.student_id); if (s) setSelectedStudent(s); }} className="font-medium text-xs text-primary hover:underline">{studentName(sa.student_id)}</button>
                        <p className="text-[10px] text-muted-foreground">מאמן: {sa.staff_members?.name || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">{sa.frequency === 'daily' ? 'יומי' : 'שבועי'}</Badge>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteAssignment(sa.id)}><X className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(sa.support_types || []).map((t: string) => <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{SUPPORT_LABELS[t] || t}</Badge>)}
                    </div>
                    {sa.support_description && <p className="text-[10px] text-foreground/80 mt-1">📝 {sa.support_description}</p>}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="weekly-summary">
            <AccordionTrigger className="text-sm font-bold py-3">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                סיכום שבועי
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <WeeklySupportSummary
                studentIds={new Set((classFilter ? getClassStudents(classFilter) : activeStudents).map(s => s.id))}
                students={classFilter ? getClassStudents(classFilter) : activeStudents}
                staffMembers={staffMembers}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };

  // ===== RENDER STUDENTS ACCORDION CONTENT =====
  const renderStudentsContent = (classFilter?: string) => {
    const filteredStudents = classFilter ? getClassStudents(classFilter) : activeStudents;
    const filteredAbsent = classFilter ? getClassAbsent(classFilter) : todayAbsent;
    return (
      <div>
        <div className="flex justify-end mb-2">
          <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7"><UserPlus className="h-3 w-3" /> הוספה</Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-sm">
              <DialogHeader><DialogTitle className="text-sm">הוספת תלמיד/ה</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-1">
                <Input placeholder="שם פרטי" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="h-10 text-sm" />
                <Input placeholder="שם משפחה" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="h-10 text-sm" />
                <Select value={newClass} onValueChange={v => { setNewClass(v); if (v !== '__custom__') setCustomClassName(''); }}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר/י כיתה" /></SelectTrigger>
                  <SelectContent>
                    {dynamicClasses.map(c => (<SelectItem key={c} value={c}>הכיתה של {c}</SelectItem>))}
                    <SelectItem value="__custom__">➕ כיתה חדשה...</SelectItem>
                  </SelectContent>
                    <SelectItem value="__custom__">➕ כיתה חדשה...</SelectItem>
                  </SelectContent>
                </Select>
                {newClass === '__custom__' && (
                  <Input placeholder="שם הכיתה החדשה" value={customClassName} onChange={e => setCustomClassName(e.target.value)} className="h-10 text-sm" />
                )}
                <Input placeholder="שם האם (אופציונלי)" value={newMotherName} onChange={e => setNewMotherName(e.target.value)} className="h-10 text-sm" />
                <Input placeholder="שם האב (אופציונלי)" value={newFatherName} onChange={e => setNewFatherName(e.target.value)} className="h-10 text-sm" />
                <p className="text-[10px] text-muted-foreground">קוד תלמיד וקוד הורה ייוצרו אוטומטית</p>
                <Button onClick={handleAddStudent} disabled={addingStudent} className="w-full h-10 text-sm">{addingStudent ? 'מוסיף...' : 'הוספה'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">שם</th>
                <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">כיתה</th>
                <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">דיווחים</th>
                <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">נוכחות</th>
                <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => {
                const studentReports = reports.filter(r => r.student_id === s.id);
                const isAbsentToday = filteredAbsent.some(a => a.student_id === s.id);
                const hasAssignment = supportAssignments.some((sa: any) => sa.student_id === s.id);
                return (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-2.5">
                      <button onClick={() => setSelectedStudent(s)} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {s.first_name.charAt(0)}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-sm block">{s.first_name} {s.last_name}</span>
                          {hasAssignment && <span className="text-[9px] text-accent">● תמיכה</span>}
                        </div>
                      </button>
                    </td>
                    <td className="text-center p-2.5 text-xs text-muted-foreground">{s.class_name}</td>
                    <td className="text-center p-2.5">
                      <span className="text-xs font-medium">{studentReports.length}</span>
                    </td>
                    <td className="text-center p-2.5">
                      {isAbsentToday ? <XCircle className="h-4 w-4 text-destructive mx-auto" /> : <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />}
                    </td>
                    <td className="text-center p-2.5">
                      <div className="flex items-center justify-center gap-0.5">
                        <StudentScheduleManager student={s} schedule={studentSchedules.find((sc: any) => sc.student_id === s.id) || null} onSave={fetchAll} />
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="איפוס שאלון למידה"
                          onClick={async () => {
                            const { error } = await supabase.from('learning_style_profiles').delete().eq('student_id', s.id);
                            if (!error || (error as any)?.code === 'PGRST116') toast.success(`שאלון ${s.first_name} אופס`);
                          }}>
                          <Brain className="h-3 w-3 text-primary" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="ייצוא PDF" onClick={() => handleExportStudentPedagogy(s, 'pdf')}>
                          <BookOpen className="h-3 w-3 text-accent" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="ייצוא Excel" onClick={() => handleExportStudentPedagogy(s, 'excel')}>
                          <FileSpreadsheet className="h-3 w-3 text-green-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ===== RENDER REPORTS ACCORDION CONTENT =====
  const renderReportsContent = (classFilter?: string) => {
    const filteredStudents = classFilter ? getClassStudents(classFilter) : activeStudents;
    const selectedReports = reportSelectedStudentId
      ? reports.filter(r => r.student_id === reportSelectedStudentId)
      : [];
    return (
      <div className="space-y-3">
        <Select value={reportSelectedStudentId || ''} onValueChange={setReportSelectedStudentId}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="בחר/י תלמיד לצפייה בדיווחים" /></SelectTrigger>
          <SelectContent>
            {filteredStudents.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {reportSelectedStudentId && selectedReports.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-4">אין דיווחים לתלמיד זה</p>
        )}

        {reportSelectedStudentId && selectedReports.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-4">אין דיווחים לתלמיד זה</p>
        )}

        {selectedReports.length > 0 && (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {selectedReports.slice(0, 30).map(r => (
                <div key={r.id} className="p-2.5 rounded-xl border bg-card">
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="text-xs font-medium">{r.lesson_subject}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{new Date(r.report_date).toLocaleDateString('he-IL')}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditReport(r)}><Pencil className="h-3 w-3 text-muted-foreground" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {r.attendance === 'full' && <CheckCircle2 className="h-2.5 w-2.5 ml-0.5" />}
                      {r.attendance === 'partial' && <Clock className="h-2.5 w-2.5 ml-0.5" />}
                      {r.attendance === 'absent' && <XCircle className="h-2.5 w-2.5 ml-0.5" />}
                      {ATTENDANCE_LABELS[r.attendance]}
                    </Badge>
                    {r.behavior_types?.map(b => <Badge key={b} variant={b === 'violent' ? 'destructive' : 'outline'} className="text-[10px] px-1.5 py-0">{BEHAVIOR_LABELS[b]}</Badge>)}
                    {r.participation?.map(p => <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">{PARTICIPATION_LABELS[p]}</Badge>)}
                  </div>
                  {r.comment && <p className="text-[10px] text-muted-foreground mt-1.5 bg-muted/50 rounded-lg px-2 py-1">{r.comment}</p>}
                </div>
              ))}
            </div>
            {/* Trend chart for selected student */}
            {selectedReports.length >= 2 && (
              <ReportTrendCharts
                reports={selectedReports}
                title={`מגמות - ${filteredStudents.find(s => s.id === reportSelectedStudentId)?.first_name || ''}`}
                compact
              />
            )}
          </>
        )}

        {/* Trend chart when no student selected */}
        {!reportSelectedStudentId && (() => {
          const chartReports = classFilter ? getClassReports(classFilter) : reports;
          const chartTitle = classFilter ? `מגמות כיתת ${classFilter}` : 'מגמות כלליות';
          return chartReports.length >= 2 ? (
            <ReportTrendCharts reports={chartReports} title={chartTitle} />
          ) : null;
        })()}
      </div>
    );
  };

  // ===== RENDER REFLECTIONS (class views only) =====
  const renderReflectionsContent = (classFilter: string) => {
    const classStudents = getClassStudents(classFilter);
    const studentIdsWithReflections = [...new Set(dailyReflections.map(r => r.student_id).filter(Boolean))].filter(id => classStudents.some(s => s.id === id));
    if (studentIdsWithReflections.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">אין תובנות</p>;

    return (
      <div className="space-y-3">
        {studentIdsWithReflections.map(studentId => {
          const mode = reflectionSummaryMode[studentId] || 'week';
          const summary = computeReflectionSummary(studentId, mode, reflectionCustomFrom[studentId], reflectionCustomTo[studentId]);
          const isVisible = reflectionVisibility[studentId] !== false;
          const sInsights = studentInsights.filter(i => i.student_id === studentId);
          return (
            <div key={studentId} className="border border-border/50 rounded-xl overflow-hidden">
              <div className="bg-muted/30 p-3 flex items-center justify-between">
                <span className="text-sm font-bold">{studentName(studentId)}</span>
                <button onClick={() => setReflectionVisibility(prev => ({ ...prev, [studentId]: !isVisible }))}
                  className={`text-[10px] px-2 py-1 rounded-full border ${isVisible ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
                  {isVisible ? '👁 גלוי בתעודה' : '🔒 נסתר'}
                </button>
              </div>
              <div className="px-3 pt-2 flex flex-wrap gap-1.5">
                {['week', 'month', 'year', 'custom'].map(m => (
                  <button key={m} onClick={() => setReflectionSummaryMode(prev => ({ ...prev, [studentId]: m }))}
                    className={`text-[10px] px-2 py-1 rounded-full border ${mode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}>
                    {{ week: 'שבועי', month: 'חודשי', year: 'שנתי', custom: 'מותאם' }[m]}
                  </button>
                ))}
              </div>
              {mode === 'custom' && (
                <div className="px-3 pt-2 flex items-center gap-2">
                  <input type="date" value={reflectionCustomFrom[studentId] || ''} onChange={e => setReflectionCustomFrom(prev => ({ ...prev, [studentId]: e.target.value }))} className="text-xs border rounded-lg px-2 py-1 bg-background" />
                  <span className="text-xs text-muted-foreground">עד</span>
                  <input type="date" value={reflectionCustomTo[studentId] || ''} onChange={e => setReflectionCustomTo(prev => ({ ...prev, [studentId]: e.target.value }))} className="text-xs border rounded-lg px-2 py-1 bg-background" />
                </div>
              )}
              {summary ? (
                <div className="px-3 py-3 space-y-2">
                  <p className="text-[10px] text-muted-foreground">{summary.count} דיווחים ({summary.from.toLocaleDateString('he-IL')} - {summary.to.toLocaleDateString('he-IL')})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(REFLECTION_LABELS).map(([key, label]) => {
                      const avg = summary.averages[key as keyof typeof summary.averages];
                      const starLabel = REFLECTION_STAR_LABELS[key]?.[Math.round(avg) - 1] || '';
                      return (
                        <div key={key} className="bg-background/60 rounded-xl p-2 space-y-0.5">
                          <span className="text-[10px] text-muted-foreground block">{label}</span>
                          <div className="flex items-center gap-1">{renderStars(avg)}<span className="text-xs font-bold">{avg}</span></div>
                          <span className="text-[9px] text-muted-foreground/70">{starLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <p className="text-xs text-muted-foreground text-center px-3 py-3">אין דיווחים בטווח שנבחר</p>}
              {sInsights.length > 0 && (
                <details className="px-3 pb-3">
                  <summary className="text-[10px] text-primary cursor-pointer hover:underline mb-2">תובנות ({sInsights.length})</summary>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {sInsights.slice(0, 10).map((ins: any) => (
                      <div key={ins.id} className="bg-muted/40 rounded-lg p-2">
                        <span className="text-[10px] text-muted-foreground">{new Date(ins.created_at).toLocaleDateString('he-IL')}</span>
                        <p className="text-xs text-foreground/80">{ins.content}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ===== RENDER LONG ABSENT =====
  const renderLongAbsentContent = (classFilter?: string) => {
    const filtered = classFilter
      ? longAbsentStudents.filter(la => la.student.class_name === classFilter)
      : longAbsentStudents;
    if (filtered.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">אין תלמידים עם היעדרות ממושכת</p>;

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">5+ ימי היעדרות רצופים</p>
        {filtered.map(({ student, consecutiveDays, reason }) => {
          const followup = longAbsentFollowups.get(student.id);
          return (
            <div key={student.id} className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <button onClick={() => setSelectedStudent(student)} className="font-semibold text-sm hover:text-primary transition-colors">{student.first_name} {student.last_name}</button>
                <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">{consecutiveDays} ימים — {reason}</Badge>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1">{followup?.phone_contact ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />} טלפון</span>
                <span className="flex items-center gap-1">{followup?.home_visit ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />} ביקור בית</span>
                <span className="flex items-center gap-1">{followup?.materials_sent ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />} חומרים</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ===== RENDER MONTHLY REPORT CONTENT =====
  const renderMonthlyReportContent = (classFilter?: string) => {
    const filteredStudents = classFilter ? getClassStudents(classFilter) : activeStudents;
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button onClick={() => generateMonthlyReport(null)} disabled={generatingReport} size="sm" className="gap-1.5 flex-1">
            {generatingReport && !reportStudentId ? <><div className="w-3 h-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> מפיק...</> : <><Sparkles className="h-3.5 w-3.5" /> כלל התלמידים</>}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {filteredStudents.map(s => (
            <button key={s.id} onClick={() => generateMonthlyReport(s.id)} disabled={generatingReport}
              className="text-[10px] py-1 px-2 rounded-md border border-border bg-card hover:bg-primary/10 transition-colors disabled:opacity-50">
              {s.first_name} {s.last_name}
            </button>
          ))}
        </div>
        {generatingReport && <div className="flex items-center justify-center py-4"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /><span className="text-xs text-muted-foreground mr-2">מפיק...</span></div>}
        {monthlyReport && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-primary">{reportStudentId ? studentName(reportStudentId) : 'כלל התלמידים'}</p>
              <Button onClick={shareMonthlyReport} size="sm" variant="default" className="gap-1 h-7 text-[10px] bg-[#25D366] hover:bg-[#1da851] text-white">שיתוף</Button>
            </div>
            <p className="text-xs whitespace-pre-wrap leading-relaxed">{monthlyReport}</p>
          </div>
        )}
      </div>
    );
  };

  // ===== RENDER REPORT CARDS CONTENT =====
  const renderReportCardsContent = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 mb-3">
        {[{ value: 'semester_a', label: 'סמסטר א׳' }, { value: 'semester_b', label: 'סמסטר ב׳' }, { value: 'summer', label: 'קיץ' }, { value: 'all', label: 'שנתי' }].map(opt => (
          <button key={opt.value} onClick={() => setReportCardSemester(opt.value)}
            className={`text-[10px] py-1.5 px-1 rounded-md border font-semibold transition-all ${reportCardSemester === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:bg-primary/10'}`}>
            {opt.label}
          </button>
        ))}
      </div>
      {CLASS_OPTIONS.map(cls => {
        const classStudents = activeStudents.filter(s => s.class_name === cls);
        return (
          <div key={cls} className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">כיתת {cls}</p>
            {classStudents.map(s => {
              const isVisible = reflectionVisibility[s.id] !== false;
              const hasReflections = dailyReflections.some(r => r.student_id === s.id);
              return (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                  <span className="text-xs font-medium">{s.first_name} {s.last_name}</span>
                  <div className="flex items-center gap-2">
                    {hasReflections && isVisible && <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">📊 הערכה</span>}
                    <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-[10px]" disabled={generatingCard === s.id} onClick={() => handleGenerateReportCard(s)}>
                      {generatingCard === s.id ? <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <GraduationCap className="h-3.5 w-3.5" />}
                      הפק
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  // ===== EXCEL EXPORT HELPER =====
  const handleExcelExport = (classFilter?: string) => {
    const classStudents = classFilter ? students.filter(s => s.class_name === classFilter) : students;
    const classIds = new Set(classStudents.map(s => s.id));
    exportReportsToExcel({
      reports: reports.filter(r => classIds.has(r.student_id)), students: classStudents,
      alerts: alerts.filter(a => classIds.has(a.student_id)),
      events: classFilter ? events.filter(ev => ev.people_involved && classStudents.some(s => ev.people_involved!.includes(s.first_name))) : events,
      dailyAttendance: dailyAttendance.filter(a => classIds.has(a.student_id)),
      supportSessions: supportSessions.filter((ss: any) => classIds.has(ss.student_id)),
      supportAssignments: supportAssignments.filter((sa: any) => classIds.has(sa.student_id)),
    });
    toast.success(classFilter ? `קובץ אקסל הורד — כיתת ${classFilter}` : 'קובץ אקסל הורד');
  };

  // ===== RENDER PEDAGOGY CONTENT =====
  const renderPedagogyContent = (classFilter?: string) => {
    const targetStudents = classFilter ? activeStudents.filter(s => s.class_name === classFilter) : activeStudents;
    const studentsWithGoals = new Set(pedagogyGoals.map(g => g.student_id));
    const completedProfiles = new Set(learningProfiles.filter(p => p.is_completed).map((p: any) => p.student_id));

    const withGoals = targetStudents.filter(s => studentsWithGoals.has(s.id));
    const withoutGoals = targetStudents.filter(s => !studentsWithGoals.has(s.id));
    const withLearning = targetStudents.filter(s => completedProfiles.has(s.id));
    const withoutLearning = targetStudents.filter(s => !completedProfiles.has(s.id));

    return (
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{withGoals.length}/{targetStudents.length}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">הוזנו יעדים פדגוגיים</p>
          </div>
          <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{withLearning.length}/{targetStudents.length}</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">מילאו שאלון למידה</p>
          </div>
        </div>

        {/* Without goals */}
        {withoutGoals.length > 0 && (
          <div className="rounded-xl border p-3">
            <p className="text-xs font-bold text-destructive mb-2">טרם הוזנו יעדים ({withoutGoals.length})</p>
            <div className="flex flex-wrap gap-1">
              {withoutGoals.map(s => (
                <Badge key={s.id} variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                  {s.first_name} {s.last_name} {s.class_name && `(${s.class_name})`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Without learning style */}
        {withoutLearning.length > 0 && (
          <div className="rounded-xl border p-3">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">טרם מילאו שאלון למידה ({withoutLearning.length})</p>
            <div className="flex flex-wrap gap-1">
              {withoutLearning.map(s => (
                <Badge key={s.id} variant="outline" className="text-[10px] border-amber-400/30 text-amber-600">
                  {s.first_name} {s.last_name} {s.class_name && `(${s.class_name})`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* With goals */}
        {withGoals.length > 0 && (
          <div className="rounded-xl border p-3">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">הוזנו יעדים ({withGoals.length})</p>
            <div className="flex flex-wrap gap-1">
              {withGoals.map(s => (
                <Badge key={s.id} variant="secondary" className="text-[10px]">
                  {s.first_name} {s.last_name} {s.class_name && `(${s.class_name})`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== RENDER CLASS VIEW =====
  const renderClassView = (cls: string) => {
    const filteredStudents = getClassStudents(cls);
    const filteredAbsent = getClassAbsent(cls);
    const filteredReports = getClassTodayReports(cls);
    const filteredAssignments = getClassAssignments(cls);
    const presentCount = filteredStudents.length - filteredAbsent.length;
    const filteredEvents = getFilteredEvents();

    const cards: CategoryCard[] = [
      { key: 'students', icon: Users, value: `${presentCount}/${filteredStudents.length}`, label: 'תלמידים', sub: new Date().toLocaleDateString('he-IL'), iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'reports', icon: FileText, value: filteredReports.length, label: 'דיווחים היום', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'events', icon: ShieldAlert, value: filteredEvents.length, label: 'אירועים חריגים', iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
      { key: 'support', icon: HeartHandshake, value: filteredAssignments.length, label: 'תמיכות', iconBg: 'bg-accent/10', iconColor: 'text-accent' },
      { key: 'long-absent', icon: AlertTriangle, value: longAbsentStudents.filter(la => la.student.class_name === cls).length, label: 'לא מגיעים', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
      { key: 'reflections', icon: MessageSquare, label: 'תובנות והערכה', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'pedagogy', icon: BookOpen, label: 'פדגוגיה', iconBg: 'bg-[hsl(270,40%,92%)]', iconColor: 'text-[hsl(270,40%,35%)]' },
      { key: 'monthly-report', icon: Sparkles, label: 'דוח חודשי AI', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'excel', icon: Download, label: 'הורד אקסל', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    ];

    // If a panel is active, show that panel
    if (activePanel === 'excel') {
      handleExcelExport(cls);
      setActivePanel(null);
    }

    if (activePanel && activePanel !== 'excel') {
      const panelContent: Record<string, React.ReactNode> = {
        students: renderStudentsContent(cls),
        reports: renderReportsContent(cls),
        events: renderEventsContent(),
        support: renderSupportContent(cls),
        'long-absent': renderLongAbsentContent(cls),
        reflections: renderReflectionsContent(cls),
        pedagogy: renderPedagogyContent(cls),
        'monthly-report': renderMonthlyReportContent(cls),
      };
      const panelLabels: Record<string, string> = {
        students: 'תלמידים', reports: 'דיווחים', events: 'אירועים חריגים',
        support: 'תמיכות', 'long-absent': 'תלמידים שלא מגיעים',
        reflections: 'תובנות והערכה עצמית', pedagogy: 'פדגוגיה', 'monthly-report': 'דוח חודשי AI',
      };
      return (
        <div className="space-y-2">
          {renderBackButton()}
          <h3 className="text-sm font-bold">{panelLabels[activePanel] || activePanel}</h3>
          <div className="rounded-2xl border bg-card p-4">{panelContent[activePanel]}</div>
        </div>
      );
    }

    return <div className="space-y-3">{renderCategoryGrid(cards)}</div>;
  };

  // ===== RENDER SETTINGS SCREEN =====
  const renderSettingsContent = () => (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="codes">
        <AccordionTrigger className="text-sm py-2">
          <span className="flex items-center gap-2"><Key className="h-3.5 w-3.5 text-primary" /> ניהול קודים</span>
        </AccordionTrigger>
        <AccordionContent><CodesManager students={students} onRefresh={fetchAll} /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="subjects">
        <AccordionTrigger className="text-sm py-2">
          <span className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-primary" /> ניהול מקצועות</span>
        </AccordionTrigger>
        <AccordionContent><SubjectManager /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="staff">
        <AccordionTrigger className="text-sm py-2">
          <span className="flex items-center gap-2"><UserCog className="h-3.5 w-3.5 text-primary" /> אנשי צוות ({staffMembers.length})</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="שם איש צוות" value={newStaffName} onChange={e => setNewStaffName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddStaff(); }} className="h-9 text-sm flex-1" />
              <Button size="sm" onClick={handleAddStaff} disabled={addingStaff} className="gap-1 h-9"><Plus className="h-3.5 w-3.5" /> הוסף</Button>
            </div>
            {staffMembers.map(sm => (
              <div key={sm.id} className="p-2 rounded-lg border bg-card space-y-1.5">
                {editingStaffId === sm.id ? (
                  <div className="space-y-2">
                    <Input value={editStaffName} onChange={e => setEditStaffName(e.target.value)} className="h-8 text-sm" placeholder="שם" />
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-muted-foreground shrink-0">תאריך לידה:</label>
                      <Input type="date" value={editStaffDob} onChange={e => setEditStaffDob(e.target.value)} className="h-8 text-sm flex-1" />
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setEditingStaffId(null)}>ביטול</Button>
                      <Button size="sm" className="h-7 text-[10px]" onClick={handleSaveStaffEdit}>שמור</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{sm.name}</span>
                      {sm.date_of_birth && (
                        <span className="text-[10px] text-muted-foreground mr-2">
                          🎂 {new Date(sm.date_of_birth).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                        setEditingStaffId(sm.id);
                        setEditStaffName(sm.name);
                        setEditStaffDob(sm.date_of_birth || '');
                      }}><Pencil className="h-3 w-3 text-muted-foreground" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteStaff(sm.id)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="report-cards">
        <AccordionTrigger className="text-sm py-2">
          <span className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-primary" /> הפקת תעודות</span>
        </AccordionTrigger>
        <AccordionContent>{renderReportCardsContent()}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="excel-export">
        <AccordionTrigger className="text-sm py-2">
          <span className="flex items-center gap-2"><FileSpreadsheet className="h-3.5 w-3.5 text-primary" /> ייצוא אקסל לפי כיתה</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {CLASS_OPTIONS.map(cls => (
              <Button key={cls} variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => handleExcelExport(cls)}>
                <Download className="h-3.5 w-3.5" /> הורד אקסל — כיתת {cls}
              </Button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="full-export">
        <AccordionTrigger className="text-sm py-2">
          <span className="flex items-center gap-2"><Download className="h-3.5 w-3.5 text-primary" /> ייצוא מלא — כל הפעולות</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">ייצוא קובץ אקסל מקיף הכולל את כל הפעולות שבוצעו במערכת: דיווחים, נוכחות, ציונים, אירועים, תמיכות, רפלקציות, תובנות, יעדים פדגוגיים, לוח מבחנים, לוגי פעילות ועוד.</p>
            <Button variant="default" size="sm" className="w-full gap-2" onClick={handleFullExport} disabled={exportingFull}>
              <Download className="h-3.5 w-3.5" /> {exportingFull ? 'מייצא...' : 'הורד אקסל מלא'}
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="reset">
        <AccordionTrigger className="text-sm py-2">
          <span className="flex items-center gap-2"><Trash2 className="h-3.5 w-3.5 text-destructive" /> איפוס נתונים</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="text-xs text-destructive/80">⚠️ ניתן לבחור אילו קטגוריות לאפס — הכל או רק חלק. שימו לב: לא ניתן לבטל פעולה זו!</p>
            <Button variant="destructive" size="sm" className="gap-1.5 w-full"
              onClick={() => { setResetPassword(''); setResetPasswordConfirm(''); setResetPasswordError(''); setResetCategories([]); setShowResetPassword(true); }} disabled={resetting}>
              <Trash2 className="h-3.5 w-3.5" />{resetting ? 'מאפס...' : 'איפוס נתונים'}
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  // ===== RENDER MANAGEMENT VIEW =====
  const renderManagementView = () => {
    const presentCount = activeStudents.length - todayAbsent.length;
    const filteredEvents = getFilteredEvents();

    const cards: CategoryCard[] = [
      { key: 'students', icon: Users, value: `${presentCount}/${activeStudents.length}`, label: 'תלמידים', sub: new Date().toLocaleDateString('he-IL'), iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'reports', icon: FileText, value: todayReports.length, label: 'דיווחים היום', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'events', icon: ShieldAlert, value: filteredEvents.length, label: 'אירועים חריגים', iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
      { key: 'support', icon: HeartHandshake, value: supportAssignments.length, label: 'תמיכות', iconBg: 'bg-accent/10', iconColor: 'text-accent' },
      { key: 'long-absent', icon: AlertTriangle, value: longAbsentStudents.length, label: 'לא מגיעים', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
      { key: 'pedagogy', icon: BookOpen, label: 'פדגוגיה', iconBg: 'bg-[hsl(270,40%,92%)]', iconColor: 'text-[hsl(270,40%,35%)]' },
      { key: 'monthly-report', icon: Sparkles, label: 'דוח חודשי AI', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'calendar', icon: Calendar, label: 'לוח שנה', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'sms', icon: MessageSquare, label: 'SMS תזכורות', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'excel', icon: Download, label: 'הפקת אקסל', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
      { key: 'settings', icon: Settings, label: 'הגדרות מערכת', iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
    ];

    if (activePanel === 'excel') {
      handleExcelExport();
      setActivePanel(null);
    }

    if (activePanel && activePanel !== 'excel' && activePanel !== 'sms') {
      const panelContent: Record<string, React.ReactNode> = {
        students: renderStudentsContent(),
        reports: renderReportsContent(),
        events: renderEventsContent(),
        support: renderSupportContent(),
        'long-absent': renderLongAbsentContent(),
        pedagogy: renderPedagogyContent(),
        'monthly-report': renderMonthlyReportContent(),
        calendar: <SharedCalendar editable />,
        settings: renderSettingsContent(),
      };
      const panelLabels: Record<string, string> = {
        students: 'תלמידים', reports: 'דיווחים', events: 'אירועים חריגים',
        support: 'תמיכות', 'long-absent': 'תלמידים שלא מגיעים', pedagogy: 'פדגוגיה',
        'monthly-report': 'דוח חודשי AI', calendar: 'לוח שנה', settings: 'הגדרות מערכת',
      };
      return (
        <div className="space-y-2">
          {renderBackButton()}
          <h3 className="text-sm font-bold">{panelLabels[activePanel] || activePanel}</h3>
          <div className="rounded-2xl border bg-card p-4">{panelContent[activePanel]}</div>
        </div>
      );
    }

    if (activePanel === 'sms') {
      return (
        <div className="space-y-2">
          {renderBackButton()}
          <h3 className="text-sm font-bold">SMS תזכורות</h3>
          <div className="rounded-2xl border bg-card p-4"><SmsReminderSection /></div>
        </div>
      );
    }

    return <div className="space-y-3">{renderCategoryGrid(cards)}</div>;
  };

  // ===== MAIN RENDER =====
  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">שנה:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8 text-xs w-28 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>{SCHOOL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Main View Tabs - BIGGER with prominent pastel active colors and clear separations */}
      <div className="grid grid-cols-3 gap-2.5 p-2 rounded-2xl bg-muted/50 border-2 border-border/60">
        {[
          { key: 'management' as const, label: 'הנהלה', icon: Building2, activeBg: 'bg-violet-100 dark:bg-violet-950/40', activeText: 'text-violet-700 dark:text-violet-300', activeBorder: 'border-violet-400 dark:border-violet-600' },
          { key: 'tali' as const, label: 'כיתת טלי', icon: Users, activeBg: 'bg-emerald-100 dark:bg-emerald-950/40', activeText: 'text-emerald-700 dark:text-emerald-300', activeBorder: 'border-emerald-400 dark:border-emerald-600' },
          { key: 'eden' as const, label: 'כיתת עדן', icon: Users, activeBg: 'bg-sky-100 dark:bg-sky-950/40', activeText: 'text-sky-700 dark:text-sky-300', activeBorder: 'border-sky-400 dark:border-sky-600' },
        ].map(tab => (
          <button key={tab.key} onClick={() => {
            setMainView(tab.key);
            setActivePanel(null);
            setReportSelectedStudentId(null);
          }}
            className={`flex items-center justify-center gap-2 py-4 px-3 rounded-xl text-base font-bold transition-all ${
              mainView === tab.key
                ? `${tab.activeBg} ${tab.activeBorder} border-2 shadow-md ring-1 ring-black/5`
                : 'hover:bg-background/60 border-2 border-transparent'
            }`}>
            <tab.icon className={`h-5 w-5 ${mainView === tab.key ? tab.activeText : 'text-muted-foreground'}`} />
            <span className={`text-sm ${mainView === tab.key ? tab.activeText : 'text-muted-foreground'}`}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* View Content */}
      {mainView === 'management' && renderManagementView()}
      {mainView === 'tali' && renderClassView('טלי')}
      {mainView === 'eden' && renderClassView('עדן')}

      {/* === DIALOGS === */}

      {/* Add Assignment Dialog */}
      <Dialog open={showAddAssignment} onOpenChange={setShowAddAssignment}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">שיוך תמיכה חדש</DialogTitle>
            <DialogDescription className="text-xs">הגדר ספק תמיכה לתלמיד</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Select value={assignStudentId} onValueChange={setAssignStudentId}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר/י תלמיד" /></SelectTrigger>
              <SelectContent>
                {(assignClassFilter ? students.filter(s => s.class_name === assignClassFilter) : students).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}{!assignClassFilter ? ` (${s.class_name})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignStaffId} onValueChange={setAssignStaffId}>
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר/י מאמן" /></SelectTrigger>
              <SelectContent>{staffMembers.map(sm => <SelectItem key={sm.id} value={sm.id}>{sm.name}</SelectItem>)}</SelectContent>
            </Select>
            <div>
              <p className="text-xs font-semibold mb-1.5">סוג תמיכה</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SUPPORT_TYPES_LIST.map(type => (
                  <button key={type} onClick={() => toggleAssignSupportType(type)}
                    className={`text-xs py-2 px-3 rounded-xl border font-medium transition-all ${assignSupportTypes.includes(type) ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/30'}`}>
                    {SUPPORT_LABELS[type]}
                  </button>
                ))}
              </div>
              <Textarea value={assignDescription} onChange={e => setAssignDescription(e.target.value)} className="text-sm min-h-[70px] mt-2" placeholder="תיאור התמיכה..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-semibold mb-1.5">תדירות</p>
                <Select value={assignFrequency} onValueChange={setAssignFrequency}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="daily">יומי</SelectItem><SelectItem value="weekly">שבועי</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5">מופעים</p>
                <Select value={String(assignFrequencyCount)} onValueChange={v => setAssignFrequencyCount(Number(v))}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Input type="date" value={assignTargetDate} onChange={e => setAssignTargetDate(e.target.value)} className="h-10 text-sm" placeholder="תאריך יעד" />
            <Input value={assignNotesForParents} onChange={e => setAssignNotesForParents(e.target.value)} className="h-10 text-sm" placeholder="הערה להורים (אופציונלי)" />
            <Button onClick={handleAddAssignment} disabled={addingAssignment} className="w-full h-10 text-sm">{addingAssignment ? 'משייך...' : 'שייך תמיכה'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog with Category Selection */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent dir="rtl" className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> איפוס נתונים — בחירת קטגוריות</DialogTitle>
            <DialogDescription className="text-xs">בחר אילו קטגוריות למחוק, ואשר עם קוד מנהל</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Select all / deselect all */}
            <div className="flex items-center justify-between border-b pb-2">
              <label className="text-xs font-bold text-foreground">קטגוריות למחיקה:</label>
              <Button variant="outline" size="sm" className="text-xs h-7 px-2"
                onClick={() => {
                  if (resetCategories.length === RESET_CATEGORIES.length) setResetCategories([]);
                  else setResetCategories(RESET_CATEGORIES.map(c => c.key));
                }}>
                {resetCategories.length === RESET_CATEGORIES.length ? 'בטל הכל' : 'בחר הכל'}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-[280px] overflow-y-auto pr-1">
              {RESET_CATEGORIES.map(cat => (
                <label key={cat.key} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                  <Checkbox
                    checked={resetCategories.includes(cat.key)}
                    onCheckedChange={(checked) => {
                      if (checked) setResetCategories(prev => [...prev, cat.key]);
                      else setResetCategories(prev => prev.filter(k => k !== cat.key));
                    }}
                  />
                  <span className="text-xs">{cat.label}</span>
                </label>
              ))}
            </div>
            {resetCategories.length > 0 && (
              <p className="text-xs text-muted-foreground">נבחרו {resetCategories.length} מתוך {RESET_CATEGORIES.length} קטגוריות</p>
            )}
            <div className="border-t pt-3 space-y-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">קוד מנהל — הזנה ראשונה:</label>
                <Input type="password" placeholder="קוד מנהל" value={resetPassword} onChange={e => { setResetPassword(e.target.value); setResetPasswordError(''); }}
                  className="h-10 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">קוד מנהל — הזנה שנייה:</label>
                <Input type="password" placeholder="הזן שוב לאישור" value={resetPasswordConfirm} onChange={e => { setResetPasswordConfirm(e.target.value); setResetPasswordError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleResetPasswordSubmit(); }} className="h-10 text-sm" />
              </div>
            </div>
            {resetPasswordError && <p className="text-xs text-destructive font-medium">{resetPasswordError}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setShowResetPassword(false)}>ביטול</Button>
            <Button variant="destructive" size="sm" onClick={handleResetPasswordSubmit} disabled={resetCategories.length === 0}>אישור איפוס</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent dir="rtl" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <span>פעולה זו תמחק את הקטגוריות הבאות:</span>
              <span className="block font-semibold text-destructive">
                {RESET_CATEGORIES.filter(c => resetCategories.includes(c.key)).map(c => c.label).join(' • ')}
              </span>
              <strong className="text-destructive block">אינה ניתנת לביטול!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAllReports} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">כן, אפס</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StudentDetailDialog student={selectedStudent} open={!!selectedStudent} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }} />

      {/* Edit Report Dialog */}
      <Dialog open={!!editingReport} onOpenChange={(open) => { if (!open) setEditingReport(null); }}>
        <DialogContent dir="rtl" className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">עריכת דיווח</DialogTitle>
            <DialogDescription className="text-xs">
              {editingReport && `${studentName(editingReport.student_id)} — ${new Date(editingReport.report_date).toLocaleDateString('he-IL')}`}
            </DialogDescription>
          </DialogHeader>
          {editingReport && (
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-xs font-semibold mb-1">מקצוע</p>
                <Select value={editSubject} onValueChange={setEditSubject}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['מתמטיקה','עברית','אנגלית','מדעים','היסטוריה','גיאוגרפיה','חינוך גופני','אמנות','מוזיקה','תנ"ך','ספרות','פסיכולוגיה','כישורי חיים'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">נוכחות</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(ATTENDANCE_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setEditAttendance(k)}
                      className={`text-xs py-2 px-2 rounded-lg border font-medium transition-all ${editAttendance === k ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/30'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">התנהגות</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(BEHAVIOR_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setEditBehaviorTypes(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
                      className={`text-xs py-2 px-2 rounded-lg border font-medium transition-all ${editBehaviorTypes.includes(k) ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/30'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">למידה</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(PARTICIPATION_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setEditParticipations(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
                      className={`text-xs py-2 px-2 rounded-lg border font-medium transition-all ${editParticipations.includes(k) ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/30'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea value={editComment} onChange={e => setEditComment(e.target.value)} className="text-sm min-h-[60px]" placeholder="הערה (אופציונלי)" />
              <div className="flex gap-2 pt-1">
                <Button onClick={handleSaveEdit} disabled={savingEdit} className="flex-1 h-9 text-sm">{savingEdit ? 'שומר...' : 'שמור'}</Button>
                <Button variant="destructive" size="sm" className="h-9 text-sm gap-1" onClick={() => handleDeleteReport(editingReport.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> מחק
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
