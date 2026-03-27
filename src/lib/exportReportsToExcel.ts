import * as XLSX from 'xlsx';
import {
  BEHAVIOR_LABELS, ATTENDANCE_LABELS, PARTICIPATION_LABELS,
  SEVERITY_LABELS, ABSENCE_REASON_LABELS, INCIDENT_TYPE_LABELS,
} from '@/lib/constants';
import type { Database } from '@/integrations/supabase/types';

type Report = Database['public']['Tables']['lesson_reports']['Row'];
type Student = Database['public']['Tables']['students']['Row'];
type Alert = Database['public']['Tables']['alerts']['Row'];
type ExceptionalEvent = Database['public']['Tables']['exceptional_events']['Row'];

const SUPPORT_LABELS: Record<string, string> = {
  social: 'חברתית', emotional: 'רגשית', academic: 'לימודית', behavioral: 'התנהגותית',
};

interface ExportData {
  reports: Report[];
  students: Student[];
  alerts: Alert[];
  events: ExceptionalEvent[];
  dailyAttendance: any[];
  supportSessions: any[];
  supportAssignments: any[];
}

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('he-IL');
  } catch { return d; }
};

const studentMap = (students: Student[]) => {
  const m = new Map<string, string>();
  students.forEach(s => m.set(s.id, `${s.first_name} ${s.last_name}`));
  return m;
};

