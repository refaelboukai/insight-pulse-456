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
    const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
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

const TEAM_LABELS: Record<string, string> = {
  behavior: 'התנהגות',
  independent_work: 'עבודה עצמאית',
  group_work: 'עבודה בקבוצה',
  emotional_regulation: 'ויסות רגשי',
  general_functioning: 'תפקוד כללי',
  helping_others: 'עזרה לאחרים',
  environmental_care: 'אכפתיות לסביבה',
  duties_performance: 'ביצוע תורנויות',
  studentship: 'תלמידאות',
};

export async function generateReportCard(data: ReportCardData): Promise<Blob> {
  const hebrewDate = getHebrewDate();
  const gregorianDate = getGregorianDate();

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:0;background:white;font-family:Arial,sans-serif;direction:rtl;';

  const gradeRows = data.grades.map((g, i) => `
    <tr style="background:${i % 2 === 0 ? '#fafbfc' : 'white'};">
      <td style="padding:10px 14px;border:1px solid #e0e0e0;font-weight:600;font-size:13px;color:#333;width:100px;">${g.subject}</td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0;font-size:14px;color:#1a1a1a;text-align:center;width:60px;font-weight:bold;">${g.grade ?? '—'}</td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0;font-size:12px;color:#444;line-height:1.6;white-space:pre-wrap;">${g.ai_enhanced_evaluation || g.verbal_evaluation || '—'}</td>
    </tr>
  `).join('');

  // Team evaluation rows
  const teamEval = data.teamEvaluation;
  const teamRows = teamEval ? Object.entries(TEAM_LABELS).map(([key, label], i) => {
    const val = teamEval[key as keyof TeamEvaluation];
    if (!val) return '';
    return `
      <tr style="background:${i % 2 === 0 ? '#f8f9ff' : 'white'};">
        <td style="padding:8px 14px;border:1px solid #e0e0e0;font-weight:600;font-size:12px;color:#333;">${label}</td>
        <td style="padding:8px 14px;border:1px solid #e0e0e0;font-size:13px;color:#1a1a1a;text-align:center;font-weight:500;">${val}</td>
      </tr>
    `;
  }).filter(Boolean).join('') : '';

  const personalNoteHtml = data.personalNote ? `
    <div style="margin-bottom:20px;padding:14px 16px;background:#fdf2f8;border-radius:10px;border:1px solid #f9d4e8;">
      <div style="font-size:13px;font-weight:bold;color:#be185d;margin-bottom:8px;">💌 ממני אלייך</div>
      <div style="font-size:12px;color:#333;line-height:1.8;white-space:pre-wrap;">${data.personalNote}</div>
    </div>
  ` : '';

  const teamTableHtml = teamRows ? `
    <div style="margin-bottom:20px;">
      <div style="font-size:13px;font-weight:bold;color:#1e40af;margin-bottom:8px;">📋 דיווחי צוות כיתה</div>
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
        <thead>
          <tr style="background:linear-gradient(135deg, #3b5998, #5b7ec2);">
            <th style="padding:8px 14px;color:white;font-size:12px;text-align:right;border:1px solid #3b5998;">תחום</th>
            <th style="padding:8px 14px;color:white;font-size:12px;text-align:center;border:1px solid #3b5998;">דירוג</th>
          </tr>
        </thead>
        <tbody>${teamRows}</tbody>
      </table>
    </div>
  ` : '';

  const signatureLine = (label: string) => `
    <div style="display:flex;flex-direction:column;align-items:center;width:120px;">
      <div style="width:100px;border-bottom:1.5px solid #999;margin-bottom:6px;height:30px;"></div>
      <div style="font-size:11px;color:#666;font-weight:500;">${label}</div>
    </div>
  `;

  container.innerHTML = `
    <div style="padding:36px 40px 30px;min-height:842px;position:relative;">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #2a7c6f;">
        <img src="${logoSrc}" style="max-width:140px;height:auto;margin-bottom:8px;" />
        <div style="font-size:22px;font-weight:bold;color:#2a7c6f;margin-bottom:2px;">בית ספר מרום בית אקשטיין</div>
        <div style="font-size:12px;color:#888;letter-spacing:1px;">תעודת הערכה</div>
      </div>

      <!-- Student Info -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding:12px 16px;background:#f0f7f6;border-radius:10px;border:1px solid #d4e8e5;">
        <div>
          <div style="font-size:11px;color:#888;margin-bottom:2px;">שם התלמיד/ה</div>
          <div style="font-size:18px;font-weight:bold;color:#1a1a1a;">${data.studentName}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:11px;color:#888;margin-bottom:2px;">כיתה</div>
          <div style="font-size:16px;font-weight:bold;color:#2a7c6f;">${data.className || '—'}</div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:11px;color:#888;margin-bottom:2px;">תאריך</div>
          <div style="font-size:12px;color:#333;">${gregorianDate}</div>
          <div style="font-size:11px;color:#666;">${hebrewDate}</div>
        </div>
      </div>

      ${personalNoteHtml}

      ${teamTableHtml}

      <!-- Grades Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
        <thead>
          <tr style="background:linear-gradient(135deg, #2a7c6f, #3a9d8f);">
            <th style="padding:10px 14px;color:white;font-size:13px;text-align:right;border:1px solid #2a7c6f;">מקצוע</th>
            <th style="padding:10px 14px;color:white;font-size:13px;text-align:center;border:1px solid #2a7c6f;width:60px;">ציון</th>
            <th style="padding:10px 14px;color:white;font-size:13px;text-align:right;border:1px solid #2a7c6f;">הערכה מילולית</th>
          </tr>
        </thead>
        <tbody>
          ${gradeRows || '<tr><td colspan="3" style="padding:20px;text-align:center;color:#999;font-size:13px;">אין ציונים להצגה</td></tr>'}
        </tbody>
      </table>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-around;margin-top:30px;padding-top:20px;border-top:2px dashed #e0e0e0;">
        <div style="display:flex;flex-direction:column;align-items:center;width:120px;">
          <img src="${principalSigSrc}" style="width:100px;height:auto;margin-bottom:4px;" />
          <div style="font-size:11px;color:#666;font-weight:500;">מנהל ביה״ס</div>
        </div>
        ${signatureLine('מחנכ/ת')}
        ${signatureLine('התלמיד/ה')}
        ${signatureLine('ההורים')}
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}
