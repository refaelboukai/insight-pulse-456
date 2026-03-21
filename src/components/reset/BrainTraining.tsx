import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Zap, ListOrdered, Trophy, Calculator, BookOpen } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';
import BreathingBackground from '@/components/reset/BreathingBackground';
import { playClick } from '@/hooks/useSoundEffects';
import { LOGIC_QUESTIONS, type LogicQuestion } from '@/data/logicQuestions';
import { READING_PASSAGES, type ReadingPassage, type Difficulty } from '@/data/readingComprehension';

type GameId = 'memory' | 'reaction' | 'series' | 'math' | 'reading' | null;

const games = [
  { id: 'memory' as GameId, label: 'זיכרון', desc: 'מצא את הזוגות', icon: Brain, bg: 'bg-violet-50', text: 'text-violet-700', iconColor: 'text-violet-500' },
  { id: 'reaction' as GameId, label: 'תגובה מהירה', desc: 'לחץ כשמופיע!', icon: Zap, bg: 'bg-sky-50', text: 'text-sky-700', iconColor: 'text-sky-500' },
  { id: 'series' as GameId, label: 'חידות לוגיות', desc: 'מה הבא בתור?', icon: ListOrdered, bg: 'bg-amber-50', text: 'text-amber-700', iconColor: 'text-amber-500' },
  { id: 'math' as GameId, label: 'חשבון מהיר', desc: 'פתור נגד הזמן', icon: Calculator, bg: 'bg-orange-50', text: 'text-orange-700', iconColor: 'text-orange-500' },
  { id: 'reading' as GameId, label: 'הבנת הנקרא', desc: 'קרא וענה', icon: BookOpen, bg: 'bg-emerald-50', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
];

// ====== Memory Game ======
function MemoryGame() {
  const emojis = ['🐶', '🐱', '🐸', '🦊', '🐻', '🐼', '🐨', '🦁'];
  const [cards, setCards] = useState<{ emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const shuffled = [...emojis, ...emojis].sort(() => Math.random() - 0.5).map(emoji => ({ emoji, flipped: false, matched: false }));
    setCards(shuffled);
  }, []);

  const handleFlip = (index: number) => {
    if (flippedIndexes.length === 2 || cards[index].flipped || cards[index].matched) return;
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    const newFlipped = [...flippedIndexes, index];
    setFlippedIndexes(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (newCards[newFlipped[0]].emoji === newCards[newFlipped[1]].emoji) {
        newCards[newFlipped[0]].matched = true;
        newCards[newFlipped[1]].matched = true;
        setCards(newCards);
        setFlippedIndexes([]);
      } else {
        setTimeout(() => {
          newCards[newFlipped[0]].flipped = false;
          newCards[newFlipped[1]].flipped = false;
          setCards([...newCards]);
          setFlippedIndexes([]);
        }, 800);
      }
    }
  };

  const allMatched = cards.length > 0 && cards.every(c => c.matched);

  return (
    <div>
      <p className="text-center text-sm text-muted-foreground mb-3">מהלכים: {moves}</p>
      {allMatched && <p className="text-center text-lg font-bold text-primary mb-3">🎉 כל הכבוד! סיימת ב-{moves} מהלכים</p>}
      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
        {cards.map((card, i) => (
          <motion.button key={i} onClick={() => handleFlip(i)} whileTap={{ scale: 0.95 }}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${card.flipped || card.matched ? 'bg-primary/10 border-primary' : 'bg-card border-border'}`}>
            {card.flipped || card.matched ? card.emoji : '❓'}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ====== Reaction Game ======
function ReactionGame() {
  const [state, setState] = useState<'waiting' | 'ready' | 'go' | 'done'>('waiting');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);

  const start = () => {
    setState('ready');
    const delay = 1000 + Math.random() * 3000;
    setTimeout(() => { setState('go'); setStartTime(Date.now()); }, delay);
  };

  const handleClick = () => {
    if (state === 'go') { setReactionTime(Date.now() - startTime); setState('done'); }
    else if (state === 'ready') { setState('waiting'); }
  };

  return (
    <div className="text-center">
      {state === 'waiting' && <button onClick={start} className="bg-primary text-primary-foreground rounded-xl px-8 py-4 text-lg font-bold">התחל!</button>}
      {state === 'ready' && <button onClick={handleClick} className="w-48 h-48 rounded-full bg-destructive/20 text-destructive text-lg font-bold mx-auto flex items-center justify-center">חכה...</button>}
      {state === 'go' && <button onClick={handleClick} className="w-48 h-48 rounded-full bg-emerald-500 text-white text-lg font-bold mx-auto flex items-center justify-center animate-pulse">לחץ עכשיו!</button>}
      {state === 'done' && (
        <div>
          <p className="text-2xl font-bold text-primary mb-2">{reactionTime} ms</p>
          <p className="text-sm text-muted-foreground mb-4">{reactionTime < 300 ? 'מהיר מאוד! ⚡' : reactionTime < 500 ? 'טוב! 👍' : 'נסה שוב!'}</p>
          <button onClick={() => setState('waiting')} className="bg-primary text-primary-foreground rounded-xl px-6 py-2 font-semibold">שוב</button>
        </div>
      )}
    </div>
  );
}

// ====== Series (Logic) Game ======
function SeriesGame() {
  const [level, setLevel] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const availableQuestions = LOGIC_QUESTIONS.filter(g => g.minLevel <= level).flatMap(g => g.items);
  const question = availableQuestions[qIndex % availableQuestions.length];

  const handleAnswer = (answer: string) => {
    if (answer === question.answer) {
      setScore(s => s + 1);
      setFeedback('✅ נכון!');
      if (score > 0 && score % 3 === 0) setLevel(l => Math.min(l + 1, 5));
    } else {
      setFeedback(`❌ התשובה: ${question.answer}`);
    }
    setTimeout(() => { setFeedback(null); setQIndex(i => i + 1); }, 1500);
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex justify-between text-sm text-muted-foreground mb-3">
        <span>רמה: {level}</span><span>ניקוד: {score}</span>
      </div>
      <div className="rounded-2xl border bg-card p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{question.emoji}</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{question.category}</span>
        </div>
        <p className="text-base font-semibold text-foreground mb-4">{question.text}</p>
        <div className="grid grid-cols-2 gap-2">
          {question.options.map(opt => (
            <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
              className="rounded-xl border bg-secondary/30 p-3 text-sm font-medium text-foreground hover:bg-primary/10 transition-colors disabled:opacity-50">
              {opt}
            </button>
          ))}
        </div>
      </div>
      {feedback && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-lg font-bold">{feedback}</motion.p>}
    </div>
  );
}

// ====== Math Game ======
function MathGame() {
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [active, setActive] = useState(false);

  const generateQuestion = useCallback(() => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let ans = 0;
    if (op === '+') ans = a + b;
    else if (op === '-') ans = a - b;
    else ans = a * b;
    setQuestion(`${a} ${op} ${b} = ?`);
    setAnswer(ans);
    setInput('');
  }, []);

  const start = () => { setActive(true); setScore(0); setTimeLeft(30); generateQuestion(); };

  useEffect(() => {
    if (!active || timeLeft <= 0) { if (timeLeft <= 0) setActive(false); return; }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [active, timeLeft]);

  const checkAnswer = () => {
    if (parseInt(input) === answer) { setScore(s => s + 1); setFeedback('✅'); } else { setFeedback('❌'); }
    setTimeout(() => { setFeedback(null); generateQuestion(); }, 500);
  };

  if (!active) {
    return (
      <div className="text-center">
        {score > 0 && <p className="text-xl font-bold text-primary mb-3">ניקוד: {score} 🎯</p>}
        <button onClick={start} className="bg-primary text-primary-foreground rounded-xl px-8 py-3 font-bold text-lg">{score > 0 ? 'שחק שוב' : 'התחל!'}</button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto text-center">
      <div className="flex justify-between text-sm text-muted-foreground mb-4">
        <span>⏱ {timeLeft}s</span><span>ניקוד: {score}</span>
      </div>
      <p className="text-3xl font-bold text-foreground mb-4">{question}</p>
      <div className="flex gap-2 justify-center mb-3">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAnswer()}
          type="number" className="w-24 rounded-xl border text-center text-xl p-2" autoFocus />
        <button onClick={checkAnswer} className="bg-primary text-primary-foreground rounded-xl px-4 font-semibold">✓</button>
      </div>
      {feedback && <p className="text-2xl">{feedback}</p>}
    </div>
  );
}

// ====== Reading Game ======
function ReadingGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [passageIndex, setPassageIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showText, setShowText] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const passages = READING_PASSAGES[difficulty];
  const passage = passages[passageIndex % passages.length];
  const question = passage.questions[qIndex];

  const handleAnswer = (answer: string) => {
    if (answer === question.answer) { setScore(s => s + 1); setFeedback('✅ נכון!'); } else { setFeedback(`❌ ${question.answer}`); }
    setTimeout(() => {
      setFeedback(null);
      if (qIndex < passage.questions.length - 1) { setQIndex(q => q + 1); }
      else { setPassageIndex(p => p + 1); setQIndex(0); setShowText(true); }
    }, 1500);
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex gap-2 justify-center mb-4">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <button key={d} onClick={() => { setDifficulty(d); setPassageIndex(0); setQIndex(0); setShowText(true); }}
            className={`text-xs px-3 py-1.5 rounded-full ${difficulty === d ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            {d === 'easy' ? 'קל' : d === 'medium' ? 'בינוני' : 'קשה'}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mb-3">ניקוד: {score}</p>
      {showText ? (
        <div className="rounded-2xl border bg-card p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{passage.emoji}</span>
            <h3 className="font-bold text-foreground">{passage.title}</h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed mb-4">{passage.text}</p>
          <button onClick={() => setShowText(false)} className="bg-primary text-primary-foreground rounded-xl px-6 py-2 text-sm font-semibold w-full">מוכן לשאלות!</button>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-4">{question.question}</p>
          <div className="space-y-2">
            {question.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
                className="w-full rounded-xl border bg-secondary/30 p-3 text-sm text-foreground hover:bg-primary/10 disabled:opacity-50 text-right">
                {opt}
              </button>
            ))}
          </div>
          {feedback && <p className="text-center text-lg font-bold mt-3">{feedback}</p>}
        </div>
      )}
    </div>
  );
}

// ====== Main BrainTraining ======
export default function BrainTraining() {
  const navigate = useNavigate();
  const { fullName } = useAuth();
  const [activeGame, setActiveGame] = useState<GameId>(null);

  const handleBack = () => { playClick(); if (activeGame) setActiveGame(null); else navigate('/student'); };

  return (
    <PageTransition>
      <div className="min-h-screen p-4 pb-20 relative" style={{ background: 'var(--gradient-warm)' }}>
        <BreathingBackground />
        <div className="relative z-10">
          <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground mb-4 text-sm">
            <ArrowRight size={18} />
            <span>{activeGame ? 'חזרה למשחקים' : 'חזרה'}</span>
          </button>

          {!activeGame ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2">
                  <Trophy size={28} className="text-amber-500" />
                  <h1 className="text-2xl font-extrabold text-foreground">אימון מוח</h1>
                </div>
                {fullName && <p className="text-sm text-primary font-semibold">שלום {fullName}! 👋</p>}
                <p className="text-sm text-muted-foreground">בחר משחק ואתגר את המוח שלך!</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {games.map((game, i) => (
                  <motion.button key={game.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.95 }} onClick={() => { playClick(); setActiveGame(game.id); }}
                    className={`rounded-2xl flex flex-col items-center justify-center gap-2 p-4 ${game.bg} border hover:shadow-md transition-shadow`}>
                    <game.icon size={28} className={game.iconColor} />
                    <p className={`text-sm font-bold ${game.text}`}>{game.label}</p>
                    <p className="text-xs text-muted-foreground">{game.desc}</p>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {activeGame === 'memory' && <MemoryGame />}
              {activeGame === 'reaction' && <ReactionGame />}
              {activeGame === 'series' && <SeriesGame />}
              {activeGame === 'math' && <MathGame />}
              {activeGame === 'reading' && <ReadingGame />}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
