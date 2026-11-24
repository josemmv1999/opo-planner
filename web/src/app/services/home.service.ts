import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { HomeData } from '../../common/models/home.model';
import { TrueFalseStatement } from '../../common/models/true-false-statement.model';
import { DEFAULT_EXAM_DATE } from './mock-storage';

const FLASHCARD_COUNT = 15;

@Injectable({ providedIn: 'root' })
export class HomeService {
  readonly #http = inject(HttpClient);

  getHomeData(): Observable<HomeData> {
    return forkJoin([
      this.#http.get<Omit<HomeData, 'examDate' | 'statements'> & { examDate: string | null }>(
        '/api/home',
      ),
      this.getFlashcards(),
    ]).pipe(
      map(([home, statements]) => ({
        ...home,
        examDate: home.examDate ?? DEFAULT_EXAM_DATE,
        statements,
      })),
    );
  }

  getFlashcards(): Observable<TrueFalseStatement[]> {
    return this.#http.get<TrueFalseStatement[]>('/api/flashcards', {
      params: { count: FLASHCARD_COUNT },
    });
  }
}
