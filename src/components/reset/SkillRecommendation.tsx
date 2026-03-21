import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { skills, getSkillRecommendations } from '@/data/skills';
import { Home, Play } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

export default function SkillRecommendation() {
  const { stateId, intensity } = useParams<{ stateId: string; intensity: string }>();
  const navigate = useNavigate();
  const intensityNum = Number(intensity) || 5;
  const recommended = getSkillRecommendations(stateId || '', intensityNum);
  const recommendedSkills = recommended.map(id => skills.find(s => s.id === id)).filter(Boolean);

  const handleStart = (skillId: string) => {
    if (skillId === 'breathing') navigate('/student/breathing');
    else if (skillId === 'grounding') navigate('/student/grounding');
    else navigate(`/student/practice/${skillId}/${stateId}/${intensity}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">הכלי שיכול לעזור עכשיו</h2>
          <p className="text-sm text-muted-foreground">התרגול הבא קצר ויכול לעזור לך.</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {recommendedSkills.map((skill, i) => skill && (
            <motion.div key={skill.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-bold text-foreground">{skill.name}</h3>
              {skill.englishName && <p className="text-xs text-muted-foreground" dir="ltr">{skill.englishName}</p>}
              <p className="text-sm text-muted-foreground mt-2 mb-3">{skill.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">⏱ {skill.estimatedTime}</span>
                <button onClick={() => handleStart(skill.id)}
                  className="bg-primary text-primary-foreground text-sm py-2 px-5 rounded-xl flex items-center gap-1 font-semibold">
                  <Play size={14} /> התחל
                </button>
              </div>
            </motion.div>
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
