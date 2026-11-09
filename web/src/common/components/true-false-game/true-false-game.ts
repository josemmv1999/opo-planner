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

const ROUND_SIZE = 5;

type SegmentState = 'correct' | 'wrong' | 'current' | 'pending';

@Component({
  selector: 'app-true-false-game',
  imports: [TranslatePipe, Icon],
  template: `
    <section class="card card--cyan h-100">
      <div class="card-body d-flex flex-column">
        <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
          <h2 class="card-title fs-5 mb-0">{{ 'trueFalseGame.title' | translate }}</h2>
          <span class="badge rounded-pill bg-success-subtle text-success-emphasis">
            {{ 'trueFalseGame.score' | translate: { correct: correctCount() } }}
          </span>
        </div>

        <ol class="d-flex gap-1 list-unstyled mb-4" aria-hidden="true">
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
          <p class="visually-hidden">
            {{ 'trueFalseGame.progress' | translate: { current: currentIndex() + 1, total: roundStatements().length } }}
          </p>
          <p class="true-false-game__statement fw-bold">{{ statement.text }}</p>
          <div class="true-false-game__answers">
            <button
              #trueButton
              type="button"
              class="true-false-game__answer btn d-flex align-items-center justify-content-center"
              [class.btn-success]="selectedAnswer() === true"
              [class.btn-outline-success]="selectedAnswer() !== true"
              [disabled]="hasAnswered()"
              (click)="answer(true)">
              <app-icon class="me-2" name="check" />
              {{ 'trueFalseGame.true' | translate }}
            </button>
            <button
              type="button"
              class="true-false-game__answer btn d-flex align-items-center justify-content-center"
              [class.btn-danger]="selectedAnswer() === false"
              [class.btn-outline-danger]="selectedAnswer() !== false"
              [disabled]="hasAnswered()"
              (click)="answer(false)">
              <app-icon class="me-2" name="close" />
              {{ 'trueFalseGame.false' | translate }}
            </button>
          </div>
          @if (hasAnswered()) {
            <div
              class="alert mt-3 mb-0"
              [class.alert-success]="isCorrect()"
              [class.alert-danger]="!isCorrect()"
              role="status">
              <p class="fw-bold mb-1">
                {{ (isCorrect() ? 'trueFalseGame.correct' : 'trueFalseGame.incorrect') | translate }}
              </p>
              <p class="mb-0">{{ statement.explanation }}</p>
            </div>
            <button #nextButton type="button" class="btn btn-primary align-self-end mt-3" (click)="next()">
              {{ 'trueFalseGame.next' | translate }}
            </button>
          }
        } @else {
          <div class="d-flex flex-column align-items-center text-center gap-3 my-auto">
            <p class="mb-0">
              <span class="d-block display-4 fw-bold">{{ correctCount() }}/{{ roundStatements().length }}</span>
              {{ 'trueFalseGame.roundOver' | translate }}
            </p>
            <button #playAgainButton type="button" class="btn btn-primary d-flex align-items-center" (click)="playAgain()">
              <app-icon class="me-2" name="refresh" />
              {{ 'trueFalseGame.playAgain' | translate }}
            </button>
          </div>
        }

        <p class="small text-body-secondary mt-auto pt-3 mb-0">{{ 'trueFalseGame.disclaimer' | translate }}</p>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .true-false-game__segment {
      height: 0.375rem;
    }

    .true-false-game__statement {
      font-size: clamp(1.125rem, 0.875rem + 2cqi, 1.5rem);
    }

    .true-false-game__answers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
      gap: 0.5rem;
    }

    .true-false-game__answer {
      min-width: 0;
    }

    .true-false-game__answer.btn-success:disabled,
    .true-false-game__answer.btn-danger:disabled {
      opacity: 1;
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
