import confetti from 'canvas-confetti';

export function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4ade80', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6'],
    gravity: 0.8,
    ticks: 120,
  });
}

export function fireStars() {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.5 },
    shapes: ['star'],
    colors: ['#fbbf24', '#f59e0b', '#eab308'],
    scalar: 1.2,
  });
}
