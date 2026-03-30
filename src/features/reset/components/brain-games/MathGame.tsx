import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';
import { playClick } from '@reset/hooks/useSoundEffects';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; emoji: string; levelRange: [number, number]; timeBonus: number; questionsCount: number }> = {
  easy: { label: 'קלה', emoji: '🟢', levelRange: [1, 3], timeBonus: 4, questionsCount: 8 },
  medium: { label: 'בינונית', emoji: '🟡', levelRange: [4, 7], timeBonus: 0, questionsCount: 12 },
  hard: { label: 'קשה', emoji: '🔴', levelRange: [8, 10], timeBonus: -2, questionsCount: 15 },
};

function getConfigForLevel(level: number, difficulty: Difficulty) {
  const timePerQuestion = Math.max(12 - level + DIFFICULTY_CONFIG[difficulty].timeBonus, 3);
  const totalQuestions = DIFFICULTY_CONFIG[difficulty].questionsCount;
  return { timePerQuestion, totalQuestions };
}

function getEffectiveLevel(baseLevel: number, difficulty: Difficulty): number {
  const [min, max] = DIFFICULTY_CONFIG[difficulty].levelRange;
  return Math.max(min, Math.min(max, baseLevel));
}

type Op = '+' | '-' | '×' | '÷';

function generateQuestion(level: number): { question: string; answer: number; options: number[] } {
  let a: number, b: number, answer: number, question: string;

  if (level <= 2) {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 15) + 1;
    if (Math.random() > 0.5) {
      answer = a + b;
      question = `${a} + ${b} = ?`;
    } else {
      answer = Math.max(a, b) - Math.min(a, b);
      question = `${Math.max(a, b)} - ${Math.min(a, b)} = ?`;
    }
  } else if (level <= 4) {
    const ops: Op[] = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * 30) + 5;
    if (op === '+') {
      answer = a + b;
      question = `${a} + ${b} = ?`;
    } else {
      answer = a - b;
      if (answer < 0) { answer = a + b; question = `${a} + ${b} = ?`; }
      else question = `${a} - ${b} = ?`;
    }
  } else if (level <= 6) {
    const ops: Op[] = ['+', '-', '×'];
    if (level >= 6) ops.push('÷');
    const op = ops[Math.floor(Math.random() * ops.length)];
    switch (op) {
      case '+': a = Math.floor(Math.random() * 80) + 20; b = Math.floor(Math.random() * 50) + 10; answer = a + b; break;
      case '-': a = Math.floor(Math.random() * 80) + 30; b = Math.floor(Math.random() * 30) + 5; answer = a - b; break;
      case '×': a = Math.floor(Math.random() * 9) + 2; b = Math.floor(Math.random() * 9) + 2; answer = a * b; break;
      case '÷': b = Math.floor(Math.random() * 8) + 2; answer = Math.floor(Math.random() * 10) + 1; a = answer * b; break;
      default: a = 1; b = 1; answer = 2;
    }
    question = `${a} ${op} ${b} = ?`;
  } else if (level <= 8) {
    const patterns = [
      () => { a = Math.floor(Math.random() * 10) + 2; b = Math.floor(Math.random() * 8) + 2; const c = Math.floor(Math.random() * 15) + 5; answer = a * b + c; return `${a} × ${b} + ${c} = ?`; },
      () => { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; const c = Math.floor(Math.random() * 12) + 2; answer = a * b - c; return `${a} × ${b} - ${c} = ?`; },
      () => { b = Math.floor(Math.random() * 8) + 2; answer = Math.floor(Math.random() * 10) + 2; a = answer * b; const c = Math.floor(Math.random() * 10) + 1; answer = answer + c; return `${a} ÷ ${b} + ${c} = ?`; },
      () => { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * 30) + 10; const c = Math.floor(Math.random() * 20) + 5; answer = a + b - c; return `${a} + ${b} - ${c} = ?`; },
    ];
    question = patterns[Math.floor(Math.random() * patterns.length)]();
  } else {
    const patterns = [
      () => { a = Math.floor(Math.random() * 12) + 3; b = Math.floor(Math.random() * 12) + 3; const c = Math.floor(Math.random() * 8) + 2; const d = Math.floor(Math.random() * 5) + 2; answer = a * b + c * d; return `${a} × ${b} + ${c} × ${d} = ?`; },
      () => { const percent = [10, 20, 25, 50][Math.floor(Math.random() * 4)]; a = Math.floor(Math.random() * 10 + 2) * (100 / percent); answer = a * percent / 100; return `${percent}% מתוך ${a} = ?`; },
      () => { a = Math.floor(Math.random() * 15) + 5; answer = a * a; return `${a}² = ?`; },
      () => { a = Math.floor(Math.random() * 8) + 2; b = Math.floor(Math.random() * 8) + 2; const c = Math.floor(Math.random() * 6) + 2; answer = (a + b) * c; return `(${a} + ${b}) × ${c} = ?`; },
    ];
    question = patterns[Math.floor(Math.random() * patterns.length)]();
  }

  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const range = Math.max(5, Math.abs(answer) * 0.3);
    const offset = Math.floor(Math.random() * range) + 1;
    const wrong = Math.random() > 0.5 ? answer + offset : Math.max(0, answer - offset);
    if (wrong !== answer) wrongSet.add(wrong);
  }

  const options = [answer, ...wrongSet].sort(() => Math.random() - 0.5);
  return { question: question!, answer, options };
}

