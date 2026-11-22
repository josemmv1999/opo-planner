import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  CUSTOM_EXAM_ID,
  CustomExamConfig,
  ExamAttempt,
  ExamDetail,
  ExamQuestion,
  OfficialExam,
} from '../../common/models/exam.model';
import { ImportedExam, ParsedQuestion } from '../../common/models/exam-import.model';
import { readJson, writeJson } from './mock-storage';

const HISTORY_KEY = 'mockExamHistory';
const IMPORTED_KEY = 'mockImportedExams';
const FIRST_IMPORTED_ID = 1000;

interface BankQuestion extends Omit<ExamQuestion, 'id'> {
  topicId: number;
  isOfficial: boolean;
}

const QUESTION_BANK: BankQuestion[] = [
  {
    statement: '¿Cuántos artículos tiene la Constitución Española de 1978?',
    options: ['155', '169', '176', '184'],
    correctOption: 1,
    block: 'Constitución Española',
    topicId: 1,
    isOfficial: true,
  },
  {
    statement: 'Si la norma no fija plazo, ¿cuál es el plazo máximo para resolver y notificar?',
    options: ['Un mes', 'Tres meses', 'Seis meses', 'Un año'],
    correctOption: 1,
    block: 'Procedimiento administrativo',
    topicId: 5,
    isOfficial: true,
  },
  {
    statement: '¿Quién designa al Defensor del Pueblo?',
    options: ['El Gobierno', 'El Rey', 'Las Cortes Generales', 'El Tribunal Constitucional'],
    correctOption: 2,
    block: 'Constitución Española',
    topicId: 1,
    isOfficial: false,
  },
  {
    statement: '¿Cuánto dura el mandato de los diputados?',
    options: ['Dos años', 'Cuatro años', 'Cinco años', 'Seis años'],
    correctOption: 1,
    block: 'Organización del Estado',
    topicId: 2,
    isOfficial: false,
  },
];

const EXAM_QUESTIONS = 60;
const EXAM_MINUTES = 60;
const OFFICIAL_YEARS = [2025, 2024, 2023];

const toQuestions = (bank: BankQuestion[], count: number): ExamQuestion[] =>
  Array.from({ length: count }, (_, i) => {
    const { statement, options, correctOption, block } = bank[i % bank.length];
    return { id: i + 1, statement, options, correctOption, block };
  });

const toImportedQuestions = (questions: ParsedQuestion[]): ExamQuestion[] =>
  questions
    .filter(({ isReserve, isVoided }) => !isReserve && !isVoided)
    .map(({ statement, options, correctOption, section }, i) => ({
      id: i + 1,
      statement,
      options,
      correctOption: correctOption ?? 0,
      block: section,
    }));

@Injectable({ providedIn: 'root' })
export class ExamService {
  #history: ExamAttempt[] = readJson<ExamAttempt[]>(HISTORY_KEY) ?? [];
  #imported: ImportedExam[] = readJson<ImportedExam[]>(IMPORTED_KEY) ?? [];

  getOfficialExams(): Observable<OfficialExam[]> {
    return of([
      ...this.#imported.map(({ id, name, questions }) => ({
        id,
        name,
        questionCount: toImportedQuestions(questions).length,
        minutes: EXAM_MINUTES,
        lastPercentage: this.#lastPercentage(name),
      })),
      ...OFFICIAL_YEARS.map((year) => {
        const name = `Convocatoria ${year}`;
        return {
          id: year,
          name,
          questionCount: EXAM_QUESTIONS,
          minutes: EXAM_MINUTES,
          lastPercentage: this.#lastPercentage(name),
        };
      }),
    ]).pipe(delay(300));
  }

  importOfficialExam(name: string, questions: ParsedQuestion[]): Observable<ImportedExam> {
    const exam: ImportedExam = {
      id: Math.max(FIRST_IMPORTED_ID - 1, ...this.#imported.map(({ id }) => id)) + 1,
      name,
      importedAt: new Date().toISOString(),
      questions,
    };
    this.#imported = [exam, ...this.#imported];
    writeJson(IMPORTED_KEY, this.#imported);
    return of(exam).pipe(delay(300));
  }

  getImportedExams(): Observable<ImportedExam[]> {
    return of(this.#imported).pipe(delay(300));
  }

  deleteImportedExam(examId: number): Observable<void> {
    this.#imported = this.#imported.filter(({ id }) => id !== examId);
    writeJson(IMPORTED_KEY, this.#imported);
    return of(undefined).pipe(delay(300));
  }

  getExam(examId: string): Observable<ExamDetail> {
    const imported = this.#imported.find(({ id }) => id === Number(examId));
    if (imported)
      return of<ExamDetail>({
        id: examId,
        name: imported.name,
        minutes: EXAM_MINUTES,
        questions: toImportedQuestions(imported.questions),
      }).pipe(delay(300));
    return of<ExamDetail>({
      id: examId,
      name: examId === 'mixed' ? 'Batiburrillo' : `Convocatoria ${examId}`,
      minutes: EXAM_MINUTES,
      questions: toQuestions(QUESTION_BANK, EXAM_QUESTIONS),
    }).pipe(delay(300));
  }

  getCustomExam({
    topicIds,
    questionCount,
    isOfficialOnly,
  }: CustomExamConfig): Observable<ExamDetail> {
    const bank = QUESTION_BANK.filter(
      ({ topicId, isOfficial }) => topicIds.includes(topicId) && (isOfficial || !isOfficialOnly),
    );
    if (!bank.length || !questionCount) return throwError(() => new Error('No questions'));
    return of<ExamDetail>({
      id: CUSTOM_EXAM_ID,
      name: 'Test personalizado',
      minutes: questionCount,
      questions: toQuestions(bank, questionCount),
    }).pipe(delay(300));
  }

  #lastPercentage(name: string): number | null {
    return (
      [...this.#history].reverse().find((attempt) => attempt.name === name)?.percentage ?? null
    );
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
