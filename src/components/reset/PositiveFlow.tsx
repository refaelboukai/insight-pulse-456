import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

const sources = ['ספורט', 'חברים', 'מוזיקה', 'לימודים', 'משהו אחר'];

export default function PositiveFlow() {
  const navigate = useNavigate();
  const { fullName, lockedStudentId } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (source: string) => {
    setSelected(source);
    if (lockedStudentId) {
      await supabase.from('activity_logs').insert({
        student_id: lockedStudentId,
        student_name: fullName || 'אנונימי',
        selected_state: 'good',
        support_requested: false,
        is_positive_reflection: true,
        positive_source: source,
      });
    }
  };

  if (selected) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center" style={{ background: 'var(--gradient-warm)' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-4xl mb-4 block">🌟</span>
            <h2 className="text-xl font-bold text-foreground mb-3">יופי שאתה מרגיש טוב!</h2>
            <p className="text-sm text-muted-foreground mb-6">שווה לזכור את הרגע הזה.</p>
            <button onClick={() => navigate('/student')} className="bg-primary text-primary-foreground rounded-xl px-6 py-2.5 font-semibold">חזרה למסך הראשי</button>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">מה עוזר לך להרגיש טוב היום?</h2>
        </div>
        <div className="space-y-3 max-w-sm mx-auto">
          {sources.map((source, i) => (
            <motion.button key={source} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => handleSelect(source)}
              className="w-full rounded-2xl p-4 text-center bg-emerald-50 border hover:shadow-md transition-shadow">
              <span className="text-base font-medium text-emerald-700">{source}</span>
            </motion.button>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
