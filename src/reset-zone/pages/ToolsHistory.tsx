import { useNavigate } from 'react-router-dom';
import { useApp } from '@/reset-zone/contexts/AppContext';
import { skills } from '@/reset-zone/data/skills';
import { motion } from 'framer-motion';
import { Home, UserCheck, Star, TrendingUp } from 'lucide-react';

export default function ToolsHistory() {
  const navigate = useNavigate();
  const { activities, favoriteSkills } = useApp();
  const skillCounts: Record<string, { count: number; lastUsed: string }> = {};
  activities.forEach(a => { if (a.skillUsed) { if (!skillCounts[a.skillUsed]) skillCounts[a.skillUsed] = { count: 0, lastUsed: a.timestamp }; skillCounts[a.skillUsed].count++; if (a.timestamp > skillCounts[a.skillUsed].lastUsed) skillCounts[a.skillUsed].lastUsed = a.timestamp; } });
  const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1].count - a[1].count);
  const favSkills = skills.filter(s => favoriteSkills.includes(s.id));
  const totalDays = new Set(activities.map(a => new Date(a.timestamp).toDateString())).size;
  const topSkill = sortedSkills[0];

  return (
    <div className="reset-screen-container">
      <div className="text-center mb-6"><h2 className="text-xl font-bold text-foreground mb-2">מה עזר לי בעבר</h2></div>
      {(totalDays > 0 || topSkill) && (<div className="reset-card p-4 mb-6 bg-check-blue"><div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-check-blue-icon" /><span className="text-sm font-semibold text-check-blue-text">תובנות אישיות</span></div>{topSkill && <p className="text-sm text-check-blue-text/80">נראה שכלי {skills.find(s => s.id === topSkill[0])?.name || topSkill[0]} עוזר לך. השתמשת בו {topSkill[1].count} פעמים.</p>}{totalDays > 0 && <p className="text-sm text-check-blue-text/80 mt-1">השתמשת באפליקציה {totalDays} ימים.</p>}</div>)}
      {favSkills.length > 0 && (<div className="mb-6"><h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2"><Star size={16} className="text-warning" /> הכלים האהובים עלי</h3><div className="space-y-2">{favSkills.map(skill => (<div key={skill.id} className="reset-card p-3 bg-sand/50"><span className="text-sm font-medium text-foreground">{skill.name}</span><span className="text-xs text-muted-foreground mr-2">– {skill.description}</span></div>))}</div></div>)}
      <h3 className="text-base font-bold text-foreground mb-3">שימוש בכלים</h3>
      {sortedSkills.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">עדיין אין נתונים. התחל להשתמש בכלים!</p> : (<div className="space-y-2 mb-8">{sortedSkills.map(([skillId, data]) => { const skill = skills.find(s => s.id === skillId); return (<div key={skillId} className="reset-card p-3 flex justify-between items-center"><span className="text-sm font-medium text-foreground">{skill?.name || skillId}</span><div className="text-left"><span className="text-xs text-muted-foreground">{data.count} פעמים</span><br /><span className="text-xs text-muted-foreground">{new Date(data.lastUsed).toLocaleDateString('he-IL')}</span></div></div>); })}</div>)}
      <div className="flex justify-center"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה למסך הראשי</button></div>
      <button onClick={() => navigate('/reset/contact')} className="reset-floating-adult-btn"><UserCheck size={16} className="inline ml-1" />אני צריך מבוגר</button>
    </div>
  );
}
