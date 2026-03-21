import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Check, RotateCcw, Sparkles, Plus, Wind, Dumbbell, Heart, Users, House, Palette, Sun } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

interface ReminderCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: string[];
}

const categories: ReminderCategory[] = [
  { id: 'body', label: 'גוף ותנועה', icon: <Dumbbell size={18} />, items: ['לצאת לשמש להליכה', 'לעשות יוגה', 'חדר כושר', 'לשחק כדורגל', 'לשתות כוס מים'] },
  { id: 'calm', label: 'הרגעה ורוגע', icon: <Wind size={18} />, items: ['לשמוע מוזיקה', 'לקרוא ספר', 'לעשות נשימות', 'להקשיב לפודקאסט'] },
  { id: 'social', label: 'חברתי ומשפחתי', icon: <Users size={18} />, items: ['להתקשר למשפחה', 'להתקשר לחבר', 'ללטף את החיה שלי', 'לעזור למישהו'] },
  { id: 'creative', label: 'יצירתיות', icon: <Palette size={18} />, items: ['לצייר', 'לנגן', 'לאפות', 'לבשל', 'ללמוד משהו חדש'] },
  { id: 'selfcare', label: 'טיפול עצמי', icon: <Heart size={18} />, items: ['להתלבש יפה', 'להתקלח', 'לאכול משהו טעים'] },
  { id: 'home', label: 'סדר ובית', icon: <House size={18} />, items: ['לנקות את החדר', 'לסדר פינה קטנה', 'לייצר לו״ז למחר'] },
  { id: 'positive', label: 'חשיבה חיובית', icon: <Sun size={18} />, items: ['לחגוג הצלחה קטנה', 'לצאת לטבע', 'לכתוב מחשבה טובה על עצמי'] },
];

const categoryColors: Record<string, { bg: string; icon: string }> = {
  body: { bg: 'bg-orange-50', icon: 'text-orange-500' },
  calm: { bg: 'bg-blue-50', icon: 'text-blue-500' },
  social: { bg: 'bg-pink-50', icon: 'text-pink-500' },
  creative: { bg: 'bg-purple-50', icon: 'text-purple-500' },
  selfcare: { bg: 'bg-rose-50', icon: 'text-rose-500' },
  home: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  positive: { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
};

export default function SelfReminders() {
  const navigate = useNavigate();
  const [completedReminders, setCompletedReminders] = useState<string[]>([]);
  const [customReminder, setCustomReminder] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleReminder = (r: string) => {
    setCompletedReminders(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const addCustom = () => {
    if (customReminder.trim()) {
      setCustomList(prev => [...prev, customReminder.trim()]);
      setCustomReminder('');
    }
  };

  const suggestRandom = () => {
    const allItems = categories.flatMap(c => c.items).concat(customList).filter(r => !completedReminders.includes(r));
    if (allItems.length > 0) alert('💡 ' + allItems[Math.floor(Math.random() * allItems.length)]);
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-4 pb-20" style={{ background: 'var(--gradient-warm)' }}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={14} /> חזרה
          </button>
        </div>

        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-foreground mb-1">תזכורות לעצמי</h2>
          <p className="text-sm text-muted-foreground">דברים קטנים יכולים לשנות את ההרגשה.</p>
        </div>

        {completedReminders.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 px-1">
              <span>עשיתי {completedReminders.length} דברים טובים</span>
              {completedReminders.length >= 3 && <span className="text-emerald-600 font-medium">✨ כל הכבוד!</span>}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-l from-emerald-400 to-emerald-500 rounded-full" initial={{ width: 0 }}
                animate={{ width: `${Math.min((completedReminders.length / 10) * 100, 100)}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button onClick={suggestRandom} className="bg-primary text-primary-foreground text-sm py-2 flex-1 rounded-xl flex items-center justify-center gap-1 font-semibold">
            <Sparkles size={14} /> הצע לי משהו
          </button>
          <button onClick={() => setCompletedReminders([])} className="border text-sm py-2 px-3 rounded-xl flex items-center gap-1 text-muted-foreground">
            <RotateCcw size={14} /> אפס
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {categories.map(cat => {
            const colors = categoryColors[cat.id] || { bg: 'bg-muted', icon: 'text-foreground' };
            const isExpanded = expandedCategories.includes(cat.id);
            return (
              <div key={cat.id} className={`rounded-2xl border overflow-hidden ${colors.bg}`}>
                <button onClick={() => toggleCategory(cat.id)} className="w-full p-3 flex items-center gap-2">
                  <span className={colors.icon}>{cat.icon}</span>
                  <span className="text-sm font-semibold text-foreground flex-1 text-right">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">{cat.items.filter(i => completedReminders.includes(i)).length}/{cat.items.length}</span>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {cat.items.map(item => (
                      <button key={item} onClick={() => toggleReminder(item)}
                        className={`w-full text-right p-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors ${completedReminders.includes(item) ? 'bg-primary/10 line-through text-muted-foreground' : 'bg-card'}`}>
                        {completedReminders.includes(item) ? <Check size={14} className="text-primary" /> : <div className="w-3.5 h-3.5 rounded border border-muted-foreground/30" />}
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom */}
        <div className="flex gap-2 mb-4">
          <input value={customReminder} onChange={e => setCustomReminder(e.target.value)} placeholder="הוסף תזכורת משלך..."
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm" />
          <button onClick={addCustom} className="bg-primary text-primary-foreground rounded-xl px-3 py-2"><Plus size={16} /></button>
        </div>
        {customList.map(item => (
          <button key={item} onClick={() => toggleReminder(item)}
            className={`w-full text-right p-2.5 rounded-xl text-sm flex items-center gap-2 mb-1.5 ${completedReminders.includes(item) ? 'bg-primary/10 line-through text-muted-foreground' : 'bg-card border'}`}>
            {completedReminders.includes(item) ? <Check size={14} className="text-primary" /> : <div className="w-3.5 h-3.5 rounded border border-muted-foreground/30" />}
            {item}
          </button>
        ))}
      </div>
    </PageTransition>
  );
}
