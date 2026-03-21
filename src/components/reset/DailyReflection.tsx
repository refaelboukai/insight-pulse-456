import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Home, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import PageTransition from '@/components/reset/PageTransition';

const categories = [
  { key: 'academic_tasks', label: 'ביצוע משימות לימודיות', emoji: '📚', desc: 'כמה הצלחתי לעשות את מה שנדרש?' },
  { key: 'class_presence', label: 'נוכחות בכיתה', emoji: '🏫', desc: 'כמה הייתי נוכח ומרוכז?' },
  { key: 'behavior', label: 'התנהגות', emoji: '🌟', desc: 'איך הייתה ההתנהגות שלי היום?' },
  { key: 'social_interaction', label: 'אינטראקציה חברתית', emoji: '🤝', desc: 'איך הקשרים שלי עם אחרים?' },
] as const;

const ratingLabels: Record<number, string> = { 1: 'צריך שיפור', 2: 'לא הכי טוב', 3: 'בסדר', 4: 'טוב', 5: 'מעולה!' };

export default function DailyReflection() {
  const navigate = useNavigate();
  const { fullName } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allRated = categories.every(c => ratings[c.key]);

  const handleSubmit = async () => {
    if (!allRated) return;
    const { error } = await supabase.from('daily_reflections' as any).insert({
      student_name: fullName || 'אנונימי',
      academic_tasks: ratings.academic_tasks,
      class_presence: ratings.class_presence,
      behavior: ratings.behavior,
      social_interaction: ratings.social_interaction,
    });
    if (error) { toast.error('שגיאה בשמירה'); return; }
    setSubmitted(true);
    toast.success('הדיווח נשמר בהצלחה! 🎉');
  };

  if (submitted) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <CheckCircle size={64} className="text-primary mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">תודה על הדיווח! 🌟</h2>
          <button onClick={() => navigate('/student')} className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-3">
            <Star size={16} className="text-primary" />
            <span className="text-xs font-medium text-primary">התבוננות עצמית</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">היום שלי</h2>
          <p className="text-sm text-muted-foreground mt-1">דרג/י את עצמך מ-1 עד 5</p>
        </div>

        <div className="space-y-5 mb-8 max-w-md mx-auto">
          {categories.map((cat, ci) => (
            <motion.div key={cat.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}
              className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{cat.emoji}</span>
                <h3 className="font-bold text-sm text-foreground">{cat.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{cat.desc}</p>
              <div className="flex justify-between gap-1.5">
                {[1, 2, 3, 4, 5].map(n => {
                  const selected = ratings[cat.key] === n;
                  return (
                    <button key={n} onClick={() => setRatings(prev => ({ ...prev, [cat.key]: n }))}
                      className={`flex-1 rounded-xl py-2.5 text-center transition-all border-2 ${selected ? 'bg-primary border-primary text-primary-foreground scale-105 shadow-md' : 'bg-secondary/40 border-transparent text-foreground hover:bg-secondary/70'}`}>
                      <span className="text-lg font-bold block">{n}</span>
                      <span className="text-[9px] block mt-0.5 opacity-80">{n === 1 ? '😔' : n === 2 ? '😕' : n === 3 ? '😐' : n === 4 ? '🙂' : '🤩'}</span>
                    </button>
                  );
                })}
              </div>
              {ratings[cat.key] && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-center text-primary mt-2 font-medium">{ratingLabels[ratings[cat.key]]}</motion.p>}
            </motion.div>
          ))}
        </div>

        <div className="max-w-md mx-auto">
          <button onClick={handleSubmit} disabled={!allRated}
            className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all ${allRated ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>
            {allRated ? 'שלח דיווח ✨' : `נותרו ${categories.filter(c => !ratings[c.key]).length} קטגוריות`}
          </button>
        </div>

        <div className="flex justify-center mt-6">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
