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
    // Use he-u-ca-hebrew with numberingSystem set to hebr for gematria
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

const TEAM_SECTIONS: { title: string; color: string; items: { key: string; label: string }[] }[] = [
  {
    title: '📋 דיווחי צוות כיתה',
    color: '#3b5998',
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
    title: '🧠 מיומנויות למידה',
    color: '#b45309',
    items: [
      { key: 'problem_solving', label: 'פתרון בעיות' },
      { key: 'creative_thinking', label: 'חשיבה יצירתית' },
      { key: 'perseverance', label: 'התמדה וכוח רצון' },
    ],
  },
  {
    title: '💚 מיומנויות רגשיות',
    color: '#047857',
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

  const gradeRows = data.grades.map((g, i) => `
    <tr style="background:${i % 2 === 0 ? '#fafbfc' : 'white'};">
      <td style="padding:10px 14px;border:1px solid #e0e0e0;font-weight:600;font-size:13px;color:#333;width:100px;">${g.subject}</td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0;font-size:14px;color:#1a1a1a;text-align:center;width:60px;font-weight:bold;">${g.grade ?? '—'}</td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0;font-size:12px;color:#444;line-height:1.6;white-space:pre-wrap;">${g.ai_enhanced_evaluation || g.verbal_evaluation || '—'}</td>
    </tr>
  `).join('');

  // Team evaluation sections
  const teamEval = data.teamEvaluation;
  const teamSectionsHtml = teamEval ? TEAM_SECTIONS.map(section => {
    const rows = section.items.map((item, i) => {
      const val = teamEval[item.key as keyof TeamEvaluation];
      if (!val) return '';
      return `
        <tr style="background:${i % 2 === 0 ? '#f8f9ff' : 'white'};">
          <td style="padding:8px 14px;border:1px solid #e0e0e0;font-weight:600;font-size:12px;color:#333;">${item.label}</td>
          <td style="padding:8px 14px;border:1px solid #e0e0e0;font-size:13px;color:#1a1a1a;text-align:center;font-weight:500;">${val}</td>
        </tr>
      `;
    }).filter(Boolean).join('');
    if (!rows) return '';
    return `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:bold;color:${section.color};margin-bottom:8px;">${section.title}</div>
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
          <thead>
            <tr style="background:${section.color};">
              <th style="padding:8px 14px;color:white;font-size:12px;text-align:right;">תחום</th>
              <th style="padding:8px 14px;color:white;font-size:12px;text-align:center;">דירוג</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).filter(Boolean).join('') : '';

  const personalNoteHtml = data.personalNote ? `
    <div style="margin-bottom:20px;padding:14px 16px;background:#fdf2f8;border-radius:10px;border:1px solid #f9d4e8;">
      <div style="font-size:13px;font-weight:bold;color:#be185d;margin-bottom:8px;">💌 ממני אלייך</div>
      <div style="font-size:12px;color:#333;line-height:1.8;white-space:pre-wrap;">${data.personalNote}</div>
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

      ${teamSectionsHtml}

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
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfPageHeight;

    // Additional pages if content overflows
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
