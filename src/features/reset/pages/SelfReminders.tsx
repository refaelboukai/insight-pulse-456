import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@reset/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, UserCheck, Check, RotateCcw, Sparkles, Plus, Sun, Users, House, Palette, Wind, Dumbbell, Heart, CalendarDays, X, Clock, ChevronLeft } from 'lucide-react';
import ActivityDetailPanel from '@reset/components/ActivityDetailPanel';

interface ReminderCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: string[];
}

const categories: ReminderCategory[] = [
  {
    id: 'body',
    label: 'גוף ותנועה',
    icon: <Dumbbell size={18} />,
    items: [
      'לצאת לשמש להליכה', 'לעשות יוגה / פילאטיס', 'חדר כושר',
      'לשחק פינגפונג', 'לשחק כדורגל / כדורסל', 'ללכת לים',
      'לעשות מתיחה לגוף', 'לשתות כוס מים',
    ],
  },
  {
    id: 'calm',
    label: 'הרגעה ורוגע',
    icon: <Wind size={18} />,
    items: [
      'לשמוע מוסיקה', 'לקרוא ספר', 'לעשות נשימות להרגעה',
      'להקשיב לפודקאסט מעניין', 'לכבות את הטלפון ל-10 דקות ולהירגע',
      'לראות סדרה בטלוויזיה',
    ],
  },
  {
    id: 'social',
    label: 'חברתי ומשפחתי',
    icon: <Users size={18} />,
    items: [
      'להתקשר למשפחה', 'להתקשר לחבר או חברה טובה',
      'ללטף את הכלב / חתול שלי', 'לכתוב הודעה מרגשת למישהו',
      'לעשות מעשה טוב למישהו אחר', 'לעזור למישהו בבית',
    ],
  },
  {
    id: 'creative',
    label: 'יצירתיות',
    icon: <Palette size={18} />,
    items: [
      'לצייר / להכין יצירה', 'לנגן', 'לאפות', 'לבשל',
      'ללמוד משהו חדש', 'להשקות את הצמחים',
    ],
  },
  {
    id: 'selfcare',
    label: 'טיפול עצמי',
    icon: <Heart size={18} />,
    items: [
      'לק לציפורניים', 'להתאפר', 'להתלבש יפה', 'להתקלח',
      'לאכול משהו טעים', 'לאכול משהו מתוק', 'להזמין אוכל',
    ],
  },
  {
    id: 'home',
    label: 'סדר ובית',
    icon: <House size={18} />,
    items: [
      'לשטוף כלים / להכניס מדיח', 'לקפל כביסה', 'לנקות את החדר',
      'לסדר פינה קטנה בחדר', 'לייצר לו״ז למחר',
    ],
  },
  {
    id: 'positive',
    label: 'חשיבה חיובית',
    icon: <Sun size={18} />,
    items: [
      'לחגוג הצלחה קטנה', 'לצאת לטבע', 'לכתוב משהו שאני מודה עליו',
      'לכתוב מחשבה טובה על עצמי',
    ],
  },
];

const categoryColors: Record<string, { bg: string; border: string; icon: string; activeBg: string }> = {
  body: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500', activeBg: 'bg-orange-100' },
  calm: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', activeBg: 'bg-blue-100' },
  social: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-500', activeBg: 'bg-pink-100' },
  creative: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500', activeBg: 'bg-purple-100' },
  selfcare: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-500', activeBg: 'bg-rose-100' },
  home: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', activeBg: 'bg-amber-100' },
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', activeBg: 'bg-emerald-100' },
};

