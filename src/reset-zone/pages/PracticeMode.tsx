import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { skills } from '@/reset-zone/data/skills';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, UserCheck, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function PracticeMode() {
  const { skillId, stateId, intensity } = useParams();
  const navigate = useNavigate();
  const skill = skills.find(s => s.id === skillId);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  if (!skill) { navigate('/reset'); return null; }
  const hasSteps = skill.steps && skill.steps.length > 0;
  const totalSteps = skill.steps?.length || 0;
  const handleNextStep = () => { setCompletedSteps(prev => [...prev, currentStep]); if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1); };
  const allDone = hasSteps && completedSteps.length === totalSteps;

  return (
    <div className="reset-screen-container">
      <div className="text-center mb-6"><h2 className="text-2xl font-bold text-foreground mb-1">{skill.name}</h2><p className="text-base text-muted-foreground mt-2">⏱ {skill.estimatedTime}</p></div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="reset-card p-5 mb-6 text-center"><p className="text-base text-muted-foreground leading-relaxed">קח רגע לעצמך. אין צורך למהר.<br />פשוט בצע את השלבים אחד אחד.</p></motion.div>
      {hasSteps ? (
        <>
          <div className="flex items-center justify-center gap-2 mb-6">{skill.steps!.map((step, i) => { const isDone = completedSteps.includes(i); const isCurrent = i === currentStep; return (<button key={i} onClick={() => setCurrentStep(i)} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 border-2 ${isDone ? 'bg-primary text-primary-foreground border-primary shadow-md' : isCurrent ? 'bg-primary/10 text-primary border-primary scale-110' : 'bg-muted/50 text-muted-foreground border-transparent'}`}>{isDone ? <Check size={16} /> : step.letter || i + 1}</button>); })}</div>
          <AnimatePresence mode="wait"><motion.div key={currentStep} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.25 }} className="reset-card p-6 mb-6 border-r-4 border-primary"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0"><span className="text-xl font-black text-primary">{skill.steps![currentStep].letter || currentStep + 1}</span></div><div className="flex-1"><p className="text-xs text-muted-foreground mb-1">שלב {currentStep + 1} מתוך {totalSteps}</p><h3 className="text-lg font-bold text-foreground mb-2">{skill.steps![currentStep].title}</h3><p className="text-sm text-foreground/80 leading-relaxed">{skill.steps![currentStep].description}</p></div></div></motion.div></AnimatePresence>
          <div className="flex justify-center gap-3 mb-6">{currentStep > 0 && <button onClick={() => setCurrentStep(p => p - 1)} className="reset-btn-secondary flex items-center gap-1 text-sm"><ChevronLeft size={16} />הקודם</button>}{!allDone ? <button onClick={handleNextStep} className="reset-btn-primary text-sm">{currentStep < totalSteps - 1 ? 'הבנתי, הלאה ←' : 'סיימתי ✓'}</button> : <button onClick={() => navigate('/reset/post-practice')} className="reset-btn-primary text-sm">סיימתי את התרגול ✓</button>}</div>
          <AnimatePresence>{allDone && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="reset-card p-5 text-center bg-primary/5 border border-primary/20 mb-6"><p className="text-lg font-bold text-primary mb-1">כל הכבוד! 🎉</p><p className="text-sm text-foreground/70">עברת על כל השלבים.</p></motion.div>}</AnimatePresence>
        </>
      ) : (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="reset-card p-6 mb-6"><p className="text-base text-foreground">{skill.description}</p></motion.div>)}
      <div className="flex justify-center gap-3">{!hasSteps && <button onClick={() => navigate('/reset/post-practice')} className="reset-btn-primary">סיימתי</button>}<button onClick={() => navigate(-1 as any)} className="reset-btn-secondary flex items-center gap-2"><ChevronRight size={16} /> חזרה</button><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> מסך ראשי</button></div>
      <button onClick={() => navigate('/reset/contact')} className="reset-floating-adult-btn"><UserCheck size={16} className="inline ml-1" />אני צריך מבוגר</button>
    </div>
  );
}
