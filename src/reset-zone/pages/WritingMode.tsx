import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { writingPrompts, skills } from '@/reset-zone/data/skills';
import { motion } from 'framer-motion';
import { Home, ChevronLeft, SkipForward } from 'lucide-react';

export default function WritingMode() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const prompts = writingPrompts[skillId || ''] || [];
  const skill = skills.find(s => s.id === skillId);

  if (step >= prompts.length) return (<div className="reset-screen-container flex flex-col items-center justify-center min-h-screen text-center"><h2 className="text-xl font-bold text-foreground mb-4">כל הכבוד!</h2><p className="text-sm text-muted-foreground mb-6">סיימת את התרגול.</p><button onClick={() => navigate('/reset/post-practice')} className="reset-btn-primary">המשך</button></div>);

  return (
    <div className="reset-screen-container">
      <div className="text-center mb-4"><h2 className="text-lg font-bold text-foreground">{skill?.name || ''}</h2><p className="text-sm text-muted-foreground mt-1">שאלה {step + 1} מתוך {prompts.length}</p></div>
      <div className="flex gap-1 mb-6 justify-center">{prompts.map((_, i) => (<div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />))}</div>
      <motion.div key={step} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="reset-card p-6 mb-6"><p className="text-base font-semibold text-foreground mb-4">{prompts[step]}</p><textarea value={answers[step] || ''} onChange={e => { const n = [...answers]; n[step] = e.target.value; setAnswers(n); }} placeholder="כתוב כאן... (לא חובה)" className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></motion.div>
      <div className="flex justify-center gap-3"><button onClick={() => setStep(step + 1)} className="reset-btn-primary flex items-center gap-1">{step < prompts.length - 1 ? 'הבא' : 'סיום'}<ChevronLeft size={16} /></button><button onClick={() => setStep(step + 1)} className="reset-btn-secondary flex items-center gap-1"><SkipForward size={14} /> דלג</button></div>
      <div className="mt-8 flex justify-center"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה למסך הראשי</button></div>
    </div>
  );
}
