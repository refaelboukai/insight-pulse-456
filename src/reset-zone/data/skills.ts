import { Skill, EmotionalState } from '@/reset-zone/types';

export const emotionalStates: EmotionalState[] = [
  { id: 'good', label: 'אני מרגיש טוב', icon: 'Smile', isPositive: true },
  { id: 'anger', label: 'כעס', icon: 'Flame' },
  { id: 'anxiety', label: 'חרדה', icon: 'AlertTriangle' },
  { id: 'sadness', label: 'עצב', icon: 'CloudRain' },
  { id: 'overwhelm', label: 'הצפה', icon: 'Waves' },
  { id: 'conflict', label: 'ריב עם מישהו', icon: 'Users' },
  { id: 'academic-stress', label: 'לחץ בלימודים', icon: 'BookOpen' },
  { id: 'exhaustion', label: 'אין לי כוח', icon: 'Battery' },
  { id: 'confusion', label: 'בלבול', icon: 'HelpCircle' },
  { id: 'sos', label: 'SOS – קשה לי מאוד עכשיו', icon: 'AlertOctagon', isSOS: true },
];

export const skills: Skill[] = [
  { id: 'stop', name: 'STOP', description: 'עצור, קח צעד אחורה, שים לב למה שקורה ופעל בצורה מודעת.', category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '1-2 דקות' },
  { id: 'tipp', name: 'TIPP', description: 'ויסות מהיר דרך הגוף.', category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '2-5 דקות' },
  { id: 'check-facts', name: 'Check the Facts', description: 'בדיקת עובדות מול פרשנות.', category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '3-5 דקות', hasWritingMode: true },
  { id: 'opposite-action', name: 'Opposite Action', description: 'בחירה בפעולה הפוכה לדחף.', category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '2-3 דקות' },
  { id: 'dear-man', name: 'DEAR MAN', description: 'דרך ברורה ומכבדת לבקש.', category: 'communication', categoryLabel: 'תקשורת', estimatedTime: '5-7 דקות', hasWritingMode: true },
  { id: 'give', name: 'GIVE', description: 'תקשורת נעימה ששומרת על הקשר.', category: 'communication', categoryLabel: 'תקשורת', estimatedTime: '2-3 דקות' },
  { id: 'fast', name: 'FAST', description: 'לשמור על הכבוד העצמי.', category: 'communication', categoryLabel: 'תקשורת', estimatedTime: '2-3 דקות' },
  { id: 'wise-mind', name: 'Wise Mind', description: 'איזון בין רגש לחשיבה.', category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '2-3 דקות' },
  { id: 'self-soothing', name: 'Self Soothing', description: 'הרגעה דרך החושים.', category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '3-5 דקות' },
  { id: 'pros-cons', name: 'Pros and Cons', description: 'יתרונות וחסרונות לפני פעולה.', category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '3-5 דקות', hasWritingMode: true },
  { id: 'accepts', name: 'ACCEPTS', description: 'דרכים לעבור רגע קשה.', category: 'acceptance', categoryLabel: 'קבלה', estimatedTime: '5-10 דקות' },
  { id: 'please', name: 'PLEASE', description: 'דאגה לגוף כדי להפחית פגיעות רגשית.', category: 'acceptance', categoryLabel: 'קבלה', estimatedTime: '2-3 דקות' },
  { id: 'radical-acceptance', name: 'Radical Acceptance', description: 'קבלה של מצב שלא ניתן לשנות.', category: 'acceptance', categoryLabel: 'קבלה', estimatedTime: '3-5 דקות' },
  { id: 'problem-solving', name: 'Problem Solving', description: 'פתרון בעיה בצעדים קטנים.', category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '5-7 דקות', hasWritingMode: true },
  { id: 'cope-ahead', name: 'Cope Ahead', description: 'הכנה מראש למצב קשה.', category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '3-5 דקות', hasWritingMode: true },
  { id: 'grounding', name: '5-4-3-2-1 Grounding', description: 'קרקוע דרך החושים.', category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '2-3 דקות' },
  { id: 'breathing', name: 'נשימה להרגעה', description: 'תרגול נשימה מודעת.', category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '40 שניות' },
];

export function getSkillRecommendations(stateId: string, intensity: number): string[] {
  const high = intensity >= 7;
  const map: Record<string, string[]> = {
    'anger': high ? ['stop', 'tipp', 'opposite-action'] : ['stop', 'check-facts', 'wise-mind'],
    'anxiety': high ? ['tipp', 'breathing', 'grounding'] : ['check-facts', 'breathing', 'self-soothing'],
    'sadness': high ? ['self-soothing', 'opposite-action', 'please'] : ['check-facts', 'self-soothing', 'opposite-action'],
    'overwhelm': high ? ['grounding', 'tipp', 'breathing'] : ['self-soothing', 'grounding', 'breathing'],
    'conflict': ['dear-man', 'give', 'fast'],
    'academic-stress': high ? ['breathing', 'check-facts', 'problem-solving'] : ['problem-solving', 'check-facts', 'cope-ahead'],
    'exhaustion': ['opposite-action', 'please', 'self-soothing'],
    'confusion': ['wise-mind', 'check-facts', 'pros-cons'],
    'sos': ['breathing', 'grounding', 'tipp'],
  };
  return map[stateId] || ['breathing', 'stop', 'grounding'];
}

export const writingPrompts: Record<string, string[]> = {
  'check-facts': ['מה קרה בפועל?', 'מה חשבת שזה אומר?', 'יכול להיות הסבר אחר?', 'מה העובדה הכי ברורה כרגע?'],
  'dear-man': ['מה קרה?', 'מה אתה מרגיש?', 'מה אתה רוצה לבקש?', 'למה זה חשוב לך?', 'כתוב משפט קצר שתוכל לומר.'],
  'pros-cons': ['אם אפעל מתוך דחף — מה יקרה?', 'אם אעצור רגע — מה יכול לעזור?'],
  'problem-solving': ['מה הבעיה המרכזית?', 'מה אפשר לעשות עכשיו?', 'מה הצעד הכי קטן שאפשר לעשות?'],
  'cope-ahead': ['מה עלול להיות קשה בהמשך היום?', 'איך תזהה שזה מתחיל?', 'מה יעזור לך אם זה יקרה?'],
};
