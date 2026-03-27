import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PedagogyGoalData {
  studentName: string;
  subjectName: string;
  subSubject?: string | null;
  month: string;
  schoolYear: string;
  learningStyle?: string | null;
  currentStatus?: string | null;
  learningGoals?: string | null;
  measurementMethods?: string | null;
  whatWasDone?: string | null;
  whatWasNotDone?: string | null;
  teacherNotes?: string | null;
  adminNotes?: string | null;
}

function preloadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export async function generatePedagogyPdf(data: PedagogyGoalData): Promise<Blob> {
  const logoSrc = '/logo.png';
  let logoDataUrl: string;
  try {
    logoDataUrl = await preloadImageAsDataUrl(logoSrc);
  } catch {
    logoDataUrl = logoSrc;
  }

  const subjectTitle = data.subSubject ? `${data.subjectName} (${data.subSubject})` : data.subjectName;

  const fields = [
    { label: 'סגנון למידה', value: data.learningStyle },
    { label: 'מצב נוכחי', value: data.currentStatus },
    { label: 'יעדים לימודיים', value: data.learningGoals },
    { label: 'דרכי מדידה', value: data.measurementMethods },
    { label: 'מה נעשה בפועל', value: data.whatWasDone },
    { label: 'פערים - מה לא נעשה', value: data.whatWasNotDone },
    { label: 'הערות מורה', value: data.teacherNotes },
    { label: 'הערות הנהלה', value: data.adminNotes },
  ].filter(f => f.value);

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-9999px;left:0;width:595px;font-family:Arial,sans-serif;direction:rtl;background:#fff;padding:30px;';

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:20px;">
      <div>
        <div style="font-size:18px;font-weight:bold;color:#1e293b;">מרום בית אקשטיין</div>
        <div style="font-size:12px;color:#64748b;">יעד פדגוגי - ${data.schoolYear}</div>
      </div>
      <img src="${logoDataUrl}" style="height:50px;width:auto;" />
    </div>
    <div style="display:flex;gap:20px;margin-bottom:16px;font-size:13px;">
      <div><strong>תלמיד/ה:</strong> ${data.studentName}</div>
      <div><strong>מקצוע:</strong> ${subjectTitle}</div>
      <div><strong>חודש:</strong> ${data.month}</div>
    </div>
    ${fields.map(f => `
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:bold;color:#2563eb;margin-bottom:4px;">${f.label}</div>
        <div style="font-size:13px;color:#1e293b;white-space:pre-wrap;background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;">${f.value}</div>
      </div>
    `).join('')}
    <div style="margin-top:20px;font-size:10px;color:#94a3b8;text-align:center;">
      הופק בתאריך ${new Date().toLocaleDateString('he-IL')}
    </div>
  `;

  document.body.appendChild(container);

  const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdfWidth = 595;
  const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
  const pdf = new jsPDF({ orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape', unit: 'px', format: [pdfWidth, pdfHeight] });
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

  return pdf.output('blob');
}

export interface MonthlyGoalRow {
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

export async function generatePedagogyTrackingPdf(
  studentName: string,
  subjectName: string,
  subSubject: string | null,
  schoolYear: string,
  rows: MonthlyGoalRow[]
): Promise<Blob> {
  const logoSrc = '/logo.png';
  let logoDataUrl: string;
  try {
    logoDataUrl = await preloadImageAsDataUrl(logoSrc);
  } catch {
    logoDataUrl = logoSrc;
  }

  const subjectTitle = subSubject ? `${subjectName} (${subSubject})` : subjectName;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-9999px;left:0;width:800px;font-family:Arial,sans-serif;direction:rtl;background:#fff;padding:24px;';

  const fieldLabels = ['סגנון למידה', 'מצב נוכחי', 'יעדים', 'דרכי מדידה', 'מה נעשה', 'פערים', 'הערות מורה', 'הערות הנהלה'];
  const fieldKeys: (keyof MonthlyGoalRow)[] = ['learningStyle', 'currentStatus', 'learningGoals', 'measurementMethods', 'whatWasDone', 'whatWasNotDone', 'teacherNotes', 'adminNotes'];

  const headerCells = rows.map(r => `<th style="padding:6px 8px;font-size:11px;background:#2563eb;color:#fff;text-align:center;min-width:70px;">${r.month}</th>`).join('');
  const bodyRows = fieldLabels.map((label, i) => {
    const key = fieldKeys[i];
    const cells = rows.map(r => {
      const val = r[key] || '-';
      return `<td style="padding:6px 8px;font-size:10px;border:1px solid #e2e8f0;vertical-align:top;max-width:120px;word-break:break-word;">${val}</td>`;
    }).join('');
    return `<tr><td style="padding:6px 8px;font-size:11px;font-weight:bold;background:#f1f5f9;border:1px solid #e2e8f0;white-space:nowrap;">${label}</td>${cells}</tr>`;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:16px;">
      <div>
        <div style="font-size:16px;font-weight:bold;color:#1e293b;">מעקב פדגוגי שנתי - ${studentName}</div>
        <div style="font-size:12px;color:#64748b;">${subjectTitle} | ${schoolYear}</div>
      </div>
      <img src="${logoDataUrl}" style="height:40px;width:auto;" />
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr><th style="padding:6px 8px;font-size:11px;background:#1e293b;color:#fff;text-align:center;">תחום</th>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
    <div style="margin-top:16px;font-size:9px;color:#94a3b8;text-align:center;">הופק בתאריך ${new Date().toLocaleDateString('he-IL')}</div>
  `;

  document.body.appendChild(container);
  const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdfWidth = 842;
  const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [pdfWidth, Math.max(pdfHeight, 595)] });
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

  return pdf.output('blob');
}
