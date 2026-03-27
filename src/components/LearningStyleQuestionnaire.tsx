import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Brain, ChevronRight, ChevronLeft, Sparkles, RotateCcw } from 'lucide-react';
import { g, type Gender } from '@/lib/genderUtils';

interface LearningStyleQuestionnaireProps {
  studentId: string;
  onComplete?: () => void;
  gender?: Gender;
}

const CATEGORIES = {
  environment: 'סביבת למידה',
  social: 'חברתי',
  sensory: 'חושי (VAK)',
  time: 'זמן וריכוז',
  emotional: 'רגשי',
  cognitive: 'קוגניטיבי',
};

type CategoryKey = keyof typeof CATEGORIES;

const QUESTIONS_MALE: { category: CategoryKey; text: string }[] = [
  // Environment (1-6)
  { category: 'environment', text: 'אני לומד טוב יותר באור חזק' },
  { category: 'environment', text: 'רעש לא מפריע לי להתרכז' },
  { category: 'environment', text: 'אני צריך שקט מוחלט כדי ללמוד' },
  { category: 'environment', text: 'הטמפרטורה משפיעה על הריכוז שלי' },
  { category: 'environment', text: 'אני מעדיף ללמוד ליד שולחן' },
  { category: 'environment', text: 'אני לומד טוב יותר בצורה חופשית (ספה/רצפה)' },
  // Social (7-11)
  { category: 'social', text: 'אני מעדיף ללמוד לבד' },
  { category: 'social', text: 'אני לומד טוב יותר בזוג' },
  { category: 'social', text: 'אני לומד טוב יותר בקבוצה' },
  { category: 'social', text: 'אני צריך שמישהו ינחה אותי' },
  { category: 'social', text: 'אני נהנה לעבוד עם אחרים' },
  // Sensory / VAK (12-16)
  { category: 'sensory', text: 'אני מבין טוב יותר דרך ראייה (תמונות/תרשימים)' },
  { category: 'sensory', text: 'אני מבין טוב יותר דרך שמיעה' },
  { category: 'sensory', text: 'אני לומד הכי טוב דרך עשייה' },
  { category: 'sensory', text: 'כתיבה עוזרת לי לזכור' },
  { category: 'sensory', text: 'אני צריך תנועה כדי להתרכז' },
  // Time & Attention (17-20)
  { category: 'time', text: 'אני מרוכז יותר בבוקר' },
  { category: 'time', text: 'אני מרוכז יותר בערב' },
  { category: 'time', text: 'אני צריך הפסקות קצרות' },
  { category: 'time', text: 'אני יכול להתרכז לאורך זמן' },
  // Emotional (21-25)
  { category: 'emotional', text: 'אני לומד מתוך רצון פנימי' },
  { category: 'emotional', text: 'קשה לי להתמיד' },
  { category: 'emotional', text: 'אני מסיים משימות גם כשקשה' },
  { category: 'emotional', text: 'אני צריך חיזוקים מבחוץ' },
  { category: 'emotional', text: 'אני מרגיש אחריות על ההצלחה שלי' },
  // Cognitive (26-30)
  { category: 'cognitive', text: 'אני צריך להבין את התמונה הגדולה' },
  { category: 'cognitive', text: 'אני עובד לפי שלבים מסודרים' },
  { category: 'cognitive', text: 'אני מגיב מהר בלי לחשוב הרבה' },
  { category: 'cognitive', text: 'אני חושב לפני שאני עונה' },
  { category: 'cognitive', text: 'אני צריך מבנה ברור' },
];

