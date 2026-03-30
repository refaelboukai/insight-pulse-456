import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@reset/contexts/AppContext';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

const sources = ['ספורט', 'חברים', 'מוזיקה', 'לימודים', 'משהו אחר'];

export default function PositiveFlow() {
  const navigate = useNavigate();
  const { logActivity, student, role } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (source: string) => {
    setSelected(source);
    if (role === 'student' && student) {
      logActivity({
        studentId: student.id,
        studentName: student.name,
        selectedState: 'good',
        supportRequested: false,
        isPositiveReflection: true,
        positiveSource: source,
      });
    }
  };

  if (selected) {
    return (
      <div className="screen-container flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-5xl mb-4 block">🌟</span>
          <h2 className="text-2xl font-extrabold text-foreground mb-3">יופי שאתה מרגיש טוב!</h2>
          <p className="text-lg text-muted-foreground mb-6">שווה לזכור את הרגע הזה.</p>
          <button onClick={() => navigate('/')} className="btn-primary text-lg py-3 px-8">חזרה למסך הראשי</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-foreground mb-2">מה עוזר לך להרגיש טוב היום?</h2>
      </div>
      <div className="space-y-3 max-w-sm mx-auto">
        {sources.map((source, i) => (
          <motion.button
            key={source}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleSelect(source)}
            className="card-reset w-full p-5 text-center bg-sage"
          >
            <span className="text-lg font-semibold text-sage-text">{source}</span>
          </motion.button>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
          <Home size={16} /> חזרה למסך הראשי
        </button>
      </div>
    </div>
  );
}
