import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmContent } from '../../common/components/confirm-content/confirm-content';
import { Icon } from '../../common/components/icon/icon';
import { Modal } from '../../common/components/modal/modal';
import { AdminStore } from './admin.store';
import { ExamImportForm } from './exam-import-form/exam-import-form';
import { ExamImportReview } from './exam-import-review/exam-import-review';
import { GeneratedImportForm } from './generated-import-form/generated-import-form';
import { ImportedExamList } from './imported-exam-list/imported-exam-list';

@Component({
  selector: 'app-admin',
  imports: [
    TranslatePipe,
    Icon,
    Modal,
    ConfirmContent,
    ExamImportForm,
    ExamImportReview,
    GeneratedImportForm,
    ImportedExamList,
  ],
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
            [syllabusBlocks]="store.syllabusBlocks()"
            [canImport]="store.canImport()"
            [isImporting]="store.isImporting()"
            (imported)="store.importExam()"
            (discarded)="store.discard()"
            (topicChanged)="store.setQuestionTopic($event)" />
        } @else {
          <p class="text-body-secondary mb-0">{{ 'admin.import.hint' | translate }}</p>
          <app-exam-import-form
            [isReading]="store.isReading()"
            [hasError]="store.error() === 'reading'"
            (submitted)="store.read($event)" />
        }
      </div>
    </section>

    <section class="card card--yellow">
      <div class="card-body d-flex flex-column gap-3">
        <h2 class="h5 mb-0">{{ 'admin.generated.title' | translate }}</h2>
        <p class="text-body-secondary mb-0">{{ 'admin.generated.hint' | translate }}</p>
        <app-generated-import-form
          [isImporting]="store.isImportingGenerated()"
          [hasError]="store.error() === 'importingGenerated'"
          [result]="store.generatedResult()"
          (submitted)="store.importGenerated($event)" />
      </div>
    </section>

    <section class="card card--teal">
      <div class="card-body d-flex flex-column gap-3">
        <h2 class="h5 mb-0">{{ 'admin.imported.title' | translate }}</h2>
        @if (store.isLoadingImported()) {
          <div class="d-flex justify-content-center py-3">
            <span class="spinner-border text-primary" role="status">
              <span class="visually-hidden">{{ 'admin.imported.loading' | translate }}</span>
            </span>
          </div>
        } @else if (store.error() === 'loadingImported') {
          <p class="alert alert-danger mb-0" role="alert">
            {{ 'admin.imported.loadError' | translate }}
          </p>
        } @else if (store.importedExams().length) {
          <app-imported-exam-list
            [exams]="store.importedExams()"
            (deleted)="store.openDeleteModal($event)" />
        } @else {
          <p class="text-body-secondary mb-0">{{ 'admin.imported.empty' | translate }}</p>
        }
      </div>
    </section>

    <app-modal
      [isOpen]="!!store.examToDelete()"
      [label]="'admin.imported.deleteTitle' | translate"
      (closed)="store.closeDeleteModal()">
      <ng-template>
        <app-confirm-content
          [title]="'admin.imported.deleteTitle' | translate"
          [message]="
            'admin.imported.deleteMessage' | translate: { name: store.examToDelete()?.name }
          "
          [isDanger]="true"
          (confirm)="store.deleteExam()"
          (cancelAction)="store.closeDeleteModal()" />
      </ng-template>
    </app-modal>
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

  constructor() {
    this.store.loadImported();
  }
}
