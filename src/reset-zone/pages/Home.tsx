import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/reset-zone/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Activity, UserCheck, History, Bookmark, Info, LogOut, Brain, CalendarDays, Check, Clock, Star, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import BreathingBackground from '@/reset-zone/components/BreathingBackground';
import StreakCounter from '@/reset-zone/components/StreakCounter';
import PageTransition from '@/reset-zone/components/PageTransition';
import { playClick } from '@/reset-zone/hooks/useSoundEffects';
import ActivityDetailPanel from '@/reset-zone/components/ActivityDetailPanel';

const cards = [
  { path: '/reset/brain-training', label: 'אימון מוח', icon: Brain, bg: 'bg-gradient-to-br from-lavender to-check-blue', text: 'text-foreground', iconColor: 'text-primary' },
  { path: '/reset/daily-reflection', label: 'היום שלי', icon: Star, bg: 'bg-gradient-to-br from-sage to-sand', text: 'text-foreground', iconColor: 'text-primary' },
  { path: '/reset/skills', label: 'הכלים שלי', icon: Wrench, bg: 'bg-sage', text: 'text-sage-text', iconColor: 'text-sage-icon' },
  { path: '/reset/quick-check', label: 'בדיקה מהירה', icon: Activity, bg: 'bg-check-blue', text: 'text-check-blue-text', iconColor: 'text-check-blue-icon' },
  { path: '/reset/contact', label: 'אני צריך מבוגר', icon: UserCheck, bg: 'bg-contact-pink', text: 'text-contact-pink-text', iconColor: 'text-contact-pink-icon' },
  { path: '/reset/history', label: 'מה עזר לי בעבר', icon: History, bg: 'bg-history-gray', text: 'text-history-gray-text', iconColor: 'text-history-gray-icon' },
  { path: '/reset/reminders', label: 'תזכורות לעצמי', icon: Bookmark, bg: 'bg-lavender', text: 'text-lavender-text', iconColor: 'text-lavender-icon' },
  { path: '/reset/info', label: 'מידע וטיפים', icon: Info, bg: 'bg-sand', text: 'text-sand-text', iconColor: 'text-sand-icon' },
];

export default function Home() {
  const navigate = useNavigate();
  const { logout, student, role, todaySchedule, toggleScheduleItem } = useApp();
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [scheduleCollapsed, setScheduleCollapsed] = useState(false);

  const timeSlotLabels: Record<string, { label: string; icon: string }> = {
    morning: { label: 'בוקר', icon: '🌅' },
    late_morning: { label: 'לפני הצהריים', icon: '☀️' },
    noon: { label: 'צהריים', icon: '🍽️' },
    afternoon: { label: 'אחה״צ', icon: '🌤️' },
    evening: { label: 'ערב', icon: '🌇' },
    night: { label: 'לילה', icon: '🌙' },
  };

  const scheduleAllItems = todaySchedule ? Object.values(todaySchedule.schedule).flat() : [];
  const scheduleCompletedCount = todaySchedule?.completedItems.length || 0;
  const showScheduleWidget = todaySchedule && scheduleAllItems.length > 0;

  const handleNavigate = (path: string) => {
    playClick();
    navigate(path);
  };

  return (
    <PageTransition>
      <div className="reset-screen-container relative">
        <BreathingBackground />

        <div className="relative z-10">
          <div className="text-center mb-4">
            <p className="text-xl font-bold text-primary mb-1">RESET</p>
            <p className="text-base text-muted-foreground mb-2">עצור רגע. בחר תגובה.</p>
            {student && <p className="text-base font-bold text-primary">שלום, {student.name} 👋</p>}
          </div>

          <div className="flex justify-center mb-4">
            <StreakCounter />
          </div>

          <p className="text-center text-sm text-foreground/70 mb-6">
            כאן אפשר לעצור רגע, לבדוק מה עובר עליך, ולקבל כלי קצר שיכול לעזור עכשיו.
          </p>

          <AnimatePresence>
            {showScheduleWidget && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4"
              >
                <button
                  onClick={() => setScheduleCollapsed(!scheduleCollapsed)}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-primary" />
                    <h3 className="text-sm font-bold text-foreground">הלו״ז שלי להיום</h3>
                    <span className="text-xs text-muted-foreground">
                      {scheduleCompletedCount}/{scheduleAllItems.length}
                    </span>
                  </div>
                  {scheduleCollapsed ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronUp size={16} className="text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {!scheduleCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${(scheduleCompletedCount / scheduleAllItems.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="space-y-2">
                  {Object.entries(todaySchedule!.schedule).map(([slotKey, items]) => {
                    if (items.length === 0) return null;
                    const slot = timeSlotLabels[slotKey];
                    return (
                      <div key={slotKey}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs">{slot?.icon}</span>
                          <span className="text-xs font-semibold text-muted-foreground">{slot?.label}</span>
                        </div>
                        {items.map((item, idx) => {
                          const done = todaySchedule!.completedItems.includes(item);
                          return (
                            <div key={idx} className="flex items-center gap-1">
                              <button
                                onClick={() => { playClick(); toggleScheduleItem(item); }}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-right transition-all text-sm ${
                                  done ? 'opacity-50' : ''
                                }`}
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                  done ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                }`}>
                                  {done && <Check size={10} className="text-primary-foreground" />}
                                </div>
                                <span className={done ? 'line-through text-muted-foreground' : 'text-foreground'}>
                                  {item}
                                </span>
                              </button>
                              {!done && (
                                <button
                                  onClick={() => { playClick(); setActiveActivity(item); }}
                                  className="mr-auto text-primary/60 hover:text-primary transition-colors p-1"
                                >
                                  <ChevronLeft size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {cards.map((card, i) => (
              <motion.button
                key={card.path}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNavigate(card.path)}
                className={`reset-home-card ${card.bg}`}
              >
                <card.icon size={28} strokeWidth={1.5} className={card.iconColor} />
                <span className={`text-base font-semibold ${card.text}`}>{card.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleNavigate('/reset/contact')}
          className="reset-floating-adult-btn"
        >
          <UserCheck size={16} className="inline ml-1" />
          אני צריך מבוגר
        </button>
      </div>

      <AnimatePresence>
        {activeActivity && (
          <ActivityDetailPanel
            activityName={activeActivity}
            onClose={() => setActiveActivity(null)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
