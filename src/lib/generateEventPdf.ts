import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { INCIDENT_TYPE_LABELS } from '@/lib/constants';
import logoSrc from '@/assets/logo.jpeg';

interface EventData {
  incidentType: string;
  description: string;
  peopleInvolved: string;
  staffResponse: string;
  followupRequired: boolean;
  followupNotes: string;
  date: string;
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
        resolve(src); // fallback to original
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export async function generateEventPdf(data: EventData): Promise<Blob> {
  const typeName = INCIDENT_TYPE_LABELS[data.incidentType] || data.incidentType;

  // Preload logo as data-URL to avoid CORS / loading issues with html2canvas
  const logoDataUrl = await preloadImageAsDataUrl(logoSrc);

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:595px;padding:40px;background:white;font-family:Arial,sans-serif;direction:rtl;z-index:-1;';

  const rows = [
    { label: 'סוג אירוע', value: typeName },
    { label: 'תאריך', value: data.date },
    { label: 'תיאור האירוע', value: data.description },
  ];
  if (data.peopleInvolved) rows.push({ label: 'מעורבים', value: data.peopleInvolved });
  if (data.staffResponse) rows.push({ label: 'תגובת הצוות', value: data.staffResponse });
  if (data.followupRequired) {
    rows.push({ label: 'נדרש מעקב', value: 'כן' });
    if (data.followupNotes) rows.push({ label: 'הערות מעקב', value: data.followupNotes });
  }

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:24px;">
      <img src="${logoDataUrl}" style="max-width:200px;height:auto;margin-bottom:12px;" />
      <div style="font-size:28px;font-weight:bold;color:#1a1a1a;">🚨 דיווח אירוע חריג</div>
      <div style="font-size:13px;color:#888;margin-top:6px;">בית אקשטיין</div>
    </div>
    <div style="border:2px solid #e5e5e5;border-radius:12px;overflow:hidden;">
      ${rows
        .map(
          (r, i) => `
        <div style="display:flex;padding:14px 18px;${i % 2 === 0 ? 'background:#f9f9f9;' : 'background:white;'}border-bottom:1px solid #eee;">
          <div style="min-width:120px;font-weight:bold;color:#444;font-size:14px;">${r.label}</div>
          <div style="flex:1;color:#1a1a1a;font-size:14px;white-space:pre-wrap;">${r.value}</div>
        </div>
      `
        )
        .join('')}
    </div>
    <div style="text-align:center;margin-top:30px;color:#bbb;font-size:11px;">
      נוצר אוטומטית • ${data.date}
    </div>
  `;

  document.body.appendChild(container);

  // Wait a tick for the browser to lay out + render the image
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
