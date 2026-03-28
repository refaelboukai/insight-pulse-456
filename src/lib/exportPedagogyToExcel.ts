import * as XLSX from 'xlsx';
import { downloadWorkbook } from '@/lib/excelDownload';

interface GoalRow {
  month: string;
  learningStyle: string | null;
  currentStatus: string | null;
  learningGoals: string | null;
  measurementMethods: string | null;
  whatWasDone: string | null;
  whatWasNotDone: string | null;
  teacherNotes: string | null;
  adminNotes: string | null;
}

export function exportPedagogyToExcel(
  studentName: string,
  subjectName: string,
  subSubject: string | null,
  schoolYear: string,
  rows: GoalRow[]
) {
  const wb = XLSX.utils.book_new();
  const subjectTitle = subSubject ? `${subjectName} (${subSubject})` : subjectName;

  const data = rows.map(r => ({
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

  // Auto column widths
  const cols = Object.keys(data[0] || {});
  ws['!cols'] = cols.map(col => {
    const maxLen = Math.max(col.length, ...data.map(r => ((r as any)[col] || '').length));
    return { wch: Math.min(Math.max(maxLen, 10), 40) };
  });

  XLSX.utils.book_append_sheet(wb, ws, 'מעקב פדגוגי');

  const fileName = `מעקב-פדגוגי-${studentName}-${subjectTitle}-${schoolYear}.xlsx`;
  downloadWorkbook(wb, fileName);
}
