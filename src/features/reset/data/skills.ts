import { Skill, EmotionalState } from '@reset/types';

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
    id: 'stop',
    name: 'STOP',
    englishName: 'Stop, Take a step back, Observe, Proceed mindfully',
    description: 'עצור, קח צעד אחורה, שים לב למה שקורה ופעל בצורה מודעת.',
    category: 'calming',
    categoryLabel: 'הרגעה',
    estimatedTime: '1-2 דקות',
    steps: [
      { letter: 'S', title: 'Stop – עצור', description: 'עצור את מה שאתה עושה. אל תגיב עדיין.' },
      { letter: 'T', title: 'Take a step back – קח צעד אחורה', description: 'קח נשימה. תן לעצמך רגע לפני שאתה מגיב.', hasAnimation: 'breathing-circle' },
      { letter: 'O', title: 'Observe – שים לב', description: 'מה אתה מרגיש בגוף? מה עובר לך בראש? מה קורה סביבך?' },
      { letter: 'P', title: 'Proceed – פעל בצורה מודעת', description: 'עכשיו בחר תגובה שמתאימה למה שבאמת חשוב לך.' },
    ],
  },
  {
    id: 'tipp',
    name: 'TIPP',
    englishName: 'Temperature, Intense Exercise, Paced Breathing, Paired Muscle Relaxation',
    description: 'ויסות מהיר דרך הגוף: שינוי טמפרטורה, תנועה, נשימה והרפיית שרירים.',
    category: 'calming',
    categoryLabel: 'הרגעה',
    estimatedTime: '2-5 דקות',
    steps: [
      {
        letter: 'T',
        title: 'שינוי טמפרטורה',
        description: 'שטוף את הפנים במים קרים, החזק קוביית קרח ביד, או שים מגבת קרה על הפנים. השינוי בטמפרטורה עוזר לגוף להירגע מיד.',
        hasAnimation: 'temperature',
      },
      {
        letter: 'I',
        title: 'תרגיל גופני אינטנסיבי',
        description: 'עשה 20 סקוואטים, רוץ במקום דקה, עשה ג׳אמפינג ג׳ק או כל תנועה חזקה. תנועה אינטנסיבית משחררת מתח ומפחיתה עוררות רגשית.',
        hasAnimation: 'exercise',
      },
      {
        letter: 'P',
        title: 'נשימה מווסתת',
        description: 'שאף לאט דרך האף ל-4 שניות, עצור ל-4 שניות, נשוף לאט דרך הפה ל-6 שניות. חזור על זה 4-5 פעמים. הנשיפה הארוכה מרגיעה את מערכת העצבים.',
        hasAnimation: 'breathing-circle',
      },
      {
        letter: 'P',
        title: 'הרפיית שרירים וכיווץ',
        description: 'כווץ את שתי הידיים לאגרוף חזק ל-5 שניות, ואז שחרר בבת אחת תוך נשיפה. הרגש את ההבדל בין מתח לרפיון. חזור עם אזורים שונים בגוף.',
        hasAnimation: 'fist-clench',
      },
    ],
  },
  {
    id: 'check-facts',
    name: 'Check the Facts',
    englishName: 'בדיקת עובדות',
    description: 'בדיקת עובדות מול פרשנות.',
    category: 'thinking',
    categoryLabel: 'חשיבה',
    estimatedTime: '3-5 דקות',
    hasWritingMode: true,
    steps: [
      {
        letter: '1',
        title: 'מה קרה בפועל?',
        description: 'תאר את המצב בעובדות בלבד – מה ראית, שמעת או קרה. בלי פרשנות.',
      },
      {
        letter: '2',
        title: 'מה סיפרתי לעצמי?',
        description: 'מה חשבת שזה אומר? איזה סיפור בנית בראש? שים לב להבדל בין עובדה לפרשנות.',
      },
      {
        letter: '3',
        title: 'יש הסבר אחר?',
        description: 'חשוב על 2-3 הסברים אפשריים אחרים למה שקרה. לא כל מה שאנחנו חושבים הוא האמת.',
      },
      {
        letter: '4',
        title: 'מה הצעד הנכון?',
        description: 'על סמך העובדות (ולא הפרשנות) – מה הדבר הנכון לעשות עכשיו?',
      },
    ],
  },
  {
    id: 'opposite-action',
    name: 'Opposite Action',
    englishName: 'פעולה הפוכה',
    description: 'בחירה בפעולה הפוכה לדחף הלא-מועיל.',
    category: 'thinking',
    categoryLabel: 'חשיבה',
    estimatedTime: '2-3 דקות',
    steps: [
      {
        letter: '1',
        title: 'זהה את הדחף',
        description: 'מה הדחף? כעס → לצעוק. עצב → להסתגר. חרדה → לברוח. בושה → להתחבא.',
        hasAnimation: 'flip',
      },
      {
        letter: '2',
        title: 'האם הדחף מועיל?',
        description: 'אם תעשה מה שהדחף אומר – זה ישפר או יחמיר את המצב?',
      },
      {
        letter: '3',
        title: 'עשה הפוך',
        description: 'כעס → דבר בשקט. עצב → צא החוצה. חרדה → גש למצב בהדרגה. בושה → שתף מישהו.',
      },
      {
        letter: '4',
        title: 'תתמסר לזה',
        description: 'עשה את הפעולה ההפוכה במלוא הכוח – גם בגוף, בקול וביציבה.',
      },
    ],
  },
  {
    id: 'dear-man',
    name: 'DEAR MAN',
    englishName: 'Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate',
    description: 'דרך ברורה ומכבדת לבקש, להסביר, ולעמוד על מה שחשוב לך.',
    category: 'communication',
    categoryLabel: 'תקשורת',
    estimatedTime: '5-7 דקות',
    hasWritingMode: true,
    steps: [
      {
        letter: 'D',
        title: 'תאר – Describe',
        description: 'תאר את המצב בעובדות בלבד, בלי שיפוטיות. מה קרה? מתי? איפה?',
      },
      {
        letter: 'E',
        title: 'בטא – Express',
        description: 'בטא את מה שאתה מרגיש לגבי המצב. השתמש במשפטי "אני מרגיש..."',
      },
      {
        letter: 'A',
        title: 'בקש – Assert',
        description: 'בקש בבירור את מה שאתה צריך או רוצה. תהיה ישיר אבל מכבד.',
      },
      {
        letter: 'R',
        title: 'חזק – Reinforce',
        description: 'הסבר למה זה טוב לשני הצדדים. מה ירוויח הצד השני אם יעזור?',
      },
      {
        letter: 'M',
        title: 'הישאר ממוקד – Mindful',
        description: 'אל תיסחף לנושאים אחרים. חזור לנקודה המרכזית אם השיחה סוטה.',
      },
      {
        letter: 'A',
        title: 'הקרן ביטחון – Appear confident',
        description: 'שמור על קשר עין, דבר בקול ברור, עמוד ביציבה זקופה.',
      },
      {
        letter: 'N',
        title: 'נהל משא ומתן – Negotiate',
        description: 'היה מוכן לפשרה. חשוב על פתרון שעובד לשני הצדדים.',
      },
    ],
  },
  {
    id: 'give',
    name: 'GIVE',
    englishName: 'Gentle, Interested, Validate, Easy manner',
    description: 'תקשורת נעימה ששומרת על הקשר.',
    category: 'communication',
    categoryLabel: 'תקשורת',
    estimatedTime: '2-3 דקות',
    steps: [
      {
        letter: 'G',
        title: 'עדינות – Gentle',
        description: 'דבר בנחת, בלי התקפות, איומים או שיפוטיות. שמור על טון רגוע ומכבד גם כשקשה.',
      },
      {
        letter: 'I',
        title: 'גלה עניין – Interested',
        description: 'הקשב באמת למה שהצד השני אומר. שאל שאלות, תן לו לדבר, אל תקטע.',
      },
      {
        letter: 'V',
        title: 'תקף – Validate',
        description: 'הראה שאתה מבין את הרגש של הצד השני. "אני מבין למה אתה מרגיש ככה" – גם אם אתה לא מסכים.',
      },
      {
        letter: 'E',
        title: 'קלילות – Easy manner',
        description: 'שמור על אווירה קלילה. חיוך, הומור עדין, גישה נינוחה – עוזרים לשיחה להיות פרודוקטיבית.',
      },
    ],
  },
  {
    id: 'fast',
    name: 'FAST',
    englishName: 'Fair, no Apologies, Stick to values, Truthful',
    description: 'לשמור על הכבוד העצמי בתוך תקשורת עם אחרים.',
    category: 'communication',
    categoryLabel: 'תקשורת',
    estimatedTime: '2-3 דקות',
    steps: [
      {
        letter: 'F',
        title: 'הוגנות – Fair',
        description: 'היה הוגן גם כלפי עצמך וגם כלפי הצד השני. אל תוותר על הצרכים שלך, אבל גם אל תדרוס את האחר.',
      },
      {
        letter: 'A',
        title: 'בלי התנצלויות מיותרות – no Apologies',
        description: 'אל תתנצל על כך שיש לך דעה, צורך או בקשה. התנצל רק כשבאמת עשית משהו לא בסדר.',
      },
      {
        letter: 'S',
        title: 'דבק בערכים – Stick to values',
        description: 'אל תוותר על מה שחשוב לך רק כדי לרצות מישהו. דע מה הערכים שלך ועמוד מאחוריהם.',
      },
      {
        letter: 'T',
        title: 'אמיתיות – Truthful',
        description: 'היה כנה. אל תגזים, אל תמעיט, ואל תשקר. אמירת האמת שומרת על הכבוד העצמי שלך.',
      },
    ],
  },
  {
    id: 'wise-mind',
    name: 'Wise Mind',
    englishName: 'מוח חכם',
    description: 'איזון בין רגש לחשיבה.',
    category: 'thinking',
    categoryLabel: 'חשיבה',
    estimatedTime: '2-3 דקות',
    steps: [
      {
        letter: '1',
        title: 'מה זה מוח חכם?',
        description: 'לכל אחד יש שני "מוחות": מוח רגשי (מה שאני מרגיש) ומוח רציונלי (מה שאני חושב). מוח חכם הוא המקום שבו שניהם נפגשים – הוא לא מתעלם מהרגש ולא מתעלם מההיגיון.',
        hasAnimation: 'balance',
      },
      {
        letter: '2',
        title: 'זהה – באיזה מוח אתה עכשיו?',
        description: 'מוח רגשי: "אני חייב לעשות את זה עכשיו!", "אני לא יכול לסבול את זה!"\nמוח רציונלי: "זה לא הגיוני להתעצבן", "סטטיסטית זה לא משנה"\nשים לב – האם אתה נוטה לאחד מהם יותר מדי?',
      },
      {
        letter: '3',
        title: 'דוגמה מעשית',
        description: 'נגיד שחבר ביטל תוכנית ברגע האחרון.\n🧡 מוח רגשי: "הוא לא אכפת לו ממני! אני כועס!"\n🧠 מוח רציונלי: "אנשים מבטלים, זה קורה, לא נורא"\n⭐ מוח חכם: "אני מאוכזב וזה בסדר. אבל אולי יש לו סיבה. אשאל אותו מה קרה לפני שאני מגיב."',
      },
      {
        letter: '4',
        title: 'תרגול – מצא את המוח החכם שלך',
        description: 'חשוב על מצב שמטריד אותך עכשיו. כתוב או חשוב:\n1. מה המוח הרגשי אומר?\n2. מה המוח הרציונלי אומר?\n3. מה המוח החכם היה אומר?\nהתשובה של המוח החכם בדרך כלל מרגישה "נכונה" – היא מכבדת גם את הרגש וגם את ההיגיון.',
      },
    ],
  },
  {
    id: 'self-soothing',
    name: 'Self Soothing',
    englishName: 'הרגעה עצמית',
    description: 'הרגעה דרך החושים.',
    category: 'calming',
    categoryLabel: 'הרגעה',
    estimatedTime: '3-5 דקות',
    steps: [
      {
        letter: '👁',
        title: 'ראייה',
        description: 'הסתכל סביבך ומצא 3 דברים יפים או מרגיעים. זה יכול להיות צבע שאתה אוהב, תמונה, נוף מהחלון, או סתם אור שמש על הקיר. התמקד בפרטים הקטנים.',
        hasAnimation: 'senses-0',
      },
      {
        letter: '👂',
        title: 'שמיעה',
        description: 'הקשב לצליל מרגיע – שיר שאתה אוהב, צלילי טבע, גשם, או פשוט שקט. אפשר גם לזמזם מנגינה מוכרת. תן לצליל למלא אותך.',
        hasAnimation: 'senses-1',
      },
      {
        letter: '👃',
        title: 'ריח',
        description: 'הרח משהו נעים – סבון, בושם, פרח, קפה, או אוכל טעים. קח נשימה עמוקה דרך האף ושים לב לריח. ריחות מוכרים יכולים להרגיע מיד.',
        hasAnimation: 'senses-2',
      },
      {
        letter: '👅',
        title: 'טעם',
        description: 'טעם משהו לאט ובמודעות – חתיכת שוקולד, כוס תה חם, פרי, או מסטיק. שים לב לכל הטעמים והמרקמים. אל תמהר – תיהנה מכל ביס.',
        hasAnimation: 'senses-3',
      },
      {
        letter: '✋',
        title: 'מגע',
        description: 'גע במשהו נעים – שמיכה רכה, כדור גומי, מים חמים, או פשוט חבק את עצמך. שים לב לתחושה על העור. מגע מרגיע את מערכת העצבים.',
        hasAnimation: 'senses-4',
      },
    ],
  },
  {
    id: 'pros-cons',
    name: 'Pros and Cons',
    englishName: 'יתרונות וחסרונות',
    description: 'יתרונות וחסרונות לפני פעולה.',
    category: 'thinking',
    categoryLabel: 'חשיבה',
    estimatedTime: '3-5 דקות',
    hasWritingMode: true,
    steps: [
      {
        letter: '1',
        title: 'מה הדחף?',
        description: 'מה אתה רוצה לעשות עכשיו? תאר את הפעולה שאתה שוקל.',
      },
      {
        letter: '2',
        title: 'יתרונות של לפעול',
        description: 'מה תרוויח אם תעשה את זה? מה ירגיש טוב בטווח הקצר?',
      },
      {
        letter: '3',
        title: 'חסרונות של לפעול',
        description: 'מה המחיר? מה יכול להשתבש? איך תרגיש אחר כך?',
      },
      {
        letter: '4',
        title: 'החלטה מודעת',
        description: 'הסתכל על התמונה המלאה. מה ההחלטה החכמה – זו שתעזור גם לטווח הארוך?',
      },
    ],
  },
  {
    id: 'accepts',
    name: 'ACCEPTS',
    englishName: 'Activities, Contributing, Comparisons, Emotions, Pushing away, Thoughts, Sensations',
    description: 'דרכים לעבור רגע קשה בלי להחמיר אותו.',
    category: 'acceptance',
    categoryLabel: 'קבלה',
    estimatedTime: '5-10 דקות',
    steps: [
      {
        letter: 'A',
        title: 'פעילות – Activities',
        description: 'עשה משהו שתופס את תשומת הלב: צא להליכה, שחק משחק, צייר, נקה, בשל. הפעילות עוזרת להסיח את הדעת מהרגע הקשה.',
      },
      {
        letter: 'C',
        title: 'תרומה – Contributing',
        description: 'עשה משהו טוב למישהו אחר: עזור לחבר, כתוב הודעה נחמדה, עשה מעשה טוב קטן. לתת לאחרים משפר את ההרגשה שלך.',
      },
      {
        letter: 'C',
        title: 'השוואה – Comparisons',
        description: 'השווה לרגעים קשים שכבר עברת בעבר והצלחת. הזכר לעצמך: "עברתי דברים קשים יותר ושרדתי".',
      },
      {
        letter: 'E',
        title: 'רגש אחר – Emotions',
        description: 'צור רגש שונה: ראה סרטון מצחיק, שמע שיר משמח, קרא משהו מעניין. אפשר להחליף רגש ברגש.',
      },
      {
        letter: 'P',
        title: 'דחיקה – Pushing away',
        description: 'דמיין שאתה שם את הבעיה בקופסה ומניח אותה בצד. תטפל בזה מאוחר יותר – עכשיו אתה לוקח הפסקה.',
      },
      {
        letter: 'T',
        title: 'מחשבות – Thoughts',
        description: 'ספור אחורה מ-100, תכנן את סוף השבוע, פתור חידה. תפוס את המוח במשהו אחר.',
      },
      {
        letter: 'S',
        title: 'תחושות – Sensations',
        description: 'החזק קוביית קרח, שטוף פנים במים קרים, לעוס מסטיק חריף. תחושה גופנית חזקה מסיחה מהכאב הרגשי.',
      },
    ],
  },
  {
    id: 'please',
    name: 'PLEASE',
    englishName: 'Physical health, balanced Eating, avoid mood-Altering substances, balanced Sleep, Exercise',
    description: 'דאגה לגוף כדי להפחית פגיעות רגשית.',
    category: 'acceptance',
    categoryLabel: 'קבלה',
    estimatedTime: '2-3 דקות',
    steps: [
      {
        letter: 'PL',
        title: 'בריאות גופנית – PhysicaL health',
        description: 'דאג לעצמך: לך לרופא כשצריך, קח תרופות אם רשמו לך, טפל בכאבים. גוף בריא = רגש יציב יותר.',
      },
      {
        letter: 'E',
        title: 'אכילה מאוזנת – Eating',
        description: 'אכול ארוחות סדירות ומזינות. אל תדלג על ארוחות ואל תאכל יותר מדי. מה שאתה אוכל משפיע על מה שאתה מרגיש.',
      },
      {
        letter: 'A',
        title: 'הימנע מחומרים – Avoid mood-Altering substances',
        description: 'הימנע מאלכוהול, סמים או חומרים שמשנים מצב רוח. הם נותנים הקלה זמנית אבל מחמירים את הרגש לטווח ארוך.',
      },
      {
        letter: 'S',
        title: 'שינה מאוזנת – Sleep',
        description: 'שמור על שעות שינה קבועות. לא יותר מדי ולא פחות מדי. שינה טובה היא הבסיס לוויסות רגשי.',
      },
      {
        letter: 'E',
        title: 'פעילות גופנית – Exercise',
        description: 'זוז כל יום! הליכה, ריצה, ספורט, ריקוד – 20 דקות של תנועה משפרות את מצב הרוח באופן מיידי.',
      },
    ],
  },
  {
    id: 'radical-acceptance',
    name: 'Radical Acceptance',
    englishName: 'קבלה רדיקלית',
    description: 'קבלה של מצב שלא ניתן לשנות כרגע.',
    category: 'acceptance',
    categoryLabel: 'קבלה',
    estimatedTime: '3-5 דקות',
    steps: [
      {
        letter: '1',
        title: 'זהה את המציאות',
        description: 'מה המצב שאתה לא יכול לשנות עכשיו? אמור לעצמך: "זה מה שקורה. זו העובדה."',
      },
      {
        letter: '2',
        title: 'שחרר את המלחמה',
        description: 'להילחם במציאות לא משנה אותה – רק מגביר את הסבל. קבלה לא אומרת שמסכימים, אלא שמפסיקים להיאבק במה שכבר קרה.',
      },
      {
        letter: '3',
        title: 'קבל עם הגוף',
        description: 'שחרר מתח מהגוף: הרפה כתפיים, פתח ידיים, נשום עמוק. הגוף מחזיק התנגדות – תן לו לשחרר.',
      },
      {
        letter: '4',
        title: 'בחר להמשיך הלאה',
        description: 'שאל את עצמך: "מה אני כן יכול לעשות עכשיו?" קבלה פותחת מקום לפעולה חדשה – צעד קטן קדימה.',
      },
    ],
  },
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    englishName: 'פתרון בעיות',
    description: 'פתרון בעיה בצעדים קטנים וברורים.',
    category: 'thinking',
    categoryLabel: 'חשיבה',
    estimatedTime: '5-7 דקות',
    hasWritingMode: true,
    steps: [
      {
        letter: '1',
        title: 'הגדר את הבעיה',
        description: 'מה בדיוק הבעיה? נסח אותה במשפט אחד ברור וקצר.',
      },
      {
        letter: '2',
        title: 'חשוב על פתרונות',
        description: 'רשום כל פתרון שעולה לך בראש – גם אם הוא נשמע מוזר. כמות לפני איכות.',
      },
      {
        letter: '3',
        title: 'בחר פתרון',
        description: 'מבין הפתרונות – מה הכי ריאלי ויעיל? מה אפשר לעשות עכשיו?',
      },
      {
        letter: '4',
        title: 'עשה צעד ראשון',
        description: 'מה הצעד הכי קטן שאתה יכול לעשות עכשיו? עשה אותו. צעד קטן זה כבר התקדמות.',
      },
    ],
  },
  {
    id: 'cope-ahead',
    name: 'Cope Ahead',
    englishName: 'הכנה מראש',
    description: 'הכנה מראש למצב שעלול להיות קשה.',
    category: 'thinking',
    categoryLabel: 'חשיבה',
    estimatedTime: '3-5 דקות',
    hasWritingMode: true,
    steps: [
      {
        letter: '1',
        title: 'מה צפוי?',
        description: 'מה המצב שעלול להיות קשה? מתי הוא צפוי לקרות?',
      },
      {
        letter: '2',
        title: 'מה יהיה קשה?',
        description: 'מה בדיוק עלול להפעיל אותך? איזה רגש צפוי לעלות?',
      },
      {
        letter: '3',
        title: 'תכנן תגובה',
        description: 'מה תעשה כשזה יקרה? איזה כלי תשתמש? דמיין את עצמך מגיב בצורה טובה.',
      },
      {
        letter: '4',
        title: 'תרגל בדמיון',
        description: 'עצום עיניים ודמיין את כל הסיטואציה – מההתחלה ועד הסוף. ראה את עצמך מצליח להתמודד.',
      },
    ],
  },
  {
    id: 'grounding',
    name: '5-4-3-2-1 Grounding',
    englishName: 'קרקוע',
    description: 'קרקוע דרך החושים להפחתת הצפה.',
    category: 'calming',
    categoryLabel: 'הרגעה',
    estimatedTime: '2-3 דקות',
  },
  {
    id: 'breathing',
    name: 'נשימה להרגעה',
    description: 'תרגול נשימה מודעת להרגעה מהירה.',
    category: 'calming',
    categoryLabel: 'הרגעה',
    estimatedTime: '40 שניות',
  },
];

export function getSkillRecommendations(stateId: string, intensity: number): string[] {
  const high = intensity >= 7;
  const mid = intensity >= 4 && intensity < 7;

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
  'check-facts': [
    'מה קרה בפועל?',
    'מה חשבת שזה אומר?',
    'יכול להיות הסבר אחר?',
    'מה העובדה הכי ברורה כרגע?',
  ],
  'dear-man': [
    'מה קרה?',
    'מה אתה מרגיש?',
    'מה אתה רוצה לבקש?',
    'למה זה חשוב לך?',
    'כתוב משפט קצר שתוכל לומר.',
  ],
  'pros-cons': [
    'אם אפעל מתוך דחף — מה יקרה?',
    'אם אעצור רגע — מה יכול לעזור?',
  ],
  'problem-solving': [
    'מה הבעיה המרכזית?',
    'מה אפשר לעשות עכשיו?',
    'מה הצעד הכי קטן שאפשר לעשות?',
  ],
  'cope-ahead': [
    'מה עלול להיות קשה בהמשך היום?',
    'איך תזהה שזה מתחיל?',
    'מה יעזור לך אם זה יקרה?',
  ],
};
