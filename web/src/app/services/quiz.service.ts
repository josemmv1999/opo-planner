import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { QuizQuestion } from '../../common/models/quiz.model';
import { TopicQuestion } from '../../common/models/exam.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  readonly #http = inject(HttpClient);

  getTopicQuestions(topicId: number, count: number): Observable<QuizQuestion[]> {
    return this.#http
      .get<TopicQuestion[]>('/api/questions', { params: { topicIds: topicId, count } })
      .pipe(
        map((questions) =>
          questions.map(
            ({ id, caseText, statement, options, correctOption, explanation, source }) => ({
              id,
              caseText,
              statement,
              options,
              correctOption,
              reasoning: [source, explanation].filter(Boolean).join(': '),
            }),
          ),
        ),
      );
  }
}