export function exportReportsToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new();
  const sMap = studentMap(data.students);
  const getName = (id: string) => sMap.get(id) || 'לא ידוע';

  // 1. Lesson Reports
  const reportsRows = data.reports.map(r => ({
    'תאריך': formatDate(r.report_date),
    'תלמיד/ה': getName(r.student_id),
    'מקצוע': r.lesson_subject,
    'נוכחות': ATTENDANCE_LABELS[r.attendance] || r.attendance,
    'התנהגות': (r.behavior_types || []).map(b => BEHAVIOR_LABELS[b] || b).join(', '),
    'חומרה': r.behavior_severity ? (SEVERITY_LABELS[r.behavior_severity] || r.behavior_severity) : '',
    'למידה': r.participation && r.participation.length > 0 ? r.participation.map(p => PARTICIPATION_LABELS[p] || p).join(', ') : '',
    'ציון ביצוע': r.performance_score || '',
    'הערה': r.comment || '',
  }));
  const wsReports = XLSX.utils.json_to_sheet(reportsRows);
  setColWidths(wsReports, reportsRows);
  XLSX.utils.book_append_sheet(wb, wsReports, 'דיווחי שיעורים');

  // 2. Daily Attendance
  const attRows = data.dailyAttendance.map(a => ({
    'תאריך': formatDate(a.attendance_date),
    'תלמיד/ה': getName(a.student_id),
    'נוכח/ת': a.is_present ? 'כן' : 'לא',
    'סיבת היעדרות': a.absence_reason ? (ABSENCE_REASON_LABELS[a.absence_reason] || a.absence_reason) : '',
  }));
  const wsAtt = XLSX.utils.json_to_sheet(attRows);
  setColWidths(wsAtt, attRows);
  XLSX.utils.book_append_sheet(wb, wsAtt, 'ביקור סדיר');

  // 3. Alerts
  const alertRows = data.alerts.map(a => ({
    'תאריך': formatDate(a.created_at),
    'תלמיד/ה': getName(a.student_id),
    'סוג': a.alert_type,
    'תיאור': a.description,
    'נקרא': a.is_read ? 'כן' : 'לא',
  }));
  const wsAlerts = XLSX.utils.json_to_sheet(alertRows);
  setColWidths(wsAlerts, alertRows);
  XLSX.utils.book_append_sheet(wb, wsAlerts, 'התראות');

  // 4. Exceptional Events
  const eventRows = data.events.map(e => ({
    'תאריך': formatDate(e.created_at),
    'סוג אירוע': INCIDENT_TYPE_LABELS[e.incident_type] || e.incident_type,
    'תיאור': e.description,
    'מעורבים': e.people_involved || '',
    'תגובת צוות': e.staff_response || '',
    'מעקב נדרש': e.followup_required ? 'כן' : 'לא',
    'הערות מעקב': e.followup_notes || '',
  }));
  const wsEvents = XLSX.utils.json_to_sheet(eventRows);
  setColWidths(wsEvents, eventRows);
  XLSX.utils.book_append_sheet(wb, wsEvents, 'אירועים חריגים');

  // 5. Support Sessions
  const supportRows = data.supportSessions.map((s: any) => ({
    'תאריך': formatDate(s.session_date || s.created_at),
    'תלמיד/ה': getName(s.student_id),
    'ספק': s.provider_name || '',
    'סוגי תמיכה': (s.support_types || []).map((t: string) => SUPPORT_LABELS[t] || t).join(', '),
    'הערות': s.notes || '',
  }));
  const wsSupport = XLSX.utils.json_to_sheet(supportRows);
  setColWidths(wsSupport, supportRows);
  XLSX.utils.book_append_sheet(wb, wsSupport, 'פגישות תמיכה');

  // 6. Support Assignments
  const assignRows = data.supportAssignments.map((a: any) => ({
    'תלמיד/ה': getName(a.student_id),
    'איש צוות': a.staff_members?.name || '',
    'סוגי תמיכה': (a.support_types || []).map((t: string) => SUPPORT_LABELS[t] || t).join(', '),
    'תיאור': a.support_description || '',
    'תדירות': a.frequency === 'weekly' ? 'שבועי' : a.frequency === 'daily' ? 'יומי' : a.frequency,
    'תאריך יעד': a.target_date ? formatDate(a.target_date) : '',
    'הערות להורים': a.notes_for_parents || '',
  }));
  const wsAssign = XLSX.utils.json_to_sheet(assignRows);
  setColWidths(wsAssign, assignRows);
  XLSX.utils.book_append_sheet(wb, wsAssign, 'שיוכי תמיכה');

  // 7. Students
  const studentRows = data.students.map(s => ({
    'שם פרטי': s.first_name,
    'שם משפחה': s.last_name,
    'כיתה': s.class_name || '',
    'קוד': s.student_code,
    'פעיל': s.is_active ? 'כן' : 'לא',
    'תאריך לידה': s.date_of_birth ? formatDate(s.date_of_birth) : '',
    'עיר': s.city || '',
    'כתובת': s.address || '',
    'שם אם': s.mother_name || '',
    'טלפון אם': s.mother_phone || '',
    'שם אב': s.father_name || '',
    'טלפון אב': s.father_phone || '',
  }));
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  setColWidths(wsStudents, studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'תלמידים');

  // Style headers for all sheets
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name];
    if (!ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[addr]) {
        ws[addr].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F46E5' } },
          alignment: { horizontal: 'center' },
        };
      }
    }
  });

  const today = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
  XLSX.writeFile(wb, `דוח_מערכת_${today}.xlsx`, { bookType: 'xlsx', bookSST: true });
}

// ===== FULL ACTIVITY EXPORT =====
interface FullExportData {
  reports: Report[];
  students: Student[];
  alerts: Alert[];
  events: ExceptionalEvent[];
  dailyAttendance: any[];
  supportSessions: any[];
  supportAssignments: any[];
  dailyReflections: any[];
  studentInsights: any[];
  grades: any[];
  evaluations: any[];
  pedagogyGoals: any[];
  examSchedule: any[];
  activityLogs: any[];
  staffMembers: any[];
  managedSubjects: any[];
}

