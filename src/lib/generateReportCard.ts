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

const TEAM_SECTIONS: { title: string; icon: string; color: string; bgLight: string; items: { key: string; label: string }[] }[] = [
  {
    title: 'דיווחי צוות כיתה',
    icon: '📋',
    color: '#2c5282',
    bgLight: '#ebf4ff',
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
    icon: '🧠',
    color: '#92400e',
    bgLight: '#fffbeb',
    items: [
      { key: 'problem_solving', label: 'פתרון בעיות' },
      { key: 'creative_thinking', label: 'חשיבה יצירתית' },
      { key: 'perseverance', label: 'התמדה וכוח רצון' },
    ],
  },
  {
    title: 'מיומנויות רגשיות',
    icon: '💚',
    color: '#065f46',
    bgLight: '#ecfdf5',
    items: [
      { key: 'emotional_regulation', label: 'ויסות רגשי' },
      { key: 'emotional_tools', label: 'שימוש בכלים שונים' },
      { key: 'cognitive_flexibility', label: 'גמישות מחשבתית' },
      { key: 'self_efficacy', label: 'מסוגלות עצמית' },
    ],
  },
];

function ratingBadge(val: string): string {
  const colors: Record<string, { bg: string; text: string }> = {
    'מצטיין/ת': { bg: '#dcfce7', text: '#166534' },
    'טוב מאוד': { bg: '#dbeafe', text: '#1e40af' },
    'טוב': { bg: '#fef9c3', text: '#854d0e' },
    'דורש/ת שיפור': { bg: '#fee2e2', text: '#991b1b' },
  };
  const c = colors[val] || { bg: '#f3f4f6', text: '#374151' };
  return `<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:600;background:${c.bg};color:${c.text};">${val}</span>`;
}

