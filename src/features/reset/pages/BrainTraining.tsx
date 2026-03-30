import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Zap, ListOrdered, Trophy, Blocks, Calculator, BookOpen, Crosshair, Puzzle, Search, BarChart3 } from 'lucide-react';
import PageTransition from '@reset/components/PageTransition';
import BreathingBackground from '@reset/components/BreathingBackground';
import MemoryGame from '@reset/components/brain-games/MemoryGame';
import ReactionGame from '@reset/components/brain-games/ReactionGame';
import SeriesGame from '@reset/components/brain-games/SeriesGame';
import TetrisGame from '@reset/components/brain-games/TetrisGame';
import MathGame from '@reset/components/brain-games/MathGame';
import ReadingGame from '@reset/components/brain-games/ReadingGame';
import CoordinationGame from '@reset/components/brain-games/CoordinationGame';
import SpatialGame from '@reset/components/brain-games/SpatialGame';
import SpotDifferenceGame from '@reset/components/brain-games/SpotDifferenceGame';
import BrainStats from '@reset/components/brain-games/BrainStats';
import DailyChallenge, { markDailyComplete } from '@reset/components/brain-games/DailyChallenge';
import Leaderboard from '@reset/components/brain-games/Leaderboard';
import { playClick } from '@reset/hooks/useSoundEffects';
import { useApp } from '@reset/contexts/AppContext';

type GameId = 'memory' | 'reaction' | 'series' | 'tetris' | 'math' | 'reading' | 'coordination' | 'spatial' | 'differences' | null;
type ViewMode = 'games' | 'stats' | 'leaderboard';

const games = [
  {
    id: 'memory' as GameId,
    label: 'זיכרון',
    desc: 'מצא את הזוגות התואמים',
    icon: Brain,
    bg: 'bg-lavender',
    text: 'text-lavender-text',
    iconColor: 'text-lavender-icon',
  },
  {
    id: 'reaction' as GameId,
    label: 'תגובה מהירה',
    desc: 'תפוס את הצבע הנכון',
    icon: Zap,
    bg: 'bg-check-blue',
    text: 'text-check-blue-text',
    iconColor: 'text-check-blue-icon',
  },
  {
    id: 'series' as GameId,
    label: 'סדרות',
    desc: 'מה הבא בתור?',
    icon: ListOrdered,
    bg: 'bg-sand',
    text: 'text-sand-text',
    iconColor: 'text-sand-icon',
  },
  {
    id: 'tetris' as GameId,
    label: 'Block Blast',
    desc: 'מקם חלקים ונקה שורות ועמודות',
    icon: Blocks,
    bg: 'bg-primary/10',
    text: 'text-primary',
    iconColor: 'text-primary',
  },
  {
    id: 'math' as GameId,
    label: 'חשבון מהיר',
    desc: 'פתור תרגילים נגד הזמן',
    icon: Calculator,
    bg: 'bg-warning/10',
    text: 'text-warning',
    iconColor: 'text-warning',
  },
  {
    id: 'reading' as GameId,
    label: 'הבנת הנקרא',
    desc: 'קרא וענה על שאלות',
    icon: BookOpen,
    bg: 'bg-success/10',
    text: 'text-success',
    iconColor: 'text-success',
  },
  {
    id: 'coordination' as GameId,
    label: 'קואורדינציה',
    desc: 'תפוס מטרות נעות',
    icon: Crosshair,
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    iconColor: 'text-destructive',
  },
  {
    id: 'spatial' as GameId,
    label: 'תפיסה מרחבית',
    desc: 'סדר את הפאזל מהזיכרון',
    icon: Puzzle,
    bg: 'bg-accent',
    text: 'text-accent-foreground',
    iconColor: 'text-accent-foreground',
  },
  {
    id: 'differences' as GameId,
    label: 'מצא הבדלים',
    desc: 'מצא מה השתנה בין שתי תמונות',
    icon: Search,
    bg: 'bg-secondary',
    text: 'text-foreground',
    iconColor: 'text-foreground',
  },
];

