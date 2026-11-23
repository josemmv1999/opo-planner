import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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

const toQuestions = (bank: BankQuestion[], count: number): ExamQuestion[] =>
  Array.from({ length: count }, (_, i) => {
    const { statement, options, correctOption, block } = bank[i % bank.length];
    return { id: i + 1, statement, options, correctOption, block };
  });

@Injectable({ providedIn: 'root' })
export class ExamService {
  readonly #http = inject(HttpClient);

  getOfficialExams(): Observable<OfficialExam[]> {
    return this.#http.get<OfficialExam[]>('/api/exams');
  }

  getImportedExams(): Observable<ImportedExam[]> {
    return this.#http.get<ImportedExam[]>('/api/admin/exams');
  }

  importOfficialExam(name: string, questions: ParsedQuestion[]): Observable<ImportedExam> {
    return this.#http.post<ImportedExam>('/api/admin/exams', { name, questions });
  }

  deleteImportedExam(examId: number): Observable<void> {
    return this.#http.delete<void>(`/api/admin/exams/${examId}`);
  }

  getExam(examId: string): Observable<ExamDetail> {
    return this.#http.get<ExamDetail>(`/api/exams/${examId}`);
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

  getHistory(): Observable<ExamAttempt[]> {
    return this.#http.get<ExamAttempt[]>('/api/exam-attempts');
  }

  saveAttempt(attempt: Omit<ExamAttempt, 'id'>): Observable<ExamAttempt> {
    return this.#http.post<ExamAttempt>('/api/exam-attempts', attempt);
  }
}
