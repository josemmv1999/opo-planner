import { StudySchedule } from './onboarding.model';

export interface PlannerEntry {
  id: number;
  text: string;
  start: string;
  end: string;
  isDone: boolean;
  isRecord: boolean;
}

export interface OtherPlannerEntry {
  id: number;
  text: string;
  start: string;
  end: string;
  oppositionName: string;
}

export interface OtherSchedule {
  oppositionName: string;
  schedule: StudySchedule;
}

export interface PlannerWeek {
  examDate: string;
  schedule: StudySchedule;
  otherSchedules: OtherSchedule[];
  entries: PlannerEntry[];
  otherEntries: OtherPlannerEntry[];
}

export interface PlannerRecord {
  kind: 'exam' | 'quiz';
  name: string;
  percentage: number;
  start: string;
  end: string;
}

export interface CalendarEntry extends PlannerEntry {
  oppositionName: string | null;
}

export interface PlacedEntry extends CalendarEntry {
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