export default function BrainTraining() {
  const navigate = useNavigate();
  const { student } = useApp();
  const [activeGame, setActiveGame] = useState<GameId>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('games');
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);

  const handleBack = () => {
    playClick();
    if (activeGame) {
      setActiveGame(null);
      setIsDailyChallenge(false);
    } else {
      navigate('/');
    }
  };

  const handleStartGame = (gameId: string) => {
    playClick();
    setActiveGame(gameId as GameId);
  };

  const handleStartDailyGame = (gameId: string) => {
    playClick();
    setIsDailyChallenge(true);
    setActiveGame(gameId as GameId);
    markDailyComplete();
  };

  return (
    <PageTransition>
      <div className="screen-container relative">
        <BreathingBackground />
        <div className="relative z-10">
          <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground mb-4 text-base">
            <ArrowRight size={20} />
            <span className="font-medium">{activeGame ? 'חזרה למשחקים' : 'חזרה'}</span>
          </button>

          {!activeGame ? (
            <>
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-2 mb-2">
                  <Trophy size={32} className="text-warning" />
                  <h1 className="text-3xl font-extrabold text-foreground">אימון מוח</h1>
                </div>
                {student && (
                  <p className="text-base text-primary font-bold">שלום {student.name}! 👋</p>
                )}
                <p className="text-lg text-muted-foreground mt-1">בחר משחק ואתגר את המוח שלך!</p>
              </div>

              {/* View Mode Tabs */}
              <div className="flex gap-2 mb-5 justify-center">
                {[
                  { mode: 'games' as ViewMode, label: 'משחקים', icon: Brain },
                  { mode: 'stats' as ViewMode, label: 'הסטטיסטיקות שלי', icon: BarChart3 },
                  { mode: 'leaderboard' as ViewMode, label: 'לוח תוצאות', icon: Trophy },
                ].map(tab => (
                  <button
                    key={tab.mode}
                    onClick={() => { playClick(); setViewMode(tab.mode); }}
                    className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-full transition-colors ${
                      viewMode === tab.mode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {viewMode === 'games' && (
                <div className="space-y-4">
                  {/* Daily Challenge */}
                  {student && <DailyChallenge onStartGame={handleStartDailyGame} />}

                  {/* Game Grid 3x3 */}
                  <div className="grid grid-cols-3 gap-3">
                    {games.map((game, i) => (
                      <motion.button
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handleStartGame(game.id!)}
                        className={`card-reset flex flex-col items-center justify-center gap-2.5 p-4 ${game.bg} aspect-square`}
                      >
                        <div className={`rounded-xl p-3 bg-card/50`}>
                          <game.icon size={30} className={game.iconColor} />
                        </div>
                        <p className={`text-sm font-bold ${game.text} text-center leading-tight`}>{game.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'stats' && (
                student ? <BrainStats /> : (
                  <div className="card-reset p-8 text-center">
                    <p className="text-muted-foreground text-base">יש להתחבר כדי לראות סטטיסטיקות</p>
                  </div>
                )
              )}

              {viewMode === 'leaderboard' && <Leaderboard />}
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {isDailyChallenge && (
                <div className="mb-3 text-center">
                  <span className="inline-flex items-center gap-1.5 bg-warning/20 text-warning text-sm font-bold px-4 py-1.5 rounded-full">
                    ⭐ אתגר יומי
                  </span>
                </div>
              )}
              {activeGame === 'memory' && <MemoryGame />}
              {activeGame === 'reaction' && <ReactionGame />}
              {activeGame === 'series' && <SeriesGame />}
              {activeGame === 'tetris' && <TetrisGame />}
              {activeGame === 'math' && <MathGame />}
              {activeGame === 'reading' && <ReadingGame />}
              {activeGame === 'coordination' && <CoordinationGame />}
              {activeGame === 'spatial' && <SpatialGame />}
              {activeGame === 'differences' && <SpotDifferenceGame />}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
