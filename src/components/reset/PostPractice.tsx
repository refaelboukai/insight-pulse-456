import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RotateCcw } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';
import { playSuccess, playSelect } from '@/hooks/useSoundEffects';
import { fireConfetti } from '@/hooks/useConfetti';

const options = [
  { id: 'better', label: 'יותר טוב', emoji: '😊' },
  { id: 'slightly-better', label: 'קצת יותר טוב', emoji: '🙂' },
  { id: 'same', label: 'אותו דבר', emoji: '😐' },
  { id: 'worse', label: 'יותר גרוע', emoji: '😞' },
  { id: 'need-adult', label: 'אני צריך מבוגר', emoji: '🤝' },
];

function SuccessScreen({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  useEffect(() => { playSuccess(); fireConfetti(); }, []);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <motion.div className="text-5xl mb-4" animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.6, delay: 0.3 }}>🎉</motion.div>
      <h2 className="text-xl font-bold text-foreground mb-3">כל הכבוד שעצרת לרגע</h2>
      <p className="text-sm text-muted-foreground mb-6">עצירה קטנה יכולה לשנות תגובה גדולה.</p>
      <button onClick={() => navigate('/student')} className="bg-primary text-primary-foreground rounded-xl px-6 py-2.5 font-semibold">חזרה למסך הראשי</button>
    </motion.div>
  );
}

export default function PostPractice() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  if (selected === 'need-adult') { navigate('/student/contact'); return null; }

  if (selected === 'better' || selected === 'slightly-better') {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
          <SuccessScreen navigate={navigate} />
        </div>
      </PageTransition>
    );
  }

  if (selected === 'same') {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
          <h2 className="text-lg font-bold text-foreground mb-4">אפשר לנסות עוד</h2>
          <div className="space-y-3 w-full max-w-sm">
            <button onClick={() => navigate(-1)} className="w-full border rounded-xl py-3 text-sm flex items-center justify-center gap-2"><RotateCcw size={16} /> נסה שוב</button>
            <button onClick={() => navigate('/student/skills')} className="w-full border rounded-xl py-3 text-sm">נסה כלי אחר</button>
            <button onClick={() => navigate('/student/contact')} className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold">פנייה למבוגר</button>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (selected === 'worse') {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
          <h2 className="text-lg font-bold text-foreground mb-3">נראה שקשה יותר כרגע</h2>
          <p className="text-sm text-muted-foreground mb-6">אפשר לנסות כלי נוסף או לפנות לאיש צוות.</p>
          <div className="space-y-3 w-full max-w-sm">
            <button onClick={() => navigate('/student/skills')} className="w-full border rounded-xl py-3 text-sm">נסה כלי נוסף</button>
            <button onClick={() => navigate('/student/contact')} className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold">פנייה לאיש צוות</button>
            <button onClick={() => navigate('/student/breathing')} className="w-full border rounded-xl py-3 text-sm">תרגול הרגעה מהיר</button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">איך אתה עכשיו?</h2>
        </div>
        <div className="space-y-3 max-w-sm mx-auto">
          {options.map((opt, i) => (
            <motion.button key={opt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }} onClick={() => { playSelect(); setSelected(opt.id); }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border bg-card shadow-sm ${opt.id === 'need-adult' ? 'bg-rose-50' : ''}`}>
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-base font-medium text-foreground">{opt.label}</span>
            </motion.button>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
