import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrainTraining } from '@reset/hooks/useBrainTraining';
import GameHeader from './GameHeader';
import GameComplete from './GameComplete';
import { playClick, playPlace, playClear, playCombo, playGameOver, playHighScore, playSuccess } from '@reset/hooks/useSoundEffects';
import { Trophy, Zap, Flame, Star, Play, Crown } from 'lucide-react';

const GRID = 8;

type Cell = { color: string; glow: string; highlight: string } | null;

const BLOCK_COLORS = {
  green:   { color: 'hsl(142 70% 42%)', glow: 'hsl(142 70% 62%)', highlight: 'hsl(142 70% 72%)' },
  blue:    { color: 'hsl(220 80% 52%)', glow: 'hsl(220 80% 68%)', highlight: 'hsl(220 80% 78%)' },
  purple:  { color: 'hsl(270 65% 52%)', glow: 'hsl(270 65% 68%)', highlight: 'hsl(270 65% 78%)' },
  red:     { color: 'hsl(0 80% 50%)', glow: 'hsl(0 80% 65%)', highlight: 'hsl(0 80% 75%)' },
  orange:  { color: 'hsl(30 90% 50%)', glow: 'hsl(30 90% 65%)', highlight: 'hsl(30 90% 75%)' },
  cyan:    { color: 'hsl(190 85% 48%)', glow: 'hsl(190 85% 65%)', highlight: 'hsl(190 85% 75%)' },
  yellow:  { color: 'hsl(45 90% 50%)', glow: 'hsl(45 90% 65%)', highlight: 'hsl(45 90% 75%)' },
  pink:    { color: 'hsl(340 75% 55%)', glow: 'hsl(340 75% 70%)', highlight: 'hsl(340 75% 80%)' },
};

const colorKeys = Object.keys(BLOCK_COLORS) as (keyof typeof BLOCK_COLORS)[];
const pickColor = () => {
  const k = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  return BLOCK_COLORS[k];
};

const SHAPES_EASY = [
  [[1]], [[1,1]], [[1],[1]], [[1,1,1]], [[1],[1],[1]],
  [[1,1],[1,1]], [[1,0],[1,1]], [[0,1],[1,1]],
];
const SHAPES_MEDIUM = [
  ...SHAPES_EASY,
  [[1,1],[1,0]], [[1,1],[0,1]], [[1,1,1],[0,1,0]],
  [[1,1,1,1]], [[1],[1],[1],[1]], [[1,0],[1,0],[1,1]],
];
const SHAPES_HARD = [
  ...SHAPES_MEDIUM,
  [[1,1,1,1,1]], [[1],[1],[1],[1],[1]],
  [[1,1,1],[1,1,1],[1,1,1]], [[1,1,0],[0,1,1],[0,0,1]], [[0,0,1],[0,1,1],[1,1,0]],
];

type Piece = { shape: number[][]; color: string; glow: string; highlight: string };

function makePiece(shapes: number[][][]): Piece {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const c = pickColor();
  return { shape, ...c };
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string; emoji: string; description: string;
  shapes: number[][][]; targetClears: number; pointsMultiplier: number; color: string;
}> = {
  easy:   { label: 'קל',    emoji: '😊', description: 'חלקים קטנים, יעד נמוך',     shapes: SHAPES_EASY,   targetClears: 8,  pointsMultiplier: 1,   color: 'hsl(142 60% 45%)' },
  medium: { label: 'בינוני', emoji: '🔥', description: 'חלקים מגוונים, אתגר מאוזן',  shapes: SHAPES_MEDIUM, targetClears: 12, pointsMultiplier: 1.5, color: 'hsl(48 90% 55%)' },
  hard:   { label: 'קשה',   emoji: '💀', description: 'חלקים ענקיים, יעד גבוה',     shapes: SHAPES_HARD,   targetClears: 18, pointsMultiplier: 2,   color: 'hsl(0 75% 55%)' },
};

function createBoard(): Cell[][] {
  return Array.from({ length: GRID }, () => Array(GRID).fill(null));
}

function getRandomPieces(shapes: number[][][], count: number): (Piece | null)[] {
  return Array.from({ length: count }, () => makePiece(shapes));
}

