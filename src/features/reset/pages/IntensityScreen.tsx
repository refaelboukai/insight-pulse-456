import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, UserCheck } from 'lucide-react';

const labels = ['קצת קשה', 'קשה', 'קשה מאוד'];

function getColor(val: number): string {
  if (val <= 3) return 'hsl(142, 50%, 45%)';
  if (val <= 6) return 'hsl(45, 90%, 50%)';
  if (val <= 8) return 'hsl(25, 90%, 55%)';
  return 'hsl(0, 75%, 55%)';
}

function getGradient(): string {
  return 'linear-gradient(to left, hsl(142, 50%, 45%), hsl(45, 90%, 50%), hsl(25, 90%, 55%), hsl(0, 75%, 55%))';
}

export default function IntensityScreen() {
  const { stateId } = useParams<{ stateId: string }>();
  const navigate = useNavigate();
  const [intensity, setIntensity] = useState(5);

  const handleContinue = () => {
    navigate(`/recommendation/${stateId}/${intensity}`);
  };

  const quickSelect = (label: string) => {
    if (label === 'קצת קשה') setIntensity(3);
    else if (label === 'קשה') setIntensity(6);
    else setIntensity(9);
  };

  return (
    <div className="screen-container">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-foreground mb-3">כמה חזק זה עכשיו?</h2>
        <p className="text-lg text-muted-foreground">זה עוזר לבחור כלי מתאים.</p>
      </div>

      {/* Quick labels */}
      <div className="flex justify-center gap-3 mb-8">
        {labels.map(label => (
          <button
            key={label}
            onClick={() => quickSelect(label)}
            className="btn-secondary text-base font-semibold py-2.5 px-5"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="px-4 mb-6">
        <div className="relative h-5 rounded-full overflow-hidden mb-4" style={{ background: 'hsl(210, 15%, 90%)' }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: getGradient(), width: `${intensity * 10}%`, transition: 'width 200ms' }}
          />
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={intensity}
          onChange={e => setIntensity(Number(e.target.value))}
          className="w-full accent-primary"
          style={{ accentColor: getColor(intensity) }}
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-1 font-medium" dir="ltr">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Current value */}
      <motion.div
        key={intensity}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="text-center mb-8"
      >
        <span
          className="inline-block text-5xl font-extrabold tabular-nums"
          style={{ color: getColor(intensity) }}
        >
          {intensity}
        </span>
      </motion.div>

      <div className="flex justify-center">
        <button onClick={handleContinue} className="btn-primary px-10 text-lg py-3">
          המשך
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <Home size={16} /> חזרה למסך הראשי
        </button>
      </div>

      <button onClick={() => navigate('/contact')} className="floating-adult-btn">
        <UserCheck size={16} className="inline ml-1" />
        אני צריך מבוגר
      </button>
    </div>
  );
}
