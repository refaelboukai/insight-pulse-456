import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { emotionalStates } from '@/data/skills';
import { Smile, Flame, AlertTriangle, CloudRain, Waves, Users, BookOpen, Battery, HelpCircle, AlertOctagon, Home, UserCheck } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';
import { playSelect } from '@/hooks/useSoundEffects';

const iconMap: Record<string, any> = { Smile, Flame, AlertTriangle, CloudRain, Waves, Users, BookOpen, Battery, HelpCircle, AlertOctagon };

const stateColors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  good: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', text: 'text-emerald-700' },
  anger: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-400', text: 'text-red-700' },
  anxiety: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', text: 'text-amber-700' },
  sadness: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-400', text: 'text-blue-700' },
  overwhelm: { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-500', text: 'text-cyan-700' },
  conflict: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-400', text: 'text-orange-700' },
  'academic-stress': { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-400', text: 'text-indigo-700' },
  exhaustion: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-400', text: 'text-slate-600' },
  confusion: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-400', text: 'text-purple-700' },
  sos: { bg: 'bg-red-100', border: 'border-red-300', icon: 'text-red-600', text: 'text-red-800' },
};

export default function QuickCheck() {
  const navigate = useNavigate();

  const handleSelect = (stateId: string) => {
    playSelect();
    if (stateId === 'good') navigate('/student/positive-flow');
    else if (stateId === 'sos') navigate('/student/breathing');
    else navigate(`/student/intensity/${stateId}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">איך אתה מרגיש עכשיו?</h2>
          <p className="text-sm text-muted-foreground">בחר את מה שהכי קרוב למה שאתה מרגיש.</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto mb-8">
          {emotionalStates.map((state, i) => {
            const Icon = iconMap[state.icon] || Smile;
            const colors = stateColors[state.id] || stateColors.good;
            return (
              <motion.button
                key={state.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(state.id)}
                className={`${colors.bg} border ${colors.border} rounded-2xl p-3 flex items-center gap-2.5 transition-shadow hover:shadow-md ${state.isSOS ? 'col-span-2' : ''}`}
              >
                <Icon size={22} className={colors.icon} />
                <span className={`text-sm font-semibold ${colors.text}`}>{state.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
