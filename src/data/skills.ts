import type { Skill, EmotionalState } from './resetTypes';

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
    id: 'stop', name: 'STOP', englishName: 'Stop, Take a step back, Observe, Proceed mindfully',
    description: 'עצור, קח צעד אחורה, שים לב למה שקורה ופעל בצורה מודעת.',
    category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '1-2 דקות',
    steps: [
      { letter: 'S', title: 'Stop – עצור', description: 'עצור את מה שאתה עושה. אל תגיב עדיין.' },
      { letter: 'T', title: 'Take a step back – קח צעד אחורה', description: 'קח נשימה. תן לעצמך רגע לפני שאתה מגיב.', hasAnimation: 'breathing-circle' },
      { letter: 'O', title: 'Observe – שים לב', description: 'מה אתה מרגיש בגוף? מה עובר לך בראש? מה קורה סביבך?' },
      { letter: 'P', title: 'Proceed – פעל בצורה מודעת', description: 'עכשיו בחר תגובה שמתאימה למה שבאמת חשוב לך.' },
    ],
  },
  {
    id: 'tipp', name: 'TIPP', englishName: 'Temperature, Intense Exercise, Paced Breathing, Paired Muscle Relaxation',
    description: 'ויסות מהיר דרך הגוף: שינוי טמפרטורה, תנועה, נשימה והרפיית שרירים.',
    category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '2-5 דקות',
    steps: [
      { letter: 'T', title: 'שינוי טמפרטורה', description: 'שטוף את הפנים במים קרים, החזק קוביית קרח ביד, או שים מגבת קרה על הפנים.', hasAnimation: 'temperature' },
      { letter: 'I', title: 'תרגיל גופני אינטנסיבי', description: 'עשה 20 סקוואטים, רוץ במקום דקה, עשה ג׳אמפינג ג׳ק.', hasAnimation: 'exercise' },
      { letter: 'P', title: 'נשימה מווסתת', description: 'שאף ל-4 שניות, עצור ל-4 שניות, נשוף ל-6 שניות.', hasAnimation: 'breathing-circle' },
      { letter: 'P', title: 'הרפיית שרירים וכיווץ', description: 'כווץ את שתי הידיים לאגרוף חזק ל-5 שניות, ואז שחרר.', hasAnimation: 'fist-clench' },
    ],
  },
  {
    id: 'check-facts', name: 'Check the Facts', englishName: 'בדיקת עובדות',
    description: 'בדיקת עובדות מול פרשנות.',
    category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '3-5 דקות', hasWritingMode: true,
    steps: [
      { letter: '1', title: 'מה קרה בפועל?', description: 'תאר את המצב בעובדות בלבד.' },
      { letter: '2', title: 'מה סיפרתי לעצמי?', description: 'מה חשבת שזה אומר? שים לב להבדל בין עובדה לפרשנות.' },
      { letter: '3', title: 'יש הסבר אחר?', description: 'חשוב על 2-3 הסברים אפשריים אחרים.' },
      { letter: '4', title: 'מה הצעד הנכון?', description: 'על סמך העובדות – מה הדבר הנכון לעשות עכשיו?' },
    ],
  },
  {
    id: 'opposite-action', name: 'Opposite Action', englishName: 'פעולה הפוכה',
    description: 'בחירה בפעולה הפוכה לדחף הלא-מועיל.',
    category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '2-3 דקות',
    steps: [
      { letter: '1', title: 'זהה את הדחף', description: 'מה הדחף? כעס → לצעוק. עצב → להסתגר. חרדה → לברוח.', hasAnimation: 'flip' },
      { letter: '2', title: 'האם הדחף מועיל?', description: 'אם תעשה מה שהדחף אומר – זה ישפר או יחמיר?' },
      { letter: '3', title: 'עשה הפוך', description: 'כעס → דבר בשקט. עצב → צא החוצה. חרדה → גש למצב בהדרגה.' },
      { letter: '4', title: 'תתמסר לזה', description: 'עשה את הפעולה ההפוכה במלוא הכוח.' },
    ],
  },
  {
    id: 'dear-man', name: 'DEAR MAN', englishName: 'Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate',
    description: 'דרך ברורה ומכבדת לבקש, להסביר, ולעמוד על מה שחשוב לך.',
    category: 'communication', categoryLabel: 'תקשורת', estimatedTime: '5-7 דקות', hasWritingMode: true,
    steps: [
      { letter: 'D', title: 'תאר – Describe', description: 'תאר את המצב בעובדות בלבד.' },
      { letter: 'E', title: 'בטא – Express', description: 'בטא את מה שאתה מרגיש.' },
      { letter: 'A', title: 'בקש – Assert', description: 'בקש בבירור את מה שאתה צריך.' },
      { letter: 'R', title: 'חזק – Reinforce', description: 'הסבר למה זה טוב לשני הצדדים.' },
      { letter: 'M', title: 'הישאר ממוקד – Mindful', description: 'אל תיסחף לנושאים אחרים.' },
      { letter: 'A', title: 'הקרן ביטחון – Appear confident', description: 'שמור על קשר עין ודבר בקול ברור.' },
      { letter: 'N', title: 'נהל משא ומתן – Negotiate', description: 'היה מוכן לפשרה.' },
    ],
  },
  {
    id: 'give', name: 'GIVE', englishName: 'Gentle, Interested, Validate, Easy manner',
    description: 'תקשורת נעימה ששומרת על הקשר.',
    category: 'communication', categoryLabel: 'תקשורת', estimatedTime: '2-3 דקות',
    steps: [
      { letter: 'G', title: 'עדינות – Gentle', description: 'דבר בנחת, בלי התקפות.' },
      { letter: 'I', title: 'גלה עניין – Interested', description: 'הקשב באמת למה שהצד השני אומר.' },
      { letter: 'V', title: 'תקף – Validate', description: 'הראה שאתה מבין את הרגש של הצד השני.' },
      { letter: 'E', title: 'קלילות – Easy manner', description: 'שמור על אווירה קלילה.' },
    ],
  },
  {
    id: 'fast', name: 'FAST', englishName: 'Fair, no Apologies, Stick to values, Truthful',
    description: 'לשמור על הכבוד העצמי בתוך תקשורת.',
    category: 'communication', categoryLabel: 'תקשורת', estimatedTime: '2-3 דקות',
    steps: [
      { letter: 'F', title: 'הוגנות – Fair', description: 'היה הוגן גם כלפי עצמך וגם כלפי הצד השני.' },
      { letter: 'A', title: 'בלי התנצלויות מיותרות', description: 'אל תתנצל על כך שיש לך דעה או צורך.' },
      { letter: 'S', title: 'דבק בערכים', description: 'אל תוותר על מה שחשוב לך רק כדי לרצות מישהו.' },
      { letter: 'T', title: 'אמיתיות – Truthful', description: 'היה כנה. אל תגזים ואל תמעיט.' },
    ],
  },
  {
    id: 'wise-mind', name: 'Wise Mind', englishName: 'מוח חכם',
    description: 'איזון בין רגש לחשיבה.',
    category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '2-3 דקות',
    steps: [
      { letter: '1', title: 'מה זה מוח חכם?', description: 'מוח חכם הוא המקום שבו הרגש וההיגיון נפגשים.', hasAnimation: 'balance' },
      { letter: '2', title: 'זהה – באיזה מוח אתה עכשיו?', description: 'מוח רגשי? מוח רציונלי? שים לב.' },
      { letter: '3', title: 'דוגמה מעשית', description: 'חבר ביטל תוכנית. רגשי: "לא אכפת לו!" רציונלי: "קורה." חכם: "אני מאוכזב אבל אשאל מה קרה."' },
      { letter: '4', title: 'תרגול – מצא את המוח החכם', description: 'חשוב על מצב מטריד. מה כל מוח אומר?' },
    ],
  },
  {
    id: 'self-soothing', name: 'Self Soothing', englishName: 'הרגעה עצמית',
    description: 'הרגעה דרך החושים.',
    category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '3-5 דקות',
    steps: [
      { letter: '👁', title: 'ראייה', description: 'מצא 3 דברים יפים או מרגיעים סביבך.', hasAnimation: 'senses-0' },
      { letter: '👂', title: 'שמיעה', description: 'הקשב לצליל מרגיע.', hasAnimation: 'senses-1' },
      { letter: '👃', title: 'ריח', description: 'הרח משהו נעים.', hasAnimation: 'senses-2' },
      { letter: '👅', title: 'טעם', description: 'טעם משהו לאט ובמודעות.', hasAnimation: 'senses-3' },
      { letter: '✋', title: 'מגע', description: 'גע במשהו נעים.', hasAnimation: 'senses-4' },
    ],
  },
  {
    id: 'pros-cons', name: 'Pros and Cons', englishName: 'יתרונות וחסרונות',
    description: 'יתרונות וחסרונות לפני פעולה.',
    category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '3-5 דקות', hasWritingMode: true,
    steps: [
      { letter: '1', title: 'מה הדחף?', description: 'מה אתה רוצה לעשות עכשיו?' },
      { letter: '2', title: 'יתרונות של לפעול', description: 'מה תרוויח?' },
      { letter: '3', title: 'חסרונות של לפעול', description: 'מה המחיר?' },
      { letter: '4', title: 'החלטה מודעת', description: 'מה ההחלטה החכמה?' },
    ],
  },
  {
    id: 'accepts', name: 'ACCEPTS',
    description: 'דרכים לעבור רגע קשה בלי להחמיר אותו.',
    category: 'acceptance', categoryLabel: 'קבלה', estimatedTime: '5-10 דקות',
    steps: [
      { letter: 'A', title: 'פעילות – Activities', description: 'עשה משהו שתופס את תשומת הלב.' },
      { letter: 'C', title: 'תרומה – Contributing', description: 'עשה משהו טוב למישהו אחר.' },
      { letter: 'C', title: 'השוואה – Comparisons', description: 'השווה לרגעים קשים שכבר עברת.' },
      { letter: 'E', title: 'רגש אחר – Emotions', description: 'צור רגש שונה.' },
      { letter: 'P', title: 'דחיקה – Pushing away', description: 'שים את הבעיה בצד לרגע.' },
      { letter: 'T', title: 'מחשבות – Thoughts', description: 'תפוס את המוח במשהו אחר.' },
      { letter: 'S', title: 'תחושות – Sensations', description: 'תחושה גופנית חזקה מסיחה מהכאב.' },
    ],
  },
  {
    id: 'please', name: 'PLEASE',
    description: 'דאגה לגוף כדי להפחית פגיעות רגשית.',
    category: 'acceptance', categoryLabel: 'קבלה', estimatedTime: '2-3 דקות',
    steps: [
      { letter: 'PL', title: 'בריאות גופנית', description: 'דאג לעצמך: רופא, תרופות, טיפול בכאבים.' },
      { letter: 'E', title: 'אכילה מאוזנת', description: 'אכול ארוחות סדירות ומזינות.' },
      { letter: 'A', title: 'הימנע מחומרים', description: 'הימנע מאלכוהול, סמים וחומרים שמשנים מצב רוח.' },
      { letter: 'S', title: 'שינה מאוזנת', description: 'שמור על שעות שינה קבועות.' },
      { letter: 'E', title: 'פעילות גופנית', description: 'זוז כל יום! 20 דקות תנועה משפרות מצב רוח.' },
    ],
  },
  {
    id: 'radical-acceptance', name: 'Radical Acceptance', englishName: 'קבלה רדיקלית',
    description: 'קבלה של מצב שלא ניתן לשנות כרגע.',
    category: 'acceptance', categoryLabel: 'קבלה', estimatedTime: '3-5 דקות',
    steps: [
      { letter: '1', title: 'זהה את המציאות', description: 'מה המצב שאתה לא יכול לשנות עכשיו?' },
      { letter: '2', title: 'שחרר את המלחמה', description: 'קבלה לא אומרת הסכמה, אלא הפסקת מאבק.' },
      { letter: '3', title: 'קבל עם הגוף', description: 'שחרר מתח, הרפה כתפיים, נשום עמוק.' },
      { letter: '4', title: 'בחר להמשיך הלאה', description: 'מה אני כן יכול לעשות עכשיו?' },
    ],
  },
  {
    id: 'problem-solving', name: 'Problem Solving', englishName: 'פתרון בעיות',
    description: 'פתרון בעיה בצעדים קטנים וברורים.',
    category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '5-7 דקות', hasWritingMode: true,
    steps: [
      { letter: '1', title: 'הגדר את הבעיה', description: 'מה בדיוק הבעיה? נסח אותה במשפט אחד.' },
      { letter: '2', title: 'חשוב על פתרונות', description: 'רשום כל פתרון שעולה לך בראש.' },
      { letter: '3', title: 'בחר פתרון', description: 'מה הכי ריאלי ויעיל?' },
      { letter: '4', title: 'עשה צעד ראשון', description: 'מה הצעד הכי קטן שאתה יכול לעשות עכשיו?' },
    ],
  },
  {
    id: 'cope-ahead', name: 'Cope Ahead', englishName: 'הכנה מראש',
    description: 'הכנה מראש למצב שעלול להיות קשה.',
    category: 'thinking', categoryLabel: 'חשיבה', estimatedTime: '3-5 דקות', hasWritingMode: true,
    steps: [
      { letter: '1', title: 'מה צפוי?', description: 'מה המצב שעלול להיות קשה?' },
      { letter: '2', title: 'מה יהיה קשה?', description: 'מה בדיוק עלול להפעיל אותך?' },
      { letter: '3', title: 'תכנן תגובה', description: 'מה תעשה כשזה יקרה?' },
      { letter: '4', title: 'תרגל בדמיון', description: 'דמיין את עצמך מצליח להתמודד.' },
    ],
  },
  {
    id: 'grounding', name: '5-4-3-2-1 Grounding', englishName: 'קרקוע',
    description: 'קרקוע דרך החושים להפחתת הצפה.',
    category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '2-3 דקות',
  },
  {
    id: 'breathing', name: 'נשימה להרגעה',
    description: 'תרגול נשימה מודעת להרגעה מהירה.',
    category: 'calming', categoryLabel: 'הרגעה', estimatedTime: '40 שניות',
  },
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
