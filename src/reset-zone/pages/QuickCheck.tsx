import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { emotionalStates } from '@/reset-zone/data/skills';
import { Smile, Flame, AlertTriangle, CloudRain, Waves, Users, BookOpen, Battery, HelpCircle, AlertOctagon, Home, UserCheck } from 'lucide-react';
import PageTransition from '@/reset-zone/components/PageTransition';
import { playSelect } from '@/reset-zone/hooks/useSoundEffects';

const iconMap: Record<string, any> = { Smile, Flame, AlertTriangle, CloudRain, Waves, Users, BookOpen, Battery, HelpCircle, AlertOctagon };

const stateColors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  good:            { bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: 'text-emerald-500', text: 'text-emerald-700' },
  anger:           { bg: 'bg-red-50',      border: 'border-red-200',     icon: 'text-red-400',     text: 'text-red-700' },
  anxiety:         { bg: 'bg-amber-50',    border: 'border-amber-200',   icon: 'text-amber-500',   text: 'text-amber-700' },
  sadness:         { bg: 'bg-blue-50',     border: 'border-blue-200',    icon: 'text-blue-400',    text: 'text-blue-700' },
  overwhelm:       { bg: 'bg-cyan-50',     border: 'border-cyan-200',    icon: 'text-cyan-500',    text: 'text-cyan-700' },
  conflict:        { bg: 'bg-orange-50',   border: 'border-orange-200',  icon: 'text-orange-400',  text: 'text-orange-700' },
  'academic-stress': { bg: 'bg-indigo-50', border: 'border-indigo-200',  icon: 'text-indigo-400',  text: 'text-indigo-700' },
  exhaustion:      { bg: 'bg-slate-50',    border: 'border-slate-200',   icon: 'text-slate-400',   text: 'text-slate-600' },
  confusion:       { bg: 'bg-purple-50',   border: 'border-purple-200',  icon: 'text-purple-400',  text: 'text-purple-700' },
  sos:             { bg: 'bg-rose-50',     border: 'border-rose-300',    icon: 'text-rose-500',    text: 'text-rose-700' },
};

export default function QuickCheck() {
  const navigate = useNavigate();
  const handleSelect = (stateId: string) => {
    playSelect();
    const state = emotionalStates.find(s => s.id === stateId);
    if (state?.isPositive) navigate('/reset/positive-flow');
    else if (state?.isSOS) navigate('/reset/calm-mode');
    else navigate(`/reset/intensity/${stateId}`);
  };

  return (
    <PageTransition>
      <div className="reset-screen-container">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">בדיקה מהירה</h2>
          <p className="text-base text-muted-foreground">לפעמים עוזר לעצור רגע ולבדוק מה קורה בפנים.<br />בחר את מה שהכי קרוב למה שאתה מרגיש עכשיו.</p>
        </div>
        <div className="space-y-2.5">
          {emotionalStates.map((state, i) => {
            const Icon = iconMap[state.icon] || HelpCircle;
            const colors = stateColors[state.id] || stateColors.confusion;
            return (
              <motion.button key={state.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, duration: 0.25 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelect(state.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-right transition-all ${colors.bg} ${colors.border}`}>
                <Icon size={24} strokeWidth={1.5} className={colors.icon} />
                <span className={`text-base font-medium ${colors.text}`}>{state.label}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה למסך הראשי</button>
        </div>
        <button onClick={() => navigate('/reset/contact')} className="reset-floating-adult-btn"><UserCheck size={16} className="inline ml-1" />אני צריך מבוגר</button>
      </div>
    </PageTransition>
  );
}
