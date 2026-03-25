export interface ReadingPassage {
  id: string;
  title: string;
  emoji: string;
  text: string;
  questions: {
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
  }[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export const READING_PASSAGES: Record<Difficulty, ReadingPassage[]> = {
  easy: [],
  medium: [],
  hard: [],
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; emoji: string; description: string; questionsPerRound: number; timePerQuestion: number | null; pointsMultiplier: number }> = {
  easy: { label: 'קלה', emoji: '🌱', description: 'טקסטים קצרים ושאלות ישירות', questionsPerRound: 3, timePerQuestion: null, pointsMultiplier: 1 },
  medium: { label: 'בינונית', emoji: '⚡', description: 'טקסטים ארוכים יותר עם שאלות הסקה', questionsPerRound: 4, timePerQuestion: 30, pointsMultiplier: 1.5 },
  hard: { label: 'קשה', emoji: '🔥', description: 'טקסטים מורכבים, ניתוח ביקורתי', questionsPerRound: 4, timePerQuestion: 25, pointsMultiplier: 2 },
};
