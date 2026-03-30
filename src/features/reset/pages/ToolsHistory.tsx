import { useNavigate } from 'react-router-dom';
import { useApp } from '@reset/contexts/AppContext';
import { skills } from '@reset/data/skills';
import { motion } from 'framer-motion';
import { Home, UserCheck, Star, TrendingUp } from 'lucide-react';

export default function ToolsHistory() {
  const navigate = useNavigate();
  const { activities, favoriteSkills } = useApp();

  // Count helpful skills
  const skillCounts: Record<string, { count: number; lastUsed: string }> = {};
  activities.forEach(a => {
    if (a.skillUsed) {
      if (!skillCounts[a.skillUsed]) skillCounts[a.skillUsed] = { count: 0, lastUsed: a.timestamp };
      skillCounts[a.skillUsed].count++;
      if (a.timestamp > skillCounts[a.skillUsed].lastUsed) {
        skillCounts[a.skillUsed].lastUsed = a.timestamp;
      }
    }
  });

  const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1].count - a[1].count);
  const favSkills = skills.filter(s => favoriteSkills.includes(s.id));

  // Insights
  const totalDays = new Set(activities.map(a => new Date(a.timestamp).toDateString())).size;
  const topSkill = sortedSkills[0];

  return (
    <div className="screen-container">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-foreground mb-2">מה עזר לי בעבר</h2>
      </div>

      {/* Insights */}
      {(totalDays > 0 || topSkill) && (
        <div className="card-reset p-5 mb-6 bg-check-blue">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-check-blue-icon" />
            <span className="text-base font-bold text-check-blue-text">תובנות אישיות</span>
          </div>
          {topSkill && (
            <p className="text-base text-check-blue-text/80">
              נראה שכלי {skills.find(s => s.id === topSkill[0])?.name || topSkill[0]} עוזר לך. השתמשת בו {topSkill[1].count} פעמים.
            </p>
          )}
          {totalDays > 0 && (
            <p className="text-base text-check-blue-text/80 mt-1">
              השתמשת באפליקציה {totalDays} ימים.
            </p>
          )}
        </div>
      )}

      {/* Favorites */}
      {favSkills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Star size={18} className="text-warning" /> הכלים האהובים עלי
          </h3>
          <div className="space-y-2">
            {favSkills.map(skill => (
              <div key={skill.id} className="card-reset p-4 bg-sand/50">
                <span className="text-base font-semibold text-foreground">{skill.name}</span>
                <span className="text-sm text-muted-foreground mr-2">– {skill.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage history */}
      <h3 className="text-lg font-bold text-foreground mb-3">שימוש בכלים</h3>
      {sortedSkills.length === 0 ? (
        <p className="text-base text-muted-foreground text-center py-8">עדיין אין נתונים. התחל להשתמש בכלים!</p>
      ) : (
        <div className="space-y-2 mb-8">
          {sortedSkills.map(([skillId, data]) => {
            const skill = skills.find(s => s.id === skillId);
            return (
              <div key={skillId} className="card-reset p-4 flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">{skill?.name || skillId}</span>
                <div className="text-left">
                  <span className="text-sm text-muted-foreground font-medium">{data.count} פעמים</span>
                  <br />
                  <span className="text-sm text-muted-foreground">{new Date(data.lastUsed).toLocaleDateString('he-IL')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
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
