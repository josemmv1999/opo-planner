import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TrueFalseStatement } from '../../models/true-false-statement.model';
import { Icon } from '../icon/icon';
import { Modal } from '../modal/modal';
import { roundVerdictKey } from './round-verdict-key';

const ROUND_SIZE = 5;
const LONG_STATEMENT_LENGTH = 110;

type SegmentState = 'correct' | 'wrong' | 'current' | 'pending';

@Component({
  selector: 'app-true-false-game',
  imports: [TranslatePipe, Icon, Modal],
  template: `
    <section class="card card--cyan h-100">
      <div class="true-false-game__body card-body card-body--home d-flex flex-column">
        <div class="d-flex align-items-center gap-3">
          <h2 class="card-title true-false-game__title mb-0">
            {{ 'trueFalseGame.title' | translate }}
          </h2>
          <ol
            class="true-false-game__segments d-flex flex-grow-1 list-unstyled mb-0"
            aria-hidden="true">
            @for (segment of segments(); track $index) {
              <li
                class="true-false-game__segment flex-fill rounded-pill"
                [class.bg-success]="segment === 'correct'"
                [class.bg-danger]="segment === 'wrong'"
                [class.bg-primary]="segment === 'current'"
                [class.bg-dark-subtle]="segment === 'pending'"></li>
            }
          </ol>
          <span
            class="true-false-game__score badge rounded-pill bg-warning text-dark border border-2 border-dark ms-auto">
            {{
              (correctCount() === 1 ? 'trueFalseGame.scoreOne' : 'trueFalseGame.score')
                | translate: { correct: correctCount() }
            }}
          </span>
        </div>

        <div class="true-false-game__main d-flex flex-column justify-content-center">
          @if (currentStatement(); as statement) {
            @if (!hasAnswered()) {
              <p class="true-false-game__progress text-body-secondary mb-0">
                {{
                  'trueFalseGame.progress'
                    | translate: { current: currentIndex() + 1, total: roundStatements().length }
                }}
              </p>
              <p
                class="true-false-game__statement mb-0"
                [class.true-false-game__statement--long]="
                  statement.text.length > longStatementLength
                ">
                {{ statement.text }}
              </p>
            } @else {
              <p class="true-false-game__asked text-body-secondary mb-0">{{ statement.text }}</p>
              <div class="d-flex align-items-center gap-3">
                <p
                  class="true-false-game__status d-flex align-items-center gap-2 mb-0"
                  [class.text-success]="isCorrect()"
                  [class.text-danger]="!isCorrect()"
                  role="status">
                  <app-icon [name]="isCorrect() ? 'check' : 'close'" />
                  @if (isCorrect()) {
                    {{ 'trueFalseGame.correct' | translate }}
                  } @else {
                    {{ 'trueFalseGame.incorrect' | translate }}
                    {{
                      (statement.isTrue ? 'trueFalseGame.wasTrue' : 'trueFalseGame.wasFalse')
                        | translate
                    }}
                  }
                </p>
                @if (isExplanationClamped()) {
                  <button
                    type="button"
                    class="true-false-game__more btn btn-link p-0 ms-auto"
                    (click)="isExplanationOpen.set(true)">
                    {{ 'trueFalseGame.fullExplanation' | translate }}
                  </button>
                }
              </div>
              <p
                #explanation
                class="true-false-game__explanation mb-0"
                [class.true-false-game__explanation--correct]="isCorrect()"
                [class.true-false-game__explanation--wrong]="!isCorrect()">
                {{ statement.explanation }}
              </p>
            }
          } @else {
            <div class="true-false-game__result d-flex align-items-center">
              <p class="true-false-game__final-block d-flex flex-column mb-0">
                <span class="true-false-game__final"
                  >{{ correctCount() }}/{{ roundStatements().length }}</span
                >
                <span class="fw-bold">{{ roundVerdictKey() | translate }}</span>
              </p>
              <ul class="true-false-game__recap list-unstyled d-flex flex-column mb-0">
                @for (statement of roundStatements(); track $index; let i = $index) {
                  <li class="d-flex align-items-center gap-2">
                    <span
                      class="true-false-game__mark d-flex align-items-center justify-content-center rounded-circle text-white"
                      [class.bg-success]="results()[i]"
                      [class.bg-danger]="!results()[i]">
                      <app-icon [name]="results()[i] ? 'check' : 'close'" />
                    </span>
                    <span class="visually-hidden">
                      {{
                        (results()[i] ? 'trueFalseGame.recapRight' : 'trueFalseGame.recapWrong')
                          | translate
                      }}
                    </span>
                    <span class="text-truncate">{{ statement.text }}</span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <div class="true-false-game__foot d-flex align-items-center gap-3">
          <p class="true-false-game__disclaimer text-body-secondary mb-0">
            {{ 'trueFalseGame.disclaimer' | translate }}
          </p>
          <div class="true-false-game__actions d-flex gap-2">
            @if (!currentStatement()) {
              <button
                #playAgainButton
                type="button"
                class="btn btn-primary d-flex align-items-center"
                (click)="playAgain()">
                <app-icon class="me-2" name="refresh" />
                {{ 'trueFalseGame.playAgain' | translate }}
              </button>
            } @else if (hasAnswered()) {
              <button
                #nextButton
                type="button"
                class="btn btn-primary border-dark d-flex align-items-center"
                (click)="next()">
                {{
                  (isLastStatement() ? 'trueFalseGame.seeResult' : 'trueFalseGame.next') | translate
                }}
                <app-icon class="ms-2" name="arrow-right" />
              </button>
            } @else {
              <button
                #trueButton
                type="button"
                class="true-false-game__answer btn btn-outline-success d-flex align-items-center justify-content-center"
                (click)="answer(true)">
                <app-icon class="me-2" name="check" />
                {{ 'trueFalseGame.true' | translate }}
              </button>
              <button
                type="button"
                class="true-false-game__answer btn btn-outline-danger d-flex align-items-center justify-content-center"
                (click)="answer(false)">
                <app-icon class="me-2" name="close" />
                {{ 'trueFalseGame.false' | translate }}
              </button>
            }
          </div>
        </div>
      </div>
    </section>

    <app-modal
      [isOpen]="isExplanationOpen()"
      [label]="'trueFalseGame.explanationTitle' | translate"
      (closed)="isExplanationOpen.set(false)">
      <ng-template>
        @if (currentStatement(); as statement) {
          <div class="d-flex flex-column gap-3">
            <h3 class="h5 mb-0">{{ 'trueFalseGame.explanationTitle' | translate }}</h3>
            <p class="fw-bold mb-0">{{ statement.text }}</p>
            <p class="mb-0">{{ statement.explanation }}</p>
            <button
              type="button"
              class="btn btn-primary align-self-end"
              (click)="isExplanationOpen.set(false)">
              {{ 'trueFalseGame.understood' | translate }}
            </button>
          </div>
        }
      </ng-template>
    </app-modal>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .true-false-game__body {
      gap: 0.75rem;
      overflow: hidden;
    }

    .true-false-game__title {
      font-size: 1.125rem;
      white-space: nowrap;
    }

    .true-false-game__segments {
      gap: 0.25rem;
      min-width: 3rem;
      max-width: 12rem;
    }

    .true-false-game__segment {
      height: 0.375rem;
    }

    .true-false-game__score {
      font-size: 0.75rem;
      font-weight: 800;
    }

    .true-false-game__main {
      flex: 1 1 auto;
      gap: 0.375rem;
      min-height: 0;
      overflow: hidden;
      container: true-false-main / size;
      contain-intrinsic-size: auto 9rem;
    }

    .true-false-game__progress {
      font-size: 0.8125rem;
      font-weight: 800;
    }

    .true-false-game__statement,
    .true-false-game__asked,
    .true-false-game__explanation {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
    }

    .true-false-game__statement {
      font-size: clamp(1rem, 22cqh, 1.5rem);
      font-weight: 800;
      line-height: 1.3;
      -webkit-line-clamp: 3;
    }

    .true-false-game__statement--long {
      font-size: clamp(0.9375rem, 16cqh, 1.25rem);
      -webkit-line-clamp: 4;
    }

    .true-false-game__asked {
      font-size: 0.8125rem;
      font-weight: 700;
      -webkit-line-clamp: 1;
    }

    .true-false-game__status {
      font-size: 1.0625rem;
      font-weight: 900;
    }

    .true-false-game__more {
      font-size: 0.8125rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .true-false-game__explanation {
      padding: 0.5rem 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.45;
      border-left: 0.25rem solid;
      border-radius: var(--bs-border-radius-sm);
      -webkit-line-clamp: 4;
    }

    .true-false-game__explanation--correct {
      background-color: rgba(var(--bs-success-rgb), 0.1);
      border-left-color: var(--bs-success);
    }

    .true-false-game__explanation--wrong {
      background-color: rgba(var(--bs-danger-rgb), 0.08);
      border-left-color: var(--bs-danger);
    }

    .true-false-game__result {
      gap: 1.25rem;
      min-height: 0;
    }

    .true-false-game__final-block {
      flex-shrink: 0;
      gap: 0.125rem;
    }

    .true-false-game__final {
      font-size: clamp(2.25rem, 40cqh, 3.5rem);
      font-weight: 900;
      line-height: 1;
    }

    .true-false-game__recap {
      flex: 1;
      gap: 0.25rem;
      min-width: 0;
      padding-left: 1.25rem;
      font-size: 0.8125rem;
      font-weight: 700;
      border-left: 2px dashed rgba(var(--bs-dark-rgb), 0.14);
    }

    .true-false-game__mark {
      flex-shrink: 0;
      width: 1.125rem;
      height: 1.125rem;

      app-icon {
        width: 0.75rem;
        height: 0.75rem;
      }
    }

    @container true-false-main (max-height: 7.5rem) {
      .true-false-game__explanation {
        -webkit-line-clamp: 2;
      }

      .true-false-game__asked {
        display: none;
      }

      .true-false-game__recap {
        display: none !important;
      }

      .true-false-game__final-block {
        flex-direction: row !important;
        align-items: baseline;
        gap: 0.625rem;
      }

      .true-false-game__final {
        font-size: clamp(1.75rem, 50cqh, 2.5rem);
      }
    }

    @container true-false-main (max-height: 5rem) {
      .true-false-game__main {
        gap: 0.25rem;
      }

      .true-false-game__progress {
        display: none;
      }

      .true-false-game__status {
        font-size: 0.9375rem;
      }

      .true-false-game__explanation {
        padding: 0.25rem 0.625rem;
        font-size: 0.9375rem;
        -webkit-line-clamp: 1;
      }
    }

    .true-false-game__foot {
      flex-shrink: 0;
      min-height: 2.75rem;
    }

    .true-false-game__disclaimer {
      flex: 1;
      min-width: 0;
      font-size: 0.75rem;
    }

    .true-false-game__actions {
      flex-shrink: 0;

      .btn {
        height: 2.75rem;
        font-weight: 800;
        white-space: nowrap;
      }
    }

    .true-false-game__answer {
      min-width: 8.5rem;
    }

    @container (max-width: 30rem) {
      .true-false-game__foot {
        flex-direction: column-reverse;
        align-items: stretch !important;
        gap: 0.5rem !important;
      }

      .true-false-game__actions .btn {
        flex: 1;
        justify-content: center;
      }

      .true-false-game__answer {
        min-width: 0;
      }

      .true-false-game__disclaimer {
        text-align: center;
      }

      .true-false-game__segments {
        max-width: none;
      }

      .true-false-game__result {
        flex-direction: column;
        align-items: center !important;
        gap: 0.75rem;
      }

      .true-false-game__recap {
        display: none !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrueFalseGame {
  readonly statements = input.required<TrueFalseStatement[]>();

  protected readonly longStatementLength = LONG_STATEMENT_LENGTH;
  protected readonly roundStart = signal(0);
  protected readonly currentIndex = signal(0);
  protected readonly results = signal<boolean[]>([]);
  protected readonly selectedAnswer = signal<boolean | null>(null);
  protected readonly isExplanationOpen = signal(false);
  protected readonly isExplanationClamped = signal(false);

  protected readonly roundStatements = computed(() => {
    const statements = this.statements();
    const roundLength = Math.min(ROUND_SIZE, statements.length);
    return Array.from(
      { length: roundLength },
      (_, i) => statements[(this.roundStart() + i) % statements.length],
    );
  });
  protected readonly currentStatement = computed(
    () => this.roundStatements()[this.currentIndex()] ?? null,
  );
  protected readonly hasAnswered = computed(() => this.selectedAnswer() !== null);
  protected readonly isCorrect = computed(
    () => this.selectedAnswer() === this.currentStatement()?.isTrue,
  );
  protected readonly correctCount = computed(() => this.results().filter(Boolean).length);
  protected readonly isLastStatement = computed(
    () => this.currentIndex() === this.roundStatements().length - 1,
  );
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
  private readonly explanation = viewChild<ElementRef<HTMLElement>>('explanation');
  readonly #injector = inject(Injector);

  constructor() {
    this.watchExplanationClamp();
  }

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
    this.roundStart.update(
      (start) => (start + this.roundStatements().length) % this.statements().length,
    );
    this.currentIndex.set(0);
    this.results.set([]);
    this.selectedAnswer.set(null);
    this.focusAfterRender(this.trueButton);
  }

  private focusAfterRender(button: () => ElementRef<HTMLButtonElement> | undefined): void {
    afterNextRender(() => button()?.nativeElement.focus(), { injector: this.#injector });
  }

  private watchExplanationClamp(): void {
    const measure = () => {
      const element = this.explanation()?.nativeElement;
      this.isExplanationClamped.set(!!element && element.scrollHeight > element.clientHeight + 1);
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
    afterRenderEffect(() => {
      const element = this.explanation()?.nativeElement;
      observer?.disconnect();
      if (element) observer?.observe(element);
      measure();
    });
  }
}
