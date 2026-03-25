import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, UserCheck } from 'lucide-react';

const labels = ['קצת קשה', 'קשה', 'קשה מאוד'];
function getColor(val: number): string { if (val <= 3) return 'hsl(142, 50%, 45%)'; if (val <= 6) return 'hsl(45, 90%, 50%)'; if (val <= 8) return 'hsl(25, 90%, 55%)'; return 'hsl(0, 75%, 55%)'; }
function getGradient(): string { return 'linear-gradient(to left, hsl(142, 50%, 45%), hsl(45, 90%, 50%), hsl(25, 90%, 55%), hsl(0, 75%, 55%))'; }

export default function IntensityScreen() {
  const { stateId } = useParams<{ stateId: string }>();
  const navigate = useNavigate();
  const [intensity, setIntensity] = useState(5);
  const handleContinue = () => { navigate(`/reset/recommendation/${stateId}/${intensity}`); };
  const quickSelect = (label: string) => { if (label === 'קצת קשה') setIntensity(3); else if (label === 'קשה') setIntensity(6); else setIntensity(9); };

  return (
    <div className="reset-screen-container">
      <div className="text-center mb-8"><h2 className="text-xl font-bold text-foreground mb-2">כמה חזק זה עכשיו?</h2><p className="text-base text-muted-foreground">זה עוזר לבחור כלי מתאים.</p></div>
      <div className="flex justify-center gap-3 mb-8">{labels.map(label => (<button key={label} onClick={() => quickSelect(label)} className="reset-btn-secondary text-sm py-2 px-4">{label}</button>))}</div>
      <div className="px-4 mb-6">
        <div className="relative h-4 rounded-full overflow-hidden mb-4" style={{ background: 'hsl(210, 15%, 90%)' }}><div className="absolute inset-0 rounded-full" style={{ background: getGradient(), width: `${intensity * 10}%`, transition: 'width 200ms' }} /></div>
        <input type="range" min={1} max={10} value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="w-full accent-primary" style={{ accentColor: getColor(intensity) }} />
        <div className="flex justify-between text-xs text-muted-foreground mt-1" dir="ltr"><span>1</span><span>5</span><span>10</span></div>
      </div>
      <motion.div key={intensity} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center mb-8"><span className="inline-block text-4xl font-bold tabular-nums" style={{ color: getColor(intensity) }}>{intensity}</span></motion.div>
      <div className="flex justify-center"><button onClick={handleContinue} className="reset-btn-primary px-8">המשך</button></div>
      <div className="mt-8 flex justify-center"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה למסך הראשי</button></div>
      <button onClick={() => navigate('/reset/contact')} className="reset-floating-adult-btn"><UserCheck size={16} className="inline ml-1" />אני צריך מבוגר</button>
    </div>
  );
}
