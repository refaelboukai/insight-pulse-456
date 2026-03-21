export interface ActivityOption {
  title: string;
  level: 'קל' | 'בינוני' | 'מתקדם';
  levelColor: string;
  description: string;
  steps?: string[];
  duration?: string;
  emoji: string;
}

export interface ActivityContent {
  title: string;
  emoji: string;
  options: ActivityOption[];
}

const activityContentMap: Record<string, ActivityContent> = {
  'חדר כושר': {
    title: 'תוכניות אימון', emoji: '💪',
    options: [
      { title: 'אימון מתחילים', level: 'קל', levelColor: 'bg-emerald-100 text-emerald-700', description: 'אימון קל לחימום', duration: '15 דקות', emoji: '🟢', steps: ['חימום 3 דקות', '10 סקוואטים', '10 שכיבות סמיכה', '15 כפיפות בטן', 'מתיחות 3 דקות'] },
      { title: 'אימון בינוני', level: 'בינוני', levelColor: 'bg-amber-100 text-amber-700', description: 'אימון מאוזן', duration: '25 דקות', emoji: '🟡', steps: ['חימום 5 דקות', '15 סקוואטים × 3', '12 שכיבות סמיכה × 3', '20 כפיפות בטן × 3', 'מתיחות 5 דקות'] },
    ],
  },
  'לבשל': {
    title: 'מתכונים', emoji: '👨‍🍳',
    options: [
      { title: 'טוסט אבוקדו', level: 'קל', levelColor: 'bg-emerald-100 text-emerald-700', description: 'פשוט וטעים', duration: '5 דקות', emoji: '🥑', steps: ['לקלות לחם', 'למעוך אבוקדו', 'למרוח ולתבל'] },
      { title: 'פסטה ברוטב עגבניות', level: 'בינוני', levelColor: 'bg-amber-100 text-amber-700', description: 'ארוחה שלמה', duration: '25 דקות', emoji: '🍝', steps: ['לבשל פסטה', 'לטגן בצל ושום', 'להוסיף רסק עגבניות', 'לערבב ולהגיש'] },
    ],
  },
};

export function getActivityContent(name: string): ActivityContent | null {
  return activityContentMap[name] || null;
}
