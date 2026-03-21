import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { emotionalStates } from '@/data/skills';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

export default function IntensityScreen() {
  const { stateId } = useParams<{ stateId: string }>();
  const navigate = useNavigate();
  const [intensity, setIntensity] = useState(5);
  const state = emotionalStates.find(s => s.id === stateId);

  const getColor = (val: number) => val <= 3 ? 'hsl(142,50%,45%)' : val <= 6 ? 'hsl(45,90%,50%)' : 'hsl(0,70%,55%)';

  const handleContinue = () => {
    navigate(`/student/recommendation/${stateId}/${intensity}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-4 flex flex-col items-center justify-center" style={{ background: 'var(--gradient-warm)' }}>
        <h2 className="text-xl font-bold text-foreground mb-2">כמה חזק הרגש?</h2>
        <p className="text-sm text-muted-foreground mb-8">{state?.label}</p>

        <div className="px-4 mb-6 w-full max-w-sm">
          <input type="range" min={1} max={10} value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full" style={{ accentColor: getColor(intensity) }} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1" dir="ltr">
            <span>1</span><span>5</span><span>10</span>
          </div>
        </div>

        <motion.div key={intensity} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center mb-8">
          <span className="text-4xl font-bold" style={{ color: getColor(intensity) }}>{intensity}</span>
        </motion.div>

        <button onClick={handleContinue} className="bg-primary text-primary-foreground rounded-xl px-8 py-2.5 font-semibold">המשך</button>

        <button onClick={() => navigate('/student')} className="mt-8 text-sm text-muted-foreground flex items-center gap-1">
          <Home size={16} /> חזרה למסך הראשי
        </button>
      </div>
    </PageTransition>
  );
}
