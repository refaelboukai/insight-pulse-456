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

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:0;background:white;font-family:Arial,sans-serif;direction:rtl;';

  // Build each section as a separate block so we can render page-by-page
  const teamEval = data.teamEvaluation;

  // Collect all team eval rows into one combined table
  const allTeamRows = teamEval ? TEAM_SECTIONS.map(section => {
    const rows = section.items.map(item => {
      const val = teamEval[item.key as keyof TeamEvaluation];
      if (!val) return '';
      return `
        <tr>
          <td style="padding:7px 16px;border-bottom:1px solid #ddd;font-size:11px;color:#333;">${item.label}</td>
          <td style="padding:7px 16px;border-bottom:1px solid #ddd;font-size:11px;color:#111;text-align:center;font-weight:500;">${val}</td>
        </tr>
      `;
    }).filter(Boolean).join('');
    if (!rows) return '';
    return `
      <tr><td colspan="2" style="padding:8px 16px 4px;font-size:11px;font-weight:700;color:#333;border-bottom:1px solid #ccc;background:#f5f5f5;">${section.title}</td></tr>
      ${rows}
    `;
  }).filter(Boolean).join('') : '';

  const personalNoteHtml = data.personalNote ? `
    <div style="page-break-inside:avoid;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px;">ממני אלייך — נימה אישית</div>
      <div style="font-size:11px;color:#333;line-height:1.9;white-space:pre-wrap;padding:12px 14px;border:1px solid #ddd;border-radius:4px;background:#fafafa;">${data.personalNote}</div>
    </div>
  ` : '';

  const teamTableHtml = allTeamRows ? `
    <div style="page-break-inside:avoid;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px;">הערכה תפקודית</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
        <thead>
          <tr style="background:#eee;">
            <th style="padding:7px 16px;font-size:11px;text-align:right;font-weight:600;color:#333;border-bottom:1px solid #ccc;">תחום</th>
            <th style="padding:7px 16px;font-size:11px;text-align:center;font-weight:600;color:#333;border-bottom:1px solid #ccc;width:120px;">דירוג</th>
          </tr>
        </thead>
        <tbody>${allTeamRows}</tbody>
      </table>
    </div>
  ` : '';

  const gradeRows = data.grades.map((g, i) => `
    <tr style="background:${i % 2 === 0 ? '#fafafa' : 'white'};">
      <td style="padding:8px 14px;border-bottom:1px solid #ddd;font-weight:600;font-size:11px;color:#333;width:80px;vertical-align:top;">${g.subject}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #ddd;font-size:13px;color:#111;text-align:center;width:45px;font-weight:700;vertical-align:top;">${g.grade ?? '—'}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #ddd;font-size:11px;color:#333;line-height:1.7;white-space:pre-wrap;vertical-align:top;">${g.ai_enhanced_evaluation || g.verbal_evaluation || '—'}</td>
    </tr>
  `).join('');

  const gradesHtml = `
    <div style="margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px;">ציונים והערכות מקצועיות</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
        <thead>
          <tr style="background:#eee;">
            <th style="padding:8px 14px;font-size:11px;text-align:right;font-weight:600;color:#333;border-bottom:1px solid #ccc;">מקצוע</th>
            <th style="padding:8px 14px;font-size:11px;text-align:center;font-weight:600;color:#333;border-bottom:1px solid #ccc;width:45px;">ציון</th>
            <th style="padding:8px 14px;font-size:11px;text-align:right;font-weight:600;color:#333;border-bottom:1px solid #ccc;">הערכה מילולית</th>
          </tr>
        </thead>
        <tbody>
          ${gradeRows || '<tr><td colspan="3" style="padding:16px;text-align:center;color:#999;font-size:11px;">אין ציונים להצגה</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  const signatureLine = (label: string) => `
    <div style="display:flex;flex-direction:column;align-items:center;width:100px;">
      <div style="width:80px;border-bottom:1px solid #999;margin-bottom:6px;height:28px;"></div>
      <div style="font-size:9px;color:#555;font-weight:600;">${label}</div>
    </div>
  `;

  // We render grade rows individually to handle page breaks properly
  // Build each grade as its own mini-container for page-break-inside:avoid
  const gradeBlocks = data.grades.map((g, i) => `
    <div style="page-break-inside:avoid;display:flex;border-bottom:1px solid #ddd;background:${i % 2 === 0 ? '#fafafa' : 'white'};">
      <div style="padding:8px 14px;font-weight:600;font-size:11px;color:#333;width:80px;flex-shrink:0;border-left:1px solid #ddd;">${g.subject}</div>
      <div style="padding:8px 14px;font-size:13px;color:#111;text-align:center;width:45px;flex-shrink:0;font-weight:700;border-left:1px solid #ddd;">${g.grade ?? '—'}</div>
      <div style="padding:8px 14px;font-size:11px;color:#333;line-height:1.7;white-space:pre-wrap;flex:1;">${g.ai_enhanced_evaluation || g.verbal_evaluation || '—'}</div>
    </div>
  `).join('');

  const gradesBlockHtml = `
    <div style="margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px;">ציונים והערכות מקצועיות</div>
      <div style="border:1px solid #ddd;">
        <div style="display:flex;background:#eee;border-bottom:1px solid #ccc;">
          <div style="padding:8px 14px;font-size:11px;font-weight:600;color:#333;width:80px;flex-shrink:0;border-left:1px solid #ccc;">מקצוע</div>
          <div style="padding:8px 14px;font-size:11px;font-weight:600;color:#333;width:45px;flex-shrink:0;text-align:center;border-left:1px solid #ccc;">ציון</div>
          <div style="padding:8px 14px;font-size:11px;font-weight:600;color:#333;flex:1;">הערכה מילולית</div>
        </div>
        ${gradeBlocks || '<div style="padding:16px;text-align:center;color:#999;font-size:11px;">אין ציונים להצגה</div>'}
      </div>
    </div>
  `;

  container.innerHTML = `
    <div style="padding:36px 40px 28px;position:relative;">
      <!-- Header -->
      <div style="page-break-inside:avoid;text-align:center;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #333;">
        <img src="${logoSrc}" style="max-width:100px;height:auto;margin-bottom:6px;" />
        <div style="font-size:20px;font-weight:700;color:#222;margin-bottom:2px;">בית ספר מרום בית אקשטיין</div>
        <div style="font-size:13px;color:#555;font-weight:500;letter-spacing:2px;">תעודת הערכה</div>
      </div>

      <!-- Student Info -->
      <div style="page-break-inside:avoid;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding:12px 16px;border:1px solid #ddd;border-radius:4px;">
        <div>
          <div style="font-size:9px;color:#888;margin-bottom:2px;font-weight:600;letter-spacing:1px;">שם התלמיד/ה</div>
          <div style="font-size:16px;font-weight:700;color:#111;">${data.studentName}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:9px;color:#888;margin-bottom:2px;font-weight:600;letter-spacing:1px;">כיתה</div>
          <div style="font-size:15px;font-weight:700;color:#111;">${data.className || '—'}</div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:9px;color:#888;margin-bottom:2px;font-weight:600;letter-spacing:1px;">תאריך</div>
          <div style="font-size:11px;color:#333;">${gregorianDate}</div>
          <div style="font-size:11px;color:#555;">${hebrewDate}</div>
        </div>
      </div>

      ${personalNoteHtml}

      ${teamTableHtml}

      ${gradesBlockHtml}

      <!-- Signatures -->
      <div style="page-break-inside:avoid;margin-top:32px;padding-top:16px;border-top:1px solid #ccc;">
        <div style="display:flex;justify-content:space-around;align-items:flex-end;">
          <div style="display:flex;flex-direction:column;align-items:center;width:100px;">
            <img src="${principalSigSrc}" style="width:80px;height:auto;margin-bottom:4px;" />
            <div style="font-size:9px;color:#555;font-weight:600;">מנהל ביה״ס</div>
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
