import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { FormatDatePipe } from '../../common/pipes/format-date.pipe';
import { NoteForm } from './note-form/note-form';
import { NoteStore } from './note.store';

const NEW_NOTE_ID = 'new';
const EMPTY_DRAFT = { title: '', content: '' };

const toObjectUrl = (dataUrl: string): string => {
  const [header, base64] = dataUrl.split(',');
  const type = /data:(.*?);/.exec(header)?.[1] ?? 'application/pdf';
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type }));
};

@Component({
  selector: 'app-note',
  imports: [RouterLink, TranslatePipe, Icon, FormatDatePipe, NoteForm],
  providers: [NoteStore],
  host: { class: 'd-flex flex-column gap-4' },
  template: `
    <a
      class="note__back d-inline-flex align-items-center align-self-start"
      [routerLink]="['/syllabus', topicId()]">
      <app-icon class="me-1" name="chevron-left" />
      {{ 'notes.back' | translate }}
    </a>

    @if (store.isLoading()) {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'notes.loading' | translate }}</span>
        </span>
      </div>
    } @else if (store.error() === 'loading') {
      <div class="alert alert-danger mb-0" role="alert">{{ 'notes.loadError' | translate }}</div>
    } @else if (pdfNote(); as note) {
      <section class="card card--yellow">
        <div class="card-body d-flex flex-column gap-3">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <div class="d-flex flex-column flex-grow-1 overflow-hidden">
              <h2 class="note__title mb-0 text-truncate">{{ note.title }}</h2>
              <span class="note__meta text-body-secondary">
                {{ 'notes.kind.pdf' | translate }} · {{ note.updatedAt | formatDate: 'd MMM' }}
              </span>
            </div>
            @if (pdfUrl(); as url) {
              <a
                class="btn btn-outline-primary btn-sm d-flex align-items-center"
                target="_blank"
                rel="noopener"
                [href]="url">
                <app-icon class="me-2" name="external" />
                {{ 'notes.openPdf' | translate }}
              </a>
            }
            <button
              type="button"
              class="btn btn-link link-danger text-decoration-none btn-sm"
              [class.is-loading]="store.isDeleting()"
              [disabled]="store.isDeleting()"
              (click)="store.delete()">
              {{ 'notes.delete' | translate }}
            </button>
          </div>
          @if (store.error() === 'deleting') {
            <p class="text-danger small fw-bold mb-0" role="alert">
              {{ 'notes.errors.deleting' | translate }}
            </p>
          }
          @if (safePdfUrl(); as url) {
            <iframe class="note__pdf" [src]="url" [title]="note.title"></iframe>
          }
        </div>
      </section>
    } @else {
      <section class="card card--yellow">
        <div class="card-body">
          <app-note-form
            [draft]="draft()"
            [isEditing]="store.note() !== null"
            [isSaving]="store.isSaving()"
            [isDeleting]="store.isDeleting()"
            [error]="formError()"
            (submitted)="store.save($event)"
            (deleted)="store.delete()" />
        </div>
      </section>
    }
  `,
  styles: `
    .note__back {
      font-size: 0.875rem;
      font-weight: 800;
      text-decoration: none;
    }

    .note__title {
      font-size: 1.25rem;
      font-weight: 900;
    }

    .note__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .note__pdf {
      width: 100%;
      height: 75vh;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Note {
  readonly topicId = input.required<string>();
  readonly noteId = input.required<string>();

  protected readonly store = inject(NoteStore);
  readonly #router = inject(Router);
  readonly #sanitizer = inject(DomSanitizer);

  protected readonly pdfNote = computed(() => {
    const note = this.store.note();
    return note?.kind === 'pdf' ? note : null;
  });
  protected readonly draft = computed(() => {
    const note = this.store.note();
    return note ? { title: note.title, content: note.content ?? '' } : EMPTY_DRAFT;
  });
  protected readonly formError = computed(() => {
    const error = this.store.error();
    return error === 'saving' || error === 'deleting' ? error : null;
  });
  protected readonly pdfUrl = computed(() => {
    const fileUrl = this.store.note()?.fileUrl;
    return fileUrl ? toObjectUrl(fileUrl) : null;
  });
  protected readonly safePdfUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.pdfUrl();
    return url ? this.#sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  constructor() {
    this.store.load(
      computed(() => ({
        topicId: Number(this.topicId()),
        noteId: this.noteId() === NEW_NOTE_ID ? null : Number(this.noteId()),
      })),
    );
    effect(() => {
      if (this.store.hasDeleted()) this.#router.navigate(['/syllabus', this.topicId()]);
    });
  }
}