export async function exportFullActivityToExcel(data: FullExportData) {
  const wb = XLSX.utils.book_new();
  const sMap = studentMap(data.students);
  const getName = (id: string) => sMap.get(id) || 'לא ידוע';
  const subjectMap = new Map<string, string>();
  (data.managedSubjects || []).forEach((s: any) => subjectMap.set(s.id, s.name));

  // 1. Lesson Reports
  const reportsRows = data.reports.map(r => ({
    'תאריך': formatDate(r.report_date),
    'תלמיד/ה': getName(r.student_id),
    'מקצוע': r.lesson_subject,
    'נוכחות': ATTENDANCE_LABELS[r.attendance] || r.attendance,
    'התנהגות': (r.behavior_types || []).map(b => BEHAVIOR_LABELS[b] || b).join(', '),
    'חומרה': r.behavior_severity ? (SEVERITY_LABELS[r.behavior_severity] || r.behavior_severity) : '',
    'למידה': r.participation?.length > 0 ? r.participation.map(p => PARTICIPATION_LABELS[p] || p).join(', ') : '',
    'הערה': r.comment || '',
  }));
  addSheet(wb, 'דיווחי שיעורים', reportsRows);

  // 2. Daily Attendance
  const attRows = data.dailyAttendance.map(a => ({
    'תאריך': formatDate(a.attendance_date),
    'תלמיד/ה': getName(a.student_id),
    'נוכח/ת': a.is_present ? 'כן' : 'לא',
    'סיבת היעדרות': a.absence_reason ? (ABSENCE_REASON_LABELS[a.absence_reason] || a.absence_reason) : '',
    'הערה': a.other_reason_text || '',
  }));
  addSheet(wb, 'ביקור סדיר', attRows);

  // 3. Alerts
  const alertRows = data.alerts.map(a => ({
    'תאריך': formatDate(a.created_at),
    'תלמיד/ה': getName(a.student_id),
    'סוג': a.alert_type,
    'תיאור': a.description,
  }));
  addSheet(wb, 'התראות', alertRows);

  // 4. Exceptional Events
  const eventRows = data.events.map(e => ({
    'תאריך': formatDate(e.created_at),
    'סוג אירוע': INCIDENT_TYPE_LABELS[e.incident_type] || e.incident_type,
    'תיאור': e.description,
    'מעורבים': e.people_involved || '',
    'תגובת צוות': e.staff_response || '',
    'מעקב נדרש': e.followup_required ? 'כן' : 'לא',
    'הערות מעקב': e.followup_notes || '',
  }));
  addSheet(wb, 'אירועים חריגים', eventRows);

  // 5. Support Sessions
  const supportRows = data.supportSessions.map((s: any) => ({
    'תאריך': formatDate(s.session_date || s.created_at),
    'תלמיד/ה': getName(s.student_id),
    'ספק': s.provider_name || '',
    'סוגי תמיכה': (s.support_types || []).map((t: string) => SUPPORT_LABELS[t] || t).join(', '),
    'הערות': s.notes || '',
  }));
  addSheet(wb, 'פגישות תמיכה', supportRows);

  // 6. Support Assignments
  const assignRows = data.supportAssignments.map((a: any) => ({
    'תלמיד/ה': getName(a.student_id),
    'איש צוות': a.staff_members?.name || '',
    'סוגי תמיכה': (a.support_types || []).map((t: string) => SUPPORT_LABELS[t] || t).join(', '),
    'תיאור': a.support_description || '',
    'תדירות': a.frequency === 'weekly' ? 'שבועי' : a.frequency === 'daily' ? 'יומי' : a.frequency,
    'תאריך יעד': a.target_date ? formatDate(a.target_date) : '',
  }));
  addSheet(wb, 'שיוכי תמיכה', assignRows);

  // 7. Grades
  const gradeRows = (data.grades || []).map((g: any) => ({
    'תלמיד/ה': getName(g.student_id),
    'מקצוע': g.subject,
    'סמסטר': g.semester === 'semester_a' ? 'סמסטר א׳' : g.semester === 'semester_b' ? 'סמסטר ב׳' : g.semester,
    'ציון': g.grade ?? '',
    'הערכה מילולית': g.verbal_evaluation || '',
    'שנת לימודים': g.school_year,
  }));
  addSheet(wb, 'ציונים', gradeRows);

  // 8. Daily Reflections
  const reflRows = (data.dailyReflections || []).map((r: any) => ({
    'תאריך': formatDate(r.created_at),
    'תלמיד/ה': r.student_name || getName(r.student_id || ''),
    'נוכחות': r.class_presence,
    'התנהגות': r.behavior,
    'חברתי': r.social_interaction,
    'לימודים': r.academic_tasks,
  }));
  addSheet(wb, 'רפלקציות יומיות', reflRows);

  // 9. Student Insights
  const insightRows = (data.studentInsights || []).map((i: any) => ({
    'תאריך': formatDate(i.created_at),
    'תלמיד/ה': getName(i.student_id),
    'תוכן': i.content,
  }));
  addSheet(wb, 'תובנות תלמידים', insightRows);

  // 10. Pedagogy Goals
  const pedRows = (data.pedagogyGoals || []).map((g: any) => ({
    'תלמיד/ה': getName(g.student_id),
    'מקצוע': subjectMap.get(g.subject_id) || '',
    'תת-מקצוע': g.sub_subject || '',
    'חודש': g.month,
    'יעדים': g.learning_goals || '',
    'מצב נוכחי': g.current_status || '',
    'מה נעשה': g.what_was_done || '',
    'פערים': g.what_was_not_done || '',
    'הערות מורה': g.teacher_notes || '',
    'הערות הנהלה': g.admin_notes || '',
    'שנה': g.school_year,
  }));
  addSheet(wb, 'יעדים פדגוגיים', pedRows);

  // 11. Exam Schedule
  const examRows = (data.examSchedule || []).map((e: any) => ({
    'תלמיד/ה': getName(e.student_id),
    'מקצוע': subjectMap.get(e.subject_id) || '',
    'תת-מקצוע': e.sub_subject || '',
    'תאריך מבחן': formatDate(e.exam_date),
    'תיאור': e.exam_description || '',
    'שנה': e.school_year,
  }));
  addSheet(wb, 'לוח מבחנים', examRows);

  // 12. Activity Logs (Reset Portal)
  const logRows = (data.activityLogs || []).map((l: any) => ({
    'תאריך': formatDate(l.created_at),
    'תלמיד/ה': l.student_name,
    'מצב': l.selected_state,
    'עוצמה': l.intensity_label || '',
    'כלי שימושי': l.skill_used || '',
    'תוצאה': l.result_after_practice || '',
    'ביקש תמיכה': l.support_requested ? 'כן' : 'לא',
  }));
  addSheet(wb, 'לוגי פעילות', logRows);

  // 13. Students
  const studentRows = data.students.map(s => ({
    'שם פרטי': s.first_name,
    'שם משפחה': s.last_name,
    'כיתה': s.class_name || '',
    'קוד': s.student_code,
    'פעיל': s.is_active ? 'כן' : 'לא',
    'מגדר': s.gender || '',
    'תאריך לידה': s.date_of_birth ? formatDate(s.date_of_birth) : '',
    'עיר': s.city || '',
    'כתובת': s.address || '',
    'שם אם': s.mother_name || '',
    'טלפון אם': s.mother_phone || '',
    'שם אב': s.father_name || '',
    'טלפון אב': s.father_phone || '',
  }));
  addSheet(wb, 'תלמידים', studentRows);

  // 14. Staff Members
  const staffRows = (data.staffMembers || []).map((s: any) => ({
    'שם': s.name,
    'פעיל': s.is_active ? 'כן' : 'לא',
  }));
  addSheet(wb, 'אנשי צוות', staffRows);

  const today = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
  XLSX.writeFile(wb, `ייצוא_מלא_כל_הפעולות_${today}.xlsx`, { bookType: 'xlsx', bookSST: true });
}

function addSheet(wb: XLSX.WorkBook, name: string, rows: Record<string, any>[]) {
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ 'אין נתונים': '' }]);
  setColWidths(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, name);
}

function setColWidths(ws: XLSX.WorkSheet, rows: Record<string, any>[]) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  ws['!cols'] = keys.map(k => {
    const maxLen = Math.max(
      k.length,
      ...rows.map(r => String(r[k] || '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
}
