import { Injectable } from '@angular/core';
import { addDays, parseISO } from 'date-fns';
import { Observable, delay, of } from 'rxjs';
import { StudySchedule } from '../../common/models/onboarding.model';
import {
  PlannerEntry,
  PlannerRecord,
  PlannerWeek,
  TaskDraft,
} from '../../common/models/planner.model';
import { readExamDate, readJson, writeExamDate, writeJson } from './mock-storage';

const RECORD_LABELS: Record<PlannerRecord['kind'], string> = {
  exam: 'Examen',
  quiz: 'Simulacro',
};
const DELAY_MS = 300;
const STORAGE_KEY = 'mockPlanner';
const FIRST_NEW_ID = 1000;

interface StoredPlanner {
  entries: PlannerEntry[];
  schedule: StudySchedule;
}

const toIso = (date: string, time: string): string => parseISO(`${date}T${time}`).toISOString();

const isInWeek = (iso: string, monday: Date): boolean => {
  const date = parseISO(iso);
  return date >= monday && date < addDays(monday, 7);
};

@Injectable({ providedIn: 'root' })
export class PlannerService {
  readonly #stored = readJson<StoredPlanner>(STORAGE_KEY);
  #entries: PlannerEntry[] = this.#stored?.entries ?? [];
  #schedule: StudySchedule = this.#stored?.schedule ?? {
    days: [0, 1, 2, 3, 4],
    slots: [{ start: '17:00', end: '20:00' }],
  };
  #nextId = Math.max(FIRST_NEW_ID - 1, ...this.#entries.map(({ id }) => id)) + 1;

  getWeek(weekStart: string): Observable<PlannerWeek> {
    const monday = parseISO(weekStart);
    return of<PlannerWeek>({
      examDate: readExamDate(),
      schedule: this.#schedule,
      otherSchedules: [],
      entries: this.#entries.filter(({ start }) => isInWeek(start, monday)),
      otherEntries: [],
    }).pipe(delay(DELAY_MS));
  }

  saveTask(taskId: number | null, { text, date, start, end }: TaskDraft): Observable<PlannerEntry> {
    const previous = this.#entries.find(({ id }) => id === taskId);
    const entry: PlannerEntry = {
      id: taskId ?? this.#nextId++,
      text,
      start: toIso(date, start),
      end: toIso(date, end),
      isDone: previous?.isDone ?? false,
      isRecord: false,
    };
    this.#entries = previous
      ? this.#entries.map((current) => (current.id === entry.id ? entry : current))
      : [...this.#entries, entry];
    this.#save();
    return of(entry).pipe(delay(DELAY_MS));
  }

  saveExamDate(date: string): Observable<string> {
    writeExamDate(date);
    return of(date).pipe(delay(DELAY_MS));
  }

  saveSchedule(schedule: StudySchedule): Observable<StudySchedule> {
    this.#schedule = schedule;
    this.#save();
    return of(schedule).pipe(delay(DELAY_MS));
  }

  setDone(taskId: number, isDone: boolean): Observable<number> {
    this.#entries = this.#entries.map((entry) =>
      entry.id === taskId ? { ...entry, isDone } : entry,
    );
    this.#save();
    return of(taskId).pipe(delay(DELAY_MS));
  }

  deleteTask(taskId: number): Observable<number> {
    this.#entries = this.#entries.filter(({ id }) => id !== taskId);
    this.#save();
    return of(taskId).pipe(delay(DELAY_MS));
  }

  logRecord({ kind, name, percentage, start, end }: PlannerRecord): Observable<PlannerEntry> {
    const entry: PlannerEntry = {
      id: this.#nextId++,
      text: `${RECORD_LABELS[kind]} · ${name} · ${percentage} %`,
      start,
      end,
      isDone: false,
      isRecord: true,
    };
    this.#entries = [...this.#entries, entry];
    this.#save();
    return of(entry).pipe(delay(DELAY_MS));
  }

  #save(): void {
    writeJson(STORAGE_KEY, { entries: this.#entries, schedule: this.#schedule });
  }
}
