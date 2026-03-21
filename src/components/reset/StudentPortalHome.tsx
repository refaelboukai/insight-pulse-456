import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Wrench, Activity, UserCheck, History, Bookmark, Info, Brain, Star, LogOut, FileText, GraduationCap, HeartHandshake } from 'lucide-react';
import BreathingBackground from '@/components/reset/BreathingBackground';
import StreakCounter from '@/components/reset/StreakCounter';
import PageTransition from '@/components/reset/PageTransition';
import { playClick } from '@/hooks/useSoundEffects';

const cards = [
  { path: '/student/quick-check', label: 'בדיקה מהירה', icon: Activity, bg: 'bg-sky-50', text: 'text-sky-700', iconColor: 'text-sky-500' },
  { path: '/student/skills', label: 'הכלים שלי', icon: Wrench, bg: 'bg-emerald-50', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
  { path: '/student/brain-training', label: 'אימון מוח', icon: Brain, bg: 'bg-violet-50', text: 'text-violet-700', iconColor: 'text-violet-500' },
  { path: '/student/daily-reflection', label: 'היום שלי', icon: Star, bg: 'bg-amber-50', text: 'text-amber-700', iconColor: 'text-amber-500' },
  { path: '/student/contact', label: 'אני צריך מבוגר', icon: UserCheck, bg: 'bg-rose-50', text: 'text-rose-700', iconColor: 'text-rose-500' },
  { path: '/student/reminders', label: 'תזכורות לעצמי', icon: Bookmark, bg: 'bg-purple-50', text: 'text-purple-700', iconColor: 'text-purple-500' },
  { path: '/student/info', label: 'מידע וטיפים', icon: Info, bg: 'bg-orange-50', text: 'text-orange-700', iconColor: 'text-orange-500' },
  { path: '/student/dashboard', label: 'דיווחים וציונים', icon: FileText, bg: 'bg-blue-50', text: 'text-blue-700', iconColor: 'text-blue-500' },
];

export default function StudentPortalHome() {
  const navigate = useNavigate();
  const { fullName, signOut } = useAuth();

  const handleNavigate = (path: string) => {
    playClick();
    navigate(path);
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative" style={{ background: 'var(--gradient-warm)' }}>
        <BreathingBackground />
        <div className="relative z-10 container mx-auto px-4 py-6 pb-16">
          <div className="text-center mb-4">
            <h1 className="text-xl font-extrabold text-foreground mb-1">בית ספר מרום בית אקשטיין</h1>
            <p className="text-lg font-bold text-primary mb-1">RESET</p>
            <p className="text-sm text-muted-foreground mb-2">עצור רגע. בחר תגובה.</p>
            {fullName && <p className="text-base font-bold text-primary">שלום, {fullName} 👋</p>}
          </div>

          <div className="flex justify-center mb-4">
            <StreakCounter />
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6">
            כאן אפשר לעצור רגע, לבדוק מה עובר עליך, ולקבל כלי קצר שיכול לעזור עכשיו.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {cards.map((card, i) => (
              <motion.button
                key={card.path}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleNavigate(card.path)}
                className={`${card.bg} rounded-2xl p-4 flex flex-col items-center gap-2 border border-transparent hover:shadow-md transition-shadow`}
              >
                <card.icon size={28} strokeWidth={1.5} className={card.iconColor} />
                <span className={`text-sm font-semibold ${card.text}`}>{card.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="flex justify-center">
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <LogOut size={14} />
              התנתקות
            </button>
          </div>
        </div>

        <button
          onClick={() => handleNavigate('/student/contact')}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white text-sm font-semibold py-2.5 px-5 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
        >
          <UserCheck size={16} className="inline ml-1" />
          אני צריך מבוגר
        </button>
      </div>
    </PageTransition>
  );
}
