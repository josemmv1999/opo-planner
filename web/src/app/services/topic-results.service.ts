import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { TopicResult } from '../../common/models/syllabus.model';
import { readJson, writeJson } from './mock-storage';

const STORAGE_KEY = 'mockTopicResults';
const DELAY_MS = 300;
@Injectable({ providedIn: 'root' })
export class TopicResultsService {
  #results: TopicResult[] = readJson<TopicResult[]>(STORAGE_KEY) ?? [];

  getAllResults(): Observable<TopicResult[]> {
    return of(this.#results).pipe(delay(DELAY_MS));
  }

  getTopicResults(topicId: number): Observable<TopicResult[]> {
    return of(this.#results.filter((result) => result.topicId === topicId)).pipe(delay(DELAY_MS));
  }

  saveResult(result: Omit<TopicResult, 'id'>): Observable<TopicResult> {
    const saved = { ...result, id: Math.max(0, ...this.#results.map(({ id }) => id)) + 1 };
    this.#results = [...this.#results, saved];
    writeJson(STORAGE_KEY, this.#results);
    return of(saved).pipe(delay(DELAY_MS));
  }
}
