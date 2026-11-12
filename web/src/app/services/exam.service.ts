import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  ExamAttempt,
  ExamDetail,
  ExamQuestion,
  OfficialExam,
} from '../../common/models/exam.model';
import { readJson, writeJson } from './mock-storage';

const HISTORY_KEY = 'mockExamHistory';

const QUESTION_BANK: Omit<ExamQuestion, 'id'>[] = [
  {
    statement: '¿Cuántos artículos tiene la Constitución Española de 1978?',
    options: ['155', '169', '176', '184'],
    correctOption: 1,
    block: 'Constitución Española',
  },
  {
    statement: 'Si la norma no fija plazo, ¿cuál es el plazo máximo para resolver y notificar?',
    options: ['Un mes', 'Tres meses', 'Seis meses', 'Un año'],
    correctOption: 1,
    block: 'Procedimiento administrativo',
  },
  {
    statement: '¿Quién designa al Defensor del Pueblo?',
    options: ['El Gobierno', 'El Rey', 'Las Cortes Generales', 'El Tribunal Constitucional'],
    correctOption: 2,
    block: 'Constitución Española',
  },
  {
    statement: '¿Cuánto dura el mandato de los diputados?',
    options: ['Dos años', 'Cuatro años', 'Cinco años', 'Seis años'],
    correctOption: 1,
    block: 'Organización del Estado',
  },
];

const EXAM_QUESTIONS = 60;
const EXAM_MINUTES = 60;
const OFFICIAL_YEARS = [2025, 2024, 2023];

@Injectable({ providedIn: 'root' })
export class ExamService {
  #history: ExamAttempt[] = readJson<ExamAttempt[]>(HISTORY_KEY) ?? [];

  getOfficialExams(): Observable<OfficialExam[]> {
    return of(
      OFFICIAL_YEARS.map((year) => {
        const name = `Convocatoria ${year}`;
        return {
          id: year,
          name,
          questionCount: EXAM_QUESTIONS,
          minutes: EXAM_MINUTES,
          lastPercentage:
            [...this.#history].reverse().find((attempt) => attempt.name === name)?.percentage ??
            null,
        };
      }),
    ).pipe(delay(300));
  }

  getExam(examId: string): Observable<ExamDetail> {
    return of<ExamDetail>({
      id: examId,
      name: examId === 'mixed' ? 'Batiburrillo' : `Convocatoria ${examId}`,
      minutes: EXAM_MINUTES,
      questions: Array.from({ length: EXAM_QUESTIONS }, (_, i) => ({
        id: i + 1,
        ...QUESTION_BANK[i % QUESTION_BANK.length],
      })),
    }).pipe(delay(300));
  }

  getHistory(): Observable<ExamAttempt[]> {
    return of([...this.#history].reverse()).pipe(delay(300));
  }

  saveAttempt(attempt: Omit<ExamAttempt, 'id'>): Observable<ExamAttempt> {
    const saved = { ...attempt, id: this.#history.length + 1 };
    this.#history = [...this.#history, saved];
    writeJson(HISTORY_KEY, this.#history);
    return of(saved).pipe(delay(300));
  }
}
