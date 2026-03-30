import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';
import { playClick, playSuccess, playWarning, playSelect } from '@reset/hooks/useSoundEffects';

// ═══ Challenge Types ═══
type ChallengeType =
  | 'catch'       // לחץ רק על המטרות
  | 'avoid'       // לחץ על הכל חוץ מהאדומים
  | 'sequence'    // לחץ על המספרים בסדר עולה
  | 'color-match' // לחץ רק על הצבע המבוקש
  | 'memory-tap'  // זכור ולחץ על מה שהבהב
  | 'growing'     // לחץ לפני שהם נעלמים
  | 'mirror'      // לחץ על הצד ההפוך
  | 'shape-sort'  // לחץ רק על הצורה המבוקשת
  | 'rapid-fire'  // לחץ כמה שיותר מהר על מטרות שצצות

interface ChallengeConfig {
  type: ChallengeType;
  title: string;
  instruction: string;
  emoji: string;
  minDifficulty: 'easy' | 'medium' | 'hard';
}

const CHALLENGES: ChallengeConfig[] = [
  { type: 'catch', title: 'תפוס מטרות', instruction: 'לחץ על ⭐ בלבד! הימנע מ-💣', emoji: '⭐', minDifficulty: 'easy' },
  { type: 'avoid', title: 'הימנע!', instruction: 'לחץ על 🟢 בלבד! אל תיגע ב-🔴', emoji: '🟢', minDifficulty: 'easy' },
  { type: 'growing', title: 'מהיר!', instruction: 'לחץ על המטרות לפני שהן מתכווצות!', emoji: '💨', minDifficulty: 'easy' },
  { type: 'sequence', title: 'סדר מספרים', instruction: 'לחץ על המספרים מ-1 בסדר עולה!', emoji: '🔢', minDifficulty: 'medium' },
  { type: 'color-match', title: 'התאם צבע', instruction: 'לחץ רק על העיגולים בצבע המבוקש!', emoji: '🎨', minDifficulty: 'medium' },
  { type: 'shape-sort', title: 'מיין צורות', instruction: 'לחץ רק על הצורה המבוקשת!', emoji: '🔷', minDifficulty: 'medium' },
  { type: 'rapid-fire', title: 'יריות מהירות', instruction: 'לחץ על כל מטרה שצצה! מהר!', emoji: '🎯', minDifficulty: 'medium' },
  { type: 'memory-tap', title: 'זיכרון מיקום', instruction: 'זכור את המיקומים שהבהבו ולחץ עליהם!', emoji: '🧠', minDifficulty: 'hard' },
  { type: 'mirror', title: 'מראה', instruction: 'לחץ על הצד ההפוך מהמטרה!', emoji: '🪞', minDifficulty: 'hard' },
];

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyOption {
  key: Difficulty;
  label: string;
  emoji: string;
  desc: string;
  rounds: number;
  speedMult: number;
  timeMult: number;
  targetMult: number;
  decoyMult: number;
}

const DIFFICULTIES: DifficultyOption[] = [
  { key: 'easy', label: 'קלה', emoji: '🌱', desc: 'מטרות גדולות, מעט מטעים', rounds: 3, speedMult: 1.2, timeMult: 0.7, targetMult: 0.8, decoyMult: 0.5 },
  { key: 'medium', label: 'בינונית', emoji: '⚡', desc: 'מהירות גוברת, יותר מטעים', rounds: 4, speedMult: 1.4, timeMult: 0.85, targetMult: 1.0, decoyMult: 1.0 },
  { key: 'hard', label: 'קשה', emoji: '🔥', desc: 'קטן, מהיר, הרבה מטעים!', rounds: 5, speedMult: 1.8, timeMult: 0.65, targetMult: 1.3, decoyMult: 1.5 },
];

function getConfigForDifficulty(level: number, diff: DifficultyOption) {
  const baseSize = Math.max(52 - level * 3, 28);
  const targetSize = Math.round(baseSize * (diff.key === 'hard' ? 0.8 : diff.key === 'easy' ? 1.1 : 1));
  const speed = Math.min(3 + level * 0.4, 6) * diff.speedMult;
  const timePerRound = Math.round(Math.max(10 - level * 0.5, 6) * diff.timeMult);
  return { targetSize, speed, totalRounds: diff.rounds, timePerRound, targetMult: diff.targetMult, decoyMult: diff.decoyMult };
}

