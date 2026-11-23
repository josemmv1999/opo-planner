import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CUSTOM_EXAM_ID,
  CustomExamConfig,
  ExamAttempt,
  ExamDetail,
  OfficialExam,
  TopicQuestion,
} from '../../common/models/exam.model';
import { ImportedExam, ParsedQuestion } from '../../common/models/exam-import.model';

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

  classifyQuestions(questions: ParsedQuestion[]): Observable<(number | null)[]> {
    return this.#http.post<(number | null)[]>('/api/admin/exams/classify', {
      questions: questions.map(({ statement, options }) => ({ statement, options })),
    });
  }

  deleteImportedExam(examId: number): Observable<void> {
    return this.#http.delete<void>(`/api/admin/exams/${examId}`);
  }

  getExam(examId: string): Observable<ExamDetail> {
    return this.#http.get<ExamDetail>(`/api/exams/${examId}`);
  }

  getCustomExam({ topicIds, questionCount }: CustomExamConfig): Observable<ExamDetail> {
    return this.#http
      .get<TopicQuestion[]>('/api/questions', {
        params: { topicIds: topicIds.join(','), count: questionCount },
      })
      .pipe(
        map((questions) => {
          if (!questions.length) throw new Error('No questions');
          return {
            id: CUSTOM_EXAM_ID,
            name: 'Test personalizado',
            minutes: questions.length,
            questions: questions.map(({ id, statement, options, correctOption, block }) => ({
              id,
              statement,
              options,
              correctOption,
              block,
            })),
          };
        }),
      );
  }

  getHistory(): Observable<ExamAttempt[]> {
    return this.#http.get<ExamAttempt[]>('/api/exam-attempts');
  }

  saveAttempt(attempt: Omit<ExamAttempt, 'id'>): Observable<ExamAttempt> {
    return this.#http.post<ExamAttempt>('/api/exam-attempts', attempt);
  }
}
