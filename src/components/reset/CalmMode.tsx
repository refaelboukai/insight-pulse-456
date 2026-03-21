import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, UserCheck, Wind, Layers } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';
import { playCalm, playClick } from '@/hooks/useSoundEffects';

export default function CalmMode() {
  const navigate = useNavigate();
  useEffect(() => { playCalm(); }, []);

  const handleNav = (path: string) => { playClick(); navigate(path); };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--gradient-warm)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-foreground mb-3">עצור רגע. נרגעים יחד.</h2>
          <p className="text-sm text-muted-foreground mb-8">לפעמים הגוף מוצף.<br />בוא נוריד רגע את העוצמה.</p>
          <div className="space-y-4">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleNav('/student/breathing')}
              className="w-full rounded-2xl p-4 bg-emerald-50 flex items-center gap-3 border hover:shadow-md transition-shadow">
              <Wind size={28} strokeWidth={1.5} className="text-emerald-500" />
              <span className="text-base font-semibold text-emerald-700">נשימה להרגעה</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleNav('/student/grounding')}
              className="w-full rounded-2xl p-4 bg-sky-50 flex items-center gap-3 border hover:shadow-md transition-shadow">
              <Layers size={28} strokeWidth={1.5} className="text-sky-500" />
              <span className="text-base font-semibold text-sky-700">קרקוע 5-4-3-2-1</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleNav('/student/contact')}
              className="w-full rounded-2xl p-4 bg-rose-50 flex items-center gap-3 border hover:shadow-md transition-shadow">
              <UserCheck size={28} strokeWidth={1.5} className="text-rose-500" />
              <span className="text-base font-semibold text-rose-700">פנייה למבוגר</span>
            </motion.button>
          </div>
          <div className="mt-8">
            <button onClick={() => handleNav('/student')} className="text-sm text-muted-foreground flex items-center gap-2 mx-auto">
              <Home size={16} /> חזרה למסך הראשי
            </button>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
