import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ChevronLeft } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

const steps = [
  { count: 5, label: 'מצא 5 דברים שאתה רואה', icon: '👁️' },
  { count: 4, label: 'מצא 4 דברים שאתה יכול לגעת בהם', icon: '✋' },
  { count: 3, label: 'מצא 3 דברים שאתה שומע', icon: '👂' },
  { count: 2, label: 'מצא 2 דברים שאתה מריח', icon: '👃' },
  { count: 1, label: 'מצא דבר אחד שאתה מרגיש בגוף', icon: '🫀' },
];

export default function GroundingExercise() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  if (step >= steps.length) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
          <h2 className="text-xl font-bold text-foreground mb-4">כל הכבוד!</h2>
          <p className="text-muted-foreground mb-8">סיימת את תרגול הקרקוע.</p>
          <button onClick={() => navigate('/student')} className="bg-primary text-primary-foreground rounded-xl px-6 py-2.5 font-semibold">חזרה</button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
        <h2 className="text-xl font-bold text-foreground mb-2">קרקוע 5-4-3-2-1</h2>
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />)}
        </div>
        <motion.div key={step} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border bg-card p-8 text-center max-w-sm w-full mb-8 shadow-sm">
          <span className="text-4xl mb-4 block">{steps[step].icon}</span>
          <p className="text-lg font-semibold text-foreground">{steps[step].label}</p>
        </motion.div>
        <button onClick={() => setStep(step + 1)} className="bg-primary text-primary-foreground rounded-xl px-8 py-2.5 font-semibold flex items-center gap-2">
          {step < steps.length - 1 ? 'הבא' : 'סיום'} <ChevronLeft size={16} />
        </button>
        <button onClick={() => navigate('/student')} className="mt-8 text-sm text-muted-foreground flex items-center gap-2">
          <Home size={16} /> חזרה למסך הראשי
        </button>
      </div>
    </PageTransition>
  );
}
