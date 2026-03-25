import { useNavigate } from 'react-router-dom';
import { Home, Brain } from 'lucide-react';

export default function BrainTraining() {
  const navigate = useNavigate();
  return (
    <div className="reset-screen-container">
      <div className="text-center mb-6"><h2 className="text-2xl font-extrabold text-foreground flex items-center justify-center gap-2"><Brain size={28} className="text-primary" />אימון מוח</h2><p className="text-base text-muted-foreground mt-2">משחקי אימון מוח יתווספו בקרוב!</p></div>
      <div className="flex justify-center mt-8"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה</button></div>
    </div>
  );
}
