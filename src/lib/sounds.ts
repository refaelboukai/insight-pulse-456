// Warm, pleasant UI sounds using Web Audio API
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Soft "pop" sound — warm and bubbly, like a gentle water drop.
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Warm base tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.exponentialRampToValueAtTime(380, now + 0.07);

    // Soft harmonic overtone for warmth
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(780, now);
    osc2.frequency.exponentialRampToValueAtTime(570, now + 0.06);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.04, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.13);
    osc2.start(now);
    osc2.stop(now + 0.09);
  } catch {
    // Silently fail
  }
}

/**
 * Gentle two-note chime for navigation — ascending, airy and melodic.
 */
export function playNavSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First note — soft C
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523, now); // C5

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.09, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    // Second note — gentle E (major third, sounds pleasant)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659, now + 0.06); // E5

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.08, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.11);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.19);
  } catch {
    // Silently fail
  }
}