export default function MathGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('math');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentQ, setCurrentQ] = useState<ReturnType<typeof generateQuestion> | null>(null);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveLevel = difficulty ? getEffectiveLevel(progress.level, difficulty) : progress.level;
  const config = difficulty ? getConfigForLevel(effectiveLevel, difficulty) : { timePerQuestion: 10, totalQuestions: 10 };

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    setCurrentQ(generateQuestion(effectiveLevel));
    setTimeLeft(config.timePerQuestion);
  }, [effectiveLevel, config.timePerQuestion]);

  useEffect(() => {
    if (difficulty) nextQuestion();
  }, [difficulty, nextQuestion]);

  // Countdown timer
  useEffect(() => {
    if (!difficulty || feedback || gameComplete) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [round, feedback, gameComplete, difficulty]);

  const handleAnswer = (selected: number | null) => {
    if (feedback) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = selected === currentQ?.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect(c => c + 1);
    else setWrong(w => w + 1);

    setTimeout(() => {
      const nextR = round + 1;
      if (nextR >= config.totalQuestions) {
        const totalCorrect = correct + (isCorrect ? 1 : 0);
        const accuracy = totalCorrect / config.totalQuestions;
        const won = accuracy >= 0.6;
        const points = Math.round(accuracy * 100) + (effectiveLevel * 5);
        recordResult(won, points);
        setGameComplete(true);
      } else {
        setRound(nextR);
        nextQuestion();
      }
    }, 1000);
  };

  const handleSelectDifficulty = (d: Difficulty) => {
    playClick();
    setDifficulty(d);
  };

  const resetGame = () => {
    setRound(0);
    setCorrect(0);
    setWrong(0);
    setGameComplete(false);
    setDifficulty(null);
    setCurrentQ(null);
  };

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <div>
        <GameHeader title="חשבון מהיר" level={progress.level} score={progress.score} />
        <div className="text-center mt-4 mb-6">
          <p className="text-lg font-bold text-foreground mb-1">בחר רמת קושי</p>
          <p className="text-sm text-muted-foreground">הרמה משפיעה על סוג התרגילים, הזמן והכמות</p>
        </div>
        <div className="grid gap-4">
          {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([key, cfg], i) => (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectDifficulty(key)}
              className="card-reset p-5 text-right flex items-center gap-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="text-3xl">{cfg.emoji}</div>
              <div className="flex-1">
                <p className="text-lg font-bold text-foreground">{cfg.label}</p>
                <p className="text-sm text-muted-foreground">
                  {key === 'easy' && 'חיבור וחיסור בסיסי • זמן נוסף'}
                  {key === 'medium' && 'כפל, חילוק ותרגילים מורכבים'}
                  {key === 'hard' && 'אחוזים, חזקות ותרגילים מרובי שלבים'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cfg.questionsCount} שאלות • רמות {cfg.levelRange[0]}-{cfg.levelRange[1]}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <GameComplete
        title="חשבון מהיר"
        level={progress.level}
        score={progress.score}
        customStats={[
          { label: 'נכונות', value: correct },
          { label: 'שגויות', value: wrong },
        ]}
        onPlayAgain={resetGame}
        isNewRecord={isNewRecord}
        leveledUp={leveledUp}
      />
    );
  }

  if (!currentQ) return null;

  const timerPercent = (timeLeft / config.timePerQuestion) * 100;

  return (
    <div>
      <GameHeader title="חשבון מהיר" level={progress.level} score={progress.score} />

      <div className="text-center mt-2 mb-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
            {DIFFICULTY_CONFIG[difficulty].emoji} {DIFFICULTY_CONFIG[difficulty].label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">שאלה {round + 1} / {config.totalQuestions}</p>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-4 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${timerPercent > 30 ? 'bg-primary' : 'bg-destructive'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="card-reset p-8 mb-6 text-center" dir="ltr">
        <motion.p
          key={round}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl font-extrabold text-foreground"
        >
          {currentQ.question}
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentQ.options.map((option, i) => (
          <motion.button
            key={`${round}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswer(option)}
            disabled={feedback !== null}
            className={`card-reset p-4 text-center text-2xl font-bold transition-colors ${
              feedback && option === currentQ.answer
                ? 'bg-success/20 border-2 border-success'
                : feedback === 'wrong' && option !== currentQ.answer
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
          {feedback === 'correct' ? '🎉 נכון!' : `❌ התשובה: ${currentQ.answer}`}
        </motion.div>
      )}
    </div>
  );
}
