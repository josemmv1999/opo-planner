import { StudySchedule } from './onboarding.model';

export interface PlannerEntry {
  id: number;
  text: string;
  start: string;
  end: string;
  isDone: boolean;
  isRecord: boolean;
}

export interface PlannerWeek {
  examDate: string;
  schedule: StudySchedule;
  entries: PlannerEntry[];
}

export interface PlacedEntry extends PlannerEntry {
  lane: number;
  startRow: number;
  endRow: number;
  isShort: boolean;
}

export interface RowRange {
  startRow: number;
  endRow: number;
}

export interface PlannerDay {
  date: string;
  isToday: boolean;
  entries: PlacedEntry[];
  studyRows: RowRange[];
}

export interface TaskDraft {
  text: string;
  date: string;
  start: string;
  end: string;
}
