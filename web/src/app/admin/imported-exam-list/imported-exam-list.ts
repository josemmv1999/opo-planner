import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import { ImportedExam } from '../../../common/models/exam-import.model';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';

@Component({
  selector: 'app-imported-exam-list',
  imports: [TranslatePipe, Button, FormatDatePipe],
  template: `
    <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
      @for (exam of rows(); track exam.id) {
        <li class="imported-exam-list__item d-flex align-items-center gap-3">
          <div class="flex-grow-1">
            <p class="fw-bold mb-0">{{ exam.name }}</p>
            <p class="small text-body-secondary mb-0">
              {{
                'admin.imported.meta'
                  | translate
                    : {
                        count: exam.questionCount,
                        date: exam.importedAt | formatDate: 'd MMM yyyy',
                      }
              }}
            </p>
          </div>
          <button
            app-button
            type="button"
            variant="outline-danger"
            icon="delete"
            [isIconOnly]="true"
            [title]="'admin.imported.delete' | translate"
            (click)="deleted.emit(exam.id)"></button>
        </li>
      }
    </ul>
  `,
  styles: `
    .imported-exam-list__item {
      padding: 0.75rem 1rem;
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportedExamList {
  readonly exams = input.required<ImportedExam[]>();
  readonly deleted = output<number>();

  protected readonly rows = computed(() =>
    this.exams().map(({ id, name, importedAt, questions }) => ({
      id,
      name,
      importedAt,
      questionCount: questions.filter(({ isReserve, isVoided }) => !isReserve && !isVoided).length,
    })),
  );
}
