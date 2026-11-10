export interface QuizQuestion {
  id: number;
  caseText: string | null;
  statement: string;
  options: string[];
  correctOption: number;
  reasoning: string;
}

export type QuizPhase = 'setup' | 'playing' | 'finished';
