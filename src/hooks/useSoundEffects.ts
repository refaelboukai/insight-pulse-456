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
