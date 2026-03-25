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
  {
    id: 'breathing',
    title: 'תרגיל נשימות',
    description: 'נשימות עמוקות להרגעת הגוף והמחשבה',
    icon: 'Wind',
    category: 'calm',
    duration: 3,
    difficulty: 'easy'
  },
  {
    id: 'stop',
    title: 'טכניקת עצירה',
    description: 'עצירה מודעת של המחשבות והתמקדות בכאן ועכשיו',
    icon: 'Hand',
    category: 'focus',
    duration: 2,
    difficulty: 'easy'
  },
  {
    id: 'grounding',
    title: 'טכניקת 5-4-3-2-1',
    description: 'חיבור לחושים כדי להפחית חרדה',
    icon: 'MapPin',
    category: 'calm',
    duration: 5,
    difficulty: 'medium'
  },
  {
    id: 'muscle-relaxation',
    title: 'הרפיית שרירים',
    description: 'כיווץ ושחרור שרירים להפגת מתח פיזי',
    icon: 'Activity',
    category: 'calm',
    duration: 7,
    difficulty: 'medium'
  },
  {
    id: 'positive-reframing',
    title: 'חשיבה חיובית',
    description: 'שינוי נקודת המבט על סיטואציה מאתגרת',
    icon: 'Lightbulb',
    category: 'cognitive',
    duration: 5,
    difficulty: 'hard'
  },
  {
    id: 'journaling',
    title: 'כתיבה רגשית',
    description: 'פריקת רגשות על הכתב',
    icon: 'PenTool',
    category: 'cognitive',
    duration: 10,
    difficulty: 'medium'
  }
];

export function getSkillRecommendations(stateId: string, intensity: number): string[] {
  if (stateId === 'sos') return ['breathing', 'grounding'];
  if (stateId === 'anger') return ['stop', 'muscle-relaxation'];
  if (stateId === 'anxiety') return ['breathing', 'grounding'];
  if (stateId === 'overwhelm') return ['stop', 'breathing'];
  return ['breathing', 'stop', 'grounding'];
}

export const writingPrompts: Record<string, string[]> = {
  anger: [
    'מה בדיוק גרם לי להרגיש ככה?',
    'איך אני יכול להגיב בצורה רגועה יותר בפעם הבאה?',
    'מה אני צריך עכשיו כדי להרגיש טוב יותר?'
  ],
  anxiety: [
    'מה הדבר הכי גרוע שיכול לקרות, והאם הוא באמת יקרה?',
    'מה אני יכול לשלוט בו כרגע?',
    'איזה משפט מרגיע אני יכול להגיד לעצמי?'
  ],
  sadness: [
    'מה יכול לעזור לי להרגיש קצת יותר טוב?',
    'מי האנשים שתומכים בי?',
    'מה הדבר הטוב שקרה לי היום, גם אם הוא קטן?'
  ]
};
