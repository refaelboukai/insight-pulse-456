import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { skills, getSkillRecommendations } from '@/reset-zone/data/skills';
import { useApp } from '@/reset-zone/contexts/AppContext';
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
      logActivity({ studentId: student.id, studentName: student.name, selectedState: stateId || '', intensityScore: intensityNum, skillUsed: skillId, supportRequested: false, skillHelpful: undefined });
    }
    if (skillId === 'breathing') navigate('/reset/breathing');
    else if (skillId === 'grounding') navigate('/reset/grounding');
    else {
      const skill = skills.find(s => s.id === skillId);
      if (skill?.hasWritingMode) navigate(`/reset/writing/${skillId}/${stateId}/${intensity}`);
      else navigate(`/reset/practice/${skillId}/${stateId}/${intensity}`);
    }
  };

  return (
    <div className="reset-screen-container">
      <div className="text-center mb-6"><h2 className="text-xl font-bold text-foreground mb-2">הכלי שיכול לעזור עכשיו</h2><p className="text-base text-muted-foreground">התרגול הבא קצר ויכול לעזור לך לעצור רגע ולבחור תגובה טובה יותר.</p></div>
      <div className="reset-card p-4 mb-4 bg-check-blue/50"><p className="text-sm text-check-blue-text font-medium">💡 למה הכלי הזה מתאים עכשיו?</p><p className="text-sm text-check-blue-text/80 mt-1">כאשר הרגש חזק, עצירה קצרה עוזרת למוח להירגע לפני תגובה.</p></div>
      <div className="space-y-4">
        {recommendedSkills.map((skill, i) => skill && (
          <motion.div key={skill.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="reset-card p-5">
            <div className="flex justify-between items-start mb-2">
              <div><h3 className="text-lg font-bold text-foreground">{skill.name}</h3></div>
              <button onClick={() => toggleFavorite(skill.id)} className="p-1"><Star size={20} fill={favoriteSkills.includes(skill.id) ? 'hsl(45, 90%, 50%)' : 'none'} className={favoriteSkills.includes(skill.id) ? 'text-warning' : 'text-muted-foreground'} /></button>
            </div>
            <p className="text-sm text-foreground/80 mb-3">{skill.description}</p>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">⏱ {skill.estimatedTime}</span><button onClick={() => handleStart(skill.id)} className="reset-btn-primary text-sm py-2 px-5 flex items-center gap-1"><Play size={14} /> התחל</button></div>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 flex justify-center"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה למסך הראשי</button></div>
      <button onClick={() => navigate('/reset/contact')} className="reset-floating-adult-btn"><UserCheck size={16} className="inline ml-1" />אני צריך מבוגר</button>
    </div>
  );
}
