import { Injectable } from '@angular/core';
import { subWeeks } from 'date-fns';
import { Observable, delay, of } from 'rxjs';
import { TopicResult } from '../../common/models/syllabus.model';
import { readJson, writeJson } from './mock-storage';

const STORAGE_KEY = 'mockTopicResults';
const DELAY_MS = 300;
const SEED_PERCENTAGES = [60, 70, 65, 80, 88];

const seedResults = (): TopicResult[] =>
  SEED_PERCENTAGES.map((percentage, i) => ({
    id: i + 1,
    topicId: 1,
    date: subWeeks(new Date(), SEED_PERCENTAGES.length - 1 - i).toISOString(),
    percentage,
    correctQuestionIds: [],
    mistakes:
      i === SEED_PERCENTAGES.length - 1
        ? [
            {
              questionId: 101,
              statement: '¿Quién propone al candidato a Presidente del Gobierno?',
              options: [
                'El Congreso de los Diputados',
                'El Senado',
                'El Rey, tras consultar a los grupos',
                'El Consejo de Estado',
              ],
              chosenOption: 0,
              correctOption: 2,
              reasoning:
                'Lo dice el artículo 99.1: el Rey, previa consulta con los representantes de los grupos políticos, propone un candidato.',
            },
            {
              questionId: 102,
              statement: '¿Qué mayoría exige la reforma del Título Preliminar?',
              options: [
                'Mayoría absoluta del Congreso',
                'Tres quintos de cada Cámara',
                'Mayoría simple y referéndum',
                'Dos tercios y disolución de las Cortes',
              ],
              chosenOption: 1,
              correctOption: 3,
              reasoning:
                'Es el procedimiento agravado del artículo 168, que también se aplica a la Sección 1.ª del Capítulo II del Título I y al Título II.',
            },
          ]
        : [],
  }));

@Injectable({ providedIn: 'root' })
export class TopicResultsService {
  #results: TopicResult[] = readJson<TopicResult[]>(STORAGE_KEY) ?? seedResults();

  getTopicResults(topicId: number): Observable<TopicResult[]> {
    return of(this.#results.filter((result) => result.topicId === topicId)).pipe(
      delay(DELAY_MS),
    );
  }

  saveResult(result: Omit<TopicResult, 'id'>): Observable<TopicResult> {
    const saved = { ...result, id: Math.max(0, ...this.#results.map(({ id }) => id)) + 1 };
    this.#results = [...this.#results, saved];
    writeJson(STORAGE_KEY, this.#results);
    return of(saved).pipe(delay(DELAY_MS));
  }
}
