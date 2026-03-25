import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/reset-zone/contexts/AppContext';
import { motion } from 'framer-motion';
import { Home, UserCheck, RotateCcw } from 'lucide-react';
import PageTransition from '@/reset-zone/components/PageTransition';
import { playSuccess, playSelect } from '@/reset-zone/hooks/useSoundEffects';
import { fireConfetti } from '@/reset-zone/hooks/useConfetti';

export default function PostPractice() {
  const navigate = useNavigate();
  const { logActivity, student, role } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const options = [
    { id: 'better', label: 'יותר טוב', emoji: '😊' },
    { id: 'slightly-better', label: 'קצת יותר טוב', emoji: '🙂' },
    { id: 'same', label: 'אותו דבר', emoji: '😐' },
    { id: 'worse', label: 'יותר גרוע', emoji: '😞' },
    { id: 'need-adult', label: 'אני צריך מבוגר', emoji: '🤝' },
  ];
  const handleSelect = (id: string) => { playSelect(); setSelected(id); };
  if (selected === 'need-adult') { navigate('/reset/contact'); return null; }
  if (selected === 'better' || selected === 'slightly-better') return <PageTransition><div className="reset-screen-container flex flex-col items-center justify-center min-h-screen text-center"><SuccessScreen navigate={navigate} /></div></PageTransition>;
  if (selected === 'same') return <PageTransition><div className="reset-screen-container flex flex-col items-center justify-center min-h-screen text-center"><h2 className="text-lg font-bold text-foreground mb-4">אפשר לנסות עוד</h2><div className="space-y-3 w-full max-w-sm"><button onClick={() => navigate(-1 as any)} className="reset-btn-secondary w-full flex items-center justify-center gap-2"><RotateCcw size={16} /> נסה שוב</button><button onClick={() => navigate('/reset/skills')} className="reset-btn-secondary w-full">נסה כלי אחר</button><button onClick={() => navigate('/reset/contact')} className="reset-btn-primary w-full">פנייה למבוגר</button></div></div></PageTransition>;
  if (selected === 'worse') return <PageTransition><div className="reset-screen-container flex flex-col items-center justify-center min-h-screen text-center"><h2 className="text-lg font-bold text-foreground mb-3">נראה שקשה יותר כרגע</h2><p className="text-base text-muted-foreground mb-6">לפעמים כלי אחד לא מספיק.<br />אפשר לנסות כלי נוסף או לפנות לאיש צוות.</p><div className="space-y-3 w-full max-w-sm"><button onClick={() => navigate('/reset/skills')} className="reset-btn-secondary w-full">נסה כלי נוסף</button><button onClick={() => navigate('/reset/contact')} className="reset-btn-primary w-full">פנייה לאיש צוות</button><button onClick={() => navigate('/reset/breathing')} className="reset-btn-secondary w-full">תרגול הרגעה מהיר</button></div></div></PageTransition>;

  return (
    <PageTransition>
      <div className="reset-screen-container">
        <div className="text-center mb-6"><h2 className="text-xl font-bold text-foreground mb-2">איך אתה עכשיו?</h2></div>
        <div className="space-y-3 max-w-sm mx-auto">
          {options.map((opt, i) => (
            <motion.button key={opt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(opt.id)} className={`reset-card w-full flex items-center gap-3 p-4 ${opt.id === 'need-adult' ? 'bg-contact-pink' : 'bg-card'}`}>
              <span className="text-2xl">{opt.emoji}</span><span className="text-base font-medium text-foreground">{opt.label}</span>
            </motion.button>
          ))}
        </div>
        <div className="mt-4 flex justify-center"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה למסך הראשי</button></div>
      </div>
    </PageTransition>
  );
}

function SuccessScreen({ navigate }: { navigate: any }) {
  useEffect(() => { playSuccess(); fireConfetti(); }, []);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <motion.div className="text-5xl mb-4" animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.6, delay: 0.3 }}>🎉</motion.div>
      <h2 className="text-xl font-bold text-foreground mb-3">כל הכבוד שעצרת לרגע</h2>
      <p className="text-sm text-muted-foreground mb-6">עצירה קטנה יכולה לשנות תגובה גדולה.</p>
      <div className="space-y-3"><button onClick={() => navigate('/reset')} className="reset-btn-primary w-full">חזרה למסך הראשי</button></div>
    </motion.div>
  );
}
