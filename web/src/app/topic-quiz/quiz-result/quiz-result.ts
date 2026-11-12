import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { QuizQuestion } from '../../../common/models/quiz.model';

@Component({
  selector: 'app-quiz-result',
  imports: [Button, TranslatePipe],
  template: `
    <section class="d-flex flex-column gap-4">
      <p class="d-flex flex-wrap align-items-baseline gap-3 mb-0">
        <span class="quiz-result__score">{{ correctCount() }}/{{ total() }}</span>
        <span class="quiz-result__verdict">
          {{ 'topicQuiz.result.percentage' | translate: { percentage: percentage() } }} ·
          {{ verdictKey() | translate }}
        </span>
      </p>

      @if (wrongQuestions().length) {
        <div class="d-flex flex-column gap-2">
          <h3 class="quiz-result__title mb-0">{{ 'topicQuiz.result.toReview' | translate }}</h3>
          <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
            @for (question of wrongQuestions(); track question.id) {
              <li class="quiz-result__wrong">
                <p class="fw-bold mb-1">{{ question.statement }}</p>
                <p class="quiz-result__reasoning text-body-secondary mb-0">
                  {{ question.reasoning }}
                </p>
              </li>
            }
          </ul>
        </div>
      }

      <div class="d-flex flex-wrap gap-2">
        <button app-button type="button" (click)="restarted.emit()" icon="refresh">
          {{ 'topicQuiz.result.again' | translate }}
        </button>
        <button app-button variant="outline-primary" type="button" (click)="closed.emit()">
          {{ 'topicQuiz.result.close' | translate }}
        </button>
      </div>
    </section>
  `,
  styles: `
    .quiz-result__score {
      font-size: 3.5rem;
      font-weight: 900;
      line-height: 1;
    }

    .quiz-result__verdict {
      font-size: 1.125rem;
      font-weight: 800;
    }

    .quiz-result__title {
      font-size: 1rem;
      font-weight: 900;
    }

    .quiz-result__wrong {
      padding: 0.75rem 1rem;
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-left: 0.25rem solid var(--bs-danger);
      border-radius: var(--bs-border-radius);
    }

    .quiz-result__reasoning {
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizResult {
  readonly correctCount = input.required<number>();
  readonly total = input.required<number>();
  readonly percentage = input.required<number>();
  readonly verdictKey = input.required<string>();
  readonly wrongQuestions = input.required<QuizQuestion[]>();
  readonly restarted = output();
  readonly closed = output();
}
