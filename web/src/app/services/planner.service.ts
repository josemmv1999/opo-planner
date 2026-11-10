import { Injectable } from '@angular/core';
import { addDays, addMinutes, parseISO, startOfToday, startOfWeek } from 'date-fns';
import { Observable, delay, of } from 'rxjs';
import { StudySchedule } from '../../common/models/onboarding.model';
import {
  OtherPlannerEntry,
  PlannerEntry,
  PlannerRecord,
  PlannerWeek,
  TaskDraft,
} from '../../common/models/planner.model';
import { readJson, writeJson } from './mock-storage';

type MockEntry = [day: number, start: string, end: string, text: string, isDone?: boolean];

const MOCK_TASKS: MockEntry[] = [
  [0, '09:00', '10:30', 'Repasar la Constitución', true],
  [1, '09:00', '10:30', 'Repasar la Constitución', true],
  [1, '11:00', '12:00', 'Simulacro de Procedimiento Administrativo'],
  [1, '17:00', '18:30', 'Pasar a limpio los apuntes de Ofimática'],
  [1, '18:00', '19:00', 'Leer la Ley 39/2015'],
  [2, '17:00', '19:00', 'Tema 5: el Gobierno'],
  [3, '17:30', '18:30', 'Test de repaso del bloque I'],
  [4, '17:00', '20:00', 'Batiburrillo cronometrado'],
];

const MOCK_RECORDS: MockEntry[] = [
  [0, '18:00', '18:30', 'Simulacro · Tema 3 · 80 %'],
  [5, '10:00', '11:00', 'Examen · Batiburrillo · 68 %'],
];

const MOCK_OTHER_TASKS: MockEntry[] = [
  [2, '18:30', '20:00', 'Tema 4: la Seguridad Social'],
  [4, '10:00', '11:30', 'Repasar prestaciones'],
];

const OTHER_OPPOSITION = 'Auxiliar Administrativo de la Seguridad Social';
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

const at = (monday: Date, day: number, time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  return addMinutes(addDays(monday, day), hours * 60 + minutes).toISOString();
};

const toEntries = (monday: Date, entries: MockEntry[], isRecord: boolean, firstId: number) =>
  entries.map<PlannerEntry>(([day, start, end, text, isDone = false], i) => ({
    id: firstId + i,
    text,
    start: at(monday, day, start),
    end: at(monday, day, end),
    isDone,
    isRecord,
  }));

const toIso = (date: string, time: string): string => parseISO(`${date}T${time}`).toISOString();

const isInWeek = (iso: string, monday: Date): boolean => {
  const date = parseISO(iso);
  return date >= monday && date < addDays(monday, 7);
};

@Injectable({ providedIn: 'root' })
export class PlannerService {
  readonly #monday = startOfWeek(startOfToday(), { weekStartsOn: 1 });
  readonly #stored = readJson<StoredPlanner>(STORAGE_KEY);
  #entries: PlannerEntry[] = this.#stored?.entries ?? [
    ...toEntries(this.#monday, MOCK_TASKS, false, 1),
    ...toEntries(this.#monday, MOCK_RECORDS, true, 100),
  ];
  readonly #otherEntries: OtherPlannerEntry[] = toEntries(
    this.#monday,
    MOCK_OTHER_TASKS,
    false,
    500,
  ).map(({ id, text, start, end }) => ({ id, text, start, end, oppositionName: OTHER_OPPOSITION }));
  #schedule: StudySchedule = this.#stored?.schedule ?? {
    days: [0, 1, 2, 3, 4],
    slots: [{ start: '17:00', end: '20:00' }],
  };
  readonly #otherSchedule: StudySchedule = {
    days: [2, 4],
    slots: [{ start: '18:30', end: '20:00' }],
  };
  #nextId = Math.max(FIRST_NEW_ID - 1, ...this.#entries.map(({ id }) => id)) + 1;

  getWeek(weekStart: string): Observable<PlannerWeek> {
    const monday = parseISO(weekStart);
    return of<PlannerWeek>({
      examDate: '2027-06-12',
      schedule: this.#schedule,
      otherSchedules: [{ oppositionName: OTHER_OPPOSITION, schedule: this.#otherSchedule }],
      entries: this.#entries.filter(({ start }) => isInWeek(start, monday)),
      otherEntries: this.#otherEntries.filter(({ start }) => isInWeek(start, monday)),
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
