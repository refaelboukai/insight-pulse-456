import { useEffect, useState } from 'react';
import StudentDetailDialog from '@/components/StudentDetailDialog';
import CodesManager from '@/components/CodesManager';
import SubjectManager from '@/components/SubjectManager';
import WeeklySupportSummary from '@/components/WeeklySupportSummary';
import StudentScheduleManager from '@/components/StudentScheduleManager';
import SmsReminderSection from '@/components/SmsReminderSection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS, INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS, ABSENCE_REASON_LABELS, LONG_ABSENT_REASONS,
} from '@/lib/constants';

import {
  AlertTriangle, TrendingUp, Users, FileText, Bell, UserPlus, ShieldAlert, Shield, Download,
  ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, ClipboardCheck, HeartHandshake, Sparkles, Trash2, GraduationCap, UserCog, Plus, X, Pencil, Key, Share2, Calendar, MessageSquare, Brain, RotateCcw, BookOpen, FileSpreadsheet,
} from 'lucide-react';
import { generateReportCard } from '@/lib/generateReportCard';
import { generateEventPdf } from '@/lib/generateEventPdf';
import { generatePedagogyPdf, generatePedagogyTrackingPdf, type MonthlyGoalRow } from '@/lib/generatePedagogyPdf';
import { exportPedagogyToExcel } from '@/lib/exportPedagogyToExcel';
import { toast } from 'sonner';
import { exportReportsToExcel } from '@/lib/exportReportsToExcel';
import type { Database } from '@/integrations/supabase/types';

type Report = Database['public']['Tables']['lesson_reports']['Row'];
type Student = Database['public']['Tables']['students']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];
type ExceptionalEvent = Database['public']['Tables']['exceptional_events']['Row'];

const CLASS_OPTIONS = ['טלי', 'עדן'];
const SCHOOL_YEARS = ['תשפ"ו', 'תשפ"ז', 'תשפ"ח', 'תשפ"ט'];

