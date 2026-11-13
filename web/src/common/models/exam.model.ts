export type ExamKind = 'official' | 'mixed' | 'custom';

export const CUSTOM_EXAM_ID = 'custom';

export interface CustomExamConfig {
  topicIds: number[];
  questionCount: number;
  isOfficialOnly: boolean;
}

export interface ExamRequest {
  examId: string;
  custom: CustomExamConfig;
}

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
  block: string;
}

export interface ExamDetail {
  id: string;
  name: string;
  minutes: number;
  questions: ExamQuestion[];
}

export interface WeakBlock {
  name: string;
  errorPercentage: number;
}
