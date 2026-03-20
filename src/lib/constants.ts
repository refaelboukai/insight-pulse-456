export const SUBJECTS = [
  'מתמטיקה',
  'עברית',
  'אנגלית',
  'מדעים',
  'היסטוריה',
  'גיאוגרפיה',
  'חינוך גופני',
  'אמנות',
  'מוזיקה',
  'תנ"ך',
  'ספרות',
  'פסיכולוגיה',
  'כישורי חיים',
] as const;

export const ATTENDANCE_LABELS: Record<string, string> = {
  full: 'נוכחות מלאה',
  partial: 'נוכחות חלקית',
  absent: 'חיסור',
};

export const BEHAVIOR_LABELS: Record<string, string> = {
  respectful: 'התנהגות מכבדת / הולמת',
  non_respectful: 'התנהגות לא מכבדת',
  disruptive: 'התנהגות מפריעה',
  violent: 'התנהגות אלימה',
};

export const VIOLENCE_LABELS: Record<string, string> = {
  physical: 'אלימות פיזית',
  verbal: 'אלימות מילולית',
  property_damage: 'נזק לרכוש',
  sexual: 'אלימות מינית',
};

export const PARTICIPATION_LABELS: Record<string, string> = {
  completed_tasks: 'השלים/ה משימות למידה',
  active_participation: 'השתתפות פעילה',
  no_participation: 'ללא השתתפות',
  no_function: 'אין תפקוד לימודי',
};

export const SEVERITY_LABELS: Record<number, string> = {
  1: 'קל מאוד',
  2: 'קל',
  3: 'בינוני',
  4: 'חמור',
  5: 'חמור מאוד',
};

export const PERFORMANCE_LABELS: Record<number, string> = {
  1: 'נמוך מאוד',
  2: 'נמוך',
  3: 'בינוני',
  4: 'טוב',
  5: 'מצוין',
};

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  violence: 'אלימות',
  bullying: 'בריונות',
  medical: 'רפואי',
  safety: 'בטיחות',
  other: 'אחר',
};

export const ABSENCE_REASON_LABELS: Record<string, string> = {
  illness: 'מחלה',
  vacation: 'חופשה',
  family_arrangements: 'סידורים משפחתיים',
  medical_checkup: 'בדיקות רפואיות',
  emotional_difficulty: 'קושי תפקודי - רגשי',
  school_suspension: 'הרחקה מבית הספר',
  other: 'אחר',
};
