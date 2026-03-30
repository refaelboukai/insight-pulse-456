import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { writingPrompts } from '@reset/data/skills';
import { skills } from '@reset/data/skills';
import { motion } from 'framer-motion';
import { Home, ChevronLeft, SkipForward } from 'lucide-react';

export default function WritingMode() {
  const { skillId, stateId, intensity } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const prompts = writingPrompts[skillId || ''] || [];
  const skill = skills.find(s => s.id === skillId);

  if (step >= prompts.length) {
    return (
      <div className="screen-container flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-extrabold text-foreground mb-4">כל הכבוד!</h2>
        <p className="text-base text-muted-foreground mb-6">סיימת את התרגול.</p>
        <button onClick={() => navigate('/post-practice')} className="btn-primary text-lg py-3 px-8">המשך</button>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-foreground">{skill?.name || ''}</h2>
        {skill?.englishName && (
          <p className="text-sm text-muted-foreground mt-0.5" dir="ltr">{skill.englishName}</p>
        )}
        <p className="text-base text-muted-foreground mt-1 font-medium">שאלה {step + 1} מתוך {prompts.length}</p>
      </div>

      {/* Acronym explanation */}
      {skill?.steps && skill.steps.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          {skill.steps.map((s, i) => (
            <span
              key={i}
              className={`text-sm px-2.5 py-1 rounded-full border transition-colors ${
                i === step
                  ? 'bg-primary/15 border-primary text-primary font-bold'
                  : 'bg-muted/50 border-transparent text-muted-foreground'
              }`}
            >
              <strong>{s.letter}</strong> {s.title.split(' – ')[0].split(' — ')[0]}
            </span>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="flex gap-1 mb-6 justify-center">
        {prompts.map((_, i) => (
          <div key={i} className={`h-2 w-10 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="card-reset p-6 mb-6"
      >
        <p className="text-lg font-bold text-foreground mb-4">{prompts[step]}</p>
        <textarea
          value={answers[step] || ''}
          onChange={e => {
            const newAnswers = [...answers];
            newAnswers[step] = e.target.value;
            setAnswers(newAnswers);
          }}
          placeholder="כתוב כאן... (לא חובה)"
          className="w-full rounded-xl border border-input bg-background p-3 text-base min-h-[90px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </motion.div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setStep(step + 1)}
          className="btn-primary flex items-center gap-1 text-base"
        >
          {step < prompts.length - 1 ? 'הבא' : 'סיום'}
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setStep(step + 1)}
          className="btn-secondary flex items-center gap-1 text-base"
        >
          <SkipForward size={16} /> דלג
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <Home size={16} /> חזרה למסך הראשי
        </button>
      </div>
    </div>
  );
}
