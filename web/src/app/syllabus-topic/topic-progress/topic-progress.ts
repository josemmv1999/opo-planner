import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from '../../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { ReviewQuestion, TopicResult } from '../../../common/models/syllabus.model';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const LOW_PERCENTAGE = 70;

@Component({
  selector: 'app-topic-progress',
  imports: [Button, TranslatePipe, FormatDatePipe],
  host: { class: 'd-flex flex-column gap-4' },
  template: `
    <section class="card card--teal">
      <div class="card-body d-flex flex-column gap-3">
        <h2 class="topic-progress__title mb-0">{{ 'syllabusTopic.trend' | translate }}</h2>
        @if (trend().length) {
          <div
            class="topic-progress__chart"
            role="img"
            [attr.aria-label]="'syllabusTopic.trendLabel' | translate: { count: trend().length }">
            @for (result of trend(); track result.id) {
              <span class="topic-progress__column d-flex flex-column align-items-center">
                <span class="topic-progress__value">{{ result.percentage }} %</span>
                <span
                  class="topic-progress__bar"
                  [class.topic-progress__bar--low]="result.percentage < lowPercentage"
                  [style.height.%]="result.percentage"></span>
                <span class="topic-progress__date">{{ result.date | formatDate: 'd MMM' }}</span>
              </span>
            }
          </div>
          @if (hasLowResult()) {
            <p class="topic-progress__legend d-flex align-items-center gap-2 mb-0">
              <span
                class="topic-progress__swatch topic-progress__bar--low"
                aria-hidden="true"></span>
              {{ 'syllabusTopic.lowLegend' | translate: { percentage: lowPercentage } }}
            </p>
          }
          @if (improvement(); as improvement) {
            <p class="topic-progress__summary mb-0">
              {{
                (improvement > 0 ? 'syllabusTopic.improved' : 'syllabusTopic.dropped')
                  | translate: { points: improvement > 0 ? improvement : -improvement }
              }}
            </p>
          }
        } @else {
          <p class="text-body-secondary mb-0">{{ 'syllabusTopic.noTrend' | translate }}</p>
        }
      </div>
    </section>

    <section class="card card--orange">
      <div class="card-body d-flex flex-column gap-3">
        <h2 class="topic-progress__title mb-0">{{ 'syllabusTopic.review' | translate }}</h2>
        @for (question of reviewQuestions(); track question.questionId) {
          <article class="topic-progress__question d-flex flex-column">
            <span class="fw-bold">{{ question.statement }}</span>
            <span class="topic-progress__answer topic-progress__answer--wrong">
              <b>{{ letters[question.chosenOption] }}</b>
              {{ question.options[question.chosenOption] }}
            </span>
            <span class="topic-progress__answer topic-progress__answer--right">
              <b>{{ letters[question.correctOption] }}</b>
              {{ question.options[question.correctOption] }}
            </span>
            <details class="topic-progress__why">
              <summary>{{ 'syllabusTopic.why' | translate }}</summary>
              {{ question.reasoning }}
            </details>
          </article>
        } @empty {
          <p class="text-body-secondary mb-0">{{ 'syllabusTopic.noReview' | translate }}</p>
        }
        @if (reviewCount() > reviewQuestions().length) {
          <p class="topic-progress__more text-body-secondary mb-0">
            {{
              'syllabusTopic.moreToReview'
                | translate: { count: reviewCount() - reviewQuestions().length }
            }}
          </p>
        }
        @if (reviewCount()) {
          <button
            app-button
            variant="outline-primary"
            type="button"
            class="align-self-start"
            (click)="practised.emit()"
            icon="tests">
            {{ 'syllabusTopic.practiseReview' | translate: { count: reviewCount() } }}
          </button>
        }
      </div>
    </section>
  `,
  styles: `
    .topic-progress__title {
      font-size: 1.0625rem;
      font-weight: 900;
    }

    .topic-progress__chart {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
      grid-auto-flow: column;
      gap: 0.5rem;
      height: 9rem;
    }

    .topic-progress__column {
      justify-content: flex-end;
      gap: 0.25rem;
      min-width: 0;
    }

    .topic-progress__value,
    .topic-progress__date {
      font-size: 0.6875rem;
      font-weight: 900;
      white-space: nowrap;
    }

    .topic-progress__date {
      font-weight: 700;
      color: var(--bs-secondary-color);
    }

    .topic-progress__bar {
      width: 100%;
      max-width: 2.25rem;
      background-color: var(--bs-primary);
      border: 2px solid var(--bs-dark);
      border-bottom: 0;
      border-radius: 0.5rem 0.5rem 0 0;
    }

    .topic-progress__bar--low {
      background-color: var(--bs-secondary);
      background-image: repeating-linear-gradient(
        45deg,
        rgba(var(--bs-white-rgb), 0.5) 0 0.25rem,
        transparent 0.25rem 0.5rem
      );
    }

    .topic-progress__legend {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--bs-secondary-color);
    }

    .topic-progress__swatch {
      width: 1rem;
      height: 0.75rem;
      border: 2px solid var(--bs-dark);
      border-radius: 0.25rem;
    }

    .topic-progress__summary {
      font-size: 0.875rem;
      font-weight: 700;
    }

    .topic-progress__question {
      gap: 0.375rem;
      padding-top: 0.75rem;
      font-size: 0.875rem;
      border-top: 2px dashed rgba(var(--bs-dark-rgb), 0.14);

      &:first-of-type {
        padding-top: 0;
        border-top: 0;
      }
    }

    .topic-progress__answer {
      display: flex;
      gap: 0.375rem;
      align-items: baseline;
      font-size: 0.8125rem;
      font-weight: 700;

      b {
        display: inline-grid;
        flex: 0 0 auto;
        place-items: center;
        width: 1.25rem;
        height: 1.25rem;
        font-size: 0.6875rem;
        border: 1.5px solid currentColor;
        border-radius: 0.375rem;
      }
    }

    .topic-progress__answer--wrong {
      color: var(--bs-danger);
      text-decoration: line-through;
    }

    .topic-progress__answer--right {
      color: var(--bs-success);
    }

    .topic-progress__why {
      font-size: 0.8125rem;
      color: var(--bs-secondary-color);

      summary {
        font-weight: 800;
        color: var(--bs-primary);
        cursor: pointer;
      }
    }

    .topic-progress__more {
      font-size: 0.8125rem;
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicProgress {
  readonly trend = input.required<TopicResult[]>();
  readonly improvement = input<number | null>(null);
  readonly reviewQuestions = input.required<ReviewQuestion[]>();
  readonly reviewCount = input(0);
  readonly practised = output();

  protected readonly letters = LETTERS;
  protected readonly lowPercentage = LOW_PERCENTAGE;
  protected readonly hasLowResult = computed(() =>
    this.trend().some(({ percentage }) => percentage < LOW_PERCENTAGE),
  );
}
