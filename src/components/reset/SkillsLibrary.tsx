import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skills } from '@/data/skills';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Play, Wind, Brain, MessageCircle, Heart, ChevronDown } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

const categories = [
  { id: 'calming', label: 'הרגעה', icon: Wind, bg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-blue-100', iconColor: 'text-blue-500' },
  { id: 'thinking', label: 'חשיבה', icon: Brain, bg: 'bg-amber-50', border: 'border-amber-200', headerBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { id: 'communication', label: 'תקשורת', icon: MessageCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', headerBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { id: 'acceptance', label: 'קבלה', icon: Heart, bg: 'bg-purple-50', border: 'border-purple-200', headerBg: 'bg-purple-100', iconColor: 'text-purple-500' },
];

export default function SkillsLibrary() {
  const navigate = useNavigate();
  const [openCats, setOpenCats] = useState<string[]>([]);

  const toggleCat = (id: string) => setOpenCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleStart = (skillId: string) => {
    if (skillId === 'breathing') navigate('/student/breathing');
    else if (skillId === 'grounding') navigate('/student/grounding');
    else navigate(`/student/practice/${skillId}/general/5`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">הכלים שלי</h2>
        </div>

        <div className="rounded-2xl border bg-card p-4 mb-6 shadow-sm max-w-md mx-auto">
          <p className="text-sm font-medium text-foreground mb-3">תרגול קצר להרגעה מיידית</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => navigate('/student/breathing')} className="border rounded-xl text-xs py-2 px-3 hover:bg-muted/50">נשימה להרגעה</button>
            <button onClick={() => navigate('/student/grounding')} className="border rounded-xl text-xs py-2 px-3 hover:bg-muted/50">קרקוע 5-4-3-2-1</button>
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-3">
          {categories.map(cat => {
            const Icon = cat.icon;
            const catSkills = skills.filter(s => s.category === cat.id);
            const isOpen = openCats.includes(cat.id);
            return (
              <div key={cat.id} className={`rounded-2xl border ${cat.border} overflow-hidden`}>
                <button onClick={() => toggleCat(cat.id)} className={`${cat.headerBg} w-full px-4 py-3.5 flex items-center gap-2`}>
                  <Icon size={18} className={cat.iconColor} />
                  <h3 className="text-sm font-bold text-foreground">{cat.label}</h3>
                  <span className="text-xs text-muted-foreground mr-auto">{catSkills.length} כלים</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={18} className="text-muted-foreground" /></motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-2 space-y-2">
                        {catSkills.map(skill => (
                          <div key={skill.id} className="rounded-xl p-3 flex items-center justify-between bg-card border">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-foreground">{skill.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                            </div>
                            <button onClick={() => handleStart(skill.id)} className="bg-primary text-primary-foreground text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 mr-3 font-semibold">
                              <Play size={12} /> התחל
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-6">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
