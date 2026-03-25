import { useNavigate } from 'react-router-dom';
import { Home, Brain } from 'lucide-react';

export default function InfoTips() {
  const navigate = useNavigate();
  return (
    <div className="reset-screen-container">
      <div className="text-center mb-6"><div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-3"><Brain size={16} className="text-primary" /><span className="text-xs font-medium text-primary">ידע = כוח</span></div><h2 className="text-xl font-bold text-foreground">מידע וטיפים</h2><p className="text-base text-muted-foreground mt-1">בקרוב - תוכן מלא</p></div>
      <div className="flex justify-center mt-8"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה</button></div>
    </div>
  );
}
