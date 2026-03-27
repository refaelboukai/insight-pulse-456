import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Brain, ChevronRight, ChevronLeft, Sparkles, Sun, Users, Eye, Clock, Heart, Puzzle } from 'lucide-react';
import { g, type Gender } from '@/lib/genderUtils';

interface LearningStyleQuestionnaireProps {
  studentId: string;
  onComplete?: () => void;
  gender?: Gender;
}

const CATEGORIES = {
  environment: 'סביבת למידה',
  social: 'חברתי',
  sensory: 'חושי',
  time: 'זמן וריכוז',
  emotional: 'רגשי',
  cognitive: 'קוגניטיבי',
};

const CATEGORY_ICONS: Record<string, typeof Brain> = {
  environment: Sun,
  social: Users,
  sensory: Eye,
  time: Clock,
  emotional: Heart,
  cognitive: Puzzle,
};

const CATEGORY_COLORS: Record<string, string> = {
  environment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  social: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  sensory: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  time: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  emotional: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  cognitive: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

type CategoryKey = keyof typeof CATEGORIES;

interface Question {
  category: CategoryKey;
  text: string;
}

// ──────────── 24 שאלות מותאמות זכר ────────────
const QUESTIONS_MALE: Question[] = [
  // סביבה (4)
  { category: 'environment', text: 'אני מתרכז טוב יותר כשיש שקט סביבי' },
  { category: 'environment', text: 'אני אוהב ללמוד בישיבה חופשית (ספה, שטיח, רצפה)' },
  { category: 'environment', text: 'אור חזק עוזר לי ללמוד' },
  { category: 'environment', text: 'אני רגיש לחום או קור בכיתה' },
  // חברתי (4)
  { category: 'social', text: 'אני מעדיף ללמוד לבד על פני קבוצה' },
  { category: 'social', text: 'אני נהנה לעבוד עם חבר בזוג' },
  { category: 'social', text: 'אני צריך שמבוגר יעזור לי להתחיל' },
  { category: 'social', text: 'עבודת צוות נותנת לי אנרגיה' },
  // חושי (4)
  { category: 'sensory', text: 'תמונות ותרשימים עוזרים לי להבין' },
  { category: 'sensory', text: 'אני מבין טוב יותר כששומע הסבר בקול' },
  { category: 'sensory', text: 'אני לומד הכי טוב כשעושה משהו בידיים' },
  { category: 'sensory', text: 'קשה לי לשבת בלי לזוז הרבה זמן' },
  // זמן (4)
  { category: 'time', text: 'בבוקר הראש שלי הכי צלול' },
  { category: 'time', text: 'אני צריך הפסקה קצרה כל כמה דקות' },
  { category: 'time', text: 'אני יכול להתרכז לאורך שיעור שלם' },
  { category: 'time', text: 'דווקא אחה"צ או בערב אני יותר ממוקד' },
  // רגשי (4)
  { category: 'emotional', text: 'אני לומד כי זה מעניין אותי, לא בגלל ציונים' },
  { category: 'emotional', text: 'אני מסיים משימות גם כשקשה לי' },
  { category: 'emotional', text: 'חיזוק מהמורה נותן לי כוח להמשיך' },
  { category: 'emotional', text: 'אני מרגיש שההצלחה בלימודים תלויה בי' },
  // קוגניטיבי (4)
  { category: 'cognitive', text: 'חשוב לי להבין למה לומדים משהו לפני שמתחילים' },
  { category: 'cognitive', text: 'אני אוהב ללמוד צעד אחרי צעד בסדר ברור' },
  { category: 'cognitive', text: 'אני חושב לפני שאני עונה' },
  { category: 'cognitive', text: 'מבנה ברור של השיעור עוזר לי' },
];

// ──────────── 24 שאלות מותאמות נקבה ────────────
const QUESTIONS_FEMALE: Question[] = [
  // סביבה (4)
  { category: 'environment', text: 'אני מתרכזת טוב יותר כשיש שקט סביבי' },
  { category: 'environment', text: 'אני אוהבת ללמוד בישיבה חופשית (ספה, שטיח, רצפה)' },
  { category: 'environment', text: 'אור חזק עוזר לי ללמוד' },
  { category: 'environment', text: 'אני רגישה לחום או קור בכיתה' },
  // חברתי (4)
  { category: 'social', text: 'אני מעדיפה ללמוד לבד על פני קבוצה' },
  { category: 'social', text: 'אני נהנית לעבוד עם חברה בזוג' },
  { category: 'social', text: 'אני צריכה שמבוגר יעזור לי להתחיל' },
  { category: 'social', text: 'עבודת צוות נותנת לי אנרגיה' },
  // חושי (4)
  { category: 'sensory', text: 'תמונות ותרשימים עוזרים לי להבין' },
  { category: 'sensory', text: 'אני מבינה טוב יותר כששומעת הסבר בקול' },
  { category: 'sensory', text: 'אני לומדת הכי טוב כשעושה משהו בידיים' },
  { category: 'sensory', text: 'קשה לי לשבת בלי לזוז הרבה זמן' },
  // זמן (4)
  { category: 'time', text: 'בבוקר הראש שלי הכי צלול' },
  { category: 'time', text: 'אני צריכה הפסקה קצרה כל כמה דקות' },
  { category: 'time', text: 'אני יכולה להתרכז לאורך שיעור שלם' },
  { category: 'time', text: 'דווקא אחה"צ או בערב אני יותר ממוקדת' },
  // רגשי (4)
  { category: 'emotional', text: 'אני לומדת כי זה מעניין אותי, לא בגלל ציונים' },
  { category: 'emotional', text: 'אני מסיימת משימות גם כשקשה לי' },
  { category: 'emotional', text: 'חיזוק מהמורה נותן לי כוח להמשיך' },
  { category: 'emotional', text: 'אני מרגישה שההצלחה בלימודים תלויה בי' },
  // קוגניטיבי (4)
  { category: 'cognitive', text: 'חשוב לי להבין למה לומדים משהו לפני שמתחילים' },
  { category: 'cognitive', text: 'אני אוהבת ללמוד צעד אחרי צעד בסדר ברור' },
  { category: 'cognitive', text: 'אני חושבת לפני שאני עונה' },
  { category: 'cognitive', text: 'מבנה ברור של השיעור עוזר לי' },
];

// Default for calculations
const QUESTIONS = QUESTIONS_MALE;

const EMOJI_SCALE = [
  { emoji: '😕', label: 'בכלל לא', value: 1 },
  { emoji: '🤔', label: 'קצת', value: 2 },
  { emoji: '😐', label: 'ככה ככה', value: 3 },
  { emoji: '🙂', label: 'די נכון', value: 4 },
  { emoji: '😄', label: 'ממש אני!', value: 5 },
];

// Keep old SCALE_LABELS for export compatibility
const SCALE_LABELS = [
  'בכלל לא נכון לי',
  'קצת נכון',
  'בינוני',
  'די נכון',
  'מאוד נכון לי',
];

function calculateResults(responses: Record<number, number>) {
  const categoryScores: Record<CategoryKey, number[]> = {
    environment: [], social: [], sensory: [], time: [], emotional: [], cognitive: [],
  };

  QUESTIONS.forEach((q, i) => {
    if (responses[i] !== undefined) {
      categoryScores[q.category].push(responses[i]);
    }
  });

  const averages: Record<string, number> = {};
  for (const [cat, scores] of Object.entries(categoryScores)) {
    averages[cat] = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;
  }

  const sorted = Object.entries(averages).sort((a, b) => b[1] - a[1]);
  const dominant = sorted.slice(0, 3).map(([k]) => k);
  const secondary = sorted.slice(3).map(([k]) => k);

  const challenges: string[] = [];
  // impulsive vs structured — removed Q28 (was impulsive, now removed)
  // independent (q4 high) + needs guidance (q6 high)
  if ((responses[4] || 0) >= 4 && (responses[6] || 0) >= 4) {
    challenges.push('סתירה: העדפה ללמידה עצמאית לצד צורך בהנחיה');
  }
  // low persistence (q17 emotional) + finishes tasks (q17 high)
  // With new structure: Q16=interest, Q17=persistence, Q18=reinforcement, Q19=self-efficacy
  // No direct contradiction pair needed with new cleaner questions

  const recommendations: string[] = [];
  const catLabels = CATEGORIES;

  if (averages.sensory >= 3.5) {
    if ((responses[10] || 0) >= 4) recommendations.push('שילוב למידה דרך עשייה ותנועה');
    if ((responses[8] || 0) >= 4) recommendations.push('שימוש בעזרים חזותיים: תרשימים, מפות חשיבה');
    if ((responses[9] || 0) >= 4) recommendations.push('שימוש בהקלטות ושיחות כדי לעזור בלמידה');
  }
  if ((responses[13] || 0) >= 4) recommendations.push('שילוב הפסקות קצרות ותכופות');
  if ((responses[18] || 0) >= 4) recommendations.push('מתן חיזוקים חיוביים מידיים');
  if ((responses[23] || 0) >= 4) recommendations.push('הצגת מבנה ברור ושלבים מסודרים');
  if ((responses[20] || 0) >= 4) recommendations.push('הצגת התמונה הגדולה לפני כניסה לפרטים');
  if ((responses[11] || 0) >= 4) recommendations.push('אפשר תנועה במהלך הלמידה');
  if ((responses[7] || 0) >= 4) recommendations.push('עבודה בקבוצות קטנות');
  if ((responses[4] || 0) >= 4) recommendations.push('מתן מרחב ללמידה עצמאית');

  if (recommendations.length === 0) {
    recommendations.push('ליצור סביבה מגוונת שמשלבת ערוצים שונים');
  }

  const dominantLabels = dominant.map(d => catLabels[d as CategoryKey]);
  const studentInsight = `הסגנון הדומיננטי שלך: ${dominantLabels.join(', ')}. ${
    recommendations.slice(0, 2).join('. ')
  }.`;

  return {
    averages,
    dominant,
    secondary,
    challenges,
    recommendations,
    studentInsight,
  };
}

export default function LearningStyleQuestionnaire({ studentId, onComplete, gender }: LearningStyleQuestionnaireProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from('learning_style_profiles')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (data?.is_completed) {
        setIsCompleted(true);
        setResults(data.results);
        setResponses((data.responses as Record<number, number>) || {});
      }
      setChecking(false);
    };
    check();
  }, [studentId]);

  const genderedQuestions = gender === 'נ' ? QUESTIONS_FEMALE : QUESTIONS_MALE;
  const totalQ = genderedQuestions.length;

  const navigateTo = (target: number) => {
    if (animating || target < 0 || target >= totalQ) return;
    setDirection(target > currentQ ? 'next' : 'prev');
    setAnimating(true);
    setTimeout(() => {
      setCurrentQ(target);
      setAnimating(false);
    }, 200);
  };

  const handleAnswer = (value: number) => {
    const newResponses = { ...responses, [currentQ]: value };
    setResponses(newResponses);

    if (currentQ < totalQ - 1) {
      setTimeout(() => navigateTo(currentQ + 1), 300);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length < totalQ) {
      toast.error('יש לענות על כל השאלות');
      return;
    }
    setSaving(true);
    const computedResults = calculateResults(responses);

    const payload = {
      student_id: studentId,
      responses: responses,
      results: computedResults,
      is_completed: true,
      is_visible: true,
    };

    const { error } = await supabase
      .from('learning_style_profiles')
      .upsert(payload, { onConflict: 'student_id' });

    setSaving(false);
    if (error) {
      toast.error('שגיאה בשמירת השאלון');
    } else {
      setResults(computedResults);
      setIsCompleted(true);
      toast.success('השאלון הושלם בהצלחה! 🎉');
      onComplete?.();
    }
  };

  if (checking) return null;

  if (isCompleted && results) {
    return (
      <div className="card-styled rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">סגנון הלמידה שלי</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground bg-primary/5 rounded-xl p-3 border border-primary/10">
          {results.studentInsight}
        </p>
        {results.recommendations && results.recommendations.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">המלצות:</span>
            <ul className="space-y-1">
              {results.recommendations.map((r: string, i: number) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const progress = ((currentQ + 1) / totalQ) * 100;
  const currentQuestion = genderedQuestions[currentQ];
  const allAnswered = Object.keys(responses).length === totalQ;
  const answeredCount = Object.keys(responses).length;
  const CategoryIcon = CATEGORY_ICONS[currentQuestion.category];
  const catColor = CATEGORY_COLORS[currentQuestion.category];

  return (
    <div className="card-styled rounded-2xl p-5 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-lg p-1.5">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-bold text-sm block">סגנון הלמידה שלי</span>
            <span className="text-[10px] text-muted-foreground">{answeredCount}/{totalQ} תשובות</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1">
          <span className="text-xs font-bold text-primary">{currentQ + 1}</span>
          <span className="text-[10px] text-muted-foreground">מתוך {totalQ}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2.5 rounded-full" />
        <div className="flex justify-between">
          {Object.keys(CATEGORIES).map((cat, i) => {
            const startIdx = i * 4;
            const endIdx = startIdx + 4;
            const catAnswered = Object.keys(responses)
              .map(Number)
              .filter(idx => idx >= startIdx && idx < endIdx).length;
            const isCurrentCat = currentQuestion.category === cat;
            return (
              <div
                key={cat}
                className={`h-1 rounded-full flex-1 mx-0.5 transition-colors ${
                  catAnswered === 4 ? 'bg-primary' :
                  isCurrentCat ? 'bg-primary/40' : 'bg-muted'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Category badge */}
      <div className="flex justify-center">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 ${catColor}`}>
          {CategoryIcon && <CategoryIcon className="h-3.5 w-3.5" />}
          {CATEGORIES[currentQuestion.category]}
        </span>
      </div>

      {/* Question with animation */}
      <div
        className={`text-center py-6 min-h-[80px] flex items-center justify-center transition-all duration-200 ${
          animating
            ? direction === 'next'
              ? 'opacity-0 -translate-x-4'
              : 'opacity-0 translate-x-4'
            : 'opacity-100 translate-x-0'
        }`}
      >
        <p className="font-semibold text-base leading-relaxed px-2">{currentQuestion.text}</p>
      </div>

      {/* Emoji scale */}
      <div className="flex justify-center gap-2 py-2">
        {EMOJI_SCALE.map(({ emoji, label, value }) => {
          const isSelected = responses[currentQ] === value;
          return (
            <button
              key={value}
              onClick={() => handleAnswer(value)}
              className={`flex flex-col items-center gap-1 rounded-xl p-2.5 min-w-[56px] transition-all duration-200 active:scale-95 ${
                isSelected
                  ? 'bg-primary/15 ring-2 ring-primary scale-110 shadow-md'
                  : 'bg-muted/50 hover:bg-muted hover:scale-105'
              }`}
            >
              <span className={`text-2xl transition-transform duration-200 ${isSelected ? 'scale-110' : ''}`}>
                {emoji}
              </span>
              <span className={`text-[10px] font-medium leading-tight ${
                isSelected ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dot indicators for quick navigation */}
      <div className="flex justify-center gap-1 py-1">
        {Array.from({ length: totalQ }).map((_, i) => (
          <button
            key={i}
            onClick={() => navigateTo(i)}
            className={`rounded-full transition-all duration-200 ${
              i === currentQ
                ? 'w-4 h-2 bg-primary'
                : responses[i] !== undefined
                  ? 'w-2 h-2 bg-primary/40'
                  : 'w-2 h-2 bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentQ === 0}
          onClick={() => navigateTo(currentQ - 1)}
          className="gap-1"
        >
          <ChevronRight className="h-4 w-4" />
          הקודם
        </Button>

        {currentQ < totalQ - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={responses[currentQ] === undefined}
            onClick={() => navigateTo(currentQ + 1)}
            className="gap-1"
          >
            הבא
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : allAnswered ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving}
            className="gap-1.5 btn-primary-gradient"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {saving ? 'שומר...' : 'סיימתי! 🎉'}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{g(gender, 'ענה', 'עני')} על כל השאלות</span>
        )}
      </div>
    </div>
  );
}

export { CATEGORIES, QUESTIONS, SCALE_LABELS, calculateResults };
