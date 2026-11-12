import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { CountdownPipe } from '../../../common/pipes/countdown.pipe';

@Component({
  selector: 'app-exam-bar',
  imports: [Button, TranslatePipe, Icon, CountdownPipe],
  template: `
    <div class="card card--flat exam-bar d-flex flex-row flex-wrap align-items-center">
      <button
        app-button
        variant="link"
        type="button"
        class="exam-bar__exit d-flex align-items-center p-0"
        (click)="exited.emit()">
        <app-icon class="me-1" name="close" />
        {{ 'examSession.exit' | translate }}
      </button>
      <span class="d-flex flex-column flex-grow-1 overflow-hidden">
        <strong class="text-truncate">{{ name() }}</strong>
        <span class="exam-bar__meta text-body-secondary">
          {{ 'examSession.answered' | translate: { answered: answered(), total: total() } }}
        </span>
      </span>
      <span
        class="exam-bar__timer d-flex align-items-center"
        [class.exam-bar__timer--low]="isTimeLow()"
        role="timer"
        [attr.aria-label]="'examSession.timeLeft' | translate">
        <app-icon class="me-1" name="timer" />
        {{ secondsLeft() | countdown }}
      </span>
      <button app-button size="sm" type="button" class="ms-auto" (click)="submitted.emit()">
        {{ 'examSession.submit' | translate }}
      </button>
    </div>
  `,
  styles: `
    .exam-bar {
      gap: 0.75rem 1rem;
      padding: 0.75rem 1rem;
    }

    .exam-bar__exit {
      font-size: 0.875rem;
      font-weight: 800;
      text-decoration: none;
    }

    .exam-bar__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .exam-bar__timer {
      padding: 0.25rem 0.625rem;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-pill);
    }

    .exam-bar__timer--low {
      color: var(--bs-white);
      background-color: var(--bs-danger);
      border-color: var(--bs-danger);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamBar {
  readonly name = input.required<string>();
  readonly answered = input.required<number>();
  readonly total = input.required<number>();
  readonly secondsLeft = input.required<number>();
  readonly isTimeLow = input(false);
  readonly submitted = output();
  readonly exited = output();
}
