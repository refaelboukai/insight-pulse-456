import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';

type SeriesType = 'numbers' | 'shapes';

const SHAPE_CYCLES = [
  ['🔵', '🔴', '🟡'],
  ['⭐', '🌙', '☀️'],
  ['🟥', '🟦', '🟩'],
  ['💎', '❤️', '🔶'],
  ['🐱', '🐶', '🐸', '🦋'],
  ['🍎', '🍊', '🍋', '🍇'],
];

/**
 * Generates a full sequence of `length` numbers, then returns
 * the first `length-1` as visible and the last as the answer.
 */
function generateNumberSeries(level: number): { visible: string[]; answer: string } {
  const seqLen = Math.min(4 + Math.floor(level / 3), 7); // 4-7 visible items
  const fullLen = seqLen + 1; // +1 for the answer

  let full: number[] = [];

  if (level <= 2) {
    // Simple arithmetic: constant step
    const start = Math.floor(Math.random() * 10) + 1;
    const step = Math.floor(Math.random() * 4) + 2;
    const descending = Math.random() > 0.7;
    full = Array.from({ length: fullLen }, (_, i) => descending ? start - step * i : start + step * i);
  } else if (level <= 4) {
    // Alternating steps: +a, +b, +a, +b...
    const start = Math.floor(Math.random() * 10) + 1;
    const stepA = Math.floor(Math.random() * 3) + 1;
    const stepB = Math.floor(Math.random() * 5) + 3;
    full = [start];
    for (let i = 1; i < fullLen; i++) {
      full.push(full[i - 1] + (i % 2 === 1 ? stepA : stepB));
    }
  } else if (level <= 6) {
    const pattern = Math.floor(Math.random() * 3);
    if (pattern === 0) {
      // Geometric: multiply by 2 or 3
      const base = Math.floor(Math.random() * 3) + 2;
      const mult = Math.random() > 0.5 ? 2 : 3;
      full = Array.from({ length: fullLen }, (_, i) => base * Math.pow(mult, i));
    } else if (pattern === 1) {
      // Increasing differences: +1, +2, +3, +4...
      const start = Math.floor(Math.random() * 5) + 1;
      full = [start];
      for (let i = 1; i < fullLen; i++) full.push(full[i - 1] + i);
    } else {
      // Squares: 1, 4, 9, 16, 25...
      const offset = Math.floor(Math.random() * 3);
      full = Array.from({ length: fullLen }, (_, i) => (i + 1 + offset) ** 2);
    }
  } else if (level <= 8) {
    const pattern = Math.floor(Math.random() * 3);
    if (pattern === 0) {
      // Fibonacci-like
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 4) + 2;
      full = [a, b];
      for (let i = 2; i < fullLen; i++) full.push(full[i - 1] + full[i - 2]);
    } else if (pattern === 1) {
      // n*2+1: 1, 3, 7, 15, 31...
      const start = Math.floor(Math.random() * 3) + 1;
      full = [start];
      for (let i = 1; i < fullLen; i++) full.push(full[i - 1] * 2 + 1);
    } else {
      // Each = prev * 2 - 1: 2, 3, 5, 9, 17...
      const start = Math.floor(Math.random() * 3) + 2;
      full = [start];
      for (let i = 1; i < fullLen; i++) full.push(full[i - 1] * 2 - 1);
    }
  } else {
    // Level 9-10: complex
    const pattern = Math.floor(Math.random() * 3);
    if (pattern === 0) {
      // Alternating operations: *2, +3, *2, +3...
      const start = Math.floor(Math.random() * 3) + 1;
      const addBy = Math.floor(Math.random() * 4) + 2;
      full = [start];
      for (let i = 1; i < fullLen; i++) {
        full.push(i % 2 === 1 ? full[i - 1] * 2 : full[i - 1] + addBy);
      }
    } else if (pattern === 1) {
      // Triangular numbers: 1, 3, 6, 10, 15...
      const offset = Math.floor(Math.random() * 3);
      full = Array.from({ length: fullLen }, (_, i) => {
        const n = i + 1 + offset;
        return (n * (n + 1)) / 2;
      });
    } else {
      // Cubes: 1, 8, 27, 64...
      const offset = Math.floor(Math.random() * 2);
      full = Array.from({ length: fullLen }, (_, i) => (i + 1 + offset) ** 3);
    }
  }

  const visible = full.slice(0, seqLen).map(String);
  const answer = String(full[seqLen]);

  return { visible, answer };
}

function generateShapeSeries(level: number): { visible: string[]; answer: string } {
  const cycleIdx = Math.floor(Math.random() * SHAPE_CYCLES.length);
  const pool = SHAPE_CYCLES[cycleIdx];
  const cycleLen = Math.min(2 + Math.floor(level / 3), pool.length);
  const cycle = pool.slice(0, cycleLen);
  const seqLen = Math.min(4 + Math.floor(level / 3), 7);
  const fullLen = seqLen + 1;
  const full = Array.from({ length: fullLen }, (_, i) => cycle[i % cycleLen]);

  return {
    visible: full.slice(0, seqLen),
    answer: full[seqLen],
  };
}