export default function SelfReminders() {
  const navigate = useNavigate();
  const { completedReminders, toggleReminder, resetReminders, setTodaySchedule } = useApp();
  const [customReminder, setCustomReminder] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);
  const [randomSuggestion, setRandomSuggestion] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);

  const allDefaultReminders = categories.flatMap(c => c.items);
  const allReminders = [...allDefaultReminders, ...customList];

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const addCustom = () => {
    if (customReminder.trim()) {
      setCustomList(prev => [...prev, customReminder.trim()]);
      setCustomReminder('');
    }
  };

  const suggestRandom = () => {
    const uncompleted = allReminders.filter(r => !completedReminders.includes(r));
    if (uncompleted.length === 0) return;
    setRandomSuggestion(uncompleted[Math.floor(Math.random() * uncompleted.length)]);
  };

  const completedCount = completedReminders.length;
  const totalCount = allReminders.length;

  // Schedule generation logic
  const timeSlots = [
    { label: 'בוקר (07:00–09:00)', icon: '🌅', key: 'morning' },
    { label: 'לפני הצהריים (09:00–12:00)', icon: '☀️', key: 'late_morning' },
    { label: 'צהריים (12:00–14:00)', icon: '🍽️', key: 'noon' },
    { label: 'אחר הצהריים (14:00–17:00)', icon: '🌤️', key: 'afternoon' },
    { label: 'ערב (17:00–20:00)', icon: '🌇', key: 'evening' },
    { label: 'לילה (20:00–22:00)', icon: '🌙', key: 'night' },
  ];

  const categoryToTimeSlot: Record<string, string[]> = {
    body: ['morning', 'afternoon'],
    calm: ['evening', 'night'],
    social: ['late_morning', 'afternoon'],
    creative: ['late_morning', 'noon'],
    selfcare: ['morning', 'evening'],
    home: ['noon', 'late_morning'],
    positive: ['morning', 'night'],
  };

  const generateSchedule = () => {
    const selected = completedReminders;
    if (selected.length === 0) return {};

    const schedule: Record<string, string[]> = {};
    timeSlots.forEach(s => { schedule[s.key] = []; });

    selected.forEach(reminder => {
      // Find which category this reminder belongs to
      let catId = 'positive'; // default
      for (const cat of categories) {
        if (cat.items.includes(reminder)) {
          catId = cat.id;
          break;
        }
      }
      const preferredSlots = categoryToTimeSlot[catId] || ['afternoon'];
      // Pick the slot with fewer items
      const targetSlot = preferredSlots.reduce((a, b) =>
        (schedule[a]?.length || 0) <= (schedule[b]?.length || 0) ? a : b
      );
      schedule[targetSlot].push(reminder);
    });

    // Distribute custom reminders
    customList.filter(r => selected.includes(r)).forEach(reminder => {
      const leastFull = Object.keys(schedule).reduce((a, b) =>
        schedule[a].length <= schedule[b].length ? a : b
      );
      schedule[leastFull].push(reminder);
    });

    return schedule;
  };

  const handleShowSchedule = () => {
    const gen = generateSchedule();
    setShowSchedule(true);
    // Save as tomorrow's schedule (will show on home page tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTodaySchedule({
      schedule: gen,
      date: tomorrow.toDateString(),
      completedItems: [],
    });
  };

  const schedule = showSchedule ? generateSchedule() : {};
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="screen-container">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3">
          <Home size={14} /> חזרה למסך הראשי
        </button>
      </div>
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-foreground mb-1">תזכורות לעצמי</h2>
        <p className="text-base text-muted-foreground">
          לפעמים דברים קטנים יכולים לשנות את ההרגשה.
        </p>
      </div>

      {/* Progress bar */}
      {completedCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 px-1">
            <span>עשיתי {completedCount} דברים טובים</span>
            {completedCount >= 3 && <span className="text-emerald-600 font-medium">✨ כל הכבוד!</span>}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-emerald-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((completedCount / Math.max(totalCount, 1)) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      )}

      {randomSuggestion && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card-reset p-4 mb-4 bg-lavender text-center">
          <p className="text-sm text-lavender-text">💡 מה דעתך על: <strong>{randomSuggestion}</strong></p>
        </motion.div>
      )}

      <div className="flex gap-2 mb-3">
        <button onClick={suggestRandom} className="btn-primary text-sm py-2 flex-1 flex items-center justify-center gap-1">
          <Sparkles size={14} /> הצע לי משהו
        </button>
        <button onClick={resetReminders} className="btn-secondary text-sm py-2 flex items-center gap-1">
          <RotateCcw size={14} /> איפוס
        </button>
      </div>

      {/* Auto-plan button */}
      <button
        onClick={() => {
          // Pick one random item from each category
          const picks: string[] = [];
          categories.forEach(cat => {
            const available = cat.items.filter(r => !completedReminders.includes(r));
            if (available.length > 0) {
              picks.push(available[Math.floor(Math.random() * available.length)]);
            }
          });
          // Toggle them all on
          picks.forEach(p => {
            if (!completedReminders.includes(p)) toggleReminder(p);
          });
          // Open schedule
          handleShowSchedule();
        }}
        className="w-full mb-5 py-3 text-sm rounded-2xl flex items-center justify-center gap-2 bg-gradient-to-l from-primary/80 to-accent text-primary-foreground font-semibold shadow-md hover:opacity-90 transition-opacity"
      >
        <CalendarDays size={18} />
        🪄 תכנן לי את המחר אוטומטית
      </button>

      {/* Categories */}
      <div className="space-y-3 mb-5">
        {categories.map((cat, catIdx) => {
          const colors = categoryColors[cat.id];
          const isExpanded = expandedCategories.includes(cat.id);
          const catCompleted = cat.items.filter(r => completedReminders.includes(r)).length;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.05 }}
              className={`rounded-2xl border ${colors.border} overflow-hidden`}
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`w-full flex items-center justify-between p-3 ${colors.bg} transition-colors`}
              >
                <div className="flex items-center gap-2">
                  <span className={colors.icon}>{cat.icon}</span>
                  <span className="font-semibold text-sm text-foreground">{cat.label}</span>
                  {catCompleted > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      {catCompleted}/{cat.items.length}
                    </span>
                  )}
                </div>
                <motion.span
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  className="text-muted-foreground text-xs"
                >
                  ▼
                </motion.span>
              </button>

              {/* Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      {cat.items.map((reminder) => {
                        const done = completedReminders.includes(reminder);
                        return (
                          <button
                            key={reminder}
                            onClick={() => toggleReminder(reminder)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-all ${
                              done ? `${colors.activeBg}` : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                              done ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-muted-foreground/25'
                            }`}>
                              {done && <Check size={12} className="text-white" />}
                            </div>
                            <span className={`text-sm leading-snug ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {reminder}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Custom reminders section */}
      {customList.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 overflow-hidden mb-5">
          <div className="p-3 bg-indigo-50 flex items-center gap-2">
            <Plus size={18} className="text-indigo-500" />
            <span className="font-semibold text-sm text-foreground">תזכורות אישיות</span>
          </div>
          <div className="p-2 space-y-1">
            {customList.map((reminder) => {
              const done = completedReminders.includes(reminder);
              return (
                <button
                  key={reminder}
                  onClick={() => toggleReminder(reminder)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-all ${
                    done ? 'bg-indigo-100' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                    done ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/25'
                  }`}>
                    {done && <Check size={12} className="text-white" />}
                  </div>
                  <span className={`text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {reminder}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Schedule Button */}
      {completedCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <button
            onClick={handleShowSchedule}
            className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 rounded-2xl"
          >
            <CalendarDays size={18} />
            צור לו״ז מאורגן למחר ({completedCount} פעילויות)
          </button>
        </motion.div>
      )}

      {/* Schedule Modal */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setShowSchedule(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <CalendarDays size={20} className="text-primary" />
                    הלו״ז שלי למחר
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{tomorrowStr}</p>
                </div>
                <button onClick={() => setShowSchedule(false)} className="p-1.5 rounded-full hover:bg-muted">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                {timeSlots.map(slot => {
                  const items = schedule[slot.key] || [];
                  if (items.length === 0) return null;
                  return (
                    <motion.div
                      key={slot.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{slot.icon}</span>
                        <span className="text-sm font-semibold text-foreground">{slot.label}</span>
                        <Clock size={12} className="text-muted-foreground" />
                      </div>
                      <div className="space-y-1.5 mr-6">
                        {items.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveActivity(item)}
                            className="w-full flex items-center justify-between gap-2 text-sm text-foreground hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors text-right"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              {item}
                            </div>
                            <ChevronLeft size={14} className="text-muted-foreground flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}

                {Object.values(schedule).every(arr => arr.length === 0) && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    לא נבחרו פעילויות. סמן פעילויות ונסה שוב!
                  </p>
                )}
              </div>

              <div className="mt-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground mb-3">🌟 מחר יהיה יום מדהים!</p>
                <button
                  onClick={() => {
                    // Save schedule for TODAY so it shows immediately on home
                    const today = new Date();
                    setTodaySchedule({
                      schedule: generateSchedule(),
                      date: today.toDateString(),
                      completedItems: [],
                    });
                    setShowSchedule(false);
                  }}
                  className="w-full btn-primary py-2.5 px-6 text-sm rounded-xl flex items-center justify-center gap-2"
                >
                  <Home size={16} />
                  הצמד למסך הבית
                </button>
                <button
                  onClick={() => setShowSchedule(false)}
                  className="w-full py-2 px-6 text-sm rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                >
                  סגור
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Detail Panel */}
      <AnimatePresence>
        {activeActivity && (
          <ActivityDetailPanel
            activityName={activeActivity}
            onClose={() => setActiveActivity(null)}
          />
        )}
      </AnimatePresence>

      {/* Add custom */}
      <div className="card-reset p-4 mb-6">
        <p className="text-sm text-muted-foreground mb-2">הוספת תזכורת אישית</p>
        <div className="flex gap-2">
          <input
            value={customReminder}
            onChange={e => setCustomReminder(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="הוסף תזכורת..."
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={addCustom} className="btn-primary py-2 px-3">
            <Plus size={16} />
          </button>
        </div>
      </div>

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