// Map Hebrew school year to Gregorian date range (Sept–Aug)
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedYear, setSelectedYear] = useState(SCHOOL_YEARS[0]);

  // Staff management
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);

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
  const [addingStudent, setAddingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Monthly report
  const [monthlyReport, setMonthlyReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportStudentId, setReportStudentId] = useState<string | null>(null);

  // Reset all reports
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetting, setResetting] = useState(false);
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

  // Long-absent students
  const [longAbsentStudents, setLongAbsentStudents] = useState<{ student: Student; consecutiveDays: number; reason: string }[]>([]);
  const [longAbsentFollowups, setLongAbsentFollowups] = useState<Map<string, any>>(new Map());

  // Reflection summary state
  const [reflectionSummaryMode, setReflectionSummaryMode] = useState<Record<string, string>>({});
  const [reflectionCustomFrom, setReflectionCustomFrom] = useState<Record<string, string>>({});
  const [reflectionCustomTo, setReflectionCustomTo] = useState<Record<string, string>>({});
  const [reflectionVisibility, setReflectionVisibility] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const fetchAll = async () => {
    const { from: yearFrom, to: yearTo } = getYearDateRange(selectedYear);
    const today = new Date().toISOString().split('T')[0];
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
    setLoading(false);
  };

  const loadLongAbsent = async (allStudents: Student[]) => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fromDate = fourteenDaysAgo.toISOString().split('T')[0];

    const { data: recentAttendance } = await supabase
      .from('daily_attendance')
      .select('*')
      .gte('attendance_date', fromDate)
      .order('attendance_date', { ascending: false });

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
        .from('absent_student_followups')
        .select('*')
        .gte('week_start', weekStartStr);
      
      if (followupData) {
        const map = new Map<string, any>();
        followupData.forEach((f: any) => map.set(f.student_id, f));
        setLongAbsentFollowups(map);
      }
    }
  };

  useEffect(() => { fetchAll(); }, [selectedYear]);

  // Staff management
  const handleAddStaff = async () => {
    if (!newStaffName.trim()) { toast.error('נא להזין שם'); return; }
    setAddingStaff(true);
    const { error } = await supabase.from('staff_members').insert({ name: newStaffName.trim() } as any);
    if (error) { toast.error('שגיאה בהוספה'); console.error(error); }
    else { toast.success(`${newStaffName} נוסף/ה`); setNewStaffName(''); fetchAll(); }
    setAddingStaff(false);
  };

  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff_members').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); console.error(error); }
    else { toast.success('נמחק'); fetchAll(); }
  };

  // Support assignments
  const handleAddAssignment = async () => {
    if (!user || !assignStudentId || !assignStaffId || assignSupportTypes.length === 0) {
      toast.error('נא למלא את כל השדות'); return;
    }
    setAddingAssignment(true);
    const { error } = await supabase.from('support_assignments').insert({
      student_id: assignStudentId,
      staff_member_id: assignStaffId,
      support_types: assignSupportTypes,
      support_description: assignDescription.trim() || null,
      frequency: assignFrequency,
      frequency_count: assignFrequencyCount,
      target_date: assignTargetDate || null,
      notes_for_parents: assignNotesForParents.trim() || null,
      assigned_by: user.id,
    } as any);
    if (error) { toast.error('שגיאה בשיוך'); console.error(error); }
    else {
      toast.success('תמיכה שויכה בהצלחה');
      setShowAddAssignment(false);
      setAssignStudentId(''); setAssignStaffId(''); setAssignSupportTypes([]); setAssignFrequency('weekly'); setAssignFrequencyCount(1); setAssignTargetDate(''); setAssignNotesForParents(''); setAssignDescription('');
      fetchAll();
    }
    setAddingAssignment(false);
  };

  const handleDeleteAssignment = async (id: string) => {
    const { error } = await supabase.from('support_assignments').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); console.error(error); }
    else { toast.success('שיוך נמחק'); fetchAll(); }
  };

  const toggleAssignSupportType = (t: string) => {
    setAssignSupportTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleAddStudent = async () => {
    if (!newFirstName.trim() || !newLastName.trim() || !newClass) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    setAddingStudent(true);
    const code = `${newClass === 'טלי' ? 'T' : 'E'}${String(students.length + 1).padStart(3, '0')}`;
    const { error } = await supabase.from('students').insert({
      student_code: code,
      first_name: newFirstName.trim(),
      last_name: newLastName.trim(),
      grade: newClass,
      class_name: newClass,
    });
    if (error) {
      toast.error('שגיאה בהוספת תלמיד/ה');
    } else {
      toast.success(`${newFirstName} ${newLastName} נוסף/ה בהצלחה`);
      setNewFirstName('');
      setNewLastName('');
      setNewClass('');
      setShowAddStudent(false);
      fetchAll();
    }
    setAddingStudent(false);
  };

  const generateMonthlyReport = async (sid: string | null) => {
    setGeneratingReport(true);
    setMonthlyReport(null);
    setReportStudentId(sid);
    try {
      const { data, error } = await supabase.functions.invoke('monthly-report', {
        body: { studentId: sid },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMonthlyReport(data.summary);
    } catch (e: any) {
      console.error('Monthly report error:', e);
      toast.error('שגיאה בהפקת הדוח');
    } finally {
      setGeneratingReport(false);
    }
  };

  const shareMonthlyReport = async () => {
    if (!monthlyReport) return;
    const title = reportStudentId
      ? `דוח חודשי - ${studentName(reportStudentId)}`
      : 'דוח חודשי - כלל התלמידים';
    if (navigator.share) {
      try {
        const blob = new Blob([monthlyReport], { type: 'text/plain;charset=utf-8' });
        const file = new File([blob], `דוח_חודשי.txt`, { type: 'text/plain' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title, files: [file] });
        } else {
          await navigator.share({ title, text: monthlyReport });
        }
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(monthlyReport)}`, '_blank');
  };

  const handleResetPasswordSubmit = () => {
    if (resetPassword !== '9020') {
      setResetPasswordError('סיסמה שגויה');
      return;
    }
    setResetPasswordError('');
    setShowResetPassword(false);
    setResetPassword('');
    setShowResetConfirm(true);
  };

  const handleResetAllReports = async () => {
    setResetting(true);
    setShowResetConfirm(false);
    try {
      const results = await Promise.all([
        supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('lesson_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('daily_attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('exceptional_events').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('support_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('student_grades' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('student_evaluations' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('absent_student_followups' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('activity_logs' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('daily_reflections' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('brain_training_scores' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('brain_training_history' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('schedule_checkins' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Reset errors:', errors.map(e => e.error));
        toast.error('שגיאה באיפוס חלק מהנתונים');
      } else {
        toast.success('כל הדיווחים אופסו בהצלחה!');
      }
      fetchAll();
    } catch (e) {
      console.error('Reset error:', e);
      toast.error('שגיאה באיפוס הדיווחים');
    } finally {
      setResetting(false);
    }
  };

  const SEMESTER_LABELS: Record<string, string> = {
    semester_a: 'סמסטר א׳',
    semester_b: 'סמסטר ב׳',
    summer: 'סמסטר קיץ',
    all: 'שנתי מאוחד',
  };

  const handleGenerateReportCard = async (student: Student) => {
    setGeneratingCard(student.id);
    try {
      let gradesQuery = supabase.from('student_grades' as any).select('*').eq('student_id', student.id);
      if (reportCardSemester !== 'all') {
        gradesQuery = gradesQuery.eq('semester', reportCardSemester);
      }
      const [{ data: grades }, { data: evals }] = await Promise.all([
        gradesQuery,
        supabase.from('student_evaluations' as any).select('*').eq('student_id', student.id).order('created_at', { ascending: false }).limit(1),
      ]);

      const latestEval = (evals as any)?.[0] || null;

      // Build reflection summary if visible
      const isVisible = reflectionVisibility[student.id] !== false;
      let reflectionSummary = null;
      if (isVisible) {
        const mode = reflectionSummaryMode[student.id] || 'year';
        const customFrom = reflectionCustomFrom[student.id] || '';
        const customTo = reflectionCustomTo[student.id] || '';
        const summary = computeReflectionSummary(student.id, mode, customFrom, customTo);
        if (summary) {
          reflectionSummary = summary.averages;
        }
      }

      const blob = await generateReportCard({
        studentName: `${student.first_name} ${student.last_name}`,
        className: student.class_name || '',
        semesterLabel: SEMESTER_LABELS[reportCardSemester] || '',
        gender: student.gender,
        grades: (grades || []).map((g: any) => ({
          subject: g.subject,
          grade: g.grade,
          verbal_evaluation: g.verbal_evaluation,
          ai_enhanced_evaluation: g.ai_enhanced_evaluation,
        })),
        personalNote: latestEval?.personal_note || null,
        teamEvaluation: latestEval ? {
          behavior: latestEval.behavior,
          independent_work: latestEval.independent_work,
          group_work: latestEval.group_work,
          emotional_regulation: latestEval.emotional_regulation,
          general_functioning: latestEval.general_functioning,
          helping_others: latestEval.helping_others,
          environmental_care: latestEval.environmental_care,
          duties_performance: latestEval.duties_performance,
          studentship: latestEval.studentship,
          problem_solving: latestEval.problem_solving,
          creative_thinking: latestEval.creative_thinking,
          perseverance: latestEval.perseverance,
          emotional_tools: latestEval.emotional_tools,
          cognitive_flexibility: latestEval.cognitive_flexibility,
          self_efficacy: latestEval.self_efficacy,
        } : null,
        reflectionSummary,
        socialEmotionalSummary: latestEval?.social_emotional_summary || null,
      });

      const semSuffix = reportCardSemester === 'all' ? 'שנתי' : SEMESTER_LABELS[reportCardSemester];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `תעודה_${semSuffix}_${student.first_name}_${student.last_name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`תעודה הופקה עבור ${student.first_name} ${student.last_name}`);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בהפקת התעודה');
    } finally {
      setGeneratingCard(null);
    }
  };

  const openEditReport = (r: Report) => {
    setEditingReport(r);
    setEditAttendance(r.attendance);
    setEditBehaviorTypes([...(r.behavior_types || [])]);
    setEditParticipations([...(r.participation || [])]);
    setEditComment(r.comment || '');
    setEditSubject(r.lesson_subject);
  };

  const toggleEditBehavior = (b: string) => {
    setEditBehaviorTypes(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;
    setSavingEdit(true);
    const { error } = await supabase.from('lesson_reports').update({
      attendance: editAttendance as any,
      behavior_types: editBehaviorTypes as any,
      participation: editParticipations as any,
      comment: editComment.trim() || null,
      lesson_subject: editSubject,
    }).eq('id', editingReport.id);
    if (error) { toast.error('שגיאה בעדכון הדיווח'); console.error(error); }
    else { toast.success('הדיווח עודכן בהצלחה'); setEditingReport(null); fetchAll(); }
    setSavingEdit(false);
  };

  const handleDeleteReport = async (id: string) => {
    const { error } = await supabase.from('lesson_reports').delete().eq('id', id);
    if (error) { toast.error('שגיאה במחיקה'); console.error(error); }
    else { toast.success('הדיווח נמחק'); setEditingReport(null); fetchAll(); }
  };

  const studentName = (id: string) => {
    const s = students.find(st => st.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'לא ידוע';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const SectionHeader = ({ title, icon: Icon, count, badge, sectionKey, color = 'text-primary' }: {
    title: string; icon: React.ElementType; count?: number; badge?: string;
    sectionKey: string; color?: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'text-destructive' ? 'bg-destructive/10' : color === 'text-accent' ? 'bg-accent/10' : 'bg-primary/10'}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="font-semibold text-sm">{title}</span>
        {count !== undefined && (
          <Badge variant={badge === 'destructive' ? 'destructive' : 'secondary'} className="text-xs rounded-full px-2">
            {count}
          </Badge>
        )}
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  // Helper: get filtered data for a view
  const getViewData = (classFilter: string | null) => {
    const viewStudents = classFilter ? students.filter(s => s.class_name === classFilter) : students;
    const viewStudentIds = new Set(viewStudents.map(s => s.id));
    const viewReports = classFilter ? reports.filter(r => viewStudentIds.has(r.student_id)) : reports;
    const viewAlerts = classFilter ? alerts.filter(a => viewStudentIds.has(a.student_id)) : alerts;
    const viewAttendance = classFilter ? dailyAttendance.filter(a => viewStudentIds.has(a.student_id)) : dailyAttendance;
    const viewAssignments = classFilter ? supportAssignments.filter((sa: any) => viewStudentIds.has(sa.student_id)) : supportAssignments;
    // Filter events: if class filter, only show events where people_involved mentions a student from that class
    const viewEvents = classFilter
      ? events.filter(ev => {
          if (!ev.people_involved) return false;
          return viewStudents.some(s => ev.people_involved!.includes(s.first_name) || ev.people_involved!.includes(s.last_name));
        })
      : events;
    const unreadAlerts = viewAlerts.filter(a => !a.is_read);
    const avgPerformance = viewReports.filter(r => r.performance_score).length > 0
      ? (viewReports.reduce((s, r) => s + (r.performance_score || 0), 0) / viewReports.filter(r => r.performance_score).length).toFixed(1)
      : '—';
    return { viewStudents, viewStudentIds, viewReports, viewAlerts, viewAttendance, viewAssignments, viewEvents, unreadAlerts, avgPerformance };
  };

  // Render stats grid
  const renderStats = (viewStudents: Student[], viewReports: Report[], unreadAlerts: Alert[], avgPerformance: string) => (
    <div className="grid grid-cols-4 gap-2 mb-3">
      {[
        { icon: Users, value: viewStudents.length, label: 'תלמידים', color: 'bg-primary/10 text-primary' },
        { icon: FileText, value: viewReports.length, label: 'דיווחים', color: 'bg-primary/10 text-primary' },
        { icon: Bell, value: unreadAlerts.length, label: 'התראות', color: 'bg-accent/10 text-accent' },
        { icon: TrendingUp, value: avgPerformance, label: 'ממוצע', color: 'bg-success/10 text-success' },
      ].map((stat, i) => (
        <div key={i} className="card-styled rounded-xl p-3 text-center">
          <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${stat.color}`}>
            <stat.icon className="h-4 w-4" />
          </div>
          <p className="text-lg font-bold">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );

  // Render attendance section
  const renderAttendance = (viewAttendance: any[], viewStudents: Student[], sectionPrefix: string) => (
    <div className="card-styled rounded-2xl overflow-hidden">
      <SectionHeader title="ביקור סדיר — היום" icon={ClipboardCheck} count={viewAttendance.filter(a => !a.is_present).length} badge={viewAttendance.filter(a => !a.is_present).length > 0 ? 'destructive' : undefined} sectionKey={`${sectionPrefix}_dailyAttendance`} />
      {expandedSections[`${sectionPrefix}_dailyAttendance`] && (
        <div className="px-3 pb-3">
          {(() => {
            const absentRecords = viewAttendance.filter(a => !a.is_present);
            const presentCount = viewStudents.length - absentRecords.length;
            if (absentRecords.length === 0) {
              return (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1.5" />
                  <p className="text-xs text-success font-medium">כל התלמידים נוכחים היום!</p>
                  <p className="text-[10px] text-muted-foreground">{presentCount}/{viewStudents.length}</p>
                </div>
              );
            }
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>📅 {new Date().toLocaleDateString('he-IL')}</span>
                  <span>{presentCount}/{viewStudents.length} נוכחים</span>
                </div>
                {CLASS_OPTIONS.map(cls => {
                  const classAbsent = absentRecords.filter(a => {
                    const s = students.find(st => st.id === a.student_id);
                    return s?.class_name === cls;
                  });
                  if (classAbsent.length === 0) return null;
                  return (
                    <div key={cls}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">הכיתה של {cls}</p>
                      {classAbsent.map(a => {
                        const s = students.find(st => st.id === a.student_id);
                        if (!s) return null;
                        const reason = a.absence_reason
                          ? ABSENCE_REASON_LABELS[a.absence_reason] || a.absence_reason
                          : 'לא צוינה סיבה';
                        return (
                          <div key={a.student_id} className="flex items-center justify-between text-xs bg-destructive/5 rounded-lg px-3 py-1.5 mb-1">
                            <span className="font-medium">{s.first_name} {s.last_name}</span>
                            <Badge variant="outline" className="text-[10px] px-2">{reason}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  // Render alerts section
  const renderAlerts = (unreadAlerts: Alert[], sectionPrefix: string) => {
    if (unreadAlerts.length === 0) return null;
    return (
      <div className="card-styled rounded-2xl overflow-hidden border-destructive/20">
        <SectionHeader title="התראות" icon={AlertTriangle} count={unreadAlerts.length} badge="destructive" sectionKey={`${sectionPrefix}_alerts`} color="text-destructive" />
        {expandedSections[`${sectionPrefix}_alerts`] && (
          <div className="px-3 pb-3 space-y-1.5">
            {unreadAlerts.slice(0, 5).map(a => (
              <div key={a.id} className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs">{studentName(a.student_id)}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString('he-IL')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render support assignments
  const renderSupport = (viewAssignments: any[], sectionPrefix: string, showManagement: boolean, classFilter: string | null = null) => (
    <div className="card-styled rounded-2xl overflow-hidden border-primary/20">
      <div className="flex items-center justify-between px-3 pt-1">
        <SectionHeader title="שיוך תמיכות" icon={HeartHandshake} count={viewAssignments.length} sectionKey={`${sectionPrefix}_support`} />
        {showManagement && (
          <Button size="sm" variant="ghost" className="gap-1 text-xs h-8 ml-2" onClick={() => { setAssignClassFilter(classFilter); setShowAddAssignment(true); }}>
            <Plus className="h-3.5 w-3.5" />
            שיוך חדש
          </Button>
        )}
      </div>
      {expandedSections[`${sectionPrefix}_support`] && (
        <div className="px-3 pb-3 space-y-1.5">
          {viewAssignments.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-6">אין שיוכי תמיכה{showManagement ? '. לחצ/י על ״שיוך חדש״' : ''}</p>
          ) : (
            viewAssignments.map((sa: any) => (
              <div key={sa.id} className="p-2.5 rounded-lg border bg-card">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-medium text-xs">{studentName(sa.student_id)}</p>
                    <p className="text-[10px] text-muted-foreground">מאמן: {sa.staff_members?.name || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">{sa.frequency === 'daily' ? 'יומי' : 'שבועי'}</Badge>
                    {showManagement && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteAssignment(sa.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(sa.support_types || []).map((t: string) => (
                    <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{SUPPORT_LABELS[t] || t}</Badge>
                  ))}
                </div>
                {sa.support_description && <p className="text-[10px] text-foreground/80 mt-1">📝 {sa.support_description}</p>}
                {sa.target_date && <p className="text-[10px] text-muted-foreground mt-0.5">יעד: {new Date(sa.target_date).toLocaleDateString('he-IL')}</p>}
                {sa.notes_for_parents && <p className="text-[10px] text-muted-foreground mt-0.5">הערה להורים: {sa.notes_for_parents}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Render weekly support summary
  const renderWeeklySupport = (viewStudentIds: Set<string>, viewStudents: Student[], sectionPrefix: string) => (
    <div className="card-styled rounded-2xl overflow-hidden border-primary/20">
      <SectionHeader title="תמיכות שבוצעו השבוע" icon={CheckCircle2} sectionKey={`${sectionPrefix}_weeklySupport`} />
      {expandedSections[`${sectionPrefix}_weeklySupport`] && (
        <div className="px-3 pb-3">
          <WeeklySupportSummary studentIds={viewStudentIds} students={viewStudents} staffMembers={staffMembers} />
        </div>
      )}
    </div>
  );

  const PEDAGOGY_MONTHS = ['ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני'];

  const handleExportStudentPedagogy = async (student: Student, format: 'pdf' | 'excel') => {
    const studentName = `${student.first_name} ${student.last_name}`;
    try {
      // Fetch all pedagogy goals for this student in the selected year
      const { data: goals } = await supabase.from('pedagogical_goals')
        .select('*')
        .eq('student_id', student.id)
        .eq('school_year', selectedYear);

      if (!goals || goals.length === 0) {
        toast.error(`אין יעדים פדגוגיים עבור ${studentName}`);
        return;
      }

      // Fetch subject names
      const { data: subjectsData } = await supabase.from('managed_subjects').select('id, name').eq('is_active', true);
      const subjectMap = new Map((subjectsData || []).map(s => [s.id, s.name]));

      // Group goals by subject+sub_subject
      const groups = new Map<string, { subjectName: string; subSubject: string | null; goals: typeof goals }>();
      for (const g of goals) {
        const key = `${g.subject_id}_${g.sub_subject || ''}`;
        if (!groups.has(key)) {
          groups.set(key, {
            subjectName: subjectMap.get(g.subject_id) || 'לא ידוע',
            subSubject: g.sub_subject,
            goals: [],
          });
        }
        groups.get(key)!.goals.push(g);
      }

      if (format === 'excel') {
        // Export all subjects into one Excel with multiple "virtual" sheets via combined rows
        const allRows: { month: string; subject: string; learningStyle: string | null; currentStatus: string | null; learningGoals: string | null; measurementMethods: string | null; whatWasDone: string | null; whatWasNotDone: string | null; teacherNotes: string | null; adminNotes: string | null }[] = [];
        for (const [, group] of groups) {
          const subjectTitle = group.subSubject ? `${group.subjectName} (${group.subSubject})` : group.subjectName;
          for (const month of PEDAGOGY_MONTHS) {
            const g = group.goals.find(gl => gl.month === month);
            if (g) {
              allRows.push({
                month,
                subject: subjectTitle,
                learningStyle: g.learning_style,
                currentStatus: g.current_status,
                learningGoals: g.learning_goals,
                measurementMethods: g.measurement_methods,
                whatWasDone: g.what_was_done,
                whatWasNotDone: g.what_was_not_done,
                teacherNotes: g.teacher_notes,
                adminNotes: g.admin_notes,
              });
            }
          }
        }

        // Use xlsx directly for multi-subject export
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const data = allRows.map(r => ({
          'מקצוע': r.subject,
          'חודש': r.month,
          'סגנון למידה': r.learningStyle || '',
          'מצב נוכחי': r.currentStatus || '',
          'יעדים לימודיים': r.learningGoals || '',
          'דרכי מדידה': r.measurementMethods || '',
          'מה נעשה': r.whatWasDone || '',
          'פערים': r.whatWasNotDone || '',
          'הערות מורה': r.teacherNotes || '',
          'הערות הנהלה': r.adminNotes || '',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const cols = Object.keys(data[0] || {});
        ws['!cols'] = cols.map(col => {
          const maxLen = Math.max(col.length, ...data.map(r => ((r as any)[col] || '').length));
          return { wch: Math.min(Math.max(maxLen, 10), 40) };
        });
        XLSX.utils.book_append_sheet(wb, ws, 'יעדים פדגוגיים');
        XLSX.writeFile(wb, `יעדים-פדגוגיים-${studentName}-${selectedYear}.xlsx`);
        toast.success('קובץ Excel הורד בהצלחה');
      } else {
        // PDF: generate a combined tracking PDF for all subjects
        const { default: jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        // Build a combined HTML for all subjects
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-9999px;left:0;width:800px;font-family:Arial,sans-serif;direction:rtl;background:#fff;padding:24px;';

        let html = `
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:20px;">
            <div>
              <div style="font-size:18px;font-weight:bold;color:#1e293b;">יעדים פדגוגיים - ${studentName}</div>
              <div style="font-size:12px;color:#64748b;">כל המקצועות | ${selectedYear}</div>
            </div>
          </div>
        `;

        for (const [, group] of groups) {
          const subjectTitle = group.subSubject ? `${group.subjectName} (${group.subSubject})` : group.subjectName;
          const monthsWithData = PEDAGOGY_MONTHS.filter(m => group.goals.some(g => g.month === m));
          if (monthsWithData.length === 0) continue;

          const fieldLabels = ['מצב נוכחי', 'יעדים', 'מה נעשה', 'פערים', 'הערות מורה'];
          const fieldKeys = ['current_status', 'learning_goals', 'what_was_done', 'what_was_not_done', 'teacher_notes'];

          const headerCells = monthsWithData.map(m => `<th style="padding:5px 6px;font-size:10px;background:#2563eb;color:#fff;text-align:center;min-width:60px;">${m}</th>`).join('');
          const bodyRows = fieldLabels.map((label, i) => {
            const key = fieldKeys[i];
            const cells = monthsWithData.map(m => {
              const g = group.goals.find(gl => gl.month === m);
              const val = (g as any)?.[key] || '-';
              return `<td style="padding:4px 6px;font-size:9px;border:1px solid #e2e8f0;vertical-align:top;max-width:100px;word-break:break-word;">${val}</td>`;
            }).join('');
            return `<tr><td style="padding:4px 6px;font-size:10px;font-weight:bold;background:#f1f5f9;border:1px solid #e2e8f0;white-space:nowrap;">${label}</td>${cells}</tr>`;
          }).join('');

          html += `
            <div style="margin-bottom:20px;">
              <div style="font-size:13px;font-weight:bold;color:#2563eb;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">📘 ${subjectTitle}</div>
              <table style="width:100%;border-collapse:collapse;">
                <thead><tr><th style="padding:5px 6px;font-size:10px;background:#1e293b;color:#fff;text-align:center;">תחום</th>${headerCells}</tr></thead>
                <tbody>${bodyRows}</tbody>
              </table>
            </div>
          `;
        }

        html += `<div style="margin-top:16px;font-size:9px;color:#94a3b8;text-align:center;">הופק בתאריך ${new Date().toLocaleDateString('he-IL')}</div>`;
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
        const fileName = `יעדים-פדגוגיים-${studentName}-${selectedYear}.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: fileName, files: [file] });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
          URL.revokeObjectURL(url);
        }
        toast.success('דוח PDF הופק בהצלחה');
      }
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בייצוא');
    }
  };

  // Render students list
  const renderStudents = (viewStudents: Student[], sectionPrefix: string, showManagement: boolean) => (
    <div className="card-styled rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-1">
        <SectionHeader title="תלמידים" icon={Users} count={viewStudents.length} sectionKey={`${sectionPrefix}_students`} />
        {showManagement && (
          <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="gap-1 text-xs h-8 ml-2">
                <UserPlus className="h-3.5 w-3.5" />
                הוספה
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-sm">הוספת תלמיד/ה</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-1">
                <Input placeholder="שם פרטי" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="h-10 text-sm" />
                <Input placeholder="שם משפחה" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="h-10 text-sm" />
                <Select value={newClass} onValueChange={setNewClass}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר/י כיתה" /></SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map(c => (<SelectItem key={c} value={c}>הכיתה של {c}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddStudent} disabled={addingStudent} className="w-full h-10 text-sm">
                  {addingStudent ? 'מוסיף...' : 'הוספה'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {expandedSections[`${sectionPrefix}_students`] && (
        <div className="px-3 pb-3">
          {(sectionPrefix === 'mgmt' ? CLASS_OPTIONS : [sectionPrefix === 'tali' ? 'טלי' : 'עדן']).map(cls => {
            const classStudents = viewStudents.filter(s => s.class_name === cls);
            return (
              <div key={cls} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-primary/30">
                  <span className="text-base font-bold text-primary">🏫 הכיתה של {cls}</span>
                  <Badge variant="default" className="text-xs px-2 py-0.5">{classStudents.length} תלמידים</Badge>
                </div>
                <div className="space-y-1">
                  {classStudents.map(s => (
                    <div key={s.id} className="flex items-stretch gap-1.5">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="flex-1 text-right text-xs p-2.5 rounded-lg bg-secondary/50 border border-border hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <span className="font-semibold text-sm">{s.first_name} {s.last_name}</span>
                      </button>
                      {showManagement && (
                        <>
                          <StudentScheduleManager
                            student={s}
                            schedule={studentSchedules.find((sc: any) => sc.student_id === s.id) || null}
                            onSave={fetchAll}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="self-center h-8 w-8 p-0"
                            title="פתח מחדש שאלון סגנון למידה"
                            onClick={async () => {
                              const { error } = await supabase
                                .from('learning_style_profiles')
                                .delete()
                                .eq('student_id', s.id);
                              if (error && error.code !== 'PGRST116') {
                                toast.error('שגיאה באיפוס השאלון');
                              } else {
                                toast.success(`שאלון סגנון הלמידה של ${s.first_name} אופס`);
                              }
                            }}
                          >
                            <Brain className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="self-center h-8 w-8 p-0"
                            title="ייצוא יעדים פדגוגיים PDF"
                            onClick={() => handleExportStudentPedagogy(s, 'pdf')}
                          >
                            <BookOpen className="h-3.5 w-3.5 text-accent" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="self-center h-8 w-8 p-0"
                            title="ייצוא יעדים פדגוגיים Excel"
                            onClick={() => handleExportStudentPedagogy(s, 'excel')}
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Render report cards section (separate from students)
  const renderReportCards = (viewStudents: Student[], sectionPrefix: string) => (
    <div className="card-styled rounded-2xl overflow-hidden border-primary/20">
      <SectionHeader title="הפקת תעודות" icon={GraduationCap} count={viewStudents.length} sectionKey={`${sectionPrefix}_reportCards`} />
      {expandedSections[`${sectionPrefix}_reportCards`] && (
        <div className="px-3 pb-3">
          <div className="mb-3 p-2 rounded-lg bg-muted/30 border border-border">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">תעודה לפי תקופה:</p>
            <div className="grid grid-cols-4 gap-1">
              {[
                { value: 'semester_a', label: 'סמסטר א׳' },
                { value: 'semester_b', label: 'סמסטר ב׳' },
                { value: 'summer', label: 'קיץ' },
                { value: 'all', label: 'שנתי' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReportCardSemester(opt.value)}
                  className={`text-[10px] py-1.5 px-1 rounded-md border transition-all font-semibold ${
                    reportCardSemester === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card hover:bg-primary/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {(sectionPrefix === 'mgmt' ? CLASS_OPTIONS : [sectionPrefix === 'tali' ? 'טלי' : 'עדן']).map(cls => {
            const classStudents = viewStudents.filter(s => s.class_name === cls);
            return (
              <div key={cls} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-primary/20">
                  <span className="text-sm font-bold text-primary">🏫 {cls}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">{classStudents.length}</Badge>
                </div>
                <div className="space-y-1">
                  {classStudents.map(s => {
                    const isVisible = reflectionVisibility[s.id] !== false;
                    const hasReflections = dailyReflections.some(r => r.student_id === s.id);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                        <span className="text-xs font-medium">{s.first_name} {s.last_name}</span>
                        <div className="flex items-center gap-2">
                          {hasReflections && isVisible && (
                            <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">📊 כולל הערכה עצמית</span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 gap-1 text-[10px] border-primary/30 hover:bg-primary/10"
                            disabled={generatingCard === s.id}
                            onClick={() => handleGenerateReportCard(s)}
                          >
                            {generatingCard === s.id ? (
                              <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            ) : (
                              <GraduationCap className="h-3.5 w-3.5" />
                            )}
                            הפק תעודה
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Render reports section
  const renderReports = (viewReports: Report[], sectionPrefix: string) => {
    const recentReports = viewReports.slice(0, 15);
    return (
      <div className="card-styled rounded-2xl overflow-hidden">
        <SectionHeader title="דיווחים אחרונים" icon={FileText} count={viewReports.length} sectionKey={`${sectionPrefix}_reports`} />
        {expandedSections[`${sectionPrefix}_reports`] && (
          <div className="px-3 pb-3 space-y-1.5">
            {recentReports.map(r => (
              <div key={r.id} className="p-2.5 rounded-lg border bg-card">
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <button onClick={() => { const s = students.find(st => st.id === r.student_id); if (s) setSelectedStudent(s); }} className="font-medium text-xs text-primary hover:underline text-right">{studentName(r.student_id)}</button>
                    <p className="text-[10px] text-muted-foreground">{r.lesson_subject}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.report_date).toLocaleDateString('he-IL')}
                    </span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditReport(r)}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {r.attendance === 'full' && <CheckCircle2 className="h-2.5 w-2.5 ml-0.5" />}
                    {r.attendance === 'partial' && <Clock className="h-2.5 w-2.5 ml-0.5" />}
                    {r.attendance === 'absent' && <XCircle className="h-2.5 w-2.5 ml-0.5" />}
                    {ATTENDANCE_LABELS[r.attendance]}
                  </Badge>
                  {r.behavior_types?.map(b => (
                    <Badge key={b} variant={b === 'violent' ? 'destructive' : 'outline'} className="text-[10px] px-1.5 py-0">
                      {BEHAVIOR_LABELS[b]}
                    </Badge>
                  ))}
                  {r.behavior_severity && (
                    <Badge className={`severity-badge-${r.behavior_severity} text-[10px] px-1.5 py-0`}>
                      חומרה {r.behavior_severity}
                    </Badge>
                  )}
                  {r.participation && r.participation.length > 0 && r.participation.map(p => (
                    <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">{PARTICIPATION_LABELS[p]}</Badge>
                  ))}
                  {r.performance_score && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">ביצועים: {r.performance_score}</Badge>
                  )}
                </div>
                {r.comment && <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-1">{r.comment}</p>}
              </div>
            ))}
            {recentReports.length === 0 && (
              <p className="text-center text-muted-foreground text-xs py-6">אין דיווחים עדיין</p>
            )}
          </div>
        )}
      </div>
    );
  };
  // Render exceptional events section
  const renderEvents = (viewEvents: ExceptionalEvent[], sectionPrefix: string) => {
    if (viewEvents.length === 0) return null;
    return (
      <div className="card-styled rounded-2xl overflow-hidden border-accent/20">
        <SectionHeader title="אירועים חריגים" icon={ShieldAlert} count={viewEvents.length} sectionKey={`${sectionPrefix}_events`} color="text-accent" />
        {expandedSections[`${sectionPrefix}_events`] && (
          <div className="px-3 pb-3 space-y-1.5">
            {viewEvents.slice(0, 5).map(ev => (
              <div key={ev.id} className="p-2.5 rounded-lg bg-accent/5 border border-accent/10">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {INCIDENT_TYPE_LABELS[ev.incident_type] || ev.incident_type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(ev.created_at).toLocaleDateString('he-IL')}
                  </span>
                </div>
                <p className="text-xs line-clamp-2">{ev.description}</p>
                {ev.people_involved && (
                  <p className="text-[10px] text-muted-foreground mt-1">מעורבים: {ev.people_involved}</p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  {ev.followup_required ? (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">נדרש מעקב</Badge>
                  ) : <span />}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px] mr-auto"
                    onClick={async () => {
                      try {
                        const eventData = {
                          incidentType: ev.incident_type,
                          description: ev.description,
                          peopleInvolved: ev.people_involved || '',
                          staffResponse: ev.staff_response || '',
                          followupRequired: ev.followup_required,
                          followupNotes: ev.followup_notes || '',
                          date: new Date(ev.created_at).toLocaleDateString('he-IL'),
                        };
                        const blob = await generateEventPdf(eventData);
                        const typeName = INCIDENT_TYPE_LABELS[ev.incident_type] || ev.incident_type;
                        const fileName = `אירוע_חריג_${typeName}_${eventData.date}.pdf`;
                        const file = new File([blob], fileName, { type: 'application/pdf' });
                        if (navigator.share && navigator.canShare?.({ files: [file] })) {
                          await navigator.share({
                            title: `דיווח אירוע חריג - ${typeName}`,
                            text: `🚨 אירוע חריג: ${typeName}\n${ev.description}`,
                            files: [file],
                          });
                        } else {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = fileName;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success('הדוח הורד בהצלחה');
                        }
                      } catch (e: any) {
                        if (e?.name !== 'AbortError') toast.error('שגיאה בהפקת הדוח');
                      }
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5 ml-1" />
                    שתף דוח
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const REFLECTION_LABELS: Record<string, string> = {
    class_presence: 'נוכחות בשיעור',
    behavior: 'התנהגות',
    social_interaction: 'אינטראקציה חברתית',
    academic_tasks: 'משימות לימודיות',
  };

  const REFLECTION_STAR_LABELS: Record<string, string[]> = {
    class_presence: ['לא הייתי', 'הייתי קצת', 'הייתי חצי מהזמן', 'הייתי רוב הזמן', 'הייתי כל הזמן'],
    behavior: ['קשה מאוד', 'קשה', 'בסדר', 'טוב', 'מצוין'],
    social_interaction: ['לא דיברתי עם אף אחד', 'דיברתי מעט', 'הייתי בקשר עם חברים', 'שיתפתי פעולה טוב', 'יזמתי ועזרתי לאחרים'],
    academic_tasks: ['לא עשיתי כלום', 'עשיתי מעט', 'עשיתי חלק', 'עשיתי רוב המשימות', 'השלמתי הכל'],
  };


  const getReflectionDateRange = (mode: string, customFrom?: string, customTo?: string) => {
    const now = new Date();
    let from: Date, to: Date;
    switch (mode) {
      case 'week': {
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        to = now;
        break;
      }
      case 'month': {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
        break;
      }
      case 'year': {
        const { from: yf, to: yt } = getYearDateRange(selectedYear);
        from = new Date(yf);
        to = new Date(yt);
        break;
      }
      case 'custom': {
        from = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
        to = customTo ? new Date(customTo) : now;
        break;
      }
      default: {
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        to = now;
      }
    }
    return { from, to };
  };

  const computeReflectionSummary = (studentId: string, mode: string, customFrom?: string, customTo?: string) => {
    const { from, to } = getReflectionDateRange(mode, customFrom, customTo);
    const filtered = dailyReflections.filter(r => {
      if (r.student_id !== studentId) return false;
      const d = new Date(r.created_at);
      return d >= from && d <= to;
    });
    if (filtered.length === 0) return null;

    const sums = { class_presence: 0, behavior: 0, social_interaction: 0, academic_tasks: 0 };
    filtered.forEach(r => {
      sums.class_presence += r.class_presence || 0;
      sums.behavior += r.behavior || 0;
      sums.social_interaction += r.social_interaction || 0;
      sums.academic_tasks += r.academic_tasks || 0;
    });
    const count = filtered.length;
    return {
      count,
      averages: {
        class_presence: +(sums.class_presence / count).toFixed(1),
        behavior: +(sums.behavior / count).toFixed(1),
        social_interaction: +(sums.social_interaction / count).toFixed(1),
        academic_tasks: +(sums.academic_tasks / count).toFixed(1),
      },
      from,
      to,
    };
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'week': return 'שבועי';
      case 'month': return 'חודשי';
      case 'year': return 'שנתי';
      case 'custom': return 'מותאם אישית';
      default: return 'שבועי';
    }
  };

  const renderStars = (value: number, max: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`text-xs ${i < Math.round(value) ? 'text-primary' : 'text-muted-foreground/30'}`}>★</span>
        ))}
      </div>
    );
  };

  // Render student reflections & insights
  const renderStudentReflections = (viewStudentIds: Set<string>, sectionPrefix: string) => {
    const viewReflections = dailyReflections.filter(r => r.student_id && viewStudentIds.has(r.student_id));
    const viewInsights = studentInsights.filter(i => viewStudentIds.has(i.student_id));
    const totalCount = viewReflections.length + viewInsights.length;
    if (totalCount === 0) return null;

    const getStudentName = (studentId: string) => {
      const s = students.find(st => st.id === studentId);
      return s ? `${s.first_name} ${s.last_name}` : 'לא ידוע';
    };

    // Group reflections by student
    const studentIdsWithReflections = [...new Set(viewReflections.map(r => r.student_id))];

    return (
      <div className="card-styled rounded-2xl overflow-hidden border-primary/20">
        <SectionHeader title="תובנות ודיווחי היום שלי" icon={MessageSquare} count={totalCount} sectionKey={`${sectionPrefix}_reflections`} />
        {expandedSections[`${sectionPrefix}_reflections`] && (
          <div className="px-3 pb-3 space-y-4">
            {/* Per-student summaries */}
            {studentIdsWithReflections.map(studentId => {
              const mode = reflectionSummaryMode[studentId] || 'week';
              const customFrom = reflectionCustomFrom[studentId] || '';
              const customTo = reflectionCustomTo[studentId] || '';
              const summary = computeReflectionSummary(studentId, mode, customFrom, customTo);
              const isVisible = reflectionVisibility[studentId] !== false; // default visible
              const studentReflections = viewReflections.filter(r => r.student_id === studentId);
              const studentInsightsFiltered = viewInsights.filter(i => i.student_id === studentId);

              return (
                <div key={studentId} className="border border-border/50 rounded-xl overflow-hidden">
                  {/* Student header */}
                  <div className="bg-muted/30 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{getStudentName(studentId)}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5">{studentReflections.length} דיווחים</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReflectionVisibility(prev => ({ ...prev, [studentId]: !isVisible }))}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${isVisible ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground'}`}
                      >
                        {isVisible ? '👁 גלוי בתעודה' : '🔒 נסתר מתעודה'}
                      </button>
                    </div>
                  </div>

                  {/* Summary mode selector */}
                  <div className="px-3 pt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium">סיכום:</span>
                    {['week', 'month', 'year', 'custom'].map(m => (
                      <button
                        key={m}
                        onClick={() => setReflectionSummaryMode(prev => ({ ...prev, [studentId]: m }))}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${mode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
                      >
                        {getModeLabel(m)}
                      </button>
                    ))}
                  </div>

                  {/* Custom date range */}
                  {mode === 'custom' && (
                    <div className="px-3 pt-2 flex items-center gap-2">
                      <input
                        type="date"
                        value={customFrom}
                        onChange={e => setReflectionCustomFrom(prev => ({ ...prev, [studentId]: e.target.value }))}
                        className="text-xs border rounded-lg px-2 py-1 bg-background"
                      />
                      <span className="text-xs text-muted-foreground">עד</span>
                      <input
                        type="date"
                        value={customTo}
                        onChange={e => setReflectionCustomTo(prev => ({ ...prev, [studentId]: e.target.value }))}
                        className="text-xs border rounded-lg px-2 py-1 bg-background"
                      />
                    </div>
                  )}

                  {/* Summary results */}
                  {summary ? (
                    <div className="px-3 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          ממוצע על פני {summary.count} דיווחים ({summary.from.toLocaleDateString('he-IL')} - {summary.to.toLocaleDateString('he-IL')})
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(REFLECTION_LABELS).map(([key, label]) => {
                          const avg = summary.averages[key as keyof typeof summary.averages];
                          const starLabel = REFLECTION_STAR_LABELS[key]?.[Math.round(avg) - 1] || '';
                          return (
                            <div key={key} className="bg-background/60 rounded-xl p-2.5 space-y-1">
                              <span className="text-[10px] text-muted-foreground block">{label}</span>
                              <div className="flex items-center gap-1.5">
                                {renderStars(avg)}
                                <span className="text-xs font-bold text-foreground">{avg}</span>
                              </div>
                              <span className="text-[9px] text-muted-foreground/70">{starLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-3">
                      <p className="text-xs text-muted-foreground text-center">אין דיווחים בטווח הזמן שנבחר</p>
                    </div>
                  )}

                  {/* Individual reflections (collapsed) */}
                  <details className="px-3 pb-3">
                    <summary className="text-[10px] text-primary cursor-pointer hover:underline mb-2">הצג דיווחים בודדים ({studentReflections.length})</summary>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {studentReflections.slice(0, 20).map((r: any) => (
                        <div key={r.id} className="bg-muted/40 rounded-xl p-2.5 space-y-1">
                          <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString('he-IL')}</span>
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(REFLECTION_LABELS).map(([key, label]) => (
                              <div key={key} className="flex items-center justify-between bg-background/60 rounded-lg px-2 py-0.5">
                                <span className="text-[10px] text-muted-foreground">{label}</span>
                                <div className="flex items-center gap-1">
                                  {renderStars(r[key])}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>

                  {/* Student insights */}
                  {studentInsightsFiltered.length > 0 && (
                    <details className="px-3 pb-3">
                      <summary className="text-[10px] text-primary cursor-pointer hover:underline mb-2">תובנות ({studentInsightsFiltered.length})</summary>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {studentInsightsFiltered.slice(0, 15).map((insight: any) => (
                          <div key={insight.id} className="bg-muted/40 rounded-xl p-2.5">
                            <span className="text-[10px] text-muted-foreground block mb-1">{new Date(insight.created_at).toLocaleDateString('he-IL')}</span>
                            <p className="text-xs text-foreground/80">{insight.content}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  const renderLongAbsent = (classFilter: string | null, sectionPrefix: string) => {
    const filtered = classFilter
      ? longAbsentStudents.filter(la => la.student.class_name === classFilter)
      : longAbsentStudents;
    
    if (filtered.length === 0) return null;

    return (
      <div className="card-styled rounded-2xl overflow-hidden border-amber-500/30 border-2">
        <SectionHeader title="תלמידים שלא מגיעים לבית הספר" icon={AlertTriangle} count={filtered.length} badge="destructive" sectionKey={`${sectionPrefix}_longAbsent`} />
        {expandedSections[`${sectionPrefix}_longAbsent`] && (
          <div className="px-3 pb-3 space-y-2">
            <p className="text-xs text-muted-foreground">5+ ימי היעדרות רצופים — למעקב קשר טלפוני, ביקורי בית ושליחת חומרים</p>
            {filtered.map(({ student, consecutiveDays, reason }) => {
              const followup = longAbsentFollowups.get(student.id);
              return (
                <div key={student.id} className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{student.first_name} {student.last_name}</span>
                    <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">{consecutiveDays} ימים — {reason}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      {followup?.phone_contact ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                      קשר טלפוני
                    </span>
                    <span className="flex items-center gap-1">
                      {followup?.home_visit ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                      ביקור בית
                    </span>
                    <span className="flex items-center gap-1">
                      {followup?.materials_sent ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                      שליחת חומרים
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-3 max-w-2xl mx-auto animate-fade-in">
      {/* Year selector + reset */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] text-muted-foreground hover:text-destructive gap-1 px-2 h-7"
          onClick={() => { setResetPassword(''); setResetPasswordError(''); setShowResetPassword(true); }}
          disabled={resetting}
        >
          <Trash2 className="h-3 w-3" />
          {resetting ? 'מאפס...' : 'איפוס מערכת'}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">שנת לימודים:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCHOOL_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Top-level Accordion for views */}
      <Accordion type="multiple" dir="rtl" className="space-y-3">
        {/* Management View */}
        <AccordionItem value="management" className="card-styled rounded-2xl overflow-hidden border-none shadow-soft">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                <Shield className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="text-right">
                <span className="font-bold text-sm">צוות הנהלה</span>
                <p className="text-[10px] text-muted-foreground">ניהול מערכת מלא</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-4">
            {(() => {
              const { viewStudents, viewStudentIds, viewReports, viewAlerts, viewAttendance, viewAssignments, viewEvents, unreadAlerts, avgPerformance } = getViewData(null);
              return (
                <div className="space-y-3">
                  {renderStats(viewStudents, viewReports, unreadAlerts, avgPerformance)}

                  {/* Export Excel */}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      exportReportsToExcel({
                        reports, students, alerts, events,
                        dailyAttendance, supportSessions, supportAssignments,
                      });
                      toast.success('קובץ האקסל הורד בהצלחה');
                    }}
                  >
                    <Download className="h-4 w-4" />
                    הורדת כל הדיווחים לאקסל
                  </Button>

                  {/* SMS Reminder */}
                  <SmsReminderSection />

                  {/* Codes Manager */}
                  <div className="card-styled rounded-2xl overflow-hidden border-primary/20">
                    <SectionHeader title="ניהול קודים" icon={Key} count={students.length + 3} sectionKey="mgmt_codes" />
                    {expandedSections.mgmt_codes && (
                      <div className="px-3 pb-3">
                        <CodesManager students={students} onRefresh={fetchAll} />
                      </div>
                    )}
                  </div>

                  {/* Subject Management */}
                  <div className="card-styled rounded-2xl overflow-hidden border-primary/20">
                    <SectionHeader title="ניהול מקצועות" icon={GraduationCap} sectionKey="mgmt_subjects" />
                    {expandedSections.mgmt_subjects && (
                      <div className="px-3 pb-3">
                        <SubjectManager />
                      </div>
                    )}
                  </div>

                  {renderAttendance(viewAttendance, viewStudents, 'mgmt')}
                  {renderLongAbsent(null, 'mgmt')}
                  {renderAlerts(unreadAlerts, 'mgmt')}

                  {renderEvents(events, 'mgmt')}

                  {/* Staff Management */}
                  <div className="card-styled rounded-2xl overflow-hidden border-primary/20">
                    <SectionHeader title="ניהול אנשי צוות" icon={UserCog} count={staffMembers.length} sectionKey="mgmt_staffManagement" />
                    {expandedSections.mgmt_staffManagement && (
                      <div className="px-3 pb-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="שם איש צוות חדש"
                            value={newStaffName}
                            onChange={e => setNewStaffName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddStaff(); }}
                            className="h-9 text-sm flex-1"
                          />
                          <Button size="sm" onClick={handleAddStaff} disabled={addingStaff} className="gap-1 h-9">
                            <Plus className="h-3.5 w-3.5" />
                            הוסף
                          </Button>
                        </div>
                        {staffMembers.map(sm => (
                          <div key={sm.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                            <span className="text-sm font-medium">{sm.name}</span>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteStaff(sm.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        {staffMembers.length === 0 && (
                          <p className="text-center text-muted-foreground text-xs py-3">אין אנשי צוות. הוסף שמות כדי לשייך תמיכות</p>
                        )}
                      </div>
                    )}
                  </div>

                  {renderWeeklySupport(viewStudentIds, viewStudents, 'mgmt')}
                  {renderSupport(viewAssignments, 'mgmt', true)}
                  {renderStudents(viewStudents, 'mgmt', true)}
                  {renderReportCards(viewStudents, 'mgmt')}
                  {renderReports(viewReports, 'mgmt')}
                  {renderStudentReflections(viewStudentIds, 'mgmt')}

                  {/* Monthly Report */}
                  <div className="card-styled rounded-2xl overflow-hidden border-primary/20">
                    <SectionHeader title="הפק דוח חודשי" icon={FileText} sectionKey="mgmt_monthlyReport" />
                    {expandedSections.mgmt_monthlyReport && (
                      <div className="px-3 pb-3 space-y-3">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => generateMonthlyReport(null)}
                            disabled={generatingReport}
                            size="sm"
                            className="gap-1.5 flex-1"
                          >
                            {generatingReport && !reportStudentId ? (
                              <><div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> מפיק דוח...</>
                            ) : (
                              <><Sparkles className="h-3.5 w-3.5" /> דוח כלל התלמידים</>
                            )}
                          </Button>
                        </div>

                        <div>
                          <p className="text-xs font-semibold mb-1.5">או בחר תלמיד ספציפי:</p>
                          <div className="flex flex-wrap gap-1">
                            {students.map(s => (
                              <button
                                key={s.id}
                                onClick={() => generateMonthlyReport(s.id)}
                                disabled={generatingReport}
                                className="text-[10px] py-1 px-2 rounded-md border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors disabled:opacity-50"
                              >
                                {s.first_name} {s.last_name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {generatingReport && (
                          <div className="flex items-center justify-center py-6">
                            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span className="text-xs text-muted-foreground mr-2">מפיק דוח חודשי...</span>
                          </div>
                        )}

                        {monthlyReport && (
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <p className="text-xs font-semibold text-primary">
                                  דוח חודשי {reportStudentId ? `— ${studentName(reportStudentId)}` : '— כלל התלמידים'}
                                </p>
                              </div>
                              <Button onClick={shareMonthlyReport} size="sm" variant="default" className="gap-1 h-7 text-[10px] bg-[#25D366] hover:bg-[#1da851] text-white">
                                שיתוף
                              </Button>
                            </div>
                            <p className="text-xs whitespace-pre-wrap leading-relaxed">{monthlyReport}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reset moved to top */}
                </div>
              );
            })()}
          </AccordionContent>
        </AccordionItem>

        {/* Tali's Class */}
        <AccordionItem value="tali" className="card-styled rounded-2xl overflow-hidden border-none shadow-soft">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                <Users className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="text-right">
                <span className="font-bold text-sm">הכיתה של טלי</span>
                <p className="text-[10px] text-muted-foreground">{students.filter(s => s.class_name === 'טלי').length} תלמידים</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-4">
            {(() => {
              const { viewStudents, viewStudentIds, viewReports, viewAlerts, viewAttendance, viewAssignments, viewEvents, unreadAlerts, avgPerformance } = getViewData('טלי');
              return (
                <div className="space-y-3">
                  {renderStats(viewStudents, viewReports, unreadAlerts, avgPerformance)}
                  {renderAttendance(viewAttendance, viewStudents, 'tali')}
                  {renderLongAbsent('טלי', 'tali')}
                  {renderAlerts(unreadAlerts, 'tali')}
                  {renderEvents(viewEvents, 'tali')}
                  {renderWeeklySupport(viewStudentIds, viewStudents, 'tali')}
                  {renderSupport(viewAssignments, 'tali', true, 'טלי')}
                  {renderStudents(viewStudents, 'tali', true)}
                  {renderReportCards(viewStudents, 'tali')}
                  {renderReports(viewReports, 'tali')}
                  {renderStudentReflections(viewStudentIds, 'tali')}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => {
                      const classStudentIds = new Set(viewStudents.map(s => s.id));
                      exportReportsToExcel({
                        reports: reports.filter(r => classStudentIds.has(r.student_id)),
                        students: viewStudents,
                        alerts: alerts.filter(a => classStudentIds.has(a.student_id)),
                        events: events.filter(ev => ev.people_involved && viewStudents.some(s => ev.people_involved!.includes(s.first_name) || ev.people_involved!.includes(s.last_name))),
                        dailyAttendance: dailyAttendance.filter(a => classStudentIds.has(a.student_id)),
                        supportSessions: supportSessions.filter((ss: any) => classStudentIds.has(ss.student_id)),
                        supportAssignments: supportAssignments.filter((sa: any) => classStudentIds.has(sa.student_id)),
                      });
                      toast.success('קובץ אקסל הורד — הכיתה של טלי');
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    הורדת נתוני הכיתה לאקסל
                  </Button>
                </div>
              );
            })()}
          </AccordionContent>
        </AccordionItem>

        {/* Eden's Class */}
        <AccordionItem value="eden" className="card-styled rounded-2xl overflow-hidden border-none shadow-soft">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                <Users className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="text-right">
                <span className="font-bold text-sm">הכיתה של עדן</span>
                <p className="text-[10px] text-muted-foreground">{students.filter(s => s.class_name === 'עדן').length} תלמידים</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-4">
            {(() => {
              const { viewStudents, viewStudentIds, viewReports, viewAlerts, viewAttendance, viewAssignments, viewEvents, unreadAlerts, avgPerformance } = getViewData('עדן');
              return (
                <div className="space-y-3">
                  {renderStats(viewStudents, viewReports, unreadAlerts, avgPerformance)}
                  {renderAttendance(viewAttendance, viewStudents, 'eden')}
                  {renderLongAbsent('עדן', 'eden')}
                  {renderAlerts(unreadAlerts, 'eden')}
                  {renderEvents(viewEvents, 'eden')}
                  {renderWeeklySupport(viewStudentIds, viewStudents, 'eden')}
                  {renderSupport(viewAssignments, 'eden', true, 'עדן')}
                  {renderStudents(viewStudents, 'eden', true)}
                  {renderReportCards(viewStudents, 'eden')}
                  {renderReports(viewReports, 'eden')}
                  {renderStudentReflections(viewStudentIds, 'eden')}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => {
                      const classStudentIds = new Set(viewStudents.map(s => s.id));
                      exportReportsToExcel({
                        reports: reports.filter(r => classStudentIds.has(r.student_id)),
                        students: viewStudents,
                        alerts: alerts.filter(a => classStudentIds.has(a.student_id)),
                        events: events.filter(ev => ev.people_involved && viewStudents.some(s => ev.people_involved!.includes(s.first_name) || ev.people_involved!.includes(s.last_name))),
                        dailyAttendance: dailyAttendance.filter(a => classStudentIds.has(a.student_id)),
                        supportSessions: supportSessions.filter((ss: any) => classStudentIds.has(ss.student_id)),
                        supportAssignments: supportAssignments.filter((sa: any) => classStudentIds.has(sa.student_id)),
                      });
                      toast.success('קובץ אקסל הורד — הכיתה של עדן');
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    הורדת נתוני הכיתה לאקסל
                  </Button>
                </div>
              );
            })()}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
              <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="בחר/י מאמן/ספק" /></SelectTrigger>
              <SelectContent>
                {staffMembers.map(sm => (
                  <SelectItem key={sm.id} value={sm.id}>{sm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <p className="text-xs font-semibold mb-1.5">סוג תמיכה</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SUPPORT_TYPES_LIST.map(type => {
                  const isActive = assignSupportTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleAssignSupportType(type)}
                      className={`text-xs py-2 px-3 rounded-xl border transition-all font-medium ${
                        isActive ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      {SUPPORT_LABELS[type]}
                    </button>
                  );
                })}
            </div>
            <Textarea value={assignDescription} onChange={e => setAssignDescription(e.target.value)} className="text-sm min-h-[70px]" placeholder="תאר/י את התמיכה שצריך לספק (לדוגמה: שיחה אישית, ליווי בהפסקה, תרגול כישורים חברתיים...)" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-semibold mb-1.5">תדירות</p>
                <Select value={assignFrequency} onValueChange={setAssignFrequency}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">יומי</SelectItem>
                    <SelectItem value="weekly">שבועי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5">מספר מופעים {assignFrequency === 'daily' ? 'ביום' : 'בשבוע'}</p>
                <Select value={String(assignFrequencyCount)} onValueChange={v => setAssignFrequencyCount(Number(v))}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5">תאריך יעד לבדיקת ביצוע</p>
              <Input type="date" value={assignTargetDate} onChange={e => setAssignTargetDate(e.target.value)} className="h-10 text-sm" />
            </div>
            <Input value={assignNotesForParents} onChange={e => setAssignNotesForParents(e.target.value)} className="h-10 text-sm" placeholder="הערה להורים (אופציונלי)" />
            <Button onClick={handleAddAssignment} disabled={addingAssignment} className="w-full h-10 text-sm">
              {addingAssignment ? 'משייך...' : 'שייך תמיכה'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent dir="rtl" className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              אימות סיסמה
            </DialogTitle>
            <DialogDescription className="text-xs">
              הזן את סיסמת המנהל כדי להמשיך באיפוס
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="הזן סיסמה"
              value={resetPassword}
              onChange={e => { setResetPassword(e.target.value); setResetPasswordError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleResetPasswordSubmit(); }}
              className="h-10 text-sm"
            />
            {resetPasswordError && (
              <p className="text-xs text-destructive">{resetPasswordError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setShowResetPassword(false)}>ביטול</Button>
            <Button variant="destructive" size="sm" onClick={handleResetPasswordSubmit}>אישור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation AlertDialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent dir="rtl" className="max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              פעולה זו תמחק את כל הדיווחים, ביקורים, אירועים חריגים, מפגשי תמיכה והתראות.
              <br /><br />
              <strong className="text-destructive">פעולה זו אינה ניתנת לביטול!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAllReports} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              כן, אפס הכל
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Detail Dialog */}
      <StudentDetailDialog
        student={selectedStudent}
        open={!!selectedStudent}
        onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}
      />

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
                      className={`text-xs py-2 px-2 rounded-lg border transition-all font-medium ${editAttendance === k ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/30'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">התנהגות</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(BEHAVIOR_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => toggleEditBehavior(k)}
                      className={`text-xs py-2 px-2 rounded-lg border transition-all font-medium ${editBehaviorTypes.includes(k) ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/30'}`}>
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
                      className={`text-xs py-2 px-2 rounded-lg border transition-all font-medium ${editParticipations.includes(k) ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/30'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">הערה</p>
                <Textarea value={editComment} onChange={e => setEditComment(e.target.value)} className="text-sm min-h-[60px]" placeholder="הערה (אופציונלי)" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleSaveEdit} disabled={savingEdit} className="flex-1 h-9 text-sm">
                  {savingEdit ? 'שומר...' : 'שמור שינויים'}
                </Button>
                <Button variant="destructive" size="sm" className="h-9 text-sm gap-1" onClick={() => handleDeleteReport(editingReport.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  מחק
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
