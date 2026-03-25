// Stub pages - will be fleshed out in follow-up
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function SelfReminders() {
  const navigate = useNavigate();
  return (
    <div className="reset-screen-container">
      <div className="text-center mb-6"><h2 className="text-xl font-bold text-foreground mb-2">תזכורות לעצמי</h2><p className="text-base text-muted-foreground">בקרוב - תוכן מלא</p></div>
      <div className="flex justify-center mt-8"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה</button></div>
    </div>
  );
}
