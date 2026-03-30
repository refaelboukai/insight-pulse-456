import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function BreathingExercise() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timer, setTimer] = useState(40);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!started || done) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setDone(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, done]);

  useEffect(() => {
    if (!started || done) return;
    // Cycle: 4s inhale, 2s hold, 6s exhale = 12s total
    const cycle = () => {
      setPhase('inhale');
      setTimeout(() => setPhase('hold'), 4000);
      setTimeout(() => setPhase('exhale'), 6000);
    };
    cycle();
    const interval = setInterval(cycle, 12000);
    return () => clearInterval(interval);
  }, [started, done]);

  const phaseText = phase === 'inhale' ? 'שאיפה...' : phase === 'hold' ? 'החזקה...' : 'נשיפה...';
  const scale = phase === 'inhale' ? 1.8 : phase === 'hold' ? 1.8 : 1;

  if (done) {
    return (
      <div className="screen-container flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-extrabold text-foreground mb-4">כל הכבוד!</h2>
        <p className="text-lg text-muted-foreground mb-8">סיימת את תרגול הנשימה.</p>
        <button onClick={() => navigate('/post-practice')} className="btn-primary text-lg py-3 px-8">
          המשך
        </button>
      </div>
    );
  }

  return (
    <div className="screen-container flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-extrabold text-foreground mb-2">נשימה להרגעה</h2>
      <p className="text-lg text-muted-foreground mb-8">עקוב אחרי התנועה של העיגול.</p>

      {!started ? (
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">תרגול קצר – כ-40 שניות</p>
          <button onClick={() => setStarted(true)} className="btn-primary px-10 text-lg py-3">
            התחל
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex items-center justify-center mb-8" style={{ width: 200, height: 200 }}>
            <motion.div
              animate={{ scale }}
              transition={{
                duration: phase === 'inhale' ? 4 : phase === 'hold' ? 0.1 : 6,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="w-24 h-24 rounded-full"
              style={{
                background: 'hsl(174, 42%, 65%)',
                boxShadow: '0 0 40px 20px hsla(174, 42%, 65%, 0.3)',
              }}
            />
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">{phaseText}</p>
          <p className="text-lg text-muted-foreground tabular-nums font-medium">{timer} שניות</p>
        </>
      )}

      <div className="mt-8">
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <Home size={16} /> חזרה למסך הראשי
        </button>
      </div>
    </div>
  );
}
