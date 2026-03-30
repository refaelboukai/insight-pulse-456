import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { skills, getSkillRecommendations } from '@reset/data/skills';
import { useApp } from '@reset/contexts/AppContext';
import { Home, UserCheck, Star, Play } from 'lucide-react';

export default function SkillRecommendation() {
  const { stateId, intensity } = useParams<{ stateId: string; intensity: string }>();
  const navigate = useNavigate();
  const { favoriteSkills, toggleFavorite, logActivity, student, role } = useApp();
  const intensityNum = Number(intensity) || 5;

  const recommended = getSkillRecommendations(stateId || '', intensityNum);
  const recommendedSkills = recommended.map(id => skills.find(s => s.id === id)).filter(Boolean);

  const handleStart = (skillId: string) => {
    if (role === 'student' && student) {
      logActivity({
        studentId: student.id,
        studentName: student.name,
        selectedState: stateId || '',
        intensityScore: intensityNum,
        skillUsed: skillId,
        supportRequested: false,
        skillHelpful: undefined,
      });
    }

    if (skillId === 'breathing') {
      navigate('/breathing');
    } else if (skillId === 'grounding') {
      navigate('/grounding');
    } else {
      const skill = skills.find(s => s.id === skillId);
      if (skill?.hasWritingMode) {
        navigate(`/writing/${skillId}/${stateId}/${intensity}`);
      } else {
        navigate(`/practice/${skillId}/${stateId}/${intensity}`);
      }
    }
  };

  return (
    <div className="screen-container">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-foreground mb-3">הכלי שיכול לעזור עכשיו</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          התרגול הבא קצר ויכול לעזור לך לעצור רגע ולבחור תגובה טובה יותר.
        </p>
      </div>

      <div className="card-reset p-5 mb-5 bg-check-blue/50">
        <p className="text-base text-check-blue-text font-bold">
          💡 למה הכלי הזה מתאים עכשיו?
        </p>
        <p className="text-base text-check-blue-text/80 mt-1">
          כאשר הרגש חזק, עצירה קצרה עוזרת למוח להירגע לפני תגובה.
        </p>
      </div>

      <div className="space-y-4">
        {recommendedSkills.map((skill, i) => skill && (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card-reset p-6"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold text-foreground">{skill.name}</h3>
                {skill.englishName && (
                  <p className="text-sm text-muted-foreground" dir="ltr">{skill.englishName}</p>
                )}
              </div>
              <button
                onClick={() => toggleFavorite(skill.id)}
                className="p-1"
              >
                <Star
                  size={22}
                  fill={favoriteSkills.includes(skill.id) ? 'hsl(45, 90%, 50%)' : 'none'}
                  className={favoriteSkills.includes(skill.id) ? 'text-warning' : 'text-muted-foreground'}
                />
              </button>
            </div>
            <p className="text-base text-foreground/80 mb-3">{skill.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">⏱ {skill.estimatedTime}</span>
              <button
                onClick={() => handleStart(skill.id)}
                className="btn-primary text-base py-2.5 px-6 flex items-center gap-1"
              >
                <Play size={16} /> התחל
              </button>
            </div>
          </motion.div>
        ))}
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
