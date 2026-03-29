import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoSrc from '@/assets/logo.jpeg';
import principalSigSrc from '@/assets/principal-signature.jpeg';
import { g, type Gender } from '@/lib/genderUtils';
import { waitForPrintableRender } from '@/lib/pdfExport';

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

interface ReflectionSummary {
  class_presence: number;
  behavior: number;
  social_interaction: number;
  academic_tasks: number;
}

export type ReportTemplate = 'classic' | 'warm' | 'modern' | 'formal';

export interface ReportCardData {
  studentName: string;
  className: string;
  grades: GradeEntry[];
  personalNote?: string | null;
  teamEvaluation?: TeamEvaluation | null;
  principalName?: string;
  teacherName?: string;
  semesterLabel?: string;
  reflectionSummary?: ReflectionSummary | null;
  socialEmotionalSummary?: string | null;
  gender?: Gender;
  sectionOrder?: string[];
  template?: ReportTemplate;
  fontSize?: 'small' | 'medium' | 'large';
  showPageNumbers?: boolean;
}

// ── Color themes ──
const THEMES: Record<ReportTemplate, {
  headerBg: string; headerBorder: string; accent: string; accentLight: string; accentLighter: string;
  sectionTitle: string; text: string; textLight: string; tableBorder: string; tableHeaderBg: string;
  tableAltRow: string; noteBg: string; noteBorder: string; white: string;
  decorLine?: string; headerGradient?: string;
}> = {
  classic: {
    headerBg: '#e8f4fb', headerBorder: '#b8d8ea', accent: '#3a7ca5', accentLight: '#d0e8f5',
    accentLighter: '#eaf4fa', sectionTitle: '#2c6d94', text: '#2b2b2b', textLight: '#5a6a7a',
    tableBorder: '#c8dce8', tableHeaderBg: '#daeaf5', tableAltRow: '#f3f9fd',
    noteBg: '#f0f7fc', noteBorder: '#c4daea', white: '#ffffff',
  },
  warm: {
    headerBg: '#fdf5ec', headerBorder: '#e8ccaa', accent: '#b87333', accentLight: '#f0dcc6',
    accentLighter: '#faf3ea', sectionTitle: '#8b5e3c', text: '#3a2e24', textLight: '#7a6b5d',
    tableBorder: '#e0c9af', tableHeaderBg: '#f5e8d8', tableAltRow: '#fdf9f4',
    noteBg: '#fdf6ee', noteBorder: '#dfc8a8', white: '#ffffff',
    decorLine: '#b87333',
  },
  modern: {
    headerBg: '#eef6ee', headerBorder: '#b5d4b5', accent: '#3a8a5c', accentLight: '#c8e4c8',
    accentLighter: '#edf6ed', sectionTitle: '#2d6b45', text: '#1e2d24', textLight: '#5a7a65',
    tableBorder: '#b8d6b8', tableHeaderBg: '#d8eed8', tableAltRow: '#f3faf3',
    noteBg: '#f0f8f0', noteBorder: '#aecfae', white: '#ffffff',
    decorLine: '#3a8a5c',
  },
  formal: {
    headerBg: '#f0f0f5', headerBorder: '#c5c5d5', accent: '#4a4a6a', accentLight: '#d8d8e8',
    accentLighter: '#ededf5', sectionTitle: '#3a3a5a', text: '#1a1a2a', textLight: '#6a6a8a',
    tableBorder: '#c0c0d5', tableHeaderBg: '#e0e0ee', tableAltRow: '#f5f5fa',
    noteBg: '#f2f2f8', noteBorder: '#c0c0d5', white: '#ffffff',
    headerGradient: 'linear-gradient(135deg, #4a4a6a 0%, #6a6a8a 100%)',
  },
};

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

async function renderPageToCanvas(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:0;background:white;font-family:Arial,sans-serif;direction:rtl;z-index:-1;';
  container.innerHTML = html;
  document.body.appendChild(container);
  await waitForPrintableRender(120);
  try {
    return await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff' });
  } finally {
    document.body.removeChild(container);
  }
}