function canPlaceOnBoard(board: Cell[][], shape: number[][], row: number, col: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = row + r, nc = col + c;
      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID || board[nr][nc]) return false;
    }
  }
  return true;
}

function clearFullLines(board: Cell[][]): { newBoard: Cell[][]; cleared: number; clearedCells: Set<string> } {
  const toClear = new Set<string>();
  let cleared = 0;
  for (let r = 0; r < GRID; r++) {
    if (board[r].every(cell => cell !== null)) {
      for (let c = 0; c < GRID; c++) toClear.add(`${r},${c}`);
      cleared++;
    }
  }
  for (let c = 0; c < GRID; c++) {
    if (board.every(row => row[c] !== null)) {
      for (let r = 0; r < GRID; r++) toClear.add(`${r},${c}`);
      cleared++;
    }
  }
  if (toClear.size === 0) return { newBoard: board, cleared: 0, clearedCells: toClear };
  const newBoard = board.map((row, r) => row.map((cell, c) => toClear.has(`${r},${c}`) ? null : cell));
  return { newBoard, cleared, clearedCells: toClear };
}

function canAnyPieceFit(board: Cell[][], pieces: (Piece | null)[]): boolean {
  for (const piece of pieces) {
    if (!piece) continue;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (canPlaceOnBoard(board, piece.shape, r, c)) return true;
      }
    }
  }
  return false;
}

const HS_KEY = 'blockblast_highscore';
function getHighScore(): number { try { return parseInt(localStorage.getItem(HS_KEY) || '0', 10) || 0; } catch { return 0; } }
function setHighScore(val: number) { try { localStorage.setItem(HS_KEY, String(val)); } catch {} }

function BlockCell({ cell, size, isFlashing }: { cell: Cell; size: string; isFlashing: boolean }) {
  if (!cell) return null;
  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{
        scale: isFlashing ? [1, 1.2, 0] : 1,
        opacity: isFlashing ? [1, 1, 0] : 1,
      }}
      transition={{ duration: isFlashing ? 0.4 : 0.12 }}
      className="absolute inset-[1.5px] rounded-[5px]"
      style={{
        background: `linear-gradient(145deg, ${cell.highlight} 0%, ${cell.color} 40%, ${cell.glow} 100%)`,
        boxShadow: `
          inset 0 2px 4px ${cell.highlight}90,
          inset 0 -2px 3px rgba(0,0,0,0.25),
          inset 2px 0 3px ${cell.highlight}40,
          inset -2px 0 3px rgba(0,0,0,0.15),
          0 2px 8px ${cell.color}50
        `,
        border: `1px solid ${cell.highlight}60`,
      }}
    >
      <div className="absolute top-[2px] left-[3px] w-[40%] h-[30%] rounded-[3px] opacity-60"
        style={{ background: `linear-gradient(135deg, ${cell.highlight}cc, transparent)` }}
      />
    </motion.div>
  );
}

