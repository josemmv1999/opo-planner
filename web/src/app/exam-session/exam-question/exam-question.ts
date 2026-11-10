import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { ExamQuestion } from '../../../common/models/exam.model';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

@Component({
  selector: 'app-exam-question',
  imports: [TranslatePipe, Icon],
  template: `
    <section class="card card--cyan h-100">
      <div class="card-body d-flex flex-column gap-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="exam-question__meta text-body-secondary">
            {{ 'examSession.questionOf' | translate: { current: index() + 1, total: total() } }}
          </span>
          @if (isReviewing()) {
            <span class="exam-question__meta" [class.text-danger]="answer() !== correctOption()">
              {{ reviewKey() | translate }}
            </span>
          } @else {
            <button
              type="button"
              class="exam-question__flag d-flex align-items-center"
              [attr.aria-pressed]="isFlagged()"
              (click)="flagToggled.emit()">
              <app-icon class="me-2" name="flag" />
              {{ (isFlagged() ? 'examSession.flagged' : 'examSession.flag') | translate }}
            </button>
          }
        </div>

        <h1 #statement class="exam-question__statement mb-0" tabindex="-1">
          {{ question().statement }}
        </h1>

        <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
          @for (option of question().options; track $index) {
            <li>
              <button
                type="button"
                class="exam-question__option d-flex align-items-center w-100 text-start"
                [class.exam-question__option--correct]="correctOption() === $index"
                [class.exam-question__option--wrong]="
                  isReviewing() && answer() === $index && correctOption() !== $index
                "
                [attr.aria-pressed]="answer() === $index"
                [disabled]="isReviewing()"
                (click)="answered.emit($index)">
                <span
                  class="exam-question__letter d-flex align-items-center justify-content-center">
                  {{ letters[$index] }}
                </span>
                {{ option }}
              </button>
            </li>
          }
        </ul>

        <div class="d-flex justify-content-between gap-2 mt-auto">
          <button
            type="button"
            class="btn btn-outline-primary d-flex align-items-center"
            [disabled]="index() === 0"
            (click)="moved.emit(index() - 1)">
            <app-icon class="me-2" name="chevron-left" />
            {{ 'actions.back' | translate }}
          </button>
          <button
            type="button"
            class="btn btn-outline-primary d-flex align-items-center"
            [disabled]="index() === total() - 1"
            (click)="moved.emit(index() + 1)">
            {{ 'actions.next' | translate }}
            <app-icon class="ms-2" name="chevron-right" />
          </button>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .exam-question__meta {
      font-size: 0.875rem;
      font-weight: 800;
    }

    .exam-question__flag {
      padding: 0.25rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 800;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius-pill);

      &[aria-pressed='true'] {
        background-color: var(--bs-warning);
        border-color: var(--bs-dark);
      }
    }

    .exam-question__statement {
      font-size: 1.25rem;
      font-weight: 900;
      line-height: 1.35;

      &:focus {
        outline: none;
      }
    }

    .exam-question__option {
      gap: 0.75rem;
      min-height: 3rem;
      padding: 0.625rem 0.875rem;
      font-weight: 700;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);

      &[aria-pressed='true'] {
        border-color: var(--bs-dark);
        box-shadow: 3px 3px 0 var(--bs-primary);

        .exam-question__letter {
          color: var(--bs-white);
          background-color: var(--bs-primary);
        }
      }

      &:disabled {
        color: inherit;
        opacity: 1;
      }
    }

    .exam-question__option--correct {
      background-color: rgba(var(--bs-success-rgb), 0.15);
      border-color: var(--bs-success);
    }

    .exam-question__option--wrong {
      background-color: rgba(var(--bs-danger-rgb), 0.12);
      border-color: var(--bs-danger);
    }

    .exam-question__letter {
      flex-shrink: 0;
      width: 1.75rem;
      height: 1.75rem;
      font-weight: 900;
      border: 2px solid var(--bs-dark);
      border-radius: 50%;
    }

    @container (min-width: 70rem) {
      .exam-question__statement {
        font-size: 1.625rem;
      }

      .exam-question__option {
        min-height: 3.75rem;
        font-size: 1.125rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamQuestionCard {
  readonly question = input.required<ExamQuestion>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly answer = input<number | null>(null);
  readonly isFlagged = input(false);
  readonly correctOption = input<number | null>(null);
  readonly answered = output<number>();
  readonly flagToggled = output();
  readonly moved = output<number>();

  protected readonly letters = LETTERS;
  protected readonly isReviewing = computed(() => this.correctOption() !== null);
  protected readonly reviewKey = computed(() =>
    this.answer() === null
      ? 'examSession.reviewBlank'
      : this.answer() === this.correctOption()
        ? 'examSession.reviewCorrect'
        : 'examSession.reviewWrong',
  );
  private readonly statement = viewChild.required<ElementRef<HTMLElement>>('statement');

  constructor() {
    afterRenderEffect(() => {
      this.question();
      this.statement().nativeElement.focus();
    });
  }
}
