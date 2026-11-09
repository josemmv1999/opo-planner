import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TrueFalseStatement } from '../../models/true-false-statement.model';
import { Icon } from '../icon/icon';
import { roundVerdictKey } from './round-verdict-key';

const ROUND_SIZE = 5;

type SegmentState = 'correct' | 'wrong' | 'current' | 'pending';

@Component({
  selector: 'app-true-false-game',
  imports: [TranslatePipe, Icon],
  template: `
    <section class="card card--cyan h-100">
      <div class="card-body d-flex flex-column gap-3 p-3 p-lg-4 overflow-y-auto">
        <div class="d-flex align-items-center justify-content-between gap-2">
          <h2 class="card-title true-false-game__title mb-0">{{ 'trueFalseGame.title' | translate }}</h2>
          <span class="true-false-game__score badge rounded-pill bg-warning text-dark border border-2 border-dark">
            {{ (correctCount() === 1 ? 'trueFalseGame.scoreOne' : 'trueFalseGame.score') | translate: { correct: correctCount() } }}
          </span>
        </div>

        <ol class="true-false-game__segments d-flex list-unstyled mb-0" aria-hidden="true">
          @for (segment of segments(); track $index) {
            <li
              class="true-false-game__segment flex-fill rounded-pill"
              [class.bg-success]="segment === 'correct'"
              [class.bg-danger]="segment === 'wrong'"
              [class.bg-primary]="segment === 'current'"
              [class.bg-dark-subtle]="segment === 'pending'"></li>
          }
        </ol>

        @if (currentStatement(); as statement) {
          <div class="true-false-game__body">
            <div class="d-flex flex-column gap-2">
              <p
                class="true-false-game__progress mb-0"
                [class.text-body-secondary]="!hasAnswered()"
                [class.text-success]="hasAnswered() && isCorrect()"
                [class.text-danger]="hasAnswered() && !isCorrect()"
                role="status">
                @if (!hasAnswered()) {
                  {{ 'trueFalseGame.progress' | translate: { current: currentIndex() + 1, total: roundStatements().length } }}
                } @else if (isCorrect()) {
                  {{ 'trueFalseGame.correct' | translate }}
                } @else {
                  {{ 'trueFalseGame.incorrect' | translate }}
                  {{ (statement.isTrue ? 'trueFalseGame.wasTrue' : 'trueFalseGame.wasFalse') | translate }}
                }
              </p>
              <p class="true-false-game__statement mb-0">{{ statement.text }}</p>
              @if (hasAnswered()) {
                <p class="true-false-game__explanation mb-0">{{ statement.explanation }}</p>
              }
            </div>
            <div class="true-false-game__answers">
              <button
                #trueButton
                type="button"
                class="true-false-game__answer btn d-flex align-items-center justify-content-center gap-2"
                [class.btn-success]="selectedAnswer() === true"
                [class.btn-outline-success]="selectedAnswer() !== true"
                [disabled]="hasAnswered()"
                (click)="answer(true)">
                <app-icon name="check" />
                {{ 'trueFalseGame.true' | translate }}
              </button>
              <button
                type="button"
                class="true-false-game__answer btn d-flex align-items-center justify-content-center gap-2"
                [class.btn-danger]="selectedAnswer() === false"
                [class.btn-outline-danger]="selectedAnswer() !== false"
                [disabled]="hasAnswered()"
                (click)="answer(false)">
                <app-icon name="close" />
                {{ 'trueFalseGame.false' | translate }}
              </button>
              @if (hasAnswered()) {
                <button
                  #nextButton
                  type="button"
                  class="true-false-game__next btn btn-primary border-dark d-flex align-items-center justify-content-center gap-2"
                  (click)="next()">
                  {{ (isLastStatement() ? 'trueFalseGame.seeResult' : 'trueFalseGame.next') | translate }}
                  <app-icon name="arrow-right" />
                </button>
              }
            </div>
          </div>
        } @else {
          <div class="d-flex flex-column align-items-center text-center gap-3 my-auto">
            <p class="mb-0">
              <span class="d-block display-4 fw-bold">{{ correctCount() }}/{{ roundStatements().length }}</span>
              {{ roundVerdictKey() | translate }}
            </p>
            <button #playAgainButton type="button" class="btn btn-primary d-flex align-items-center" (click)="playAgain()">
              <app-icon class="me-2" name="refresh" />
              {{ 'trueFalseGame.playAgain' | translate }}
            </button>
          </div>
        }

        <p class="true-false-game__disclaimer text-body-secondary mt-auto mb-0">{{ 'trueFalseGame.disclaimer' | translate }}</p>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .true-false-game__title {
      font-size: 1.125rem;
    }

    .true-false-game__score {
      font-size: 0.75rem;
      font-weight: 800;
    }

    .true-false-game__segments {
      gap: 0.3125rem;
    }

    .true-false-game__segment {
      height: 0.4375rem;
    }

    .true-false-game__progress {
      font-size: 0.75rem;
      font-weight: 700;
    }

    .true-false-game__statement {
      font-size: clamp(1.0625rem, 0.875rem + 1.5cqi, 1.3125rem);
      font-weight: 700;
      line-height: 1.4;
    }

    .true-false-game__body {
      display: grid;
      gap: 1rem;
    }

    .true-false-game__explanation {
      font-size: 0.9375rem;
      line-height: 1.45;
      color: var(--bs-secondary-color);
    }

    .true-false-game__answers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
      align-content: start;
      gap: 0.625rem;
    }

    .true-false-game__answer {
      min-width: 0;
      height: 3rem;
      font-weight: 800;

      app-icon {
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    .true-false-game__answer.btn-success:disabled,
    .true-false-game__answer.btn-danger:disabled {
      opacity: 1;
    }

    .true-false-game__next {
      grid-column: 1 / -1;
      height: 3rem;
      font-weight: 800;
    }

    .true-false-game__disclaimer {
      font-size: 0.75rem;
    }

    @container (min-width: 20rem) {
      .true-false-game__title {
        font-size: 1.25rem;
      }

      .true-false-game__score {
        font-size: 0.8125rem;
      }

      .true-false-game__segments {
        gap: 0.375rem;
      }

      .true-false-game__segment {
        height: 0.5rem;
      }

      .true-false-game__progress {
        font-size: 0.8125rem;
      }

      .true-false-game__answer {
        height: 3.25rem;

        app-icon {
          width: 1.375rem;
          height: 1.375rem;
        }
      }
    }

    @container (min-width: 36rem) {
      .true-false-game__body {
        grid-template-columns: minmax(0, 1fr) 13rem;
        align-items: start;
      }

      .true-false-game__answers {
        grid-template-columns: minmax(0, 1fr);
      }

      .true-false-game__answer,
      .true-false-game__next {
        height: 2.75rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrueFalseGame {
  readonly statements = input.required<TrueFalseStatement[]>();

  protected readonly roundStart = signal(0);
  protected readonly currentIndex = signal(0);
  protected readonly results = signal<boolean[]>([]);
  protected readonly selectedAnswer = signal<boolean | null>(null);

  protected readonly roundStatements = computed(() => {
    const statements = this.statements();
    const roundLength = Math.min(ROUND_SIZE, statements.length);
    return Array.from({ length: roundLength }, (_, i) => statements[(this.roundStart() + i) % statements.length]);
  });
  protected readonly currentStatement = computed(() => this.roundStatements()[this.currentIndex()] ?? null);
  protected readonly hasAnswered = computed(() => this.selectedAnswer() !== null);
  protected readonly isCorrect = computed(() => this.selectedAnswer() === this.currentStatement()?.isTrue);
  protected readonly correctCount = computed(() => this.results().filter(Boolean).length);
  protected readonly isLastStatement = computed(() => this.currentIndex() === this.roundStatements().length - 1);
  protected readonly roundVerdictKey = computed(() =>
    roundVerdictKey(this.correctCount(), this.roundStatements().length),
  );
  protected readonly segments = computed<SegmentState[]>(() =>
    this.roundStatements().map((_, i) => {
      const result = this.results()[i];
      if (result !== undefined) return result ? 'correct' : 'wrong';
      return i === this.currentIndex() ? 'current' : 'pending';
    }),
  );

  private readonly trueButton = viewChild<ElementRef<HTMLButtonElement>>('trueButton');
  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('nextButton');
  private readonly playAgainButton = viewChild<ElementRef<HTMLButtonElement>>('playAgainButton');
  readonly #injector = inject(Injector);

  protected answer(value: boolean): void {
    const statement = this.currentStatement();
    if (!statement || this.hasAnswered()) return;
    this.selectedAnswer.set(value);
    this.results.update((results) => [...results, value === statement.isTrue]);
    this.focusAfterRender(this.nextButton);
  }

  protected next(): void {
    this.selectedAnswer.set(null);
    this.currentIndex.update((index) => index + 1);
    this.focusAfterRender(this.currentStatement() ? this.trueButton : this.playAgainButton);
  }

  protected playAgain(): void {
    this.roundStart.update((start) => (start + this.roundStatements().length) % this.statements().length);
    this.currentIndex.set(0);
    this.results.set([]);
    this.selectedAnswer.set(null);
    this.focusAfterRender(this.trueButton);
  }

  private focusAfterRender(button: () => ElementRef<HTMLButtonElement> | undefined): void {
    afterNextRender(() => button()?.nativeElement.focus(), { injector: this.#injector });
  }
}
