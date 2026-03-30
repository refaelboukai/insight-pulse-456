import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { skills } from '@reset/data/skills';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, UserCheck, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import FistClenchAnimation from '@reset/components/FistClenchAnimation';
import BreathingCircleAnimation from '@reset/components/animations/BreathingCircleAnimation';
import TemperatureAnimation from '@reset/components/animations/TemperatureAnimation';
import ExerciseAnimation from '@reset/components/animations/ExerciseAnimation';
import SensesAnimation from '@reset/components/animations/SensesAnimation';
import BalanceAnimation from '@reset/components/animations/BalanceAnimation';
import FlipAnimation from '@reset/components/animations/FlipAnimation';
import StepTimer from '@reset/components/animations/StepTimer';

function renderAnimation(animationType: string | undefined) {
  if (!animationType) return null;
  switch (animationType) {
    case 'fist-clench': return <FistClenchAnimation />;
    case 'breathing-circle': return <BreathingCircleAnimation />;
    case 'temperature': return <TemperatureAnimation />;
    case 'exercise': return <ExerciseAnimation />;
    case 'balance': return <BalanceAnimation />;
    case 'flip': return <FlipAnimation />;
    default:
      if (animationType.startsWith('senses-')) {
        const idx = parseInt(animationType.split('-')[1]);
        return <SensesAnimation senseIndex={idx} />;
      }
      return null;
  }
}

export default function PracticeMode() {
  const { skillId, stateId, intensity } = useParams();
  const navigate = useNavigate();
  const skill = skills.find(s => s.id === skillId);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  if (!skill) {
    navigate('/');
    return null;
  }

  const hasSteps = skill.steps && skill.steps.length > 0;
  const totalSteps = skill.steps?.length || 0;

  const handleNextStep = () => {
    setCompletedSteps(prev => [...prev, currentStep]);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const allDone = hasSteps && completedSteps.length === totalSteps;

  return (
    <div className="screen-container">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-foreground mb-1">{skill.name}</h2>
        {skill.englishName && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto" dir="ltr">
            {skill.englishName}
          </p>
        )}
        <p className="text-lg text-muted-foreground mt-2">⏱ {skill.estimatedTime}</p>
      </div>

      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-reset p-6 mb-6 text-center"
      >
        <p className="text-lg text-muted-foreground leading-relaxed">
          קח רגע לעצמך. אין צורך למהר.
          <br />
          פשוט בצע את השלבים אחד אחד.
        </p>
      </motion.div>

      {hasSteps ? (
        <>
          {/* Step progress indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {skill.steps!.map((step, i) => {
              const isDone = completedSteps.includes(i);
              const isCurrent = i === currentStep;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`
                    w-11 h-11 rounded-full flex items-center justify-center text-base font-bold
                    transition-all duration-200 border-2
                    ${isDone
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : isCurrent
                        ? 'bg-primary/10 text-primary border-primary scale-110 shadow-lg'
                        : 'bg-muted/50 text-muted-foreground border-transparent'
                    }
                  `}
                >
                  {isDone ? <Check size={18} /> : step.letter || i + 1}
                </button>
              );
            })}
          </div>

          {/* Current step card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
              className="card-reset p-6 mb-6 border-r-4 border-primary"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-black text-primary">
                    {skill.steps![currentStep].letter || currentStep + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">
                    שלב {currentStep + 1} מתוך {totalSteps}
                  </p>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {skill.steps![currentStep].title}
                  </h3>
                  <p className="text-base text-foreground/80 leading-relaxed">
                    {skill.steps![currentStep].description}
                  </p>
                  {renderAnimation(skill.steps![currentStep].hasAnimation)}
                  {/* Timer for steps without specific animation */}
                  {!skill.steps![currentStep].hasAnimation && (
                    <div className="mt-3">
                      <StepTimer duration={30} label="קח רגע לתרגל את השלב" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Step navigation */}
          <div className="flex justify-center gap-3 mb-6">
            {currentStep > 0 && (
              <button
                onClick={handlePrevStep}
                className="btn-secondary flex items-center gap-1 text-base"
              >
                <ChevronLeft size={18} />
                הקודם
              </button>
            )}
            {!allDone ? (
              <button
                onClick={handleNextStep}
                className="btn-primary text-base"
              >
                {completedSteps.includes(currentStep)
                  ? currentStep < totalSteps - 1
                    ? 'הבא'
                    : 'סיימתי'
                  : currentStep < totalSteps - 1
                    ? 'הבנתי, הלאה ←'
                    : 'סיימתי ✓'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/post-practice')}
                className="btn-primary text-base"
              >
                סיימתי את התרגול ✓
              </button>
            )}
          </div>

          {/* Completion message */}
          <AnimatePresence>
            {allDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-reset p-5 text-center bg-primary/5 border border-primary/20 mb-6"
              >
                <p className="text-xl font-bold text-primary mb-1">כל הכבוד! 🎉</p>
                <p className="text-base text-foreground/70">עברת על כל השלבים. אפשר להמשיך.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* Fallback for skills without steps */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-reset p-6 mb-6"
        >
          <p className="text-lg text-foreground">{skill.description}</p>
        </motion.div>
      )}

      {/* Bottom actions */}
      <div className="flex justify-center gap-3">
        {!hasSteps && (
          <button onClick={() => navigate('/post-practice')} className="btn-primary text-base">
            סיימתי
          </button>
        )}
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
          <ChevronRight size={16} /> חזרה
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <Home size={16} /> מסך ראשי
        </button>
      </div>

      <button onClick={() => navigate('/contact')} className="floating-adult-btn">
        <UserCheck size={16} className="inline ml-1" />
        אני צריך מבוגר
      </button>
    </div>
  );
}
