import { Injectable } from '@angular/core';
import { addDays, addMinutes, formatISO, parseISO, startOfToday, startOfWeek } from 'date-fns';
import { Observable, delay, of } from 'rxjs';
import { PlannerEntry, PlannerWeek, TaskDraft } from '../../common/models/planner.model';

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

let nextTaskId = 1000;

@Injectable({ providedIn: 'root' })
export class PlannerService {
  saveTask(taskId: number | null, { text, date, start, end }: TaskDraft): Observable<PlannerEntry> {
    return of<PlannerEntry>({
      id: taskId ?? nextTaskId++,
      text,
      start: toIso(date, start),
      end: toIso(date, end),
      isDone: false,
      isRecord: false,
    }).pipe(delay(400));
  }

  deleteTask(taskId: number): Observable<number> {
    return of(taskId).pipe(delay(400));
  }

  getWeek(weekStart: string): Observable<PlannerWeek> {
    const monday = parseISO(weekStart);
    const isCurrentWeek =
      weekStart ===
      formatISO(startOfWeek(startOfToday(), { weekStartsOn: 1 }), { representation: 'date' });
    return of<PlannerWeek>({
      examDate: '2027-06-12',
      schedule: { days: [0, 1, 2, 3, 4], slots: [{ start: '17:00', end: '20:00' }] },
      entries: isCurrentWeek
        ? [
            ...toEntries(monday, MOCK_TASKS, false, 1),
            ...toEntries(monday, MOCK_RECORDS, true, 100),
          ]
        : [],
    }).pipe(delay(300));
  }
}
