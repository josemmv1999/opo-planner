import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TopicResult } from '../../common/models/syllabus.model';

const URL = '/api/topic-results';

@Injectable({ providedIn: 'root' })
export class TopicResultsService {
  readonly #http = inject(HttpClient);

  getAllResults(): Observable<TopicResult[]> {
    return this.#http.get<TopicResult[]>(URL);
  }

  getTopicResults(topicId: number): Observable<TopicResult[]> {
    return this.#http.get<TopicResult[]>(URL, { params: { topicId } });
  }

  saveResult(result: Omit<TopicResult, 'id'>): Observable<TopicResult> {
    return this.#http.post<TopicResult>(URL, result);
  }
}
