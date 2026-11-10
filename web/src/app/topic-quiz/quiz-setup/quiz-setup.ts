import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { QUESTION_COUNTS, QuestionCount } from '../topic-quiz.store';

@Component({
  selector: 'app-quiz-setup',
  imports: [TranslatePipe, Icon],
  template: `
    <section class="d-flex flex-column gap-4">
      <p class="text-body-secondary mb-0">{{ 'topicQuiz.setup.lead' | translate }}</p>
      <fieldset class="m-0 p-0 border-0">
        <legend class="quiz-setup__legend">{{ 'topicQuiz.setup.howMany' | translate }}</legend>
        <div class="d-flex gap-2">
          @for (option of counts; track option) {
            <label class="quiz-setup__count d-flex flex-column align-items-center flex-fill">
              <input
                class="visually-hidden"
                type="radio"
                name="question-count"
                [checked]="count() === option"
                (change)="countChanged.emit(option)" />
              <strong>{{ option }}</strong>
              <span class="text-body-secondary">{{
                'topicQuiz.setup.counts.' + option | translate
              }}</span>
            </label>
          }
        </div>
      </fieldset>
      <div class="d-flex flex-wrap justify-content-end gap-2">
        <button type="button" class="btn btn-outline-primary" (click)="cancelled.emit()">
          {{ 'actions.cancel' | translate }}
        </button>
        <button
          type="button"
          class="btn btn-primary d-flex align-items-center"
          [class.is-loading]="isLoading()"
          [disabled]="isLoading()"
          (click)="started.emit()">
          {{ 'topicQuiz.setup.start' | translate }}
          <app-icon class="ms-2" name="arrow-right" />
        </button>
      </div>
    </section>
  `,
  styles: `
    .quiz-setup__legend {
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 800;
    }

    .quiz-setup__count {
      min-width: 0;
      text-align: center;
      gap: 0.125rem;
      padding: 0.875rem 0.5rem;
      cursor: pointer;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);

      strong {
        font-size: 1.5rem;
        font-weight: 900;
      }

      span {
        font-size: 0.75rem;
        overflow-wrap: anywhere;
        font-weight: 700;
      }

      &:has(input:checked) {
        border-color: var(--bs-dark);
        box-shadow: 3px 3px 0 var(--bs-primary);
      }

      &:has(input:focus-visible) {
        outline: 0.1875rem solid var(--bs-primary);
        outline-offset: 0.125rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizSetup {
  readonly count = input.required<QuestionCount>();
  readonly isLoading = input(false);
  readonly countChanged = output<QuestionCount>();
  readonly started = output();
  readonly cancelled = output();

  protected readonly counts = QUESTION_COUNTS;
}
