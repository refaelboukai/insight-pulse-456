import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';

const EMOJI_POOL = ['🌟', '🎯', '🌈', '🦋', '🌸', '🍀', '🎨', '🌊', '🔥', '🎵', '🌙', '💎', '🦄', '🍎', '🐬', '🌻', '🧩', '🎲', '🐝', '🦊'];

function getGridForLevel(level: number) {
  // Every level adds more pairs for a clear visual difference
  // Level 1: 6 pairs (12 cards), scaling up to Level 10: 15 pairs (30 cards)
  const pairsMap: Record<number, number> = {
    1: 6, 2: 7, 3: 8, 4: 9, 5: 10, 6: 11, 7: 12, 8: 13, 9: 14, 10: 15,
  };
  const pairs = pairsMap[level] || Math.min(3 + level, 15);
  const totalCards = pairs * 2;
  const cols = totalCards <= 8 ? 4 : totalCards <= 12 ? 4 : totalCards <= 16 ? 4 : totalCards <= 20 ? 5 : totalCards <= 24 ? 6 : 6;
  return { cols, pairs };
}

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export default function MemoryGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('memory');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const initGame = useCallback(() => {
    const { pairs } = getGridForLevel(progress.level);
    const emojis = EMOJI_POOL.slice(0, pairs);
    const deck = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(deck);
    setFlippedIds([]);
    setMoves(0);
    setGameComplete(false);
    setStartTime(Date.now());
  }, [progress.level]);

  useEffect(() => { initGame(); }, [initGame]);

  const handleFlip = (id: number) => {
    if (flippedIds.length === 2) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;

    const newCards = [...cards];
    newCards[id] = { ...card, flipped: true };
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            i === a || i === b ? { ...c, matched: true } : c
          ));
          setFlippedIds([]);
        }, 400);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            i === a || i === b ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      const { pairs } = getGridForLevel(progress.level);
      const perfectMoves = pairs;
      const won = moves <= perfectMoves * 2;
      const points = Math.max(10, Math.round((perfectMoves / moves) * 100));
      recordResult(won, points);
      setGameComplete(true);
    }
  }, [cards]);

  const { cols } = getGridForLevel(progress.level);

  if (gameComplete) {
    return <GameComplete title="משחק זיכרון" moves={moves} level={progress.level} score={progress.score} onPlayAgain={initGame} isNewRecord={isNewRecord} leveledUp={leveledUp} />;
  }

  return (
    <div>
      <GameHeader title="משחק זיכרון" level={progress.level} score={progress.score} moves={moves} />
      <div
        className="grid gap-2 mt-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        <AnimatePresence>
          {cards.map(card => (
            <motion.button
              key={card.id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFlip(card.id)}
              className={`aspect-square rounded-2xl text-2xl font-bold flex items-center justify-center transition-all duration-300 ${
                card.flipped || card.matched
                  ? 'bg-primary/10 border-2 border-primary/30'
                  : 'bg-secondary border-2 border-border hover:bg-secondary/80'
              } ${card.matched ? 'opacity-60' : ''}`}
            >
              {(card.flipped || card.matched) ? (
                <motion.span
                  initial={{ rotateY: 90 }}
                  animate={{ rotateY: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {card.emoji}
                </motion.span>
              ) : (
                <span className="text-muted-foreground text-lg">?</span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
