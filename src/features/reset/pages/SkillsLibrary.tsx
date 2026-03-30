import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skills } from '@reset/data/skills';
import { useApp } from '@reset/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, UserCheck, Star, Play, Wind, Brain, MessageCircle, Heart, ChevronDown } from 'lucide-react';

const categories = [
  { id: 'calming', label: 'הרגעה', icon: Wind, bg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-blue-100', iconColor: 'text-blue-500', cardBg: 'bg-blue-50/60', cardBorder: 'border-blue-100' },
  { id: 'thinking', label: 'חשיבה', icon: Brain, bg: 'bg-amber-50', border: 'border-amber-200', headerBg: 'bg-amber-100', iconColor: 'text-amber-600', cardBg: 'bg-amber-50/60', cardBorder: 'border-amber-100' },
  { id: 'communication', label: 'תקשורת', icon: MessageCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', headerBg: 'bg-emerald-100', iconColor: 'text-emerald-600', cardBg: 'bg-emerald-50/60', cardBorder: 'border-emerald-100' },
  { id: 'acceptance', label: 'קבלה', icon: Heart, bg: 'bg-purple-50', border: 'border-purple-200', headerBg: 'bg-purple-100', iconColor: 'text-purple-500', cardBg: 'bg-purple-50/60', cardBorder: 'border-purple-100' },
];

export default function SkillsLibrary() {
  const navigate = useNavigate();
  const { favoriteSkills, toggleFavorite } = useApp();
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setOpenCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleStart = (skillId: string) => {
    if (skillId === 'breathing') navigate('/breathing');
    else if (skillId === 'grounding') navigate('/grounding');
    else {
      const skill = skills.find(s => s.id === skillId);
      if (skill?.hasWritingMode) navigate(`/writing/${skillId}/general/5`);
      else navigate(`/practice/${skillId}/general/5`);
    }
  };

  return (
    <div className="screen-container">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-foreground mb-2">הכלים שלי</h2>
      </div>

      {/* Quick practice */}
      <div className="card-reset p-5 mb-6 bg-sage">
        <p className="text-base font-semibold text-sage-text mb-3">תרגול קצר להרגעה מיידית</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('/breathing')} className="btn-reset bg-card text-foreground text-sm font-medium py-2.5 px-4">נשימה להרגעה</button>
          <button onClick={() => navigate('/grounding')} className="btn-reset bg-card text-foreground text-sm font-medium py-2.5 px-4">קרקוע 5-4-3-2-1</button>
        </div>
      </div>

      {categories.map((cat, catIdx) => {
        const Icon = cat.icon;
        const catSkills = skills.filter(s => s.category === cat.id);
        const isOpen = openCategories.includes(cat.id);
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.08 }}
            className={`mb-3 rounded-2xl border ${cat.border} overflow-hidden`}
          >
            <button
              onClick={() => toggleCategory(cat.id)}
              className={`${cat.headerBg} w-full px-4 py-4 flex items-center gap-2.5 cursor-pointer transition-colors`}
            >
              <Icon size={22} className={cat.iconColor} />
              <h3 className="text-lg font-bold text-foreground">{cat.label}</h3>
              <span className="text-sm text-muted-foreground mr-auto font-medium">{catSkills.length} כלים</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} className="text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-2.5 space-y-2.5">
                    {catSkills.map((skill, i) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`${cat.cardBg} border ${cat.cardBorder} rounded-xl p-4 flex items-center justify-between`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-foreground">{skill.name}</h4>
                            <button onClick={() => toggleFavorite(skill.id)} className="p-0.5">
                              <Star size={16} fill={favoriteSkills.includes(skill.id) ? 'hsl(45,90%,50%)' : 'none'} className={favoriteSkills.includes(skill.id) ? 'text-warning' : 'text-muted-foreground'} />
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>
                        </div>
                        <button onClick={() => handleStart(skill.id)} className="btn-primary text-sm py-2 px-4 flex items-center gap-1 mr-3">
                          <Play size={14} /> התחל
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <div className="flex justify-center mt-4">
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
