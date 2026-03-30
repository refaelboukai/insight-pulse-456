import { motion } from 'framer-motion';
import { Trophy, Star, RotateCcw, Crown, TrendingUp } from 'lucide-react';

const ENCOURAGEMENTS = [
  'אתה מכונת מוח! 🧠',
  'אלוף/ה בלי עוררין! 🏆',
  'שיא חדש! ממשיכים קדימה! 🚀',
  'וואו, איזה הישג! ✨',
  'מדהים! המוח שלך בשיא! 💪',
];

interface GameCompleteProps {
  title: string;
  level: number;
  score: number;
  moves?: number;
  customStats?: { label: string; value: number }[];
  onPlayAgain: () => void;
  isNewRecord?: boolean;
  leveledUp?: boolean;
}

export default function GameComplete({ title, level, score, moves, customStats, onPlayAgain, isNewRecord, leveledUp }: GameCompleteProps) {
  const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="card-reset p-8">
        {/* New Record Banner */}
        {isNewRecord && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 8, stiffness: 100, delay: 0.1 }}
            className="mb-4 rounded-2xl bg-gradient-to-r from-warning/20 via-warning/30 to-warning/20 border-2 border-warning/40 p-4"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Crown size={36} className="text-warning mx-auto mb-2" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg font-extrabold text-warning"
            >
              🌟 שיא חדש! רמה {level} 🌟
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-sm font-bold text-foreground mt-1"
            >
              {encouragement}
            </motion.p>
          </motion.div>
        )}

        {/* Level Up Banner (not a new record) */}
        {leveledUp && !isNewRecord && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 10, delay: 0.1 }}
            className="mb-4 rounded-2xl bg-primary/10 border-2 border-primary/30 p-3"
          >
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: 2, duration: 0.4, delay: 0.3 }}
              >
                <TrendingUp size={24} className="text-primary" />
              </motion.div>
              <p className="text-base font-bold text-primary">עלית לרמה {level}! 🎉</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: isNewRecord ? 1.2 : 0.2 }}
        >
          <Trophy size={48} className="text-warning mx-auto mb-4" />
        </motion.div>

        <h2 className="text-xl font-extrabold text-foreground mb-2">כל הכבוד! 🎉</h2>
        <p className="text-muted-foreground mb-6">{title} הושלם</p>

        <div className="flex justify-center gap-6 mb-6 flex-wrap">
          <div className="text-center">
            <Star size={20} className="text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{level}</p>
            <p className="text-xs text-muted-foreground">רמה</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{score}</p>
            <p className="text-xs text-muted-foreground">ניקוד כולל</p>
          </div>
          {moves !== undefined && (
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{moves}</p>
              <p className="text-xs text-muted-foreground">מהלכים</p>
            </div>
          )}
          {customStats?.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          className="btn-primary flex items-center gap-2 mx-auto"
        >
          <RotateCcw size={18} />
          שחק שוב
        </motion.button>
      </div>
    </motion.div>
  );
}
