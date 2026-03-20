import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoSrc from '@/assets/logo.jpeg';
import principalSigSrc from '@/assets/principal-signature.jpeg';

interface GradeEntry {
  subject: string;
  grade: number | null;
  verbal_evaluation: string | null;
  ai_enhanced_evaluation: string | null;
}

interface TeamEvaluation {
  behavior?: string | null;
  independent_work?: string | null;
  group_work?: string | null;
  emotional_regulation?: string | null;
  general_functioning?: string | null;
  helping_others?: string | null;
  environmental_care?: string | null;
  duties_performance?: string | null;
  studentship?: string | null;
  problem_solving?: string | null;
  creative_thinking?: string | null;
  perseverance?: string | null;
  emotional_tools?: string | null;
  cognitive_flexibility?: string | null;
  self_efficacy?: string | null;
}

interface ReportCardData {
  studentName: string;
  className: string;
  grades: GradeEntry[];
  personalNote?: string | null;
  teamEvaluation?: TeamEvaluation | null;
  principalName?: string;
  teacherName?: string;
  semesterLabel?: string;
}

function getHebrewDate(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('he-u-ca-hebrew-nu-hebr', {
      day: 'numeric',
      month: 'long',
    });
    return formatter.format(now);
  } catch {
    return '';
  }
}

