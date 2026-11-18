import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import { ParsedExam } from '../../../common/models/exam-import.model';

interface ImportSummary {
  questions: number;
  reserve: number;
  voided: number;
}

@Component({
  selector: 'app-exam-import-review',
  imports: [TranslatePipe, Button],
  template: `
    @if (parsedExam().errors.length) {
      <div class="alert alert-danger mb-0" role="alert">
        <p class="fw-bold mb-2">
          {{ 'admin.import.errorsTitle' | translate: { count: parsedExam().errors.length } }}
        </p>
        <ul class="mb-0">
          @for (error of parsedExam().errors; track $index) {
            <li>
              {{
                'admin.import.errors.' + error.kind
                  | translate
                    : {
                        section: error.section,
                        number: error.number,
                        reserve: error.isReserve ? ('admin.import.reserve' | translate) : '',
                      }
              }}
            </li>
          }
        </ul>
      </div>
    } @else {
      <p class="alert alert-success mb-0" role="status">
        {{ 'admin.import.summary' | translate: summary() }}
      </p>
    }

    <ol class="exam-import-review__list list-unstyled d-flex flex-column gap-2 mb-0">
      @for (question of parsedExam().questions; track $index) {
        <li class="exam-import-review__item" [class.opacity-50]="question.isVoided">
          <p class="small text-body-secondary fw-bold mb-1">
            {{ question.section }} · {{ question.number }}
            @if (question.isReserve) {
              · {{ 'admin.import.reserve' | translate }}
            }
            @if (question.isVoided) {
              · {{ 'admin.import.voided' | translate }}
            }
          </p>
          <p class="mb-1">{{ question.statement }}</p>
          <ol class="exam-import-review__options mb-0" type="a">
            @for (option of question.options; track $index) {
              <li
                [class.fw-bold]="$index === question.correctOption"
                [class.text-success]="$index === question.correctOption">
                {{ option }}
              </li>
            }
          </ol>
        </li>
      }
    </ol>

    <div class="d-flex flex-wrap gap-2">
      <button
        app-button
        type="button"
        [isLoading]="isImporting()"
        [disabled]="!canImport() || isImporting()"
        (click)="imported.emit()">
        {{ 'admin.import.import' | translate }}
      </button>
      <button
        app-button
        type="button"
        variant="outline-primary"
        [disabled]="isImporting()"
        (click)="discarded.emit()">
        {{ 'actions.cancel' | translate }}
      </button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .exam-import-review__list {
      max-height: 32rem;
      overflow-y: auto;
    }

    .exam-import-review__item {
      padding: 0.75rem 1rem;
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);
    }

    .exam-import-review__options {
      padding-left: 1.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamImportReview {
  readonly parsedExam = input.required<ParsedExam>();
  readonly summary = input.required<ImportSummary>();
  readonly canImport = input.required<boolean>();
  readonly isImporting = input.required<boolean>();
  readonly imported = output();
  readonly discarded = output();
}