export async function generateReportCard(data: ReportCardData): Promise<Blob> {
  const hebrewDate = getHebrewDate();
  const gregorianDate = getGregorianDate();

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:0;background:white;font-family:Arial,sans-serif;direction:rtl;';

  const gradeRows = data.grades.map((g, i) => `
    <tr style="background:${i % 2 === 0 ? '#f8faf9' : 'white'};">
      <td style="padding:10px 14px;border-bottom:1px solid #e8ece9;font-weight:600;font-size:12px;color:#2a7c6f;width:90px;vertical-align:top;">${g.subject}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8ece9;font-size:15px;color:#1a1a1a;text-align:center;width:50px;font-weight:700;vertical-align:top;">${g.grade ?? '—'}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8ece9;font-size:11.5px;color:#444;line-height:1.7;white-space:pre-wrap;vertical-align:top;">${g.ai_enhanced_evaluation || g.verbal_evaluation || '—'}</td>
    </tr>
  `).join('');

  // Team evaluation sections
  const teamEval = data.teamEvaluation;
  const teamSectionsHtml = teamEval ? TEAM_SECTIONS.map(section => {
    const rows = section.items.map((item, i) => {
      const val = teamEval[item.key as keyof TeamEvaluation];
      if (!val) return '';
      return `
        <tr style="background:${i % 2 === 0 ? section.bgLight : 'white'};">
          <td style="padding:7px 14px;border-bottom:1px solid #eee;font-weight:500;font-size:11.5px;color:#333;">${item.label}</td>
          <td style="padding:7px 14px;border-bottom:1px solid #eee;text-align:center;">${ratingBadge(val)}</td>
        </tr>
      `;
    }).filter(Boolean).join('');
    if (!rows) return '';
    return `
      <div style="margin-bottom:14px;">
        <div style="font-size:12px;font-weight:700;color:${section.color};margin-bottom:6px;display:flex;align-items:center;gap:6px;">
          <span style="font-size:14px;">${section.icon}</span> ${section.title}
        </div>
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <thead>
            <tr style="background:${section.color};">
              <th style="padding:7px 14px;color:white;font-size:11px;text-align:right;font-weight:600;">תחום</th>
              <th style="padding:7px 14px;color:white;font-size:11px;text-align:center;font-weight:600;width:120px;">דירוג</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).filter(Boolean).join('') : '';

  const personalNoteHtml = data.personalNote ? `
    <div style="margin-bottom:18px;padding:16px 18px;background:linear-gradient(135deg, #fdf2f8, #fce7f3);border-radius:12px;border:1px solid #f9d4e8;position:relative;">
      <div style="position:absolute;top:-8px;right:16px;background:white;padding:0 8px;">
        <span style="font-size:12px;font-weight:700;color:#be185d;">💌 ממני אלייך</span>
      </div>
      <div style="font-size:12px;color:#4a1942;line-height:1.9;white-space:pre-wrap;margin-top:6px;font-style:italic;">${data.personalNote}</div>
    </div>
  ` : '';

  const signatureLine = (label: string) => `
    <div style="display:flex;flex-direction:column;align-items:center;width:110px;">
      <div style="width:90px;border-bottom:1.5px solid #bbb;margin-bottom:6px;height:32px;"></div>
      <div style="font-size:10px;color:#666;font-weight:600;letter-spacing:0.5px;">${label}</div>
    </div>
  `;

  container.innerHTML = `
    <div style="padding:32px 36px 28px;position:relative;">
      <!-- Decorative top border -->
      <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg, #2a7c6f, #3a9d8f, #5cb8a9, #3a9d8f, #2a7c6f);"></div>

      <!-- Header -->
      <div style="text-align:center;margin-bottom:22px;padding-bottom:18px;border-bottom:2px solid #2a7c6f;position:relative;">
        <img src="${logoSrc}" style="max-width:110px;height:auto;margin-bottom:6px;" />
        <div style="font-size:24px;font-weight:900;color:#2a7c6f;margin-bottom:3px;letter-spacing:0.5px;">בית ספר מרום בית אקשטיין</div>
        <div style="display:inline-block;padding:4px 24px;background:linear-gradient(135deg, #2a7c6f, #3a9d8f);color:white;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:2px;margin-top:4px;">תעודת הערכה</div>
      </div>

      <!-- Student Info -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding:14px 18px;background:linear-gradient(135deg, #f0f7f6, #e6f2f0);border-radius:12px;border:1px solid #c8e0db;box-shadow:0 2px 6px rgba(42,124,111,0.08);">
        <div>
          <div style="font-size:10px;color:#6b9f97;margin-bottom:3px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">שם התלמיד/ה</div>
          <div style="font-size:20px;font-weight:800;color:#1a1a1a;">${data.studentName}</div>
        </div>
        <div style="text-align:center;padding:8px 20px;background:white;border-radius:10px;border:1px solid #d4e8e5;">
          <div style="font-size:10px;color:#6b9f97;margin-bottom:2px;font-weight:600;">כיתה</div>
          <div style="font-size:18px;font-weight:800;color:#2a7c6f;">${data.className || '—'}</div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:10px;color:#6b9f97;margin-bottom:3px;font-weight:600;">תאריך</div>
          <div style="font-size:12px;color:#333;font-weight:500;">${gregorianDate}</div>
          <div style="font-size:11px;color:#2a7c6f;font-weight:600;margin-top:1px;">${hebrewDate}</div>
        </div>
      </div>

      ${personalNoteHtml}

      ${teamSectionsHtml}

      <!-- Grades Table -->
      <div style="margin-bottom:22px;">
        <div style="font-size:12px;font-weight:700;color:#2a7c6f;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
          <span style="font-size:14px;">📚</span> ציונים והערכות מקצועיות
        </div>
        <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <thead>
            <tr style="background:linear-gradient(135deg, #2a7c6f, #3a9d8f);">
              <th style="padding:10px 14px;color:white;font-size:12px;text-align:right;font-weight:600;">מקצוע</th>
              <th style="padding:10px 14px;color:white;font-size:12px;text-align:center;font-weight:600;width:50px;">ציון</th>
              <th style="padding:10px 14px;color:white;font-size:12px;text-align:right;font-weight:600;">הערכה מילולית</th>
            </tr>
          </thead>
          <tbody>
            ${gradeRows || '<tr><td colspan="3" style="padding:20px;text-align:center;color:#999;font-size:12px;">אין ציונים להצגה</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Signatures -->
      <div style="margin-top:28px;padding-top:18px;border-top:2px solid #e8ece9;">
        <div style="display:flex;justify-content:space-around;align-items:flex-end;">
          <div style="display:flex;flex-direction:column;align-items:center;width:110px;">
            <img src="${principalSigSrc}" style="width:90px;height:auto;margin-bottom:4px;opacity:0.85;" />
            <div style="font-size:10px;color:#666;font-weight:600;letter-spacing:0.5px;">מנהל ביה״ס</div>
          </div>
          ${signatureLine('מחנכ/ת')}
          ${signatureLine('התלמיד/ה')}
          ${signatureLine('ההורים')}
        </div>
      </div>

      <!-- Decorative bottom -->
      <div style="text-align:center;margin-top:20px;">
        <div style="display:inline-block;width:60px;height:3px;background:linear-gradient(90deg, transparent, #2a7c6f, transparent);border-radius:2px;"></div>
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
