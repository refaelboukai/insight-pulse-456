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
  aiType?: 'books' | 'cooking' | 'baking' | 'nature' | 'music';
}

const genericContent: ActivityContent = {
  title: 'איך לעשות את זה',
  emoji: '✨',
  options: [
    {
      title: 'התחל עכשיו',
      level: 'קל',
      levelColor: 'bg-emerald-100 text-emerald-700',
      description: 'פשוט תתחיל, צעד אחד קטן',
      duration: '10 דקות',
      emoji: '🌟',
      steps: ['עצור מה שאתה עושה', 'תתחיל עכשיו', 'תהנה מהתהליך', 'תרגיש טוב שעשית את זה!'],
    },
  ],
};

export function getActivityContent(activityName: string): ActivityContent {
  return genericContent;
}
