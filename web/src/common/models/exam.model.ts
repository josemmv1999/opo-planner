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

export interface ExamQuestion {
  id: number;
  statement: string;
  options: string[];
  correctOption: number;
}

export interface ExamDetail {
  id: string;
  name: string;
  minutes: number;
  questions: ExamQuestion[];
}
