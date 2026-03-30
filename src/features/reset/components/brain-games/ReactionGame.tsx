import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';

const COLORS = [
  { name: 'אדום', hsl: '0 85% 60%', emoji: '🔴' },
  { name: 'כחול', hsl: '210 80% 55%', emoji: '🔵' },
  { name: 'ירוק', hsl: '142 50% 45%', emoji: '🟢' },
  { name: 'צהוב', hsl: '45 90% 55%', emoji: '🟡' },
  { name: 'סגול', hsl: '265 50% 55%', emoji: '🟣' },
  { name: 'כתום', hsl: '25 90% 55%', emoji: '🟠' },
  { name: 'ורוד', hsl: '330 80% 65%', emoji: '🩷' },
  { name: 'תכלת', hsl: '190 70% 55%', emoji: '🩵' },
  { name: 'חום', hsl: '30 50% 40%', emoji: '🟤' },
  { name: 'שחור', hsl: '0 0% 15%', emoji: '⚫' },
];

function getConfigForLevel(level: number) {
  return {
    totalRounds: Math.min(10 + level * 2, 25),
    windowMs: Math.max(1400 - level * 120, 500),
    numColors: Math.min(3 + Math.floor(level / 2), COLORS.length),
    targetChance: Math.max(0.40 - level * 0.02, 0.22),
    hasReverse: level >= 7,
    gapMs: Math.max(80 - level * 5, 30),
  };
}

type RoundResult = { reactionMs: number; correct: boolean };

