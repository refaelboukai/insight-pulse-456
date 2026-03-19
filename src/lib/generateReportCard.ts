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

interface ReportCardData {
  studentName: string;
  className: string;
  grades: GradeEntry[];
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
