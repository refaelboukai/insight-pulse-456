import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { skills } from '@/data/skills';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

export default function PracticeMode() {
  const { skillId, stateId, intensity } = useParams();
  const navigate = useNavigate();
  const skill = skills.find(s => s.id === skillId);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  if (!skill) { navigate('/student'); return null; }

  const hasSteps = skill.steps && skill.steps.length > 0;
  const totalSteps = skill.steps?.length || 0;
  const allDone = hasSteps && completedSteps.length === totalSteps;

  const handleNextStep = () => {
    setCompletedSteps(prev => [...prev, currentStep]);
    if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1);
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">{skill.name}</h2>
          {skill.englishName && <p className="text-xs text-muted-foreground" dir="ltr">{skill.englishName}</p>}
          <p className="text-sm text-muted-foreground mt-2">⏱ {skill.estimatedTime}</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 mb-6 text-center shadow-sm max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">קח רגע לעצמך. פשוט בצע את השלבים אחד אחד.</p>
        </div>

        {hasSteps ? (
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              {skill.steps!.map((step, i) => {
                const isDone = completedSteps.includes(i);
                const isCurrent = i === currentStep;
                return (
                  <button key={i} onClick={() => setCurrentStep(i)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                      ${isDone ? 'bg-primary text-primary-foreground border-primary' : isCurrent ? 'bg-primary/10 text-primary border-primary scale-110' : 'bg-muted/50 text-muted-foreground border-transparent'}`}>
                    {isDone ? <Check size={16} /> : step.letter || i + 1}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                className="rounded-2xl border bg-card p-6 mb-6 border-r-4 border-r-primary shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-xl font-black text-primary">{skill.steps![currentStep].letter || currentStep + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">שלב {currentStep + 1} מתוך {totalSteps}</p>
                    <h3 className="text-lg font-bold text-foreground mb-2">{skill.steps![currentStep].title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{skill.steps![currentStep].description}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-3 mb-6">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(p => p - 1)} className="border rounded-xl px-4 py-2 text-sm flex items-center gap-1">
                  <ChevronRight size={16} /> הקודם
                </button>
              )}
              {!allDone ? (
                <button onClick={handleNextStep} className="bg-primary text-primary-foreground rounded-xl px-5 py-2 text-sm font-semibold">
                  {currentStep < totalSteps - 1 ? 'הבנתי, הלאה ←' : 'סיימתי ✓'}
                </button>
              ) : (
                <button onClick={() => navigate('/student')} className="bg-primary text-primary-foreground rounded-xl px-5 py-2 text-sm font-semibold">
                  סיימתי את התרגול ✓
                </button>
              )}
            </div>

            {allDone && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-5 text-center bg-primary/5 border border-primary/20 mb-6">
                <p className="text-lg font-bold text-primary mb-1">כל הכבוד! 🎉</p>
                <p className="text-sm text-muted-foreground">עברת על כל השלבים.</p>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 mb-6 max-w-md mx-auto">
            <p className="text-sm text-foreground">{skill.description}</p>
          </div>
        )}

        <div className="flex justify-center">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