function getGregorianDate(): string {
  const now = new Date();
  return now.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

const TEAM_SECTIONS: { title: string; items: { key: string; label: string }[] }[] = [
  {
    title: 'תפקוד כיתתי',
    items: [
      { key: 'behavior', label: 'התנהגות' },
      { key: 'independent_work', label: 'עבודה עצמאית' },
      { key: 'group_work', label: 'עבודה בקבוצה' },
      { key: 'general_functioning', label: 'תפקוד כללי' },
      { key: 'helping_others', label: 'עזרה לאחרים' },
      { key: 'environmental_care', label: 'אכפתיות לסביבה' },
      { key: 'duties_performance', label: 'ביצוע תורנויות' },
      { key: 'studentship', label: 'תלמידאות' },
    ],
  },
  {
    title: 'מיומנויות למידה',
    items: [
      { key: 'problem_solving', label: 'פתרון בעיות' },
      { key: 'creative_thinking', label: 'חשיבה יצירתית' },
      { key: 'perseverance', label: 'התמדה וכוח רצון' },
    ],
  },
  {
    title: 'מיומנויות רגשיות',
    items: [
      { key: 'emotional_regulation', label: 'ויסות רגשי' },
      { key: 'emotional_tools', label: 'שימוש בכלים שונים' },
      { key: 'cognitive_flexibility', label: 'גמישות מחשבתית' },
      { key: 'self_efficacy', label: 'מסוגלות עצמית' },
    ],
  },
];

export async function generateReportCard(data: ReportCardData): Promise<Blob> {
  const hebrewDate = getHebrewDate();
  const gregorianDate = getGregorianDate();

  // Light azure color palette
  const colors = {
    headerBg: '#e8f4fb',
    headerBorder: '#b8d8ea',
    accent: '#3a7ca5',
    accentLight: '#d0e8f5',
    accentLighter: '#eaf4fa',
    sectionTitle: '#2c6d94',
    text: '#2b2b2b',
    textLight: '#5a6a7a',
    tableBorder: '#c8dce8',
    tableHeaderBg: '#daeaf5',
    tableAltRow: '#f3f9fd',
    noteBg: '#f0f7fc',
    noteBorder: '#c4daea',
    white: '#ffffff',
  };

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:0;background:white;font-family:Arial,sans-serif;direction:rtl;';

  const teamEval = data.teamEvaluation;

  // Collect team eval rows
  const allTeamRows = teamEval ? TEAM_SECTIONS.map(section => {
    const rows = section.items.map(item => {
      const val = teamEval[item.key as keyof TeamEvaluation];
      if (!val) return '';
      return `
        <tr>
          <td style="padding:7px 16px;border-bottom:1px solid ${colors.tableBorder};font-size:11px;color:${colors.text};">${item.label}</td>
          <td style="padding:7px 16px;border-bottom:1px solid ${colors.tableBorder};font-size:11px;color:${colors.text};text-align:center;font-weight:500;">${val}</td>
        </tr>
      `;
    }).filter(Boolean).join('');
    if (!rows) return '';
    return `
      <tr><td colspan="2" style="padding:8px 16px 4px;font-size:11px;font-weight:700;color:${colors.sectionTitle};border-bottom:1px solid ${colors.headerBorder};background:${colors.accentLighter};">${section.title}</td></tr>
      ${rows}
    `;
  }).filter(Boolean).join('') : '';

  const personalNoteHtml = data.personalNote ? `
    <div style="page-break-inside:avoid;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:${colors.sectionTitle};margin-bottom:8px;border-bottom:1px solid ${colors.headerBorder};padding-bottom:4px;">ממני אלייך — נימה אישית</div>
      <div style="font-size:11px;color:${colors.text};line-height:1.9;white-space:pre-wrap;padding:12px 14px;border:1px solid ${colors.noteBorder};border-radius:4px;background:${colors.noteBg};">${data.personalNote}</div>
    </div>
  ` : '';

  const teamTableHtml = allTeamRows ? `
    <div style="page-break-inside:avoid;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:${colors.sectionTitle};margin-bottom:8px;border-bottom:1px solid ${colors.headerBorder};padding-bottom:4px;">הערכה תפקודית</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid ${colors.tableBorder};">
        <thead>
          <tr style="background:${colors.tableHeaderBg};">
            <th style="padding:7px 16px;font-size:11px;text-align:right;font-weight:600;color:${colors.sectionTitle};border-bottom:1px solid ${colors.headerBorder};">תחום</th>
            <th style="padding:7px 16px;font-size:11px;text-align:center;font-weight:600;color:${colors.sectionTitle};border-bottom:1px solid ${colors.headerBorder};width:120px;">דירוג</th>
          </tr>
        </thead>
        <tbody>${allTeamRows}</tbody>
      </table>
    </div>
  ` : '';

  const gradeBlocks = data.grades.map((g, i) => `
    <div style="page-break-inside:avoid;display:flex;border-bottom:1px solid ${colors.tableBorder};background:${i % 2 === 0 ? colors.tableAltRow : colors.white};">
      <div style="padding:8px 14px;font-weight:600;font-size:11px;color:${colors.text};width:80px;flex-shrink:0;border-left:1px solid ${colors.tableBorder};">${g.subject}</div>
      <div style="padding:8px 14px;font-size:13px;color:${colors.accent};text-align:center;width:45px;flex-shrink:0;font-weight:700;border-left:1px solid ${colors.tableBorder};">${g.grade ?? '—'}</div>
      <div style="padding:8px 14px;font-size:11px;color:${colors.text};line-height:1.7;white-space:pre-wrap;flex:1;">${g.ai_enhanced_evaluation || g.verbal_evaluation || '—'}</div>
    </div>
  `).join('');

  const gradesBlockHtml = `
    <div style="margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:${colors.sectionTitle};margin-bottom:8px;border-bottom:1px solid ${colors.headerBorder};padding-bottom:4px;">ציונים והערכות מקצועיות</div>
      <div style="border:1px solid ${colors.tableBorder};">
        <div style="display:flex;background:${colors.tableHeaderBg};border-bottom:1px solid ${colors.headerBorder};">
          <div style="padding:8px 14px;font-size:11px;font-weight:600;color:${colors.sectionTitle};width:80px;flex-shrink:0;border-left:1px solid ${colors.headerBorder};">מקצוע</div>
          <div style="padding:8px 14px;font-size:11px;font-weight:600;color:${colors.sectionTitle};width:45px;flex-shrink:0;text-align:center;border-left:1px solid ${colors.headerBorder};">ציון</div>
          <div style="padding:8px 14px;font-size:11px;font-weight:600;color:${colors.sectionTitle};flex:1;">הערכה מילולית</div>
        </div>
        ${gradeBlocks || `<div style="padding:16px;text-align:center;color:${colors.textLight};font-size:11px;">אין ציונים להצגה</div>`}
      </div>
    </div>
  `;

  const signatureLine = (label: string) => `
    <div style="display:flex;flex-direction:column;align-items:center;width:100px;">
      <div style="width:80px;border-bottom:1px solid ${colors.headerBorder};margin-bottom:6px;height:28px;"></div>
      <div style="font-size:9px;color:${colors.textLight};font-weight:600;">${label}</div>
    </div>
  `;

  container.innerHTML = `
    <div style="padding:36px 40px 28px;position:relative;">
      <!-- Header -->
      <div style="page-break-inside:avoid;text-align:center;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid ${colors.accent};">
        <img src="${logoSrc}" style="max-width:100px;height:auto;margin-bottom:6px;" />
        <div style="font-size:20px;font-weight:700;color:${colors.accent};margin-bottom:2px;">בית ספר מרום בית אקשטיין</div>
        <div style="font-size:13px;color:${colors.textLight};font-weight:500;letter-spacing:2px;">תעודת הערכה</div>
      </div>

      <!-- Student Info -->
      <div style="page-break-inside:avoid;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding:12px 16px;border:1px solid ${colors.noteBorder};border-radius:4px;background:${colors.headerBg};">
        <div>
          <div style="font-size:9px;color:${colors.textLight};margin-bottom:2px;font-weight:600;letter-spacing:1px;">שם התלמיד/ה</div>
          <div style="font-size:16px;font-weight:700;color:${colors.text};">${data.studentName}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:9px;color:${colors.textLight};margin-bottom:2px;font-weight:600;letter-spacing:1px;">כיתה</div>
          <div style="font-size:15px;font-weight:700;color:${colors.text};">${data.className || '—'}</div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:9px;color:${colors.textLight};margin-bottom:2px;font-weight:600;letter-spacing:1px;">תאריך</div>
          <div style="font-size:11px;color:${colors.text};">${gregorianDate}</div>
          <div style="font-size:11px;color:${colors.textLight};">${hebrewDate}</div>
        </div>
      </div>

      ${personalNoteHtml}

      ${teamTableHtml}

      ${gradesBlockHtml}

      <!-- Signatures -->
      <div style="page-break-inside:avoid;margin-top:32px;padding-top:16px;border-top:1px solid ${colors.headerBorder};">
        <div style="display:flex;justify-content:space-around;align-items:flex-end;">
          <div style="display:flex;flex-direction:column;align-items:center;width:100px;">
            <img src="${principalSigSrc}" style="width:80px;height:auto;margin-bottom:4px;" />
            <div style="font-size:9px;color:${colors.textLight};font-weight:600;">מנהל ביה״ס</div>
          </div>
          ${signatureLine('מחנכ/ת')}
          ${signatureLine('התלמיד/ה')}
          ${signatureLine('ההורים')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfPageHeight;

    while (heightLeft > 0) {
      position -= pdfPageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}
