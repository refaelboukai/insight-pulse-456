import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';
import { Lightbulb, BookOpen, Clock, ArrowRight } from 'lucide-react';
import {
  READING_PASSAGES,
  DIFFICULTY_CONFIG,
  type ReadingPassage,
  type Difficulty,
} from '@reset/data/readingComprehension';

export default function ReadingGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('reading');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showPassageFirst, setShowPassageFirst] = useState(true);
  const [timer, setTimer] = useState<number | null>(null);
  const [highScore, setHighScore] = useState(() => {
    try { return JSON.parse(localStorage.getItem('reading_highscore') || '{}'); } catch { return {}; }
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  const pickPassage = useCallback((diff: Difficulty) => {
    const passages = READING_PASSAGES[diff];
    const p = passages[Math.floor(Math.random() * passages.length)];
    setPassage(p);
    setQuestionIdx(0);
    setCorrect(0);
    setWrong(0);
    setFeedback(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setGameComplete(false);
    setShowPassageFirst(true);
    setTimer(null);
  }, []);

  const startDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    pickPassage(diff);
  };

  // Timer for medium/hard
  useEffect(() => {
    if (!config || !config.timePerQuestion || showPassageFirst || feedback || gameComplete) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimer(config.timePerQuestion);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev === null || prev <= 1) {
          // Time's up – count as wrong
          clearInterval(timerRef.current!);
          setFeedback('wrong');
          setWrong(w => w + 1);
          setTimeout(() => advanceQuestion(false), 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [questionIdx, showPassageFirst, feedback, gameComplete, config]);

  const advanceQuestion = (wasCorrect?: boolean) => {
    if (!passage || !config || !difficulty) return;
    const nextIdx = questionIdx + 1;
    if (nextIdx >= passage.questions.length) {
      const totalCorrect = correct + (wasCorrect ? 1 : 0);
      const accuracy = totalCorrect / passage.questions.length;
      const won = accuracy >= 0.5;
      const points = Math.round(accuracy * 100 * config.pointsMultiplier) + (progress.level * 5);
      recordResult(won, points);

      // Save high score
      const key = difficulty;
      const prev = highScore[key] || 0;
      if (points > prev) {
        const newHS = { ...highScore, [key]: points };
        setHighScore(newHS);
        localStorage.setItem('reading_highscore', JSON.stringify(newHS));
      }

      setGameComplete(true);
    } else {
      setQuestionIdx(nextIdx);
      setFeedback(null);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (feedback || !passage) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const q = passage.questions[questionIdx];
    const isCorrect = answer === q.answer;
    setSelectedAnswer(answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect(c => c + 1);
    else setWrong(w => w + 1);
    if (q.explanation) setShowExplanation(true);

    setTimeout(() => advanceQuestion(isCorrect), q.explanation ? 2500 : 1500);
  };

  // ── Difficulty selection ──
  if (!difficulty) {
    return (
      <div className="text-center">
        <GameHeader title="הבנת הנקרא" level={progress.level} score={progress.score} />
        <div className="card-reset p-6 mt-4">
          <BookOpen size={36} className="mx-auto text-primary mb-3" />
          <p className="text-lg font-bold text-foreground mb-1">בחר רמת קושי</p>
          <p className="text-sm text-muted-foreground mb-5">קרא טקסט וענה על שאלות הבנה</p>

          <div className="space-y-3">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => {
              const cfg = DIFFICULTY_CONFIG[diff];
              const hs = highScore[diff] || 0;
              return (
                <motion.button
                  key={diff}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startDifficulty(diff)}
                  className="w-full card-reset p-4 text-right flex items-center gap-3 border-2 border-border/50 hover:border-primary/40 transition-all"
                >
                  <span className="text-3xl">{cfg.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{cfg.label}</span>
                      {hs > 0 && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          🏆 {hs}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
                    {cfg.timePerQuestion && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {cfg.timePerQuestion} שניות לשאלה
                      </p>
                    )}
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Game complete ──
  if (gameComplete && passage && config) {
    return (
      <GameComplete
        title="הבנת הנקרא"
        level={progress.level}
        score={progress.score}
        customStats={[
          { label: 'נכונות', value: correct },
          { label: 'שגויות', value: wrong },
          { label: 'מכפיל', value: config.pointsMultiplier },
        ]}
        onPlayAgain={() => pickPassage(difficulty)}
        isNewRecord={isNewRecord}
        leveledUp={leveledUp}
      />
    );
  }

  if (!passage) return null;
  const currentQ = passage.questions[questionIdx];

  // ── Show passage first ──
  if (showPassageFirst) {
    return (
      <div>
        <GameHeader title="הבנת הנקרא" level={progress.level} score={progress.score} />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-reset p-5 mt-4 border-2 border-primary/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{passage.emoji}</span>
            <span className="font-bold text-foreground">{passage.title}</span>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground mr-auto">
              {config!.label}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {passage.text}
          </p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPassageFirst(false)}
          className="btn-primary w-full mt-4 text-lg py-3"
        >
          קראתי, אני מוכן לשאלות! 📝
        </motion.button>
      </div>
    );
  }

  // ── Questions ──
  return (
    <div>
      <GameHeader title="הבנת הנקרא" level={progress.level} score={correct * 10} />

      {/* Timer bar */}
      {config!.timePerQuestion && timer !== null && (
        <div className="w-full h-2 bg-secondary rounded-full mb-2 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${timer <= 5 ? 'bg-destructive' : 'bg-primary'}`}
            animate={{ width: `${(timer / config!.timePerQuestion) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <span>{passage.emoji}</span> {passage.title}
        </span>
        <span>שאלה {questionIdx + 1} / {passage.questions.length}</span>
        {timer !== null && (
          <span className={`font-bold ${timer <= 5 ? 'text-destructive' : ''}`}>
            ⏱️ {timer}
          </span>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-4">
        {passage.questions.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < questionIdx
                ? 'bg-green-500'
                : i === questionIdx
                ? 'bg-primary scale-125'
                : 'bg-secondary'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <motion.div
        key={questionIdx}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-reset p-4 mb-4 border-2 border-primary/10"
      >
        <p className="text-sm font-medium text-foreground leading-relaxed">{currentQ.question}</p>
      </motion.div>

      {/* Options */}
      <div className="grid gap-2">
        {currentQ.options.map((option, i) => {
          const isSelected = selectedAnswer === option;
          const isCorrectAnswer = option === currentQ.answer;
          let style = 'hover:bg-secondary/80 border border-border/50';
          if (feedback) {
            if (isCorrectAnswer) style = 'bg-green-500/15 border-2 border-green-500 text-green-700 dark:text-green-400';
            else if (isSelected && !isCorrectAnswer) style = 'bg-destructive/15 border-2 border-destructive text-destructive';
            else style = 'opacity-40 border border-border/30';
          }

          return (
            <motion.button
              key={`${questionIdx}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={!feedback ? { scale: 0.97 } : {}}
              onClick={() => handleAnswer(option)}
              disabled={feedback !== null}
              className={`card-reset p-3 text-right text-sm font-medium transition-all ${style}`}
            >
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary/60 flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                  {['א', 'ב', 'ג', 'ד'][i]}
                </span>
                {option}
                {feedback && isCorrectAnswer && <span className="mr-auto">✅</span>}
                {feedback && isSelected && !isCorrectAnswer && <span className="mr-auto">❌</span>}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Feedback + explanation */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className={`text-center text-lg font-bold mb-2 ${
              feedback === 'correct' ? 'text-green-500' : 'text-destructive'
            }`}>
              {feedback === 'correct' ? '🎉 נכון מאוד!' : '❌ לא נכון'}
            </div>
            {showExplanation && currentQ.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="card-reset p-3 bg-primary/5 border border-primary/20 text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Lightbulb size={14} className="text-primary" />
                  <span className="text-xs font-bold text-primary">הסבר</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{currentQ.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