// ─── Draggable Piece Component ───
function DraggablePiece({ 
  piece, idx, isSelected, onSelect, boardRef, onDragOver, onDrop, onDragEnd 
}: {
  piece: Piece;
  idx: number;
  isSelected: boolean;
  onSelect: (idx: number) => void;
  boardRef: React.RefObject<HTMLDivElement>;
  onDragOver: (row: number, col: number, pieceIdx: number) => void;
  onDrop: (row: number, col: number, pieceIdx: number) => void;
  onDragEnd: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const pieceRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  // Convert pointer position to board cell, accounting for the finger offset
  // The piece preview appears above the finger, so we calculate where the
  // CENTER of the piece would land on the board
  const getCellFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!boardRef.current) return null;
    const boardRect = boardRef.current.getBoundingClientRect();
    const padding = 6; // matches p-[6px] on the board container
    const innerW = boardRect.width - padding * 2;
    const innerH = boardRect.height - padding * 2;
    // Each cell = inner / GRID (the 1px margin is included in the cell slot)
    const cellW = innerW / GRID;
    const cellH = innerH / GRID;
    
    // Finger offset: piece shows 50px above finger during drag
    const fingerOffsetY = -50;
    
    const relX = clientX - boardRect.left - padding;
    const relY = (clientY + fingerOffsetY) - boardRect.top - padding;
    
    // Which cell is the pointer center over?
    const centerCol = Math.floor(relX / cellW);
    const centerRow = Math.floor(relY / cellH);
    
    // Convert to top-left of piece
    const offR = Math.floor(piece.shape.length / 2);
    const offC = Math.floor(piece.shape[0].length / 2);
    
    return { row: centerRow - offR, col: centerCol - offC };
  }, [boardRef, piece.shape]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    startPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    setIsDragging(true);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) hasDraggedRef.current = true;
    
    setDragPos({ x: e.clientX, y: e.clientY });
    
    if (hasDraggedRef.current) {
      const cell = getCellFromPointer(e.clientX, e.clientY);
      if (cell) {
        onDragOver(cell.row, cell.col, idx);
      }
    }
  }, [isDragging, getCellFromPointer, onDragOver, idx]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragPos(null);
    
    if (!hasDraggedRef.current) {
      onSelect(idx);
      onDragEnd();
      return;
    }
    
    const cell = getCellFromPointer(e.clientX, e.clientY);
    if (cell) {
      onDrop(cell.row, cell.col, idx);
    }
    onDragEnd();
  }, [isDragging, getCellFromPointer, onDrop, onSelect, idx, onDragEnd]);

  const handlePointerCancel = useCallback(() => {
    setIsDragging(false);
    setDragPos(null);
    onDragEnd();
  }, [onDragEnd]);

  // Visual offset: move piece with finger, shifted up so it's visible
  const dragStyle = useMemo(() => {
    if (!isDragging || !dragPos) return {};
    const translateX = dragPos.x - startPosRef.current.x;
    const translateY = dragPos.y - startPosRef.current.y - 50;
    return {
      transform: `translate(${translateX}px, ${translateY}px) scale(1.25)`,
      zIndex: 100,
      opacity: 0.9,
      pointerEvents: 'none' as const,
    };
  }, [isDragging, dragPos]);

  return (
    <div
      ref={pieceRef}
      dir="ltr"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="p-2 rounded-xl flex items-center justify-center min-w-[3.5rem] min-h-[3.5rem] touch-none select-none"
      style={{
        background: isSelected && !isDragging
          ? `linear-gradient(135deg, ${piece.color}40, ${piece.color}20)`
          : 'transparent',
        border: isSelected && !isDragging ? `2px solid ${piece.color}` : '2px solid transparent',
        boxShadow: isDragging ? `0 8px 30px ${piece.color}60` : isSelected ? `0 4px 20px ${piece.color}40` : 'none',
        transition: isDragging ? 'none' : 'all 0.2s',
        cursor: 'grab',
        ...dragStyle,
      }}
    >
      <div>
        {piece.shape.map((row, ri) => (
          <div key={ri} className="flex">
            {row.map((cell, ci) => (
              <div key={ci} style={{ width: '0.7rem', height: '0.7rem', margin: '0.5px' }}>
                {cell ? (
                  <div className="w-full h-full rounded-[2px]"
                    style={{
                      background: `linear-gradient(145deg, ${piece.highlight}, ${piece.color})`,
                      boxShadow: `inset 0 1px 2px ${piece.highlight}80, inset 0 -1px 1px rgba(0,0,0,0.2), 0 0 4px ${piece.color}40`,
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TetrisGame() {
  const { progress, recordResult, isNewRecord, leveledUp } = useBrainTraining('tetris');
  const [gamePhase, setGamePhase] = useState<'menu' | 'playing' | 'complete' | 'gameover'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [availablePieces, setAvailablePieces] = useState<(Piece | null)[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [linesCleared, setLinesCleared] = useState(0);
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [lastPoints, setLastPoints] = useState<{ value: number; combo: number; key: number } | null>(null);
  const [piecesPlaced, setPiecesPlaced] = useState(0);
  const [highScore, setHighScoreState] = useState(getHighScore);
  const [newHighScore, setNewHighScore] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ row: number; col: number; pieceIdx: number } | null>(null);
  const prevPhaseRef = useRef('menu');
  const boardRef = useRef<HTMLDivElement>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setBoard(createBoard());
    setAvailablePieces(getRandomPieces(DIFFICULTY_CONFIG[diff].shapes, 3));
    setSelectedPiece(null);
    setHoverCell(null);
    setDragPreview(null);
    setLinesCleared(0);
    setFlashCells(new Set());
    setCombo(0);
    setMaxCombo(0);
    setRoundScore(0);
    setLastPoints(null);
    setPiecesPlaced(0);
    setNewHighScore(false);
    setScreenShake(false);
    setGamePhase('playing');
    prevPhaseRef.current = 'playing';
    playClick();
  };

  // Preview cells for click mode
  const clickPreviewCells = useMemo(() => {
    if (selectedPiece === null || !hoverCell) return null;
    const piece = availablePieces[selectedPiece];
    if (!piece) return null;
    const shape = piece.shape;
    const offR = Math.floor(shape.length / 2);
    const offC = Math.floor(shape[0].length / 2);
    const startR = hoverCell.row - offR;
    const startC = hoverCell.col - offC;
    const valid = canPlaceOnBoard(board, shape, startR, startC);
    const cells: { r: number; c: number }[] = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) cells.push({ r: startR + r, c: startC + c });
      }
    }
    return { cells, valid, startR, startC, piece };
  }, [selectedPiece, hoverCell, board, availablePieces]);

  // Preview cells for drag mode
  const dragPreviewCells = useMemo(() => {
    if (!dragPreview) return null;
    const piece = availablePieces[dragPreview.pieceIdx];
    if (!piece) return null;
    const { row, col } = dragPreview;
    const valid = canPlaceOnBoard(board, piece.shape, row, col);
    const cells: { r: number; c: number }[] = [];
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) cells.push({ r: row + r, c: col + c });
      }
    }
    return { cells, valid, piece };
  }, [dragPreview, board, availablePieces]);

  // Combined preview
  const previewCells = dragPreviewCells || clickPreviewCells;

  const placePiece = useCallback((startR: number, startC: number, pieceIdx: number) => {
    if (gamePhase !== 'playing') return false;
    const piece = availablePieces[pieceIdx];
    if (!piece) return false;

    if (!canPlaceOnBoard(board, piece.shape, startR, startC)) return false;

    playPlace();
    setPiecesPlaced(p => p + 1);

    const newBoard = board.map(r => [...r]);
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          newBoard[startR + r][startC + c] = { color: piece.color, glow: piece.glow, highlight: piece.highlight };
        }
      }
    }

    const newPieces = [...availablePieces];
    newPieces[pieceIdx] = null;
    setSelectedPiece(null);
    setHoverCell(null);
    setDragPreview(null);

    const { newBoard: clearedBoard, cleared, clearedCells } = clearFullLines(newBoard);

    if (cleared > 0) {
      setFlashCells(clearedCells);
      setBoard(newBoard);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 400);

      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));

      // Sound effects
      playClear(cleared);
      if (newCombo > 1) setTimeout(() => playCombo(newCombo), 200);

      const basePoints = 15;
      const comboBonus = newCombo > 1 ? newCombo * 10 : 0;
      const points = Math.round((cleared * basePoints + comboBonus) * config.pointsMultiplier);
      setRoundScore(prev => prev + points);
      setLastPoints({ value: points, combo: newCombo, key: Date.now() });

      setTimeout(() => {
        setBoard(clearedBoard);
        setFlashCells(new Set());
        setLinesCleared(prev => prev + cleared);
      }, 400);
    } else {
      setBoard(clearedBoard);
      setCombo(0);
    }

    const remaining = newPieces.filter(p => p !== null);
    if (remaining.length === 0) {
      const fresh = getRandomPieces(config.shapes, 3);
      setAvailablePieces(fresh);
      setTimeout(() => { if (!canAnyPieceFit(clearedBoard, fresh)) setGamePhase('gameover'); }, 450);
    } else {
      setAvailablePieces(newPieces);
      setTimeout(() => { if (!canAnyPieceFit(clearedBoard, remaining as Piece[])) setGamePhase('gameover'); }, 450);
    }
    return true;
  }, [gamePhase, availablePieces, board, combo, config]);

  // Click-to-place handler (still works alongside drag)
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gamePhase !== 'playing' || selectedPiece === null) return;
    const piece = availablePieces[selectedPiece];
    if (!piece) return;
    const offR = Math.floor(piece.shape.length / 2);
    const offC = Math.floor(piece.shape[0].length / 2);
    placePiece(row - offR, col - offC, selectedPiece);
  }, [gamePhase, selectedPiece, availablePieces, placePiece]);

  // Drag handlers
  const handleDragOver = useCallback((row: number, col: number, pieceIdx: number) => {
    setDragPreview({ row, col, pieceIdx });
  }, []);

  const handleDrop = useCallback((row: number, col: number, pieceIdx: number) => {
    placePiece(row, col, pieceIdx);
    setDragPreview(null);
  }, [placePiece]);

  const handlePieceSelect = useCallback((idx: number) => {
    setSelectedPiece(prev => prev === idx ? null : idx);
    setHoverCell(null);
    setDragPreview(null);
    playClick();
  }, []);

  useEffect(() => {
    if (prevPhaseRef.current === 'playing' && (gamePhase === 'complete' || gamePhase === 'gameover')) {
      prevPhaseRef.current = gamePhase;
      const won = gamePhase === 'complete';
      const points = won ? roundScore + Math.round(progress.level * 5 * config.pointsMultiplier) : Math.max(5, Math.round(roundScore * 0.5));
      recordResult(won, points);
      if (roundScore > highScore) {
        setHighScore(roundScore); setHighScoreState(roundScore); setNewHighScore(true);
        setTimeout(() => playHighScore(), 300);
      } else if (gamePhase === 'gameover') {
        playGameOver();
      } else {
        playSuccess();
      }
    }
  }, [gamePhase]);

  // ─── MENU ───
  if (gamePhase === 'menu') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-5 max-w-sm mx-auto">
        <div className="text-center">
          <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="text-5xl mb-2">🧩</motion.div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Block Blast</h2>
          <p className="text-sm text-muted-foreground mt-1">מלא שורות ועמודות כדי לנקות!</p>
        </div>

        {highScore > 0 && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40">
            <Crown size={20} className="text-yellow-500" />
            <span className="text-base font-extrabold text-yellow-600">{highScore}</span>
          </motion.div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Star size={14} className="text-primary" />
          <span>רמת אימון: {progress.level} | ניקוד כולל: {progress.score}</span>
        </div>

        <div className="w-full space-y-2.5">
          <p className="text-sm font-bold text-foreground text-center">בחר רמת קושי</p>
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
            const cfg = DIFFICULTY_CONFIG[diff];
            return (
              <motion.button key={diff} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => startGame(diff)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-right"
                style={{ borderColor: `${cfg.color}40`, background: `linear-gradient(135deg, ${cfg.color}08, ${cfg.color}15)` }}>
                <span className="text-2xl">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{cfg.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>x{cfg.pointsMultiplier}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">יעד: {cfg.targetClears} שורות/עמודות</p>
                </div>
                <Play size={20} className="text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ─── COMPLETE / GAME OVER ───
  if (gamePhase === 'complete' || gamePhase === 'gameover') {
    return (
      <div className="flex flex-col items-center gap-4">
        {newHighScore && (
          <motion.div initial={{ opacity: 0, scale: 0.7, y: -30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 8 }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400/30 to-orange-400/30 border-2 border-yellow-500/50">
            <motion.div animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }} transition={{ duration: 0.8, delay: 0.3 }}>
              <Crown size={28} className="text-yellow-500" />
            </motion.div>
            <span className="font-extrabold text-lg text-yellow-600">שיא חדש! {roundScore} 🏆</span>
          </motion.div>
        )}
        <GameComplete
          title={gamePhase === 'gameover' ? 'Block Blast - נגמר!' : 'Block Blast'}
          level={progress.level} score={progress.score}
          customStats={[
            { label: 'ניקוד סיבוב', value: roundScore },
            { label: 'שורות/עמודות', value: linesCleared },
            { label: 'חלקים', value: piecesPlaced },
            { label: 'קומבו מקס׳', value: maxCombo },
          ]}
          onPlayAgain={() => setGamePhase('menu')}
          isNewRecord={isNewRecord} leveledUp={leveledUp}
        />
      </div>
    );
  }

  // ─── PLAYING ───
  const progressPercent = Math.min((linesCleared / config.targetClears) * 100, 100);
  const cellSize = `min(${78 / GRID}vw, 2.4rem)`;

  return (
    <motion.div
      animate={screenShake ? { x: [0, -3, 3, -2, 2, 0] } : {}}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center gap-2"
    >
      {/* Score display */}
      <div className="relative text-center mb-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Crown size={18} className="text-yellow-500" />
          <span className="text-sm font-bold text-yellow-600">{highScore}</span>
        </div>
        <motion.div key={roundScore} initial={{ scale: 1.1 }} animate={{ scale: 1 }}
          className="text-4xl font-black text-foreground tracking-tight">
          {roundScore}
        </motion.div>
      </div>

      {/* Combo / Points popup */}
      <div className="h-8 relative w-full flex justify-center">
        <AnimatePresence>
          {lastPoints && (
            <motion.div key={lastPoints.key}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -30, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute flex items-center gap-2">
              {lastPoints.combo > 1 && (
                <span className="text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Combo {lastPoints.combo}
                </span>
              )}
              <span className="text-lg font-bold text-yellow-500">+{lastPoints.value}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Game board */}
      <div
        ref={boardRef}
        dir="ltr"
        className="rounded-2xl overflow-hidden relative p-[6px]"
        style={{
          background: 'linear-gradient(135deg, hsl(230 60% 35%) 0%, hsl(230 65% 28%) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.1)',
          border: '2px solid hsl(230 50% 45%)',
        }}
      >
        {board.map((row, ri) => (
          <div key={ri} className="flex">
            {row.map((cell, ci) => {
              const isFlashing = flashCells.has(`${ri},${ci}`);
              const isPreview = previewCells?.cells.some(p => p.r === ri && p.c === ci);
              const previewValid = previewCells?.valid;
              const previewPiece = previewCells?.piece || (selectedPiece !== null ? availablePieces[selectedPiece] : null);

              return (
                <div
                  key={ci}
                  className="relative cursor-pointer"
                  style={{ width: cellSize, height: cellSize, margin: '1px' }}
                  onClick={() => handleCellClick(ri, ci)}
                  onMouseEnter={() => selectedPiece !== null && setHoverCell({ row: ri, col: ci })}
                  onMouseLeave={() => setHoverCell(null)}
                >
                  {!cell && !isPreview && (
                    <div className="absolute inset-0 rounded-[4px]"
                      style={{ background: 'hsl(230 50% 22%)', border: '1px solid hsl(230 40% 28%)' }} />
                  )}
                  <BlockCell cell={cell} size={cellSize} isFlashing={isFlashing} />
                  {isPreview && !cell && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 rounded-[4px]"
                      style={{
                        backgroundColor: previewValid
                          ? `${previewPiece?.color || 'hsl(220 80% 55%)'}90`
                          : 'hsl(0 70% 55% / 0.45)',
                        border: `2px ${previewValid ? 'solid' : 'dashed'} ${
                          previewValid ? `${previewPiece?.color || 'hsl(220 80% 55%)'}` : 'hsl(0 70% 55% / 0.7)'
                        }`,
                        boxShadow: previewValid ? `0 0 12px ${previewPiece?.color || 'hsl(220 80% 55%)'}60` : 'none',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mt-1">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>ניקוי: {linesCleared} / {config.targetClears}</span>
          <div className="flex items-center gap-2">
            {combo > 1 && (
              <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-0.5 text-orange-500 font-bold">
                <Flame size={12} /> x{combo}
              </motion.span>
            )}
            <span>{Math.round(progressPercent)}%</span>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'hsl(230 40% 25%)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(190 85% 50%), hsl(220 80% 55%))' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 120 }}
          />
        </div>
      </div>

      {/* Draggable pieces tray */}
      <div className="w-full max-w-xs mt-2">
        <p className="text-[10px] text-muted-foreground/60 text-center mb-1.5">גרור חלק ללוח או לחץ לבחור 🧩</p>
        <div dir="ltr" className="flex justify-center items-end gap-4 px-2 py-3 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, hsl(230 55% 32%), hsl(230 60% 38%))' }}>
          {availablePieces.map((piece, idx) => {
            if (!piece) return <div key={idx} className="w-16 h-16" />;
            return (
              <DraggablePiece
                key={idx}
                piece={piece}
                idx={idx}
                isSelected={selectedPiece === idx}
                onSelect={handlePieceSelect}
                boardRef={boardRef as React.RefObject<HTMLDivElement>}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={() => setDragPreview(null)}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
