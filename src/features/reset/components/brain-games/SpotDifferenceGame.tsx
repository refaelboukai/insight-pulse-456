import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';

function getConfigForLevel(level: number) {
  const gridSize = Math.min(4 + Math.floor(level / 3), 6);
  const numDifferences = Math.min(2 + Math.floor(level / 2), 5);
  const totalRounds = Math.min(4 + level, 10);
  return { gridSize, numDifferences, totalRounds };
}

const EMOJI_POOL = ['🌸', '🌊', '🌻', '🦋', '🍀', '🔥', '💎', '⭐', '🎨', '🌙',
  '🐬', '🦄', '🌈', '🍎', '🎵', '❤️', '🔵', '🟡', '🟢', '🟣',
  '🔶', '🌺', '🍄', '🐝', '🦊', '🐱', '🌍', '🎲', '🧩', '🎭',
  '🎪', '🏀', '🎸', '📚', '🔔', '🎁'];

function generateDifferencePuzzle(gridSize: number, numDifferences: number) {
  const totalCells = gridSize * gridSize;
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
  const originalGrid = shuffled.slice(0, totalCells);
  const modifiedGrid = [...originalGrid];

  // Pick random positions to change
  const diffPositions: number[] = [];
  const indices = Array.from({ length: totalCells }, (_, i) => i).sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < numDifferences && i < indices.length; i++) {
    const pos = indices[i];
    diffPositions.push(pos);
    // Replace with a different emoji
    const alternatives = EMOJI_POOL.filter(e => e !== originalGrid[pos] && !modifiedGrid.includes(e));
    if (alternatives.length > 0) {
      modifiedGrid[pos] = alternatives[Math.floor(Math.random() * alternatives.length)];
    } else {
      // Fallback: swap with unused emoji
      const unused = shuffled.slice(totalCells);
      if (unused.length > 0) {
        modifiedGrid[pos] = unused[i % unused.length];
      }
    }
  }

  return { originalGrid, modifiedGrid, diffPositions };
}

export default function SpotDifferenceGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('differences');
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [originalGrid, setOriginalGrid] = useState<string[]>([]);
  const [modifiedGrid, setModifiedGrid] = useState<string[]>([]);
  const [diffPositions, setDiffPositions] = useState<number[]>([]);
  const [foundPositions, setFoundPositions] = useState<Set<number>>(new Set());
  const [wrongClicks, setWrongClicks] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);

  const config = getConfigForLevel(progress.level);

  const startRound = useCallback(() => {
    const puzzle = generateDifferencePuzzle(config.gridSize, config.numDifferences);
    setOriginalGrid(puzzle.originalGrid);
    setModifiedGrid(puzzle.modifiedGrid);
    setDiffPositions(puzzle.diffPositions);
    setFoundPositions(new Set());
    setWrongClicks(0);
    setRoundComplete(false);
  }, [config.gridSize, config.numDifferences]);

  useEffect(() => { startRound(); }, [startRound]);

  const handleCellClick = (pos: number) => {
    if (roundComplete) return;
    if (foundPositions.has(pos)) return;

    if (diffPositions.includes(pos)) {
      const newFound = new Set(foundPositions);
      newFound.add(pos);
      setFoundPositions(newFound);

      if (newFound.size === diffPositions.length) {
        setRoundComplete(true);
        setCorrect(c => c + 1);
        setTimeout(() => advanceRound(true), 1000);
      }
    } else {
      setWrongClicks(w => w + 1);
    }
  };

  const advanceRound = (wasCorrect: boolean) => {
    const nextR = round + 1;
    if (nextR >= config.totalRounds) {
      const totalCorrect = correct + (wasCorrect ? 1 : 0);
      const accuracy = totalCorrect / config.totalRounds;
      const won = accuracy >= 0.5;
      const points = Math.round(accuracy * 100) + (progress.level * 5);
      recordResult(won, points);
      setGameComplete(true);
    } else {
      setRound(nextR);
      startRound();
    }
  };

  const handleGiveUp = () => {
    setRoundComplete(true);
    setFoundPositions(new Set(diffPositions));
    setTimeout(() => advanceRound(false), 1200);
  };

  if (gameComplete) {
    return (
      <GameComplete
        title="מצא את ההבדלים"
        level={progress.level}
        score={progress.score}
        customStats={[
          { label: 'נמצאו', value: correct },
          { label: 'סה״כ', value: config.totalRounds },
        ]}
        onPlayAgain={() => {
          setRound(0);
          setCorrect(0);
          setGameComplete(false);
          startRound();
        }}
        isNewRecord={isNewRecord}
        leveledUp={leveledUp}
      />
    );
  }

  return (
    <div>
      <GameHeader title="מצא את ההבדלים" level={progress.level} score={progress.score} />

      <div className="text-center mt-2 mb-2">
        <p className="text-sm text-muted-foreground">
          סיבוב {round + 1} / {config.totalRounds} • מצא {config.numDifferences} הבדלים
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          נמצאו: {foundPositions.size} / {diffPositions.length}
          {wrongClicks > 0 && ` • טעויות: ${wrongClicks}`}
        </p>
      </div>

      <div className="flex gap-2">
        {/* Original grid */}
        <div className="flex-1">
          <p className="text-xs text-center text-muted-foreground mb-1 font-bold">מקורי</p>
          <div
            className="grid gap-1 p-2 rounded-xl bg-secondary/30 border border-border"
            style={{ gridTemplateColumns: `repeat(${config.gridSize}, 1fr)` }}
          >
            {originalGrid.map((emoji, i) => (
              <div
                key={`o-${round}-${i}`}
                className="aspect-square rounded-lg bg-card flex items-center justify-center text-sm"
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Modified grid - clickable */}
        <div className="flex-1">
          <p className="text-xs text-center text-muted-foreground mb-1 font-bold">שונה</p>
          <div
            className="grid gap-1 p-2 rounded-xl bg-secondary/30 border border-border"
            style={{ gridTemplateColumns: `repeat(${config.gridSize}, 1fr)` }}
          >
            {modifiedGrid.map((emoji, i) => {
              const isFound = foundPositions.has(i);
              const isDiff = diffPositions.includes(i);
              const showDiff = isFound || (roundComplete && isDiff);

              return (
                <motion.button
                  key={`m-${round}-${i}`}
                  whileTap={!roundComplete ? { scale: 0.85 } : {}}
                  onClick={() => handleCellClick(i)}
                  disabled={roundComplete}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
                    showDiff
                      ? 'bg-success/20 border-2 border-success ring-1 ring-success/30'
                      : 'bg-card border border-transparent hover:bg-card/80'
                  }`}
                >
                  {emoji}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {roundComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-3 text-base font-bold text-success"
        >
          {foundPositions.size === diffPositions.length ? '🎉 מצאת הכל!' : '💡 הנה ההבדלים'}
        </motion.div>
      )}

      {!roundComplete && (
        <div className="text-center mt-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleGiveUp}
            className="btn-secondary px-4 text-sm"
          >
            הראה תשובות
          </motion.button>
        </div>
      )}
    </div>
  );
}