const QUESTIONS_FEMALE: { category: CategoryKey; text: string }[] = [
  // Environment (1-6)
  { category: 'environment', text: 'אני לומדת טוב יותר באור חזק' },
  { category: 'environment', text: 'רעש לא מפריע לי להתרכז' },
  { category: 'environment', text: 'אני צריכה שקט מוחלט כדי ללמוד' },
  { category: 'environment', text: 'הטמפרטורה משפיעה על הריכוז שלי' },
  { category: 'environment', text: 'אני מעדיפה ללמוד ליד שולחן' },
  { category: 'environment', text: 'אני לומדת טוב יותר בצורה חופשית (ספה/רצפה)' },
  // Social (7-11)
  { category: 'social', text: 'אני מעדיפה ללמוד לבד' },
  { category: 'social', text: 'אני לומדת טוב יותר בזוג' },
  { category: 'social', text: 'אני לומדת טוב יותר בקבוצה' },
  { category: 'social', text: 'אני צריכה שמישהו ינחה אותי' },
  { category: 'social', text: 'אני נהנית לעבוד עם אחרים' },
  // Sensory / VAK (12-16)
  { category: 'sensory', text: 'אני מבינה טוב יותר דרך ראייה (תמונות/תרשימים)' },
  { category: 'sensory', text: 'אני מבינה טוב יותר דרך שמיעה' },
  { category: 'sensory', text: 'אני לומדת הכי טוב דרך עשייה' },
  { category: 'sensory', text: 'כתיבה עוזרת לי לזכור' },
  { category: 'sensory', text: 'אני צריכה תנועה כדי להתרכז' },
  // Time & Attention (17-20)
  { category: 'time', text: 'אני מרוכזת יותר בבוקר' },
  { category: 'time', text: 'אני מרוכזת יותר בערב' },
  { category: 'time', text: 'אני צריכה הפסקות קצרות' },
  { category: 'time', text: 'אני יכולה להתרכז לאורך זמן' },
  // Emotional (21-25)
  { category: 'emotional', text: 'אני לומדת מתוך רצון פנימי' },
  { category: 'emotional', text: 'קשה לי להתמיד' },
  { category: 'emotional', text: 'אני מסיימת משימות גם כשקשה' },
  { category: 'emotional', text: 'אני צריכה חיזוקים מבחוץ' },
  { category: 'emotional', text: 'אני מרגישה אחריות על ההצלחה שלי' },
  // Cognitive (26-30)
  { category: 'cognitive', text: 'אני צריכה להבין את התמונה הגדולה' },
  { category: 'cognitive', text: 'אני עובדת לפי שלבים מסודרים' },
  { category: 'cognitive', text: 'אני מגיבה מהר בלי לחשוב הרבה' },
  { category: 'cognitive', text: 'אני חושבת לפני שאני עונה' },
  { category: 'cognitive', text: 'אני צריכה מבנה ברור' },
];

// Default export for calculations uses male form (gender-neutral for data processing)
const QUESTIONS = QUESTIONS_MALE;

const SCALE_LABELS = [
  'בכלל לא נכון לי',
  'קצת נכון',
  'בינוני',
  'די נכון',
  'מאוד נכון לי',
];