export default function ReactionGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('reaction');
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'complete'>('ready');
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | 'wrong' | 'timeout' | null>(null);
  const [isReverse, setIsReverse] = useState(false);
  const [showColor, setShowColor] = useState(false);

  const roundStartRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Use refs for values needed in callbacks to avoid stale closures
  const targetColorRef = useRef(targetColor);
  const gameStateRef = useRef(gameState);

  targetColorRef.current = targetColor;
  gameStateRef.current = gameState;

  const config = getConfigForLevel(progress.level);
  const activeColors = COLORS.slice(0, config.numColors);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  };

  const startGame = () => {
    const target = activeColors[Math.floor(Math.random() * activeColors.length)];
    setTargetColor(target);
    targetColorRef.current = target;
    setResults([]);
    setRound(0);
    setFeedback(null);
    setShowColor(false);
    setIsReverse(false);
    setGameState('playing');
    gameStateRef.current = 'playing';
  };

  const advanceRound = useCallback(() => {
    setShowColor(false);
    setFeedback(null);
    setRound(prev => {
      const next = prev + 1;
      if (next >= config.totalRounds) {
        setGameState('complete');
        gameStateRef.current = 'complete';
        return prev;
      }
      return next;
    });
  }, [config.totalRounds]);

  const showNextColor = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    setFeedback(null);
    const target = targetColorRef.current;
    const isTarget = Math.random() < config.targetChance;
    const nonTargets = activeColors.filter(c => c.name !== target.name);
    const color = isTarget
      ? target
      : nonTargets[Math.floor(Math.random() * nonTargets.length)] || activeColors[0];

    const reverse = config.hasReverse && Math.random() < 0.25;
    setIsReverse(reverse);
    setCurrentColor(color);
    setShowColor(true);
    roundStartRef.current = Date.now();

    timeoutRef.current = setTimeout(() => {
      const wasTarget = color.name === target.name;
      const shouldHaveTapped = reverse ? !wasTarget : wasTarget;

      if (shouldHaveTapped) {
        setFeedback('timeout');
        setResults(prev => [...prev, { reactionMs: config.windowMs, correct: false }]);
      } else {
        setResults(prev => [...prev, { reactionMs: 0, correct: true }]);
      }

      feedbackTimeoutRef.current = setTimeout(() => {
        advanceRound();
      }, shouldHaveTapped ? 250 : 60);
    }, config.windowMs);
  }, [config, activeColors, advanceRound]);

  // Trigger next color when round changes
  useEffect(() => {
    if (gameState !== 'playing') return;
    const delay = setTimeout(() => showNextColor(), config.gapMs);
    return () => clearTimeout(delay);
  }, [round, gameState, showNextColor, config.gapMs]);

  // Record result on complete
  useEffect(() => {
    if (gameState === 'complete') {
      clearTimers();
      const correctCount = results.filter(r => r.correct).length;
      const accuracy = results.length > 0 ? correctCount / results.length : 0;
      const won = accuracy >= 0.6;
      const avgReaction = results.filter(r => r.reactionMs > 0).reduce((s, r) => s + r.reactionMs, 0) /
        Math.max(1, results.filter(r => r.reactionMs > 0).length);
      const speedBonus = Math.max(0, Math.round((config.windowMs - avgReaction) / 10));
      const points = Math.round(accuracy * 80) + speedBonus + (progress.level * 5);
      recordResult(won, points);
    }
  }, [gameState]);

  useEffect(() => () => clearTimers(), []);

  const handleTap = () => {
    if (gameState !== 'playing' || !showColor || feedback) return;
    clearTimers();

    const reactionMs = Date.now() - roundStartRef.current;
    const isTarget = currentColor.name === targetColor.name;
    const correct = isReverse ? !isTarget : isTarget;

    setFeedback(correct ? 'hit' : 'wrong');
    setResults(prev => [...prev, { reactionMs, correct }]);

    feedbackTimeoutRef.current = setTimeout(() => advanceRound(), 200);
  };

  const hits = results.filter(r => r.correct).length;
  const misses = results.filter(r => !r.correct).length;
  const avgMs = results.filter(r => r.reactionMs > 0).length > 0
    ? Math.round(results.filter(r => r.reactionMs > 0).reduce((s, r) => s + r.reactionMs, 0) /
        results.filter(r => r.reactionMs > 0).length)
    : 0;

  if (gameState === 'complete') {
    return (
      <div>
        <GameComplete
          title="תגובה מהירה"
          level={progress.level}
          score={progress.score}
          customStats={[
            { label: 'פגיעות', value: hits },
            { label: 'החטאות', value: misses },
            { label: 'ממוצע ms', value: avgMs },
          ]}
          onPlayAgain={startGame}
          isNewRecord={isNewRecord}
          leveledUp={leveledUp}
        />
      </div>
    );
  }

  if (gameState === 'ready') {
    return (
      <div className="text-center">
        <GameHeader title="תגובה מהירה" level={progress.level} score={progress.score} />
        <div className="card-reset p-6 mt-6">
          <p className="text-lg font-bold text-foreground mb-3">הכללים:</p>
          <div className="space-y-2 text-muted-foreground text-sm mb-5">
            <p>🎯 יופיע עיגול צבעוני על המסך</p>
            <p>✅ <strong>לחץ מהר</strong> כשהצבע תואם למטרה</p>
            <p>🚫 <strong>אל תלחץ</strong> כשהצבע שונה</p>
            {progress.level >= 7 && (
              <p className="text-primary font-semibold">⚡ רמה מתקדמת: לפעמים הכללים מתהפכים!</p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="btn-primary text-lg px-8 py-3"
          >
            התחל! 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <GameHeader title="תגובה מהירה" level={progress.level} score={hits * 10} />

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full mb-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${((round) / config.totalRounds) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>סיבוב {round + 1} / {config.totalRounds}</span>
        <span>✅ {hits} | ❌ {misses}</span>
        {avgMs > 0 && <span>⚡ {avgMs}ms</span>}
      </div>

      {/* Target indicator */}
      <div className="text-center mb-4">
        {isReverse ? (
          <p className="text-sm font-bold text-destructive">🔄 הפוך! לחץ על כל צבע <strong>חוץ מ:</strong></p>
        ) : (
          <p className="text-sm text-muted-foreground">לחץ רק כשזה:</p>
        )}
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-2xl">{targetColor.emoji}</span>
          <span className="text-lg font-bold text-foreground">{targetColor.name}</span>
        </div>
      </div>

      {/* Main tap area with distraction colors */}
      <div
        className="relative flex justify-center items-center"
        style={{ minHeight: '250px' }}
        onClick={handleTap}
      >
        {/* Distraction circles */}
        {showColor && activeColors
          .filter(c => c.name !== currentColor.name)
          .slice(0, 3)
          .map((c, i) => {
            const positions = [
              { top: '10%', left: '8%' },
              { top: '60%', right: '5%' },
              { bottom: '5%', left: '15%' },
            ];
            return (
              <motion.div
                key={`distract-${i}-${round}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.55 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.08, delay: i * 0.03 }}
                className="absolute w-16 h-16 rounded-full pointer-events-none"
                style={{
                  backgroundColor: `hsl(${c.hsl})`,
                  boxShadow: `0 0 20px hsl(${c.hsl} / 0.3)`,
                  ...positions[i],
                }}
              />
            );
          })}

        {showColor ? (
            <motion.div
              key={`color-${round}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.08 }}
              className="w-44 h-44 rounded-full shadow-xl flex items-center justify-center cursor-pointer select-none active:scale-90 transition-transform z-10"
              style={{
                backgroundColor: `hsl(${currentColor.hsl})`,
                boxShadow: `0 0 40px hsl(${currentColor.hsl} / 0.4)`,
              }}
            >
              <span className="text-5xl">{currentColor.emoji}</span>
            </motion.div>
          ) : (
            <div
              className="w-44 h-44 rounded-full border-4 border-dashed border-border flex items-center justify-center"
            >
              <span className="text-muted-foreground text-sm">המתן...</span>
            </div>
          )}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center mt-4 text-lg font-bold ${
              feedback === 'hit' ? 'text-success' :
              feedback === 'timeout' ? 'text-warning' :
              'text-destructive'
            }`}
          >
            {feedback === 'hit' && '⚡ מהיר!'}
            {feedback === 'wrong' && '❌ לא הצבע הנכון!'}
            {feedback === 'timeout' && '⏰ איטי מדי!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
