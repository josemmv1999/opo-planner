import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { addDays, parseISO } from 'date-fns';
import { Observable, map } from 'rxjs';
import { StudySchedule } from '../../common/models/onboarding.model';
import {
  PlannerEntry,
  PlannerRecord,
  PlannerWeek,
  TaskDraft,
} from '../../common/models/planner.model';
import { removeStorage } from '../../common/utils/storage';
import { DEFAULT_EXAM_DATE } from './mock-storage';

const RECORD_LABELS: Record<PlannerRecord['kind'], string> = {
  exam: 'Examen',
  quiz: 'Simulacro',
};
const URL = '/api/planner';
const OLD_KEYS = ['mockPlanner', 'mockExamDate'];

const toIso = (date: string, time: string): string => parseISO(`${date}T${time}`).toISOString();

@Injectable({ providedIn: 'root' })
export class PlannerService {
  readonly #http = inject(HttpClient);

  constructor() {
    OLD_KEYS.forEach(removeStorage);
  }

  getWeek(weekStart: string): Observable<PlannerWeek> {
    const monday = parseISO(weekStart);
    return this.#http
      .get<Omit<PlannerWeek, 'examDate'> & { examDate: string | null }>(URL, {
        params: { from: monday.toISOString(), to: addDays(monday, 7).toISOString() },
      })
      .pipe(map((week) => ({ ...week, examDate: week.examDate ?? DEFAULT_EXAM_DATE })));
  }

  saveTask(taskId: number | null, { text, date, start, end }: TaskDraft): Observable<PlannerEntry> {
    const body = { text, start: toIso(date, start), end: toIso(date, end) };
    return taskId === null
      ? this.#http.post<PlannerEntry>(`${URL}/entries`, body)
      : this.#http.put<PlannerEntry>(`${URL}/entries/${taskId}`, body);
  }

  saveExamDate(date: string): Observable<string> {
    return this.#http
      .put<{ date: string }>(`${URL}/exam-date`, { date })
      .pipe(map((saved) => saved.date));
  }

  saveSchedule(schedule: StudySchedule): Observable<StudySchedule> {
    return this.#http.put<StudySchedule>(`${URL}/schedule`, schedule);
  }

  setDone(taskId: number, isDone: boolean): Observable<number> {
    return this.#http
      .put<PlannerEntry>(`${URL}/entries/${taskId}/done`, { isDone })
      .pipe(map(() => taskId));
  }

  deleteTask(taskId: number): Observable<number> {
    return this.#http.delete<void>(`${URL}/entries/${taskId}`).pipe(map(() => taskId));
  }

  logRecord({ kind, name, percentage, start, end }: PlannerRecord): Observable<PlannerEntry> {
    return this.#http.post<PlannerEntry>(`${URL}/entries`, {
      text: `${RECORD_LABELS[kind]} · ${name} · ${percentage} %`,
      start,
      end,
      isRecord: true,
    });
  }
}