// ═══ Target types ═══
interface Target {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  isGood: boolean;
  color?: string;
  size?: number;
  spawnTime?: number;
  seqNum?: number;
}

const GOOD_EMOJIS = ['⭐', '🎯', '💎', '🌟', '✨', '🏆', '💫'];
const BAD_EMOJIS = ['💣', '❌', '🚫', '⛔', '💀', '☠️'];
const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#f97316'];
const COLOR_NAMES: Record<string, string> = {
  '#3b82f6': 'כחול', '#ef4444': 'אדום', '#22c55e': 'ירוק',
  '#eab308': 'צהוב', '#a855f7': 'סגול', '#f97316': 'כתום',
};
const SHAPES = ['●', '■', '▲', '◆', '★', '⬟'];
const SHAPE_NAMES: Record<string, string> = {
  '●': 'עיגול', '■': 'ריבוע', '▲': 'משולש', '◆': 'מעוין', '★': 'כוכב', '⬟': 'מחומש',
};

export default function CoordinationGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('coordination');
  const [difficulty, setDifficulty] = useState<DifficultyOption | null>(null);
  const [gameState, setGameState] = useState<'select' | 'briefing' | 'playing' | 'roundEnd' | 'complete'>('select');
  const [targets, setTargets] = useState<Target[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [totalMisses, setTotalMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [challenges, setChallenges] = useState<ChallengeConfig[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeConfig | null>(null);
  const [matchColor, setMatchColor] = useState('#3b82f6');
  const [matchShape, setMatchShape] = useState('●');
  const [nextSeq, setNextSeq] = useState(1);
  const [flashPhase, setFlashPhase] = useState(false);
  const [flashPositions, setFlashPositions] = useState<{ x: number; y: number }[]>([]);
  const [feedback, setFeedback] = useState<{ x: number; y: number; good: boolean } | null>(null);
  const [roundScore, setRoundScore] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const configRef = useRef(getConfigForDifficulty(progress.level, DIFFICULTIES[1]));

  const selectDifficulty = (diff: DifficultyOption) => {
    playSelect();
    setDifficulty(diff);
    configRef.current = getConfigForDifficulty(progress.level, diff);
    const cfg = configRef.current;

    // Pick challenges appropriate for difficulty
    const available = CHALLENGES.filter(c => {
      if (diff.key === 'easy') return c.minDifficulty === 'easy';
      if (diff.key === 'medium') return c.minDifficulty !== 'hard';
      return true; // hard gets all
    });
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, cfg.totalRounds);
    setChallenges(picked);
    setCurrentRound(0);
    setTotalHits(0);
    setTotalMisses(0);
    setRoundScore(0);
    setCurrentChallenge(picked[0]);
    setGameState('briefing');
  };

  const config = configRef.current;

  // Start a round
  const startRound = useCallback(() => {
    const challenge = challenges[currentRound];
    if (!challenge) return;
    setCurrentChallenge(challenge);
    setHits(0);
    setMisses(0);
    setTimeLeft(config.timePerRound);
    setNextSeq(1);
    setFlashPhase(false);

    const newTargets = spawnTargetsForChallenge(challenge.type, progress.level, config);
    setTargets(newTargets);

    if (challenge.type === 'color-match') {
      const numColors = Math.min(COLORS.length, 3 + Math.floor(progress.level / 3));
      setMatchColor(COLORS[Math.floor(Math.random() * numColors)]);
    }

    if (challenge.type === 'shape-sort') {
      const numShapes = Math.min(SHAPES.length, 3 + Math.floor(progress.level / 3));
      setMatchShape(SHAPES[Math.floor(Math.random() * numShapes)]);
    }

    if (challenge.type === 'memory-tap') {
      const count = Math.round((3 + Math.floor(progress.level / 3)) * config.targetMult);
      const positions = Array.from({ length: count }, () => ({
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 65,
      }));
      setFlashPositions(positions);
      setFlashPhase(true);
      setTimeout(() => {
        setFlashPhase(false);
        const goodTargets = positions.map((p, i) => ({
          id: Date.now() + i,
          x: p.x, y: p.y, vx: 0, vy: 0,
          label: '❓', isGood: true, size: 44,
        }));
        const decoyCount = Math.round(3 * config.decoyMult);
        const decoys: Target[] = Array.from({ length: decoyCount }, (_, i) => ({
          id: Date.now() + 100 + i,
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 70,
          vx: 0, vy: 0,
          label: '❓', isGood: false, size: 44,
        }));
        setTargets([...goodTargets, ...decoys]);
        setGameState('playing');
      }, 2000 + positions.length * 400);
    } else {
      setGameState('playing');
    }
  }, [challenges, currentRound, config, progress.level]);

  function spawnTargetsForChallenge(type: ChallengeType, level: number, cfg: typeof config): Target[] {
    const results: Target[] = [];
    const spd = cfg.speed;

    switch (type) {
      case 'catch': {
        const numGood = Math.round((3 + Math.floor(level / 3)) * cfg.targetMult);
        const numBad = Math.round(Math.min(2 + Math.floor(level / 2), 5) * cfg.decoyMult);
        for (let i = 0; i < numGood + numBad; i++) {
          const isGood = i < numGood;
          const angle = Math.random() * Math.PI * 2;
          results.push({
            id: Date.now() + i, x: 15 + Math.random() * 70, y: 15 + Math.random() * 65,
            vx: Math.cos(angle) * spd * (0.5 + Math.random()),
            vy: Math.sin(angle) * spd * (0.5 + Math.random()),
            label: isGood ? GOOD_EMOJIS[Math.floor(Math.random() * GOOD_EMOJIS.length)] : BAD_EMOJIS[Math.floor(Math.random() * BAD_EMOJIS.length)],
            isGood,
          });
        }
        break;
      }
      case 'avoid': {
        const total = Math.round((5 + Math.floor(level / 2)) * cfg.targetMult);
        const numBad = Math.round((2 + Math.floor(level / 3)) * cfg.decoyMult);
        for (let i = 0; i < total; i++) {
          const isGood = i >= numBad;
          const angle = Math.random() * Math.PI * 2;
          results.push({
            id: Date.now() + i, x: 15 + Math.random() * 70, y: 15 + Math.random() * 65,
            vx: Math.cos(angle) * spd * (0.4 + Math.random() * 0.6),
            vy: Math.sin(angle) * spd * (0.4 + Math.random() * 0.6),
            label: isGood ? '🟢' : '🔴',
            isGood,
          });
        }
        break;
      }
      case 'sequence': {
        const count = Math.min(Math.round((5 + Math.floor(level / 2)) * cfg.targetMult), 12);
        for (let i = 1; i <= count; i++) {
          const angle = Math.random() * Math.PI * 2;
          results.push({
            id: Date.now() + i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 70,
            vx: Math.cos(angle) * spd * 0.4,
            vy: Math.sin(angle) * spd * 0.4,
            label: String(i), isGood: true, seqNum: i,
          });
        }
        break;
      }
      case 'color-match': {
        const total = Math.round((6 + Math.floor(level / 2)) * cfg.targetMult);
        const numColors = Math.min(COLORS.length, 3 + Math.floor(level / 3));
        for (let i = 0; i < total; i++) {
          const color = COLORS[Math.floor(Math.random() * numColors)];
          const angle = Math.random() * Math.PI * 2;
          results.push({
            id: Date.now() + i, x: 15 + Math.random() * 70, y: 15 + Math.random() * 65,
            vx: Math.cos(angle) * spd * 0.5,
            vy: Math.sin(angle) * spd * 0.5,
            label: '●', isGood: false, color,
          });
        }
        break;
      }
      case 'shape-sort': {
        const total = Math.round((6 + Math.floor(level / 2)) * cfg.targetMult);
        const numShapes = Math.min(SHAPES.length, 3 + Math.floor(level / 3));
        for (let i = 0; i < total; i++) {
          const shape = SHAPES[Math.floor(Math.random() * numShapes)];
          const angle = Math.random() * Math.PI * 2;
          results.push({
            id: Date.now() + i, x: 15 + Math.random() * 70, y: 15 + Math.random() * 65,
            vx: Math.cos(angle) * spd * 0.45,
            vy: Math.sin(angle) * spd * 0.45,
            label: shape, isGood: false,
            color: COLORS[Math.floor(Math.random() * 3)],
          });
        }
        break;
      }
      case 'growing': {
        const total = Math.round((4 + Math.floor(level / 2)) * cfg.targetMult);
        for (let i = 0; i < total; i++) {
          results.push({
            id: Date.now() + i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 70,
            vx: 0, vy: 0,
            label: GOOD_EMOJIS[Math.floor(Math.random() * GOOD_EMOJIS.length)],
            isGood: true, spawnTime: Date.now() + i * 800,
            size: 50,
          });
        }
        break;
      }
      case 'rapid-fire': {
        // Start with just 1-2, more spawn over time
        for (let i = 0; i < 2; i++) {
          results.push({
            id: Date.now() + i, x: 15 + Math.random() * 70, y: 15 + Math.random() * 65,
            vx: 0, vy: 0,
            label: '🎯', isGood: true,
            spawnTime: Date.now(), size: 46,
          });
        }
        break;
      }
      case 'mirror': {
        const total = Math.round((4 + Math.floor(level / 3)) * cfg.targetMult);
        for (let i = 0; i < total; i++) {
          const angle = Math.random() * Math.PI * 2;
          results.push({
            id: Date.now() + i, x: 15 + Math.random() * 35, y: 15 + Math.random() * 65,
            vx: Math.cos(angle) * spd * 0.3,
            vy: Math.sin(angle) * spd * 0.3,
            label: '🎯', isGood: true,
          });
        }
        break;
      }
    }
    return results;
  }

  // Animation loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      setTargets(prev => prev.map(t => {
        let nx = t.x + t.vx * dt;
        let ny = t.y + t.vy * dt;
        let nvx = t.vx;
        let nvy = t.vy;

        if (nx < 5 || nx > 90) { nvx = -nvx; nx = Math.max(5, Math.min(90, nx)); }
        if (ny < 5 || ny > 85) { nvy = -nvy; ny = Math.max(5, Math.min(85, ny)); }

        let size = t.size;
        if ((currentChallenge?.type === 'growing' || currentChallenge?.type === 'rapid-fire') && t.spawnTime && Date.now() > t.spawnTime) {
          const shrinkRate = currentChallenge.type === 'rapid-fire' ? 12 : 8;
          const elapsed = (Date.now() - t.spawnTime) / 1000;
          size = Math.max(50 - elapsed * shrinkRate, 0);
          if (size <= 0) return null as any;
        }

        return { ...t, x: nx, y: ny, vx: nvx, vy: nvy, size };
      }).filter(Boolean));

      animRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gameState, currentChallenge?.type]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          endRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Respawn for growing & rapid-fire
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (currentChallenge?.type !== 'growing' && currentChallenge?.type !== 'rapid-fire') return;
    const interval = setInterval(() => {
      setTargets(prev => {
        const maxTargets = currentChallenge.type === 'rapid-fire' ? 4 : 3;
        if (prev.length < maxTargets) {
          return [...prev, {
            id: Date.now() + Math.random(),
            x: 10 + Math.random() * 80, y: 10 + Math.random() * 70,
            vx: 0, vy: 0,
            label: currentChallenge.type === 'rapid-fire' ? '🎯' : GOOD_EMOJIS[Math.floor(Math.random() * GOOD_EMOJIS.length)],
            isGood: true, spawnTime: Date.now(), size: 50,
          }];
        }
        return prev;
      });
    }, currentChallenge.type === 'rapid-fire' ? 800 : 1200);
    return () => clearInterval(interval);
  }, [gameState, currentChallenge?.type]);

  const endRound = useCallback(() => {
    setTotalHits(h => h + hits);
    setTotalMisses(m => m + misses);
    setRoundScore(s => s + hits * 10);
    const nextRound = currentRound + 1;
    if (nextRound >= challenges.length) {
      playSuccess();
      setGameState('complete');
    } else {
      setCurrentRound(nextRound);
      setCurrentChallenge(challenges[nextRound]);
      setGameState('roundEnd');
    }
  }, [hits, misses, currentRound, challenges]);

  // Record result
  useEffect(() => {
    if (gameState === 'complete') {
      const totalH = totalHits + hits;
      const totalM = totalMisses + misses;
      const accuracy = (totalH + totalM) > 0 ? totalH / (totalH + totalM) : 0;
      const diffBonus = difficulty?.key === 'hard' ? 2 : difficulty?.key === 'medium' ? 1.3 : 1;
      const won = accuracy >= 0.5 && totalH >= 5;
      const points = Math.round((totalH * 10 + Math.round(accuracy * 50) + progress.level * 5) * diffBonus);
      recordResult(won, points);
    }
  }, [gameState]);

  const showFeedback = (x: number, y: number, good: boolean) => {
    setFeedback({ x, y, good });
    if (good) playClick(); else playWarning();
    setTimeout(() => setFeedback(null), 400);
  };

  const handleTap = (target: Target, e: React.MouseEvent) => {
    if (gameState !== 'playing') return;
    const rect = areaRef.current?.getBoundingClientRect();
    const fx = rect ? ((e.clientX - rect.left) / rect.width) * 100 : target.x;
    const fy = rect ? ((e.clientY - rect.top) / rect.height) * 100 : target.y;

    if (currentChallenge?.type === 'sequence') {
      if (target.seqNum === nextSeq) {
        setHits(h => h + 1);
        setNextSeq(n => n + 1);
        showFeedback(fx, fy, true);
        setTargets(prev => prev.filter(t => t.id !== target.id));
        if (nextSeq >= targets.length) setTimeout(endRound, 500);
      } else {
        setMisses(m => m + 1);
        showFeedback(fx, fy, false);
      }
      return;
    }

    if (currentChallenge?.type === 'color-match') {
      const isMatch = target.color === matchColor;
      if (isMatch) { setHits(h => h + 1); showFeedback(fx, fy, true); }
      else { setMisses(m => m + 1); showFeedback(fx, fy, false); }
      replaceTarget(target, 'color-match');
      return;
    }

    if (currentChallenge?.type === 'shape-sort') {
      const isMatch = target.label === matchShape;
      if (isMatch) { setHits(h => h + 1); showFeedback(fx, fy, true); }
      else { setMisses(m => m + 1); showFeedback(fx, fy, false); }
      replaceTarget(target, 'shape-sort');
      return;
    }

    if (currentChallenge?.type === 'mirror') {
      setHits(h => h + 1);
      showFeedback(fx, fy, true);
      replaceTarget(target, 'mirror');
      return;
    }

    // Default: catch / avoid / growing / memory-tap / rapid-fire
    if (target.isGood) {
      setHits(h => h + 1);
      showFeedback(fx, fy, true);
    } else {
      setMisses(m => m + 1);
      showFeedback(fx, fy, false);
    }

    setTargets(prev => {
      const filtered = prev.filter(t => t.id !== target.id);
      if (currentChallenge?.type === 'memory-tap' || currentChallenge?.type === 'growing' || currentChallenge?.type === 'rapid-fire') return filtered;
      const angle = Math.random() * Math.PI * 2;
      const isDecoy = !target.isGood;
      return [...filtered, {
        id: Date.now() + Math.random(),
        x: 10 + Math.random() * 80, y: 10 + Math.random() * 70,
        vx: Math.cos(angle) * config.speed * (0.5 + Math.random()),
        vy: Math.sin(angle) * config.speed * (0.5 + Math.random()),
        label: isDecoy
          ? (currentChallenge?.type === 'avoid' ? '🔴' : BAD_EMOJIS[Math.floor(Math.random() * BAD_EMOJIS.length)])
          : (currentChallenge?.type === 'avoid' ? '🟢' : GOOD_EMOJIS[Math.floor(Math.random() * GOOD_EMOJIS.length)]),
        isGood: !isDecoy,
      }];
    });
  };

  const replaceTarget = (target: Target, type: ChallengeType) => {
    setTargets(prev => {
      const filtered = prev.filter(t => t.id !== target.id);
      const angle = Math.random() * Math.PI * 2;
      if (type === 'color-match') {
        const numColors = Math.min(COLORS.length, 3 + Math.floor(progress.level / 3));
        return [...filtered, {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 80, y: 10 + Math.random() * 70,
          vx: Math.cos(angle) * config.speed * 0.5,
          vy: Math.sin(angle) * config.speed * 0.5,
          label: '●', isGood: false,
          color: COLORS[Math.floor(Math.random() * numColors)],
        }];
      }
      if (type === 'shape-sort') {
        const numShapes = Math.min(SHAPES.length, 3 + Math.floor(progress.level / 3));
        return [...filtered, {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 80, y: 10 + Math.random() * 70,
          vx: Math.cos(angle) * config.speed * 0.45,
          vy: Math.sin(angle) * config.speed * 0.45,
          label: SHAPES[Math.floor(Math.random() * numShapes)], isGood: false,
          color: COLORS[Math.floor(Math.random() * 3)],
        }];
      }
      if (type === 'mirror') {
        return [...filtered, {
          id: Date.now() + Math.random(),
          x: 15 + Math.random() * 35, y: 15 + Math.random() * 65,
          vx: Math.cos(angle) * config.speed * 0.3,
          vy: Math.sin(angle) * config.speed * 0.3,
          label: '🎯', isGood: true,
        }];
      }
      return filtered;
    });
  };

  // Mirror area click
  const handleMirrorClick = (e: React.MouseEvent) => {
    if (currentChallenge?.type !== 'mirror' || gameState !== 'playing') return;
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    if (clickX < 50) return;
    const mirrorX = 100 - clickX;
    const matched = targets.find(t => Math.abs(t.x - mirrorX) < 8 && Math.abs(t.y - clickY) < 10);
    if (matched) {
      setHits(h => h + 1);
      showFeedback(clickX, clickY, true);
      replaceTarget(matched, 'mirror');
    } else {
      setMisses(m => m + 1);
      showFeedback(clickX, clickY, false);
    }
  };

  // ═══ RENDER ═══

  if (gameState === 'complete') {
    const totalH = totalHits + hits;
    const totalM = totalMisses + misses;
    return (
      <GameComplete
        title="קואורדינציה"
        level={progress.level}
        score={progress.score}
        customStats={[
          { label: 'פגיעות', value: totalH },
          { label: 'החטאות', value: totalM },
          { label: 'סיבובים', value: challenges.length },
        ]}
        onPlayAgain={() => setGameState('select')}
        isNewRecord={isNewRecord}
        leveledUp={leveledUp}
      />
    );
  }

  // ═══ Difficulty Selection ═══
  if (gameState === 'select') {
    return (
      <div className="text-center">
        <GameHeader title="קואורדינציה" level={progress.level} score={progress.score} />
        <div className="mt-4 mb-2">
          <p className="text-lg font-bold text-foreground mb-1">🎯 בחר רמת קושי</p>
          <p className="text-xs text-muted-foreground">האתגרים משתנים בכל סיבוב</p>
        </div>
        <div className="grid gap-3 mt-4">
          {DIFFICULTIES.map((diff) => (
            <motion.button
              key={diff.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => selectDifficulty(diff)}
              className="card-reset p-4 text-right flex items-center gap-4 hover:bg-secondary/80 transition-colors border border-border/50"
            >
              <span className="text-3xl">{diff.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-foreground text-base">{diff.label}</p>
                <p className="text-xs text-muted-foreground">{diff.desc}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{diff.rounds} סיבובים</p>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                {Array.from({ length: diff.key === 'easy' ? 1 : diff.key === 'medium' ? 2 : 3 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary" />
                ))}
                {Array.from({ length: 3 - (diff.key === 'easy' ? 1 : diff.key === 'medium' ? 2 : 3) }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-secondary" />
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ═══ Briefing / Round End ═══
  if (gameState === 'briefing' || gameState === 'roundEnd') {
    const challenge = challenges[currentRound];
    return (
      <div className="text-center">
        <GameHeader title="קואורדינציה" level={progress.level} score={roundScore + (totalHits + hits) * 10} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-reset p-6 mt-5"
        >
          <div className="text-4xl mb-3">{challenge.emoji}</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
              סיבוב {currentRound + 1} / {challenges.length}
            </span>
            {difficulty && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {difficulty.emoji} {difficulty.label}
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-foreground mb-2">{challenge.title}</p>
          <p className="text-sm text-muted-foreground mb-1">{challenge.instruction}</p>
          {challenge.type === 'mirror' && (
            <p className="text-xs text-primary/80 mb-1">🪞 לחץ על המיקום המשוקף בצד ימין!</p>
          )}
          {challenge.type === 'shape-sort' && (
            <p className="text-xs text-primary/80 mb-1">הצורות נעות – התמקד בצורה הנכונה!</p>
          )}
          <p className="text-xs text-muted-foreground/60 mb-4">⏱️ {config.timePerRound} שניות</p>
          {gameState === 'roundEnd' && (
            <div className="mb-4 p-2 bg-secondary/50 rounded-lg text-xs text-muted-foreground">
              סיבוב קודם: ✓{hits} פגיעות, ✗{misses} החטאות
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClick(); startRound(); }}
            className="btn-primary px-8 py-2.5"
          >
            {gameState === 'briefing' ? 'התחל! 💪' : 'סיבוב הבא ➡️'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ═══ Playing ═══
  const timerPercent = (timeLeft / config.timePerRound) * 100;

  return (
    <div>
      <GameHeader title="קואורדינציה" level={progress.level} score={roundScore + (totalHits + hits) * 10} />

      <div className="flex items-center justify-between text-xs mb-2">
        <span className="flex items-center gap-1 text-muted-foreground">
          <span>{currentChallenge?.emoji}</span>
          <span className="font-medium">{currentChallenge?.title}</span>
          <span className="text-muted-foreground/60">({currentRound + 1}/{challenges.length})</span>
        </span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-500 font-bold">✓{hits}</span>
          <span className="text-destructive font-bold">✗{misses}</span>
          <span className={`font-mono font-bold ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
            ⏱️{timeLeft}
          </span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-secondary rounded-full mb-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${timerPercent > 30 ? 'bg-primary' : 'bg-destructive'}`}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Match indicators */}
      {currentChallenge?.type === 'color-match' && (
        <div className="text-center mb-2">
          <span className="text-sm font-bold" style={{ color: matchColor }}>
            לחץ על: {COLOR_NAMES[matchColor]} ●
          </span>
        </div>
      )}
      {currentChallenge?.type === 'shape-sort' && (
        <div className="text-center mb-2">
          <span className="text-sm font-bold text-foreground">
            לחץ על: {SHAPE_NAMES[matchShape]} <span className="text-lg">{matchShape}</span>
          </span>
        </div>
      )}

      {/* Game area */}
      <div
        ref={areaRef}
        className="relative w-full rounded-2xl bg-secondary/30 border-2 border-border overflow-hidden"
        style={{ height: '320px' }}
        onClick={currentChallenge?.type === 'mirror' ? handleMirrorClick : undefined}
      >
        {currentChallenge?.type === 'mirror' && (
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30 z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-primary/30 rounded-full px-2 py-0.5 text-xs text-primary">
              🪞
            </div>
          </div>
        )}

        {flashPhase && flashPositions.map((pos, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1.2, 0.5] }}
            transition={{ duration: 1.5, delay: i * 0.4 }}
            className="absolute w-11 h-11 rounded-full bg-primary/60 flex items-center justify-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <span className="text-lg">💡</span>
          </motion.div>
        ))}

        <AnimatePresence>
          {!flashPhase && targets.map(target => {
            const size = target.size ?? config.targetSize;
            if (size <= 0) return null;
            return (
              <motion.button
                key={target.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.7 }}
                onClick={(e) => currentChallenge?.type !== 'mirror' && handleTap(target, e)}
                className="absolute flex items-center justify-center select-none"
                style={{
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  width: size,
                  height: size,
                  fontSize: target.color ? size * 0.7 : size * 0.6,
                  transform: 'translate(-50%, -50%)',
                  color: target.color || undefined,
                  textShadow: target.color ? `0 0 8px ${target.color}40` : undefined,
                  zIndex: 5,
                }}
              >
                {target.label}
              </motion.button>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 1, scale: 0.5, y: 0 }}
              animate={{ opacity: 0, scale: 1.5, y: -30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={`absolute pointer-events-none text-2xl font-bold z-20 ${feedback.good ? 'text-green-500' : 'text-destructive'}`}
              style={{ left: `${feedback.x}%`, top: `${feedback.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {feedback.good ? '✓' : '✗'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
