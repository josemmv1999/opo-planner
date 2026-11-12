import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { Button } from '../../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { QuizQuestion } from '../../../common/models/quiz.model';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

@Component({
  selector: 'app-quiz-question',
  imports: [Button, TranslatePipe, Icon],
  template: `
    <section class="d-flex flex-column gap-4">
      <div class="d-flex align-items-center gap-3">
        <button
          app-button
          variant="link"
          type="button"
          class="quiz-question__exit d-flex align-items-center p-0"
          (click)="exited.emit()">
          <app-icon class="me-1" name="close" />
          {{ 'topicQuiz.exit' | translate }}
        </button>
        <div
          class="quiz-question__progress progress flex-grow-1"
          role="progressbar"
          [attr.aria-label]="'topicQuiz.progressLabel' | translate"
          aria-valuemin="0"
          [attr.aria-valuemax]="total()"
          [attr.aria-valuenow]="index()">
          <div class="progress-bar" [style.width.%]="(index() / total()) * 100"></div>
        </div>
        <span class="quiz-question__meta text-body-secondary text-nowrap">
          {{ 'topicQuiz.questionOf' | translate: { current: index() + 1, total: total() } }}
        </span>
      </div>

      @if (question().caseText; as caseText) {
        <div class="quiz-question__case">
          <h3 class="quiz-question__case-title">{{ 'topicQuiz.case' | translate }}</h3>
          <p class="mb-0">{{ caseText }}</p>
        </div>
      }

      <h2 #statement class="quiz-question__statement mb-0" tabindex="-1">
        {{ question().statement }}
      </h2>

      <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
        @for (option of question().options; track $index; let i = $index) {
          <li>
            <button
              type="button"
              class="quiz-question__option d-flex align-items-center gap-3 w-100 text-start"
              [class.quiz-question__option--right]="
                answer() !== null && i === question().correctOption
              "
              [class.quiz-question__option--wrong]="
                answer() === i && i !== question().correctOption
              "
              [class.quiz-question__option--dim]="
                answer() !== null && answer() !== i && i !== question().correctOption
              "
              [disabled]="answer() !== null"
              (click)="answered.emit(i)">
              <span
                class="quiz-question__letter d-flex align-items-center justify-content-center"
                >{{ letters[i] }}</span
              >
              <span class="flex-grow-1">{{ option }}</span>
              @if (answer() !== null && i === question().correctOption) {
                <app-icon name="check" />
                <span class="visually-hidden">{{ 'topicQuiz.rightOption' | translate }}</span>
              } @else if (answer() === i) {
                <app-icon name="close" />
                <span class="visually-hidden">{{ 'topicQuiz.yourOption' | translate }}</span>
              }
            </button>
          </li>
        }
      </ul>

      @if (answer() !== null) {
        @let isRight = answer() === question().correctOption;
        <div
          class="quiz-question__reasoning"
          [class.quiz-question__reasoning--right]="isRight"
          role="status">
          <p
            class="d-flex align-items-center gap-2 fw-bold mb-1"
            [class.text-success]="isRight"
            [class.text-danger]="!isRight">
            <app-icon [name]="isRight ? 'check' : 'close'" />
            {{
              isRight
                ? ('topicQuiz.right' | translate)
                : ('topicQuiz.wrong' | translate: { letter: letters[question().correctOption] })
            }}
          </p>
          <p class="mb-0">{{ question().reasoning }}</p>
        </div>
      }

      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <span class="quiz-question__meta text-body-secondary">
          {{ 'topicQuiz.tally' | translate: { right: correctCount(), wrong: wrongCount() } }}
        </span>
        @if (answer() !== null) {
          <button
            app-button
            type="button"
            class="d-flex align-items-center"
            (click)="nextClicked.emit()">
            {{ (isLast() ? 'topicQuiz.seeResult' : 'topicQuiz.next') | translate }}
            <app-icon class="ms-2" name="arrow-right" />
          </button>
        }
      </div>
    </section>
  `,
  styles: `
    .quiz-question__exit,
    .quiz-question__meta {
      font-size: 0.875rem;
      font-weight: 800;
    }

    .quiz-question__progress {
      --bs-progress-height: 0.5rem;
      --bs-progress-border-radius: var(--bs-border-radius-pill);
    }

    .quiz-question__case {
      padding: 1rem 1.25rem;
      background-color: rgba(var(--bs-info-rgb), 0.08);
      border: 2px dashed var(--bs-info);
      border-radius: var(--bs-border-radius);
    }

    .quiz-question__case-title {
      margin-bottom: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 900;
      color: var(--bs-primary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .quiz-question__statement {
      font-size: clamp(1.125rem, 2.5vw, 1.375rem);
      font-weight: 800;
      line-height: 1.35;

      &:focus {
        outline: none;
      }
    }

    .quiz-question__option {
      padding: 0.875rem 1rem;
      font-weight: 700;
      color: var(--bs-body-color);
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);

      &:not(:disabled):hover {
        border-color: var(--bs-dark);
      }
    }

    .quiz-question__letter {
      flex-shrink: 0;
      width: 2rem;
      height: 2rem;
      font-weight: 900;
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-sm);
    }

    .quiz-question__option--right {
      background-color: rgba(var(--bs-success-rgb), 0.08);
      border-color: var(--bs-success);

      .quiz-question__letter {
        color: var(--bs-white);
        background-color: var(--bs-success);
        border-color: var(--bs-success);
      }
    }

    .quiz-question__option--wrong {
      background-color: rgba(var(--bs-danger-rgb), 0.07);
      border-color: var(--bs-danger);

      .quiz-question__letter {
        color: var(--bs-white);
        background-color: var(--bs-danger);
        border-color: var(--bs-danger);
      }
    }

    .quiz-question__option--dim {
      opacity: 0.55;
    }

    .quiz-question__reasoning {
      padding: 0.875rem 1rem;
      font-weight: 600;
      line-height: 1.5;
      background-color: rgba(var(--bs-danger-rgb), 0.07);
      border-left: 0.25rem solid var(--bs-danger);
      border-radius: var(--bs-border-radius-sm);
    }

    .quiz-question__reasoning--right {
      background-color: rgba(var(--bs-success-rgb), 0.08);
      border-left-color: var(--bs-success);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizQuestionCard {
  readonly question = input.required<QuizQuestion>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly answer = input<number | null>(null);
  readonly correctCount = input(0);
  readonly wrongCount = input(0);
  readonly isLast = input(false);
  readonly answered = output<number>();
  readonly nextClicked = output();
  readonly exited = output();

  protected readonly letters = LETTERS;
  private readonly statement = viewChild.required<ElementRef<HTMLElement>>('statement');

  constructor() {
    afterRenderEffect(() => {
      this.question();
      untracked(() => this.statement().nativeElement.focus());
    });
  }
}
