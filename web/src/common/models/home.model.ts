import { TrueFalseStatement } from './true-false-statement.model';

export interface PlannerTask {
  id: number;
  text: string;
  start: string;
  end: string;
  isDone: boolean;
}

export interface MockExamLog {
  id: number;
  text: string;
  start: string;
  end: string;
  correctAnswers: number;
  totalQuestions: number;
}

export interface StudiedBlock {
  id: number;
  name: string;
}

export interface WeakBlock {
  id: number;
  name: string;
  correctPercentage: number;
}

export interface StudyDay {
  date: string;
  hasStudied: boolean;
}

export interface HomeData {
  examDate: string;
  studyStartDate: string | null;
  tasks: PlannerTask[];
  mockExamLogs: MockExamLog[];
  weekDaysWithTasks: string[];
  streakDays: number;
  lastSevenDays: StudyDay[];
  studiedBlocks: StudiedBlock[];
  weakBlocks: WeakBlock[];
  statements: TrueFalseStatement[];
}
