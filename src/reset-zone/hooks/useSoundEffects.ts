const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function ensureCtx() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (!audioCtx) return;
  ensureCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playClick() { playTone(800, 0.08, 'sine', 0.08); }
export function playSuccess() {
  if (!audioCtx) return;
  ensureCtx();
  [523, 659, 784, 1047].forEach((freq, i) => setTimeout(() => playTone(freq, 0.25, 'sine', 0.12), i * 100));
}
export function playSelect() { playTone(600, 0.1, 'sine', 0.06); }
export function playWarning() { playTone(300, 0.3, 'triangle', 0.1); }
export function playCalm() { playTone(260, 0.8, 'sine', 0.06); }
export function playPlace() { playTone(440, 0.1, 'sine', 0.1); setTimeout(() => playTone(550, 0.08, 'sine', 0.08), 40); }
export function playClear(linesCount = 1) {
  if (!audioCtx) return; ensureCtx();
  const notes = linesCount > 1 ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
  notes.forEach((freq, i) => setTimeout(() => playTone(freq, 0.2, 'triangle', 0.1), i * 60));
}
export function playCombo(comboLevel: number) {
  if (!audioCtx) return; ensureCtx();
  const baseFreq = 600 + comboLevel * 80;
  playTone(baseFreq, 0.15, 'square', 0.06);
  setTimeout(() => playTone(baseFreq * 1.25, 0.15, 'square', 0.06), 70);
  setTimeout(() => playTone(baseFreq * 1.5, 0.2, 'sine', 0.08), 140);
}
export function playGameOver() {
  if (!audioCtx) return; ensureCtx();
  [440, 370, 311, 261].forEach((freq, i) => setTimeout(() => playTone(freq, 0.35, 'triangle', 0.1), i * 150));
}
export function playHighScore() {
  if (!audioCtx) return; ensureCtx();
  [523, 659, 784, 1047, 784, 1047, 1319].forEach((freq, i) => setTimeout(() => playTone(freq, 0.2, 'sine', 0.12), i * 80));
}
