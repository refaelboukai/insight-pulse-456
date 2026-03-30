import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';

function getConfigForLevel(level: number) {
  const gridSize = Math.min(3 + Math.floor(level / 3), 5);
  const totalRounds = Math.min(4 + level, 10);
  return { gridSize, totalRounds };
}

const PUZZLE_EMOJIS = ['🌸', '🌊', '🌻', '🦋', '🍀', '🔥', '💎', '⭐', '🎨', '🌙',
  '🐬', '🦄', '🌈', '🍎', '🎵', '❤️', '🔵', '🟡', '🟢', '🟣', '🔶', '🌺', '🍄', '🐝', '🦊'];

function generatePuzzle(gridSize: number) {
  // Create a grid with emojis
  const totalCells = gridSize * gridSize;
  const shuffled = [...PUZZLE_EMOJIS].sort(() => Math.random() - 0.5);
  const grid = shuffled.slice(0, totalCells);

  // Create a shuffled version by swapping some tiles
  const tiles = grid.map((emoji, i) => ({ emoji, correctIndex: i, currentIndex: i }));

  // Perform random swaps (more swaps = harder)
  const numSwaps = Math.min(gridSize + 2, totalCells - 1);
  for (let s = 0; s < numSwaps; s++) {
    const i = Math.floor(Math.random() * totalCells);
    let j = Math.floor(Math.random() * totalCells);
    while (j === i) j = Math.floor(Math.random() * totalCells);
    // Swap currentIndex
    const tmp = tiles[i].currentIndex;
    tiles[i].currentIndex = tiles[j].currentIndex;
    tiles[j].currentIndex = tmp;
  }

  return tiles;
}

interface Tile {
  emoji: string;
  correctIndex: number;
  currentIndex: number;
}

export default function SpatialGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('spatial');
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [showTarget, setShowTarget] = useState(true);
  const [solved, setSolved] = useState(false);

  const config = getConfigForLevel(progress.level);

  const startRound = useCallback(() => {
    const puzzle = generatePuzzle(config.gridSize);
    setTiles(puzzle);
    setSelectedTile(null);
    setMoves(0);
    setSolved(false);
    setShowTarget(true);
    // Show the target arrangement briefly
    setTimeout(() => setShowTarget(false), Math.max(3000 - progress.level * 200, 1000));
  }, [config.gridSize, progress.level]);

  useEffect(() => { startRound(); }, [startRound]);

  const handleTileClick = (index: number) => {
    if (showTarget || solved) return;

    if (selectedTile === null) {
      setSelectedTile(index);
    } else {
      if (selectedTile === index) {
        setSelectedTile(null);
        return;
      }
      // Swap tiles
      setMoves(m => m + 1);
      setTiles(prev => {
        const newTiles = [...prev];
        const tmp = newTiles[selectedTile].currentIndex;
        newTiles[selectedTile] = { ...newTiles[selectedTile], currentIndex: newTiles[index].currentIndex };
        newTiles[index] = { ...newTiles[index], currentIndex: tmp };
        return newTiles;
      });
      setSelectedTile(null);
    }
  };

  // Check if solved
  useEffect(() => {
    if (showTarget || tiles.length === 0) return;
    const isSolved = tiles.every(t => t.correctIndex === t.currentIndex);
    if (isSolved) {
      setSolved(true);
      setCorrect(c => c + 1);
      setTimeout(() => {
        const nextR = round + 1;
        if (nextR >= config.totalRounds) {
          const totalCorrect = correct + 1;
          const accuracy = totalCorrect / config.totalRounds;
          const won = accuracy >= 0.5;
          const points = Math.round(accuracy * 100) + Math.max(0, 50 - moves);
          recordResult(won, points);
          setGameComplete(true);
        } else {
          setRound(nextR);
          startRound();
        }
      }, 800);
    }
  }, [tiles, showTarget]);

  const handleSkip = () => {
    const nextR = round + 1;
    if (nextR >= config.totalRounds) {
      const accuracy = correct / config.totalRounds;
      const won = accuracy >= 0.5;
      const points = Math.round(accuracy * 80);
      recordResult(won, points);
      setGameComplete(true);
    } else {
      setRound(nextR);
      startRound();
    }
  };

  if (gameComplete) {
    return (
      <GameComplete
        title="תפיסה מרחבית"
        level={progress.level}
        score={progress.score}
        customStats={[
          { label: 'פאזלים', value: correct },
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

  // Sort by currentIndex for display
  const displayTiles = [...tiles].sort((a, b) => a.currentIndex - b.currentIndex);
  const targetTiles = [...tiles].sort((a, b) => a.correctIndex - b.correctIndex);

  return (
    <div>
      <GameHeader title="תפיסה מרחבית" level={progress.level} score={progress.score} />

      <div className="text-center mt-2 mb-3">
        <p className="text-sm text-muted-foreground">
          פאזל {round + 1} / {config.totalRounds}
          {!showTarget && !solved && ` • מהלכים: ${moves}`}
        </p>
      </div>

      {showTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-3"
        >
          <p className="text-sm font-bold text-primary mb-2">📸 זכור את הסדר!</p>
        </motion.div>
      )}

      {solved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-3"
        >
          <p className="text-lg font-bold text-success">✅ מושלם!</p>
        </motion.div>
      )}

      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
          maxWidth: config.gridSize * 70,
        }}
      >
        {(showTarget ? targetTiles : displayTiles).map((tile, i) => {
          const originalIndex = showTarget ? i : tiles.findIndex(t => t.currentIndex === i);
          const isSelected = selectedTile === originalIndex;
          const isCorrectPos = !showTarget && tile.correctIndex === tile.currentIndex;

          return (
            <motion.button
              key={`${round}-${tile.emoji}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTileClick(originalIndex)}
              disabled={showTarget || solved}
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${
                showTarget
                  ? 'bg-primary/10 border-primary/20'
                  : isSelected
                  ? 'bg-primary/20 border-primary ring-2 ring-primary/50'
                  : isCorrectPos
                  ? 'bg-success/10 border-success/30'
                  : 'bg-secondary border-border hover:bg-secondary/80'
              }`}
            >
              {tile.emoji}
            </motion.button>
          );
        })}
      </div>

      {!showTarget && !solved && (
        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground mb-3">לחץ על שני ריבועים כדי להחליף ביניהם</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSkip}
            className="btn-secondary px-4 text-sm"
          >
            דלג על הפאזל
          </motion.button>
        </div>
      )}
    </div>
  );
}
