import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { AdminStore } from './admin.store';
import { ExamImportForm } from './exam-import-form/exam-import-form';
import { ExamImportReview } from './exam-import-review/exam-import-review';

@Component({
  selector: 'app-admin',
  imports: [TranslatePipe, Icon, ExamImportForm, ExamImportReview],
  providers: [AdminStore],
  template: `
    <section class="card card--teal">
      <div class="card-body d-flex flex-column gap-2">
        <span class="admin__badge d-inline-flex align-items-center align-self-start">
          <app-icon class="me-2" name="settings" />{{ 'admin.badge' | translate }}
        </span>
        <p class="mb-0">{{ 'admin.intro' | translate }}</p>
      </div>
    </section>

    <section class="card card--cyan">
      <div class="card-body d-flex flex-column gap-3">
        <h2 class="h5 mb-0">{{ 'admin.import.title' | translate }}</h2>
        @if (store.parsedExam(); as parsedExam) {
          <app-exam-import-review
            [parsedExam]="parsedExam"
            [summary]="store.importSummary()"
            [canImport]="store.canImport()"
            [isImporting]="store.isImporting()"
            (imported)="store.importExam()"
            (discarded)="store.discard()" />
        } @else {
          <p class="text-body-secondary mb-0">{{ 'admin.import.hint' | translate }}</p>
          <app-exam-import-form
            [isReading]="store.isReading()"
            [hasError]="store.error() === 'reading'"
            (submitted)="store.read($event)" />
        }
      </div>
    </section>
  `,
  host: { class: 'd-flex flex-column gap-3' },
  styles: `
    .admin__badge {
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--bs-white);
      background-color: var(--bs-dark);
      border-radius: 50rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {
  protected readonly store = inject(AdminStore);
}