const SCALE_COLORS = [
  'bg-red-400 hover:bg-red-500 text-white',
  'bg-orange-400 hover:bg-orange-500 text-white',
  'bg-yellow-400 hover:bg-yellow-500 text-white',
  'bg-lime-400 hover:bg-lime-500 text-white',
  'bg-green-500 hover:bg-green-600 text-white',
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

  // Detect contradictions
  const challenges: string[] = [];
  // impulsive (q28 high) + structured (q27 high, q30 high)
  if ((responses[27] || 0) >= 4 && ((responses[26] || 0) >= 4 || (responses[29] || 0) >= 4)) {
    challenges.push('סתירה: נטייה לאימפולסיביות לצד צורך במבנה מסודר');
  }
  // independent (q7 high) + authority-dependent (q10 high)
  if ((responses[6] || 0) >= 4 && (responses[9] || 0) >= 4) {
    challenges.push('סתירה: העדפה ללמידה עצמאית לצד צורך בהנחיה');
  }
  // low persistence (q22 high) + finishes tasks (q23 high)
  if ((responses[21] || 0) >= 4 && (responses[22] || 0) >= 4) {
    challenges.push('סתירה: קושי בהתמדה אך מדווח על סיום משימות');
  }

  // Generate recommendations
  const recommendations: string[] = [];
  const catLabels = CATEGORIES;

  if (averages.sensory >= 3.5) {
    if ((responses[13] || 0) >= 4) recommendations.push('שילוב למידה דרך עשייה ותנועה');
    if ((responses[11] || 0) >= 4) recommendations.push('שימוש בעזרים חזותיים: תרשימים, מפות חשיבה');
    if ((responses[12] || 0) >= 4) recommendations.push('שימוש בהקלטות ושיחות כדי לעזור בלמידה');
  }
  if ((responses[18] || 0) >= 4) recommendations.push('שילוב הפסקות קצרות ותכופות');
  if ((responses[23] || 0) >= 4) recommendations.push('מתן חיזוקים חיוביים מידיים');
  if ((responses[29] || 0) >= 4) recommendations.push('הצגת מבנה ברור ושלבים מסודרים');
  if ((responses[25] || 0) >= 4) recommendations.push('הצגת התמונה הגדולה לפני כניסה לפרטים');
  if ((responses[15] || 0) >= 4) recommendations.push('אפשר תנועה במהלך הלמידה');
  if ((responses[8] || 0) >= 4) recommendations.push('עבודה בקבוצות קטנות');
  if ((responses[6] || 0) >= 4) recommendations.push('מתן מרחב ללמידה עצמאית');

  if (recommendations.length === 0) {
    recommendations.push('ליצור סביבה מגוונת שמשלבת ערוצים שונים');
  }

  // Simple student insight
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

  // Check if already completed
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

  const handleAnswer = (value: number) => {
    const newResponses = { ...responses, [currentQ]: value };
    setResponses(newResponses);

    if (currentQ < QUESTIONS_MALE.length - 1) {
      setTimeout(() => setCurrentQ(prev => prev + 1), 200);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length < QUESTIONS_MALE.length) {
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
      toast.success('השאלון הושלם בהצלחה!');
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

  const genderedQuestions = gender === 'נ' ? QUESTIONS_FEMALE : QUESTIONS_MALE;
  const progress = ((currentQ + 1) / genderedQuestions.length) * 100;
  const currentQuestion = genderedQuestions[currentQ];
  const allAnswered = Object.keys(responses).length === genderedQuestions.length;

  return (
    <div className="card-styled rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">סגנון הלמידה שלי</span>
        </div>
        <span className="text-xs text-muted-foreground">{currentQ + 1}/{genderedQuestions.length}</span>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Category label */}
      <div className="text-center">
        <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-3 py-0.5">
          {CATEGORIES[currentQuestion.category]}
        </span>
      </div>

      {/* Question */}
      <div className="text-center py-4 min-h-[80px] flex items-center justify-center">
        <p className="font-semibold text-base leading-relaxed">{currentQuestion.text}</p>
      </div>

      {/* Scale buttons */}
      <div className="space-y-2">
        {SCALE_LABELS.map((label, i) => {
          const value = i + 1;
          const isSelected = responses[currentQ] === value;
          return (
            <button
              key={value}
              onClick={() => handleAnswer(value)}
              className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all transform active:scale-[0.98] ${
                isSelected
                  ? `${SCALE_COLORS[i]} ring-2 ring-offset-2 ring-primary scale-[1.02]`
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              <span className="flex items-center justify-between">
                <span>{label}</span>
                <span className="text-lg font-bold opacity-60">{value}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentQ === 0}
          onClick={() => setCurrentQ(prev => prev - 1)}
          className="gap-1"
        >
          <ChevronRight className="h-4 w-4" />
          הקודם
        </Button>

        {currentQ < QUESTIONS.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={responses[currentQ] === undefined}
            onClick={() => setCurrentQ(prev => prev + 1)}
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
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {saving ? 'שומר...' : 'המשך לתובנות שלי'}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{g(gender, 'ענה', 'עני')} על כל השאלות</span>
        )}
      </div>
    </div>
  );
}

// Exported for use in pedagogy form / admin
export { CATEGORIES, QUESTIONS, SCALE_LABELS, calculateResults };
