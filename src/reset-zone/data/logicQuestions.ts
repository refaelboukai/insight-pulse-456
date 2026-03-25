export interface LogicQuestion {
  category: string;
  emoji: string;
  text: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export const LOGIC_QUESTIONS: { minLevel: number; items: LogicQuestion[] }[] = [];
