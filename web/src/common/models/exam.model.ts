export type ExamKind = 'official' | 'mixed';

export interface OfficialExam {
  id: number;
  name: string;
  questionCount: number;
  minutes: number;
  lastPercentage: number | null;
}

export interface ExamAttempt {
  id: number;
  kind: ExamKind;
  name: string;
  date: string;
  minutesTaken: number;
  percentage: number;
}