export async function generateReportCard(data: ReportCardData): Promise<Blob> {
  const hebrewDate = getHebrewDate();
  const gregorianDate = getGregorianDate();
  const template = data.template || 'classic';
  const colors = THEMES[template];
  const fs = data.fontSize || 'medium';
  const fontScale = fs === 'small' ? 0.9 : fs === 'large' ? 1.12 : 1;
  const sz = (base: number) => `${Math.round(base * fontScale)}px`;

  const [logoDataUrl, sigDataUrl] = await Promise.all([
    preloadImageAsDataUrl(logoSrc),
    preloadImageAsDataUrl(principalSigSrc),
  ]);

  const teamEval = data.teamEvaluation;

  // ── Decorative top line for non-classic templates ──
  const decorTopLine = colors.decorLine
    ? `<div style="height:4px;background:${colors.decorLine};margin-bottom:0;border-radius:0 0 2px 2px;"></div>`
    : (colors.headerGradient
      ? `<div style="height:5px;background:${colors.headerGradient};margin-bottom:0;"></div>`
      : '');

  // ── Build section HTML blocks ──
  // Build team evaluation as individual sub-group blocks (one per category) to avoid page-cut
  const teamSubBlocks: string[] = [];
  if (teamEval) {
    TEAM_SECTIONS.forEach(section => {
      const rows = section.items.map(item => {
        const val = teamEval[item.key as keyof TeamEvaluation];
        if (!val) return '';
        return `
          <tr>
            <td style="padding:${sz(7)} ${sz(16)};border-bottom:1px solid ${colors.tableBorder};font-size:${sz(11)};color:${colors.text};">${item.label}</td>
            <td style="padding:${sz(7)} ${sz(16)};border-bottom:1px solid ${colors.tableBorder};font-size:${sz(11)};color:${colors.text};text-align:center;font-weight:500;">${val}</td>
          </tr>
        `;
      }).filter(Boolean).join('');
      if (!rows) return;
      teamSubBlocks.push(`
        <div style="margin-bottom:${sz(4)};">
          <table style="width:100%;border-collapse:collapse;border:1px solid ${colors.tableBorder};border-radius:4px;overflow:hidden;">
            <thead>
              <tr style="background:${colors.accentLighter};">
                <td colspan="2" style="padding:${sz(8)} ${sz(16)} ${sz(4)};font-size:${sz(11)};font-weight:700;color:${colors.sectionTitle};border-bottom:1px solid ${colors.headerBorder};">${section.title}</td>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `);
    });
  }

  const allTeamRows = teamSubBlocks.length > 0 ? 'HAS_TEAM' : '';
  const sectionDivider = `<div style="margin:${sz(6)} 0;border-top:1px dashed ${colors.headerBorder};"></div>`;

  const makeSectionTitle = (icon: string, text: string) =>
    `<div style="font-size:${sz(12)};font-weight:700;color:${colors.sectionTitle};margin-bottom:${sz(8)};border-bottom:2px solid ${colors.headerBorder};padding-bottom:${sz(4)};display:flex;align-items:center;gap:${sz(6)};">
      <span style="font-size:${sz(14)};">${icon}</span> ${text}
    </div>`;

  const personalNoteHtml = data.personalNote ? `
    <div style="margin-bottom:${sz(18)};">
      ${makeSectionTitle('✉️', 'ממני אלייך — נימה אישית')}
      <div style="font-size:${sz(11)};color:${colors.text};line-height:2;white-space:pre-wrap;padding:${sz(14)};border:1px solid ${colors.noteBorder};border-radius:6px;background:${colors.noteBg};border-right:3px solid ${colors.accent};">${data.personalNote}</div>
    </div>
  ` : '';

  const teamTitleHtml = allTeamRows ? `
    <div style="margin-bottom:${sz(6)};">
      ${makeSectionTitle('📊', 'הערכה תפקודית')}
    </div>
  ` : '';
  // ── Header ──
  const headerHtml = `
    ${decorTopLine}
    <div style="text-align:center;margin-bottom:${sz(20)};padding:${sz(16)} 0 ${sz(14)};border-bottom:2px solid ${colors.accent};position:relative;">
      <img src="${logoDataUrl}" style="max-width:${sz(90)};height:auto;margin-bottom:${sz(6)};border-radius:4px;" />
      <div style="font-size:${sz(20)};font-weight:700;color:${colors.accent};margin-bottom:${sz(2)};">בית ספר מרום בית אקשטיין</div>
      <div style="font-size:${sz(13)};color:${colors.textLight};font-weight:500;letter-spacing:${sz(2)};">תעודת הערכה${data.semesterLabel ? ` — ${data.semesterLabel}` : ''}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:${sz(18)};padding:${sz(12)} ${sz(16)};border:1px solid ${colors.noteBorder};border-radius:6px;background:${colors.headerBg};">
      <div>
        <div style="font-size:${sz(9)};color:${colors.textLight};margin-bottom:${sz(2)};font-weight:600;letter-spacing:${sz(1)};text-transform:uppercase;">שם ${g(data.gender, 'התלמיד', 'התלמידה')}</div>
        <div style="font-size:${sz(16)};font-weight:700;color:${colors.text};">${data.studentName}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:${sz(9)};color:${colors.textLight};margin-bottom:${sz(2)};font-weight:600;letter-spacing:${sz(1)};">כיתה</div>
        <div style="font-size:${sz(15)};font-weight:700;color:${colors.text};">${data.className || '—'}</div>
      </div>
      <div style="text-align:left;">
        <div style="font-size:${sz(9)};color:${colors.textLight};margin-bottom:${sz(2)};font-weight:600;letter-spacing:${sz(1)};">תאריך</div>
        <div style="font-size:${sz(11)};color:${colors.text};">${gregorianDate}</div>
        <div style="font-size:${sz(10)};color:${colors.textLight};">${hebrewDate}</div>
      </div>
    </div>
  `;

  // ── Reflections ──
  const REFL_LABELS: Record<string, string> = {
    class_presence: 'נוכחות בשיעור',
    behavior: 'התנהגות',
    social_interaction: 'אינטראקציה חברתית',
    academic_tasks: 'משימות לימודיות',
  };
  const reflSummary = data.reflectionSummary;

  const renderProgressBar = (val: number) => {
    const pct = Math.min(100, Math.round((val / 5) * 100));
    return `<div style="display:flex;align-items:center;gap:${sz(6)};width:${sz(140)};">
      <div style="flex:1;height:${sz(8)};background:${colors.accentLighter};border-radius:${sz(4)};overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${colors.accent};border-radius:${sz(4)};transition:width 0.3s;"></div>
      </div>
      <span style="font-size:${sz(10)};color:${colors.text};font-weight:600;min-width:${sz(20)};text-align:center;">${val.toFixed(1)}</span>
    </div>`;
  };

  const reflectionHtml = reflSummary ? `
    <div style="margin-bottom:${sz(18)};">
      ${makeSectionTitle('🌟', `הערכה עצמית של ${g(data.gender, 'התלמיד', 'התלמידה')}`)}
      <table style="width:100%;border-collapse:collapse;border:1px solid ${colors.tableBorder};border-radius:4px;overflow:hidden;">
        <thead>
          <tr style="background:${colors.tableHeaderBg};">
            <th style="padding:${sz(8)} ${sz(16)};font-size:${sz(11)};text-align:right;font-weight:600;color:${colors.sectionTitle};border-bottom:2px solid ${colors.headerBorder};">תחום</th>
            <th style="padding:${sz(8)} ${sz(16)};font-size:${sz(11)};text-align:center;font-weight:600;color:${colors.sectionTitle};border-bottom:2px solid ${colors.headerBorder};width:${sz(180)};">מדד</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(REFL_LABELS).map(([key, label]) => {
            const val = reflSummary[key as keyof ReflectionSummary];
            return `<tr>
              <td style="padding:${sz(8)} ${sz(16)};border-bottom:1px solid ${colors.tableBorder};font-size:${sz(11)};color:${colors.text};">${label}</td>
              <td style="padding:${sz(8)} ${sz(16)};border-bottom:1px solid ${colors.tableBorder};">${renderProgressBar(val)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  // ── Social-emotional ──
  const socialEmotionalHtml = data.socialEmotionalSummary ? `
    <div style="margin-bottom:${sz(18)};">
      ${makeSectionTitle('💛', 'סיכום חברתי ורגשי')}
      <div style="font-size:${sz(11)};color:${colors.text};line-height:2;white-space:pre-wrap;padding:${sz(14)};border:1px solid ${colors.noteBorder};border-radius:6px;background:${colors.noteBg};border-right:3px solid ${colors.accent};">${data.socialEmotionalSummary}</div>
    </div>
  ` : '';

  // ── Pagination engine ──
  const A4_HEIGHT_PX = 842;
  const PAGE_PADDING_TOP = 32;
  const PAGE_PADDING_BOTTOM = 36;
  const SAFETY_MARGIN = 12; // extra safety to prevent cutting
  const USABLE_HEIGHT = A4_HEIGHT_PX - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - SAFETY_MARGIN;

  const signatureLine = (label: string) => `
    <div style="display:flex;flex-direction:column;align-items:center;width:${sz(100)};">
      <div style="width:${sz(80)};border-bottom:1px solid ${colors.headerBorder};margin-bottom:${sz(6)};height:${sz(28)};"></div>
      <div style="font-size:${sz(9)};color:${colors.textLight};font-weight:600;">${label}</div>
    </div>
  `;

  const teacherLabel = data.teacherName || g(data.gender, 'מחנך', 'מחנכת');
  const principalLabel = data.principalName || 'מנהל ביה״ס';

  const signaturesHtml = `
    <div style="margin-top:${sz(28)};padding-top:${sz(14)};border-top:2px solid ${colors.headerBorder};">
      <div style="display:flex;justify-content:space-around;align-items:flex-end;">
        <div style="display:flex;flex-direction:column;align-items:center;width:${sz(100)};">
          <img src="${sigDataUrl}" style="width:${sz(80)};height:auto;margin-bottom:${sz(4)};" />
          <div style="font-size:${sz(9)};color:${colors.textLight};font-weight:600;">${principalLabel}</div>
        </div>
        ${signatureLine(teacherLabel)}
        ${signatureLine(g(data.gender, 'התלמיד', 'התלמידה'))}
        ${signatureLine('ההורים')}
      </div>
    </div>
  `;

  // ── Build section map (teamEvaluation expands into sub-blocks to prevent page-cut) ──
  const sectionHtmlMap: Record<string, string | string[]> = {
    personalNote: personalNoteHtml,
    teamEvaluation: teamSubBlocks.length > 0 ? [teamTitleHtml, ...teamSubBlocks] : '',
    socialEmotional: socialEmotionalHtml,
    reflections: reflectionHtml,
  };
  const defaultOrder = ['personalNote', 'teamEvaluation', 'socialEmotional', 'reflections'];
  const order = (data.sectionOrder || defaultOrder).filter(k => k !== 'grades');

  const educatorTitle = `<div style="font-size:${sz(14)};font-weight:700;color:${colors.accent};margin-bottom:${sz(14)};text-align:center;letter-spacing:${sz(1)};">📝 דיווח ${g(data.gender, 'מחנך', 'מחנכת')}</div>`;

  const page1Sections: string[] = [educatorTitle];
  order.forEach((k, i) => {
    const val = sectionHtmlMap[k];
    if (!val || (Array.isArray(val) && val.length === 0)) return;
    if (i > 0) page1Sections.push(sectionDivider);
    if (Array.isArray(val)) {
      page1Sections.push(...val);
    } else {
      page1Sections.push(val);
    }
  });

  if (page1Sections.length <= 1) {
    page1Sections.push(`<div style="padding:${sz(30)};text-align:center;color:${colors.textLight};font-size:${sz(12)};">לא הוזנה הערכת ${g(data.gender, 'מחנך', 'מחנכת')}</div>`);
  }

  // ── Grades section ──
  const gradesTitle = `<div style="font-size:${sz(14)};font-weight:700;color:${colors.accent};margin-bottom:${sz(12)};text-align:center;letter-spacing:${sz(1)};">📚 ציונים והערכות מקצועיות</div>`;

  const gradeTableHeader = `<div style="border:1px solid ${colors.tableBorder};border-bottom:none;border-radius:6px 6px 0 0;overflow:hidden;"><div style="display:flex;background:${colors.tableHeaderBg};border-bottom:2px solid ${colors.headerBorder};"><div style="padding:${sz(9)} ${sz(14)};font-size:${sz(11)};font-weight:600;color:${colors.sectionTitle};width:${sz(80)};flex-shrink:0;border-left:1px solid ${colors.headerBorder};">מקצוע</div><div style="padding:${sz(9)} ${sz(14)};font-size:${sz(11)};font-weight:600;color:${colors.sectionTitle};width:${sz(45)};flex-shrink:0;text-align:center;border-left:1px solid ${colors.headerBorder};">ציון</div><div style="padding:${sz(9)} ${sz(14)};font-size:${sz(11)};font-weight:600;color:${colors.sectionTitle};flex:1;">הערכה מילולית</div></div></div>`;

  // ── Measure height helper ──
  async function measureHeight(html: string): Promise<number> {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:0 40px;background:white;font-family:Arial,sans-serif;direction:rtl;z-index:-1;';
    container.innerHTML = html;
    document.body.appendChild(container);
    await new Promise(r => setTimeout(r, 60));
    const h = container.offsetHeight;
    document.body.removeChild(container);
    return h;
  }

  // ── Page builder ──
  let totalPages = 0;

  async function buildPages(sections: string[]): Promise<string[]> {
    const pages: string[] = [];
    let currentSections: string[] = [];
    let currentHeight = 0;
    const headerHeight = await measureHeight(headerHtml);

    for (const section of sections) {
      const sectionHeight = await measureHeight(section);

      if (currentSections.length > 0 && currentHeight + sectionHeight > USABLE_HEIGHT) {
        totalPages++;
        const pageNum = data.showPageNumbers !== false ? `<div style="text-align:center;font-size:${sz(8)};color:${colors.textLight};margin-top:${sz(8)};padding-top:${sz(4)};border-top:1px solid ${colors.accentLighter};">עמוד ${totalPages}</div>` : '';
        pages.push(`<div style="padding:${PAGE_PADDING_TOP}px 40px ${PAGE_PADDING_BOTTOM}px;min-height:${A4_HEIGHT_PX}px;box-sizing:border-box;">${headerHtml}${currentSections.join('')}${pageNum}</div>`);
        currentSections = [];
        currentHeight = headerHeight;
      }
      if (currentSections.length === 0) {
        currentHeight = headerHeight;
      }
      currentSections.push(section);
      currentHeight += sectionHeight;
    }
    if (currentSections.length > 0) {
      totalPages++;
      const pageNum = data.showPageNumbers !== false ? `<div style="text-align:center;font-size:${sz(8)};color:${colors.textLight};margin-top:${sz(8)};padding-top:${sz(4)};border-top:1px solid ${colors.accentLighter};">עמוד ${totalPages}</div>` : '';
      pages.push(`<div style="padding:${PAGE_PADDING_TOP}px 40px ${PAGE_PADDING_BOTTOM}px;min-height:${A4_HEIGHT_PX}px;box-sizing:border-box;">${headerHtml}${currentSections.join('')}${pageNum}</div>`);
    }
    return pages;
  }

  // ── Build educator pages ──
  const educatorPages = await buildPages(page1Sections);

  // ── Build grades pages ──
  const gradesSections: string[] = [gradesTitle];

  if (data.grades.length > 0) {
    gradesSections.push(gradeTableHeader);
    data.grades.forEach((gr, i) => {
      const isLast = i === data.grades.length - 1;
      const rowBg = i % 2 === 0 ? colors.tableAltRow : colors.white;
      const borderRadius = isLast ? 'border-radius:0 0 6px 6px;overflow:hidden;' : '';
      const rowHtml = `<div style="border-left:1px solid ${colors.tableBorder};border-right:1px solid ${colors.tableBorder};${isLast ? `border-bottom:1px solid ${colors.tableBorder};${borderRadius}` : ''}"><div style="display:flex;border-bottom:1px solid ${colors.tableBorder};background:${rowBg};"><div style="padding:${sz(9)} ${sz(14)};font-weight:600;font-size:${sz(11)};color:${colors.text};width:${sz(80)};flex-shrink:0;border-left:1px solid ${colors.tableBorder};">${gr.subject}</div><div style="padding:${sz(9)} ${sz(14)};font-size:${sz(13)};color:${colors.accent};text-align:center;width:${sz(45)};flex-shrink:0;font-weight:700;border-left:1px solid ${colors.tableBorder};">${gr.grade ?? '—'}</div><div style="padding:${sz(9)} ${sz(14)};font-size:${sz(11)};color:${colors.text};line-height:1.8;white-space:pre-wrap;flex:1;">${gr.ai_enhanced_evaluation || gr.verbal_evaluation || '—'}</div></div></div>`;
      gradesSections.push(rowHtml);
    });
  } else {
    gradesSections.push(`<div style="border:1px solid ${colors.tableBorder};padding:${sz(16)};text-align:center;color:${colors.textLight};font-size:${sz(11)};border-radius:6px;">אין ציונים להצגה</div>`);
  }

  gradesSections.push(signaturesHtml);

  const gradesPages = await buildPages(gradesSections);

  // ── Render all pages to canvas → PDF ──
  const allPageHtmls = [...educatorPages, ...gradesPages];
  const canvases = await Promise.all(allPageHtmls.map(html => renderPageToCanvas(html)));

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfPageHeight = pdf.internal.pageSize.getHeight();

  canvases.forEach((canvas, idx) => {
    if (idx > 0) pdf.addPage();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    if (imgHeight <= pdfPageHeight) {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;
      while (heightLeft > 0) {
        position -= pdfPageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }
    }
  });

  return pdf.output('blob');
}
