import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-exam-navigator',
  imports: [TranslatePipe],
  template: `
    <aside class="card card--flat" [attr.aria-label]="'examSession.questions' | translate">
      <div class="card-body d-flex flex-column gap-3">
        <h2 class="exam-navigator__title mb-0">{{ 'examSession.questions' | translate }}</h2>
        <div class="exam-navigator__grid">
          @for (answer of answers(); track $index) {
            <button
              type="button"
              class="exam-navigator__cell"
              [class.exam-navigator__cell--answered]="answer !== null"
              [class.exam-navigator__cell--flagged]="flagged().has($index)"
              [attr.aria-current]="$index === index()"
              [attr.aria-label]="
                'examSession.cellLabel'
                  | translate
                    : {
                        number: $index + 1,
                        state:
                          (answer === null ? 'examSession.blank' : 'examSession.answeredState')
                          | translate,
                      }
              "
              (click)="jumped.emit($index)">
              {{ $index + 1 }}
            </button>
          }
        </div>
        <div class="exam-navigator__legend d-flex flex-wrap gap-3 text-body-secondary">
          <span class="d-flex align-items-center gap-1">
            <i class="exam-navigator__swatch exam-navigator__cell--answered"></i>
            {{ 'examSession.answeredState' | translate }}
          </span>
          <span class="d-flex align-items-center gap-1">
            <i class="exam-navigator__swatch exam-navigator__cell--flagged"></i>
            {{ 'examSession.flaggedState' | translate }}
          </span>
          <span class="d-flex align-items-center gap-1">
            <i class="exam-navigator__swatch"></i>
            {{ 'examSession.blank' | translate }}
          </span>
        </div>
      </div>
    </aside>
  `,
  styles: `
    .exam-navigator__title {
      font-size: 1rem;
      font-weight: 900;
    }

    .exam-navigator__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(2.5rem, 1fr));
      gap: 0.375rem;
    }

    .exam-navigator__cell {
      aspect-ratio: 1;
      min-height: 2.5rem;
      font-size: 0.875rem;
      font-weight: 800;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: 0.625rem;

      &[aria-current='true'] {
        border-color: var(--bs-dark);
        box-shadow: 2px 2px 0 var(--bs-dark);
      }
    }

    .exam-navigator__cell--answered {
      color: var(--bs-white);
      background-color: var(--bs-primary);
    }

    .exam-navigator__cell--flagged {
      color: var(--bs-dark);
      background-color: var(--bs-warning);
    }

    .exam-navigator__legend {
      font-size: 0.75rem;
      font-weight: 700;
    }

    .exam-navigator__swatch {
      display: inline-block;
      width: 0.875rem;
      height: 0.875rem;
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamNavigator {
  readonly answers = input.required<(number | null)[]>();
  readonly flagged = input.required<Set<number>>();
  readonly index = input.required<number>();
  readonly jumped = output<number>();
}