function generateSeries(level: number): {
  sequence: string[];
  answer: string;
  options: string[];
  type: SeriesType;
} {
  const useShapes = level >= 2 && Math.random() > 0.6;
  const type: SeriesType = useShapes ? 'shapes' : 'numbers';

  const { visible, answer } = type === 'numbers'
    ? generateNumberSeries(level)
    : generateShapeSeries(level);

  // Generate wrong answers
  const wrongAnswers = new Set<string>();
  if (type === 'numbers') {
    const ansNum = Number(answer);
    while (wrongAnswers.size < 3) {
      const offset = Math.floor(Math.random() * Math.max(5, Math.abs(ansNum) / 4)) + 1;
      const w = Math.random() > 0.5 ? ansNum + offset : ansNum - offset;
      if (w !== ansNum) wrongAnswers.add(String(w));
    }
  } else {
    // For shapes, pick other shapes from the cycle pool
    const cycleIdx = Math.floor(Math.random() * SHAPE_CYCLES.length);
    const allShapes = [...new Set([...SHAPE_CYCLES.flat()])].filter(s => s !== answer);
    while (wrongAnswers.size < 3 && allShapes.length > 0) {
      const idx = Math.floor(Math.random() * allShapes.length);
      wrongAnswers.add(allShapes.splice(idx, 1)[0]);
    }
  }

  const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);

  return { sequence: [...visible, '?'], answer, options, type };
}

function getConfigForLevel(level: number) {
  return { roundsPerGame: Math.min(5 + level, 12) };
}

export default function SeriesGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('series');
  const [currentSeries, setCurrentSeries] = useState<ReturnType<typeof generateSeries> | null>(null);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameComplete, setGameComplete] = useState(false);

  const config = getConfigForLevel(progress.level);

  const nextRound = useCallback(() => {
    setFeedback(null);
    setCurrentSeries(generateSeries(progress.level));
  }, [progress.level]);

  useEffect(() => { nextRound(); }, [nextRound]);

  const handleAnswer = (answer: string) => {
    if (feedback) return;
    const isCorrect = answer === currentSeries?.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect(c => c + 1);
    else setWrong(w => w + 1);

    setTimeout(() => {
      const nextR = round + 1;
      if (nextR >= config.roundsPerGame) {
        const totalCorrect = correct + (isCorrect ? 1 : 0);
        const accuracy = totalCorrect / config.roundsPerGame;
        const won = accuracy >= 0.6;
        const points = Math.round(accuracy * 100);
        recordResult(won, points);
        setGameComplete(true);
      } else {
        setRound(nextR);
        nextRound();
      }
    }, 1000);
  };

  if (gameComplete) {
    return (
      <GameComplete
        title="סדרות"
        level={progress.level}
        score={progress.score}
        customStats={[
          { label: 'נכונות', value: correct },
          { label: 'שגויות', value: wrong },
        ]}
        onPlayAgain={() => {
          setRound(0);
          setCorrect(0);
          setWrong(0);
          setGameComplete(false);
          nextRound();
        }}
        isNewRecord={isNewRecord}
        leveledUp={leveledUp}
      />
    );
  }

  if (!currentSeries) return null;

  return (
    <div>
      <GameHeader title="סדרות" level={progress.level} score={progress.score} />

      <div className="text-center mt-2 mb-4">
        <p className="text-sm text-muted-foreground">סיבוב {round + 1} / {config.roundsPerGame}</p>
        <p className="text-sm text-muted-foreground mt-1">מה בא אחרי?</p>
      </div>

      <div className="card-reset p-6 mb-6">
        <div className="flex justify-center gap-3 flex-wrap" dir="ltr">
          {currentSeries.sequence.map((item, i) => (
            <motion.div
              key={`${round}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                item === '?'
                  ? 'bg-primary/10 border-2 border-dashed border-primary text-primary'
                  : 'bg-secondary text-foreground'
              }`}
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentSeries.options.map((option, i) => (
          <motion.button
            key={`${round}-opt-${i}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswer(option)}
            disabled={feedback !== null}
            className={`card-reset p-4 text-center text-xl font-bold transition-colors ${
              feedback && option === currentSeries.answer
                ? 'bg-success/20 border-2 border-success'
                : feedback === 'wrong' && option !== currentSeries.answer
                ? 'opacity-50'
                : 'hover:bg-secondary/80'
            }`}
          >
            {option}
          </motion.button>
        ))}
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center mt-4 text-lg font-bold ${
            feedback === 'correct' ? 'text-success' : 'text-destructive'
          }`}
        >
          {feedback === 'correct' ? '🎉 נכון!' : `❌ התשובה: ${currentSeries.answer}`}
        </motion.div>
      )}
    </div>
  );
}
