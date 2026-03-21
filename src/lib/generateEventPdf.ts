import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { INCIDENT_TYPE_LABELS } from '@/lib/constants';
import logoSrc from '@/assets/logo.jpeg';
import logo2Src from '@/assets/logo2.jpeg';

interface EventData {
  incidentType: string;
  description: string;
  peopleInvolved: string;
  staffResponse: string;
  followupRequired: boolean;
  followupNotes: string;
  date: string;
  time?: string;
}

/** Preload an image and return a data-URL so html2canvas never needs a network fetch */
function preloadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d')!.drawImage(img, 0, 0);
        resolve(c.toDataURL('image/jpeg'));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export async function generateEventPdf(data: EventData): Promise<Blob> {
  const typeName = INCIDENT_TYPE_LABELS[data.incidentType] || data.incidentType;
  const [logoDataUrl, logo2DataUrl] = await Promise.all([
    preloadImageAsDataUrl(logoSrc),
    preloadImageAsDataUrl(logo2Src),
  ]);
  const timeStr = data.time || new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:595px;padding:40px;background:white;font-family:Arial,sans-serif;direction:rtl;z-index:-1;';

  const rows = [
    { label: 'סוג אירוע', value: typeName },
    { label: 'תאריך', value: data.date },
    { label: 'שעת דיווח', value: timeStr },
    { label: 'תיאור האירוע', value: data.description },
  ];
  if (data.peopleInvolved) rows.push({ label: 'מעורבים', value: data.peopleInvolved });
  if (data.staffResponse) rows.push({ label: 'תגובת הצוות', value: data.staffResponse });
  if (data.followupRequired) {
    rows.push({ label: 'נדרש מעקב', value: 'כן' });
    if (data.followupNotes) rows.push({ label: 'הערות מעקב', value: data.followupNotes });
  }

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:28px;position:relative;">
      <img src="${logo2DataUrl}" style="position:absolute;left:0;top:0;width:100px;height:100px;object-fit:contain;border-radius:6px;" />
      <img src="${logoDataUrl}" style="max-width:180px;height:auto;margin-bottom:10px;" />
      <div style="font-size:22px;font-weight:bold;color:#1a3a5c;letter-spacing:0.5px;">בית ספר מרום בית אקשטיין</div>
      <div style="width:60px;height:3px;background:linear-gradient(90deg,#3b82f6,#60a5fa);margin:12px auto;border-radius:2px;"></div>
      <div style="font-size:18px;font-weight:600;color:#334155;">דיווח אירוע חריג</div>
    </div>
    <div style="border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      ${rows
        .map(
          (r, i) => `
        <div style="display:flex;padding:14px 20px;${i % 2 === 0 ? 'background:#f8fafc;' : 'background:white;'}${i < rows.length - 1 ? 'border-bottom:1px solid #e2e8f0;' : ''}">
          <div style="min-width:110px;font-weight:700;color:#475569;font-size:13px;">${r.label}</div>
          <div style="flex:1;color:#1e293b;font-size:13px;white-space:pre-wrap;line-height:1.6;">${r.value}</div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  document.body.appendChild(container);
  await new Promise((r) => setTimeout(r, 100));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
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
