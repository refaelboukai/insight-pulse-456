import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, UserCheck, Wind, Layers } from 'lucide-react';
import PageTransition from '@/reset-zone/components/PageTransition';
import { playCalm, playClick } from '@/reset-zone/hooks/useSoundEffects';

export default function CalmMode() {
  const navigate = useNavigate();
  useEffect(() => { playCalm(); }, []);
  const handleNav = (path: string) => { playClick(); navigate(path); };

  return (
    <PageTransition>
      <div className="reset-screen-container flex flex-col items-center justify-center min-h-screen">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-foreground mb-3">עצור רגע. נרגעים יחד.</h2>
          <p className="text-base text-muted-foreground mb-8">לפעמים הגוף מוצף.<br />בוא נוריד רגע את העוצמה.</p>
          <div className="space-y-4">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleNav('/reset/breathing')} className="reset-home-card w-full bg-sage"><Wind size={28} strokeWidth={1.5} className="text-sage-icon" /><span className="text-base font-semibold text-sage-text">נשימה להרגעה</span></motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleNav('/reset/grounding')} className="reset-home-card w-full bg-check-blue"><Layers size={28} strokeWidth={1.5} className="text-check-blue-icon" /><span className="text-base font-semibold text-check-blue-text">קרקוע 5-4-3-2-1</span></motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleNav('/reset/contact')} className="reset-home-card w-full bg-contact-pink"><UserCheck size={28} strokeWidth={1.5} className="text-contact-pink-icon" /><span className="text-base font-semibold text-contact-pink-text">פנייה למבוגר</span></motion.button>
          </div>
          <div className="mt-8"><button onClick={() => handleNav('/reset')} className="reset-btn-secondary flex items-center gap-2 mx-auto"><Home size={16} /> חזרה למסך הראשי</button></div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
