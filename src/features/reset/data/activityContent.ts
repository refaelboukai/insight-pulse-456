// Activity-specific content that opens when clicking a schedule item

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

const activityContentMap: Record<string, ActivityContent> = {
  'חדר כושר': {
    title: 'תוכניות אימון',
    emoji: '💪',
    options: [
      {
        title: 'אימון מתחילים',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'אימון קל לחימום הגוף',
        duration: '15 דקות',
        emoji: '🟢',
        steps: ['חימום 3 דקות הליכה במקום', '10 סקוואטים', '10 שכיבות סמיכה על הברכיים', '15 כפיפות בטן', 'מתיחות 3 דקות'],
      },
      {
        title: 'אימון בינוני',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'אימון מאוזן לחיזוק הגוף',
        duration: '25 דקות',
        emoji: '🟡',
        steps: ['חימום 5 דקות ריצה קלה', '15 סקוואטים × 3 סטים', '12 שכיבות סמיכה × 3 סטים', '20 כפיפות בטן × 3 סטים', '10 לאנג\'ים לכל רגל', 'מתיחות 5 דקות'],
      },
      {
        title: 'אימון מתקדם',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'אימון אינטנסיבי למתקדמים',
        duration: '40 דקות',
        emoji: '🔴',
        steps: ['חימום 7 דקות', '20 סקוואטים עם קפיצה × 4 סטים', '20 שכיבות סמיכה × 4 סטים', '30 כפיפות בטן × 4 סטים', '15 בורפי × 3 סטים', 'פלאנק 60 שניות × 3', 'מתיחות 5 דקות'],
      },
    ],
  },
  'לעשות יוגה / פילאטיס': {
    title: 'תרגילי יוגה',
    emoji: '🧘',
    options: [
      {
        title: 'יוגה בוקר רגועה',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'תנוחות פשוטות להתחלת יום',
        duration: '10 דקות',
        emoji: '🌸',
        steps: ['תנוחת ההר (Mountain Pose) - 30 שניות', 'תנוחת הילד (Child\'s Pose) - 45 שניות', 'חתול-פרה (Cat-Cow) - 10 חזרות', 'כלב למטה (Downward Dog) - 30 שניות', 'תנוחת העץ (Tree Pose) - 20 שניות לכל צד', 'שוואסנה - דקה אחת'],
      },
      {
        title: 'זרימת ויניאסה',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'רצף תנועתי עם נשימה',
        duration: '20 דקות',
        emoji: '🌊',
        steps: ['ברכת השמש A - 3 חזרות', 'ברכת השמש B - 3 חזרות', 'לוחם 1 + לוחם 2 - כל צד', 'משולש (Triangle) - 30 שניות לכל צד', 'יונה (Pigeon) - דקה לכל צד', 'גשר (Bridge) - 30 שניות × 3', 'שוואסנה - 3 דקות'],
      },
      {
        title: 'יוגה מתקדמת',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'אתגר גוף ונפש',
        duration: '30 דקות',
        emoji: '🔥',
        steps: ['ברכת שמש מלאה × 5', 'עמידת ידיים על הקיר - 30 שניות', 'לוחם 3 (Warrior 3) - 30 שניות', 'עמידת עורב (Crow) - ניסיון', 'גשר מלא (Wheel) - 20 שניות × 3', 'כתף-עמידה (Shoulder Stand) - דקה', 'מדיטציה 5 דקות'],
      },
    ],
  },
  'לבשל': {
    title: 'מתכונים',
    emoji: '👨‍🍳',
    options: [
      {
        title: 'טוסט אבוקדו מושלם',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'פשוט, טעים ובריא',
        duration: '5 דקות',
        emoji: '🥑',
        steps: ['לקלות פרוסת לחם', 'למעוך חצי אבוקדו', 'למרוח על הלחם', 'להוסיף מלח, פלפל ולימון', 'לקשט עם ביצה עלומה (אופציונלי)'],
      },
      {
        title: 'פסטה ברוטב עגבניות',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'ארוחה שלמה ומשביעה',
        duration: '25 דקות',
        emoji: '🍝',
        steps: ['לבשל פסטה לפי ההוראות', 'לחתוך בצל ושום דק', 'לטגן בשמן זית 3 דקות', 'להוסיף רסק עגבניות ותבלינים', 'לבשל 10 דקות', 'לערבב עם הפסטה ולהגיש'],
      },
      {
        title: 'סטייק עם ירקות בתנור',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'ארוחה מרשימה',
        duration: '45 דקות',
        emoji: '🥩',
        steps: ['לחמם תנור ל-200°', 'לתבל סטייק מלח פלפל ושום', 'לטגן 3 דקות מכל צד', 'לחתוך ירקות עונה', 'לתבל ולפזר בתבנית', 'לצלות 25 דקות', 'להגיש יחד'],
      },
    ],
  },
  'לאפות': {
    title: 'מתכוני אפייה',
    emoji: '🧁',
    options: [
      {
        title: 'עוגיות שוקולד צ\'יפס',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'קלאסיקה אהובה',
        duration: '30 דקות',
        emoji: '🍪',
        steps: ['לערבב חמאה וסוכר', 'להוסיף ביצה ווניל', 'להוסיף קמח ואבקת אפייה', 'לקפל שוקולד צ\'יפס', 'לצנן כדורים על תבנית', 'לאפות 12 דקות ב-180°'],
      },
      {
        title: 'עוגת שוקולד',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'עוגה עשירה ומפנקת',
        duration: '50 דקות',
        emoji: '🎂',
        steps: ['לחמם תנור ל-170°', 'לערבב מרכיבים יבשים', 'לערבב מרכיבים רטובים', 'לשלב הכל בעדינות', 'לשפוך לתבנית משומנת', 'לאפות 35 דקות', 'להכין ציפוי שוקולד'],
      },
      {
        title: 'קרואסונים ביתיים',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'אתגר אפייה מתגמל',
        duration: '3 שעות',
        emoji: '🥐',
        steps: ['להכין בצק שמרים', 'לקרר שעה', 'לגלגל חמאה לריבוע', 'לקפל 3 קיפולים', 'לקרר בין כל קיפול', 'לחתוך משולשים ולגלגל', 'תפיחה שעה ואפייה 15 דקות'],
      },
    ],
  },
  'לצאת לשמש להליכה': {
    title: 'מסלולי הליכה',
    emoji: '🚶',
    options: [
      {
        title: 'הליכה קצרה בשכונה',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'יציאה מהירה לאוויר',
        duration: '15 דקות',
        emoji: '🏘️',
        steps: ['לצאת מהבית', 'ללכת בקצב נוח', 'לשים לב ל-5 דברים יפים', 'לנשום עמוק', 'לחזור הביתה עם חיוך'],
      },
      {
        title: 'הליכה מהירה',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'הליכה עם קצב',
        duration: '30 דקות',
        emoji: '⚡',
        steps: ['חימום 5 דקות הליכה רגילה', 'הליכה מהירה 20 דקות', 'להאזין למוזיקה או פודקאסט', 'צעדים גדולים ונמרצים', 'קירור 5 דקות בהליכה איטית'],
      },
      {
        title: 'הליכה בטבע',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'טיול בפארק או שביל',
        duration: '60 דקות',
        emoji: '🌿',
        steps: ['להכין בקבוק מים', 'לצאת לפארק או שביל', 'הליכה 30 דקות הלוך', 'לעצור לצלם נוף', 'חזרה 30 דקות'],
      },
    ],
  },
  'לעשות מתיחה לגוף': {
    title: 'תרגילי מתיחה',
    emoji: '🤸',
    options: [
      {
        title: 'מתיחת בוקר מהירה',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'מתיחה קלה להתעוררות',
        duration: '5 דקות',
        emoji: '☀️',
        steps: ['סיבוב ראש איטי - 30 שניות', 'מתיחת זרועות למעלה - 20 שניות', 'כיפוף קדימה - 20 שניות', 'מתיחת רגליים ישיבה - 30 שניות לכל צד', 'סיבוב גו - 20 שניות לכל צד'],
      },
      {
        title: 'מתיחה מלאה',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'מתיחה יסודית לכל הגוף',
        duration: '15 דקות',
        emoji: '🧘‍♂️',
        steps: ['מתיחת צוואר - 30 שניות', 'מתיחת כתפיים - 30 שניות', 'מתיחת חזה - 30 שניות', 'מתיחת גב תחתון - 45 שניות', 'מתיחת ירכיים - 45 שניות לכל צד', 'מתיחת שוקיים - 30 שניות', 'מתיחת ישבן - 45 שניות'],
      },
      {
        title: 'גמישות מתקדמת',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'שיפור טווח תנועה',
        duration: '25 דקות',
        emoji: '🏆',
        steps: ['חימום 5 דקות', 'ספגט קדמי - שהייה דקה', 'ספגט צדדי - שהייה דקה', 'גשר מהרצפה - 30 שניות × 3', 'פרפר עמוק - דקה', 'סקוואט עמוק - דקה', 'מתיחה סופית 3 דקות'],
      },
    ],
  },
  'לשמוע מוסיקה': {
    title: 'פלייליסטים',
    emoji: '🎵',
    options: [
      {
        title: 'מוזיקה להרגעה',
        level: 'קל',
        levelColor: 'bg-blue-100 text-blue-700',
        description: 'צלילים רכים ומרגיעים',
        duration: '15 דקות',
        emoji: '😌',
        steps: ['למצוא מקום נוח', 'לעצום עיניים', 'לנשום עמוק ולהרפות', 'להקשיב למוזיקה קלאסית או אמביינט', 'להרגיש את הרוגע'],
      },
      {
        title: 'מוזיקה לאנרגיה',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'שירים עם קצב מעורר',
        duration: '20 דקות',
        emoji: '🎸',
        steps: ['לבחור פלייליסט אנרגטי', 'להזיז את הגוף לפי הקצב', 'לשיר יחד (זה בריא!)', 'לרקוד חופשי', 'ליהנות!'],
      },
      {
        title: 'גילוי מוזיקה חדשה',
        level: 'מתקדם',
        levelColor: 'bg-purple-100 text-purple-700',
        description: 'הרחב את הטעם המוזיקלי',
        duration: '30 דקות',
        emoji: '🌍',
        steps: ['לבחור ז\'אנר חדש', 'להקשיב ל-3 שירים', 'לכתוב מה אהבת', 'לגלות אמן חדש', 'ליצור פלייליסט אישי'],
      },
    ],
  },
  'לקרוא ספר': {
    title: 'אתגרי קריאה',
    emoji: '📖',
    options: [
      {
        title: 'קריאה קצרה',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: '10 דקות שקטות עם ספר',
        duration: '10 דקות',
        emoji: '📚',
        steps: ['למצוא פינה שקטה', 'לבחור ספר שמעניין', 'לקרוא 10 דקות', 'לכתוב משפט אחד שאהבת'],
      },
      {
        title: 'פרק שלם',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'לסיים פרק אחד',
        duration: '30 דקות',
        emoji: '📕',
        steps: ['להכין שתייה חמה', 'לכבות הסחות דעת', 'לקרוא פרק שלם', 'לחשוב על מה קראת'],
      },
      {
        title: 'מרתון קריאה',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'שעה של קריאה רצופה',
        duration: '60 דקות',
        emoji: '🏅',
        steps: ['להכין פינת קריאה נוחה', 'להכין חטיף ושתייה', 'לקרוא שעה ברציפות', 'לכתוב סיכום קצר', 'לספר למישהו על הספר'],
      },
    ],
  },
  'לשחק כדורגל / כדורסל': {
    title: 'תוכניות משחק',
    emoji: '⚽',
    options: [
      {
        title: 'אימון אישי',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'תרגול בסיסי לבד',
        duration: '15 דקות',
        emoji: '🏀',
        steps: ['חימום 3 דקות', 'כדרור 5 דקות', 'זריקות/בעיטות לשער', 'שליטה בכדור', 'מתיחות'],
      },
      {
        title: 'אימון עם חבר',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'תרגול בזוגות',
        duration: '30 דקות',
        emoji: '🤝',
        steps: ['חימום משותף', 'מסירות הדדיות', 'משחקון 1 על 1', 'אתגר זריקות/בעיטות', 'מתיחות ביחד'],
      },
      {
        title: 'משחק מלא',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'לארגן משחק קבוצתי',
        duration: '60 דקות',
        emoji: '🏆',
        steps: ['לאסוף שחקנים', 'חימום קבוצתי', 'לחלק קבוצות', 'משחק 2 מחציות', 'סיכום ומתיחות'],
      },
    ],
  },
  'לשתות כוס מים': {
    title: 'אתגר שתייה',
    emoji: '💧',
    options: [
      {
        title: 'כוס מים עכשיו',
        level: 'קל',
        levelColor: 'bg-blue-100 text-blue-700',
        description: 'שתייה מיידית',
        duration: 'דקה',
        emoji: '🥤',
        steps: ['קום ולך למטבח', 'מלא כוס מים', 'שתה לאט', 'הרגש את הרעננות'],
      },
    ],
  },
  'לעשות נשימות להרגעה': {
    title: 'תרגילי נשימה',
    emoji: '🫁',
    options: [
      {
        title: 'נשימה 4-4-4',
        level: 'קל',
        levelColor: 'bg-blue-100 text-blue-700',
        description: 'נשימת קופסה קלאסית',
        duration: '3 דקות',
        emoji: '🌬️',
        steps: ['שב בנוח', 'שאף 4 שניות', 'עצור 4 שניות', 'נשוף 4 שניות', 'חזור 6 פעמים'],
      },
      {
        title: 'נשימה 4-7-8',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'נשימה מרגיעה עמוקה',
        duration: '5 דקות',
        emoji: '🧘',
        steps: ['מצא מקום שקט', 'שאף דרך האף 4 שניות', 'החזק 7 שניות', 'נשוף דרך הפה 8 שניות', 'חזור 8 פעמים'],
      },
      {
        title: 'נשימה דיאפרגמטית',
        level: 'מתקדם',
        levelColor: 'bg-purple-100 text-purple-700',
        description: 'נשימה עמוקה מהבטן',
        duration: '10 דקות',
        emoji: '🌊',
        steps: ['שכב על הגב', 'שים יד על הבטן', 'נשום כך שהיד עולה', 'נשוף לאט', 'הרגש את הגוף נרגע', 'המשך 10 דקות'],
      },
    ],
  },
  'לצייר / להכין יצירה': {
    title: 'רעיונות ליצירה',
    emoji: '🎨',
    options: [
      {
        title: 'ציור חופשי',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'פשוט לצייר מה שבא',
        duration: '15 דקות',
        emoji: '✏️',
        steps: ['להוציא דף ועט/עפרון', 'לצייר בלי לחשוב', 'לא משנה התוצאה', 'ליהנות מהתהליך'],
      },
      {
        title: 'ציור מודרך',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'לצייר לפי נושא',
        duration: '30 דקות',
        emoji: '🖌️',
        steps: ['לבחור נושא (נוף/דמות/חפץ)', 'סקיצה קלה בעיפרון', 'להוסיף פרטים', 'לצבוע', 'לחתום ולתלות!'],
      },
      {
        title: 'פרויקט יצירה',
        level: 'מתקדם',
        levelColor: 'bg-red-100 text-red-700',
        description: 'יצירה מורכבת',
        duration: '60 דקות',
        emoji: '🎭',
        steps: ['לבחור טכניקה (צבעי מים/קולאז\'/פיסול)', 'להכין חומרים', 'לתכנן את היצירה', 'ליצור שלב אחרי שלב', 'לתת לזה להתייבש', 'לצלם ולשתף!'],
      },
    ],
  },
  'ללמוד משהו חדש': {
    title: 'רעיונות ללמידה',
    emoji: '🧠',
    options: [
      {
        title: 'סרטון קצר',
        level: 'קל',
        levelColor: 'bg-emerald-100 text-emerald-700',
        description: 'ללמוד מסרטון של 5 דקות',
        duration: '10 דקות',
        emoji: '📱',
        steps: ['לבחור נושא מעניין', 'לצפות בסרטון קצר', 'לכתוב 3 דברים שלמדת'],
      },
      {
        title: 'שיעור אונליין',
        level: 'בינוני',
        levelColor: 'bg-amber-100 text-amber-700',
        description: 'שיעור מקוון בנושא חדש',
        duration: '30 דקות',
        emoji: '💻',
        steps: ['לבחור פלטפורמה (YouTube/Khan Academy)', 'לצפות בשיעור', 'לתרגל לבד', 'לסכם מה למדת'],
      },
    ],
  },
  'להתקשר למשפחה': {
    title: 'רעיונות לשיחה',
    emoji: '📞',
    options: [
      {
        title: 'שיחה קצרה',
        level: 'קל',
        levelColor: 'bg-pink-100 text-pink-700',
        description: 'רק להגיד שלום',
        duration: '5 דקות',
        emoji: '💕',
        steps: ['לבחור למי להתקשר', 'להגיד שלום ולשאול מה שלומם', 'לספר משהו טוב מהיום', 'לסיים עם "אני אוהב/ת אותך"'],
      },
    ],
  },
  'להתקשר לחבר או חברה טובה': {
    title: 'רעיונות לשיחה עם חברים',
    emoji: '🤗',
    options: [
      {
        title: 'שיחת עדכון',
        level: 'קל',
        levelColor: 'bg-pink-100 text-pink-700',
        description: 'לעדכן ולהתעדכן',
        duration: '10 דקות',
        emoji: '💬',
        steps: ['להתקשר או לשלוח הודעה', 'לשאול מה נשמע', 'לספר משהו מצחיק', 'לקבוע מתי נפגשים'],
      },
    ],
  },
};

// Generic fallback for items without specific content
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

// Map activity names to AI types for dynamic content
const aiTypeMap: Record<string, 'books' | 'cooking' | 'baking' | 'nature' | 'music'> = {
  'לקרוא ספר': 'books',
  'לבשל': 'cooking',
  'לאפות': 'baking',
  'לצאת לטבע': 'nature',
  'לצאת לשמש להליכה': 'nature',
  'ללכת לים': 'nature',
  'לשמוע מוסיקה': 'music',
};

export function getActivityContent(activityName: string): ActivityContent {
  const content = activityContentMap[activityName] || genericContent;
  const aiType = aiTypeMap[activityName];
  return aiType ? { ...content, aiType } : content;
}
