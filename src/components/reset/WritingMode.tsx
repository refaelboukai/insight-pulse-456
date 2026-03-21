import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { writingPrompts, skills } from '@/data/skills';
import { motion } from 'framer-motion';
import { Home, ChevronLeft, SkipForward } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

export default function WritingMode() {
  const { skillId, stateId, intensity } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const prompts = writingPrompts[skillId || ''] || [];
  const skill = skills.find(s => s.id === skillId);

  if (step >= prompts.length) {
    return (
      <PageTransition>
        <div className="min-h-screen p-4 flex flex-col items-center justify-center" style={{ background: 'var(--gradient-warm)' }}>
          <h2 className="text-xl font-bold text-foreground mb-4">כל הכבוד!</h2>
          <p className="text-sm text-muted-foreground mb-6">סיימת את התרגול.</p>
          <button onClick={() => navigate('/student')} className="bg-primary text-primary-foreground rounded-xl px-6 py-2.5 font-semibold">חזרה למסך הראשי</button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">{skill?.name || ''}</h2>
          {skill?.englishName && <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{skill.englishName}</p>}
          <p className="text-sm text-muted-foreground mt-1">שאלה {step + 1} מתוך {prompts.length}</p>
        </div>

        {skill?.steps && skill.steps.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {skill.steps.map((s, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded-full border transition-colors ${i === step ? 'bg-primary/15 border-primary text-primary font-bold' : 'bg-muted/50 border-transparent text-muted-foreground'}`}>
                <strong>{s.letter}</strong> {s.title.split(' – ')[0].split(' — ')[0]}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-1 mb-6 justify-center">
          {prompts.map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border bg-card p-6 mb-6 max-w-md mx-auto shadow-sm">
          <p className="text-base font-semibold text-foreground mb-4">{prompts[step]}</p>
          <textarea
            value={answers[step] || ''}
            onChange={e => { const a = [...answers]; a[step] = e.target.value; setAnswers(a); }}
            placeholder="כתוב כאן... (לא חובה)"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </motion.div>

        <div className="flex justify-center gap-3">
          <button onClick={() => setStep(step + 1)} className="bg-primary text-primary-foreground rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-1">
            {step < prompts.length - 1 ? 'הבא' : 'סיום'} <ChevronLeft size={16} />
          </button>
          <button onClick={() => setStep(step + 1)} className="border rounded-xl px-4 py-2 text-sm flex items-center gap-1 text-muted-foreground">
            <SkipForward size={14} /> דלג
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
