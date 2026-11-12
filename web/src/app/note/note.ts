import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Button } from '../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { FormatDatePipe } from '../../common/pipes/format-date.pipe';
import { NoteForm } from './note-form/note-form';
import { NoteStore } from './note.store';
import { PdfPosition, PdfViewer } from './pdf-viewer/pdf-viewer';

const NEW_NOTE_ID = 'new';
const EMPTY_DRAFT = { title: '', content: '' };
const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = 1;

const toObjectUrl = (dataUrl: string): string => {
  const [header, base64] = dataUrl.split(',');
  const type = /data:(.*?);/.exec(header)?.[1] ?? 'application/octet-stream';
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type }));
};

@Component({
  selector: 'app-note',
  imports: [Button, RouterLink, TranslatePipe, Icon, FormatDatePipe, NoteForm, PdfViewer],
  providers: [NoteStore],
  host: { class: 'd-flex flex-column', '(document:click)': 'closeMenu($event)' },
  template: `
    <header class="note__bar d-flex align-items-center">
      <a
        class="note__back d-flex align-items-center"
        [routerLink]="['/syllabus', topicId()]"
        [title]="'notes.back' | translate">
        <app-icon name="chevron-left" />
        <span class="note__back-label">{{ 'notes.back' | translate }}</span>
      </a>

      @if (store.note(); as note) {
        <span class="note__kind" [class]="'note__kind--' + note.kind">
          {{ 'notes.kind.' + note.kind | translate }}
        </span>
        <span class="d-flex flex-column flex-grow-1 overflow-hidden">
          <strong class="text-truncate">{{ note.title }}</strong>
          <span class="note__meta text-body-secondary">
            {{ note.updatedAt | formatDate: 'd MMM yyyy' }}
          </span>
        </span>

        @if (note.kind === 'pdf') {
          <span class="note__zoom d-flex align-items-center">
            <button
              type="button"
              class="note__icon-button"
              [title]="'notes.zoomOut' | translate"
              [disabled]="zoomIndex() === 0"
              (click)="changeZoom(-1)">
              −
            </button>
            @if (position(); as position) {
              <span class="note__page">{{ 'notes.page' | translate: position }}</span>
            }
            <button
              type="button"
              class="note__icon-button"
              [title]="'notes.zoomIn' | translate"
              [disabled]="zoomIndex() === zoomLevels.length - 1"
              (click)="changeZoom(1)">
              +
            </button>
          </span>
        } @else if (note.kind === 'text' && !store.isEditing()) {
          <button
            app-button
            variant="outline-primary"
            size="sm"
            type="button"
            (click)="store.startEditing()"
            icon="edit">
            {{ 'notes.edit' | translate }}
          </button>
        }

        <span class="note__menu">
          <button
            type="button"
            class="note__icon-button"
            aria-haspopup="true"
            [attr.aria-expanded]="isMenuOpen()"
            [title]="'notes.more' | translate"
            (click)="isMenuOpen.set(!isMenuOpen())">
            ⋯
          </button>
          @if (isMenuOpen()) {
            <span class="note__menu-list d-flex flex-column" role="menu">
              @if (fileUrl(); as url) {
                <a role="menuitem" [href]="url" [download]="note.title">
                  <app-icon name="download" />
                  {{ 'notes.download' | translate }}
                </a>
                <a role="menuitem" [href]="url" target="_blank" rel="noopener">
                  <app-icon name="external" />
                  {{ 'notes.openTab' | translate }}
                </a>
              }
              <button
                type="button"
                role="menuitem"
                class="text-danger"
                [disabled]="store.isDeleting()"
                (click)="store.delete()">
                <app-icon name="delete" />
                {{ 'notes.delete' | translate }}
              </button>
            </span>
          }
        </span>
      } @else if (!store.isLoading()) {
        <strong class="flex-grow-1">{{ 'notes.newTitle' | translate }}</strong>
      }
    </header>

    <main class="note__body">
      @if (store.isLoading()) {
        <div class="d-flex justify-content-center py-5">
          <span class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{{ 'notes.loading' | translate }}</span>
          </span>
        </div>
      } @else if (store.error() === 'loading') {
        <div class="alert alert-danger note__sheet" role="alert">
          {{ 'notes.loadError' | translate }}
        </div>
      } @else if (store.isEditing()) {
        <section class="note__sheet card">
          <div class="card-body">
            <app-note-form
              [draft]="draft()"
              [isEditing]="store.note() !== null"
              [isSaving]="store.isSaving()"
              [isDeleting]="store.isDeleting()"
              [error]="formError()"
              (submitted)="store.save($event)"
              (deleted)="store.delete()"
              (cancelled)="cancel()" />
          </div>
        </section>
      } @else if (store.note(); as note) {
        @if (store.error() === 'deleting') {
          <div class="alert alert-danger note__sheet" role="alert">
            {{ 'notes.errors.deleting' | translate }}
          </div>
        }
        @switch (note.kind) {
          @case ('pdf') {
            @if (note.fileUrl; as src) {
              <app-pdf-viewer
                [src]="src"
                [zoom]="zoomLevels[zoomIndex()]"
                [initialPage]="store.initialPage()"
                (positionChanged)="onPosition($event)" />
            }
          }
          @case ('image') {
            <div class="d-flex justify-content-center">
              <img class="note__image" [src]="safeFileUrl()" [alt]="note.title" />
            </div>
          }
          @default {
            <article class="note__sheet note__text" [innerHTML]="note.content"></article>
          }
        }
      }
    </main>

    @if (neighbours(); as neighbours) {
      <footer class="note__pager d-flex align-items-center justify-content-between">
        @if (neighbours.previous; as previous) {
          <a
            class="note__step d-flex align-items-center"
            [routerLink]="['/syllabus', topicId(), 'notes', previous.id]"
            [title]="'notes.previous' | translate: previous">
            <app-icon name="chevron-left" />
            <span class="text-truncate">{{ previous.title }}</span>
          </a>
        } @else {
          <span></span>
        }
        <span class="note__meta text-body-secondary">
          {{
            'notes.position' | translate: { current: neighbours.current, total: neighbours.total }
          }}
        </span>
        @if (neighbours.next; as next) {
          <a
            class="note__step d-flex align-items-center justify-content-end"
            [routerLink]="['/syllabus', topicId(), 'notes', next.id]"
            [title]="'notes.next' | translate: next">
            <span class="text-truncate">{{ next.title }}</span>
            <app-icon name="chevron-right" />
          </a>
        } @else {
          <span></span>
        }
      </footer>
    }
  `,
  styles: `
    :host {
      height: 100dvh;
    }

    .note__bar {
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      background-color: var(--bs-light);
      border-bottom: 2px solid var(--bs-dark);
    }

    .note__back {
      gap: 0.25rem;
      font-size: 0.875rem;
      font-weight: 800;
      text-decoration: none;
    }

    .note__kind {
      padding: 0.125rem 0.5rem;
      font-size: 0.6875rem;
      font-weight: 900;
      text-transform: uppercase;
      border: 1.5px solid var(--bs-dark);
      border-radius: 0.375rem;
    }

    .note__kind--pdf {
      background-color: var(--bs-secondary);
    }

    .note__kind--image {
      background-color: var(--bs-info);
    }

    .note__kind--text {
      background-color: var(--bs-warning);
    }

    .note__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .note__zoom {
      gap: 0.25rem;
      padding: 0.125rem;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-pill);
    }

    .note__page {
      min-width: 7rem;
      font-size: 0.8125rem;
      font-weight: 800;
      text-align: center;
    }

    .note__icon-button {
      width: 2.25rem;
      height: 2.25rem;
      font-size: 1.125rem;
      font-weight: 900;
      background: none;
      border: 2px solid transparent;
      border-radius: var(--bs-border-radius);

      &:hover:not(:disabled) {
        background-color: var(--bs-white);
        border-color: var(--bs-dark);
      }
    }

    .note__menu {
      position: relative;
    }

    .note__menu-list {
      position: absolute;
      top: calc(100% + 0.375rem);
      right: 0;
      z-index: 10;
      min-width: 13rem;
      padding: 0.375rem;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius);
      box-shadow: 0.25rem 0.25rem 0 var(--bs-dark);

      :is(a, button) {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 0.5rem 0.625rem;
        font-weight: 800;
        color: var(--bs-body-color);
        text-align: left;
        text-decoration: none;
        background: none;
        border: 0;
        border-radius: 0.5rem;

        &:hover {
          background-color: rgba(var(--bs-primary-rgb), 0.08);
        }
      }

      .text-danger {
        color: var(--bs-danger);
      }
    }

    .note__body {
      flex: 1;
      min-height: 0;
      padding: 1.5rem 1rem;
      overflow: auto;
      background-color: var(--bs-light);
      background-image: linear-gradient(
        rgba(var(--bs-dark-rgb), 0.06),
        rgba(var(--bs-dark-rgb), 0.06)
      );
    }

    .note__sheet {
      max-width: 48rem;
      margin: 0 auto;
    }

    .note__text {
      padding: 2.5rem 3rem;
      font-size: 1.0625rem;
      line-height: 1.75;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: 1rem;
      box-shadow: 0.375rem 0.375rem 0 var(--bs-warning);

      @media (max-width: 40rem) {
        padding: 1.5rem 1.25rem;
      }
    }

    .note__image {
      max-width: 100%;
      border: 2px solid var(--bs-dark);
      border-radius: 0.5rem;
      box-shadow: 0.375rem 0.375rem 0 var(--bs-info);
    }

    .note__pager {
      gap: 1rem;
      padding: 0.5rem 1rem;
      background-color: var(--bs-light);
      border-top: 2px solid var(--bs-dark);
    }

    .note__step {
      gap: 0.5rem;
      max-width: 42%;
      font-weight: 800;
      text-decoration: none;
    }

    @media (max-width: 40rem) {
      .note__back-label,
      .note__page {
        display: none;
      }
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

  protected readonly zoomLevels = ZOOM_LEVELS;
  protected readonly zoomIndex = signal(DEFAULT_ZOOM_INDEX);
  protected readonly position = signal<PdfPosition | null>(null);
  protected readonly isMenuOpen = signal(false);

  protected readonly draft = computed(() => {
    const note = this.store.note();
    return note ? { title: note.title, content: note.content ?? '' } : EMPTY_DRAFT;
  });
  protected readonly formError = computed(() => {
    const error = this.store.error();
    return error === 'saving' || error === 'deleting' ? error : null;
  });
  protected readonly fileUrl = computed(() => {
    const fileUrl = this.store.note()?.fileUrl;
    return fileUrl ? toObjectUrl(fileUrl) : null;
  });
  protected readonly safeFileUrl = computed(() => {
    const url = this.fileUrl();
    return url ? this.#sanitizer.bypassSecurityTrustUrl(url) : null;
  });
  protected readonly neighbours = computed(() => {
    const siblings = this.store.siblings();
    const index = siblings.findIndex(({ id }) => id === this.store.note()?.id);
    if (index === -1 || siblings.length < 2) return null;
    return {
      previous: siblings[index - 1] ?? null,
      next: siblings[index + 1] ?? null,
      current: index + 1,
      total: siblings.length,
    };
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

  protected closeMenu(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.note__menu')) this.isMenuOpen.set(false);
  }

  protected changeZoom(step: number): void {
    this.zoomIndex.update((index) => index + step);
  }

  protected onPosition(position: PdfPosition): void {
    this.position.set(position);
    this.store.rememberPage(position.page);
  }

  protected cancel(): void {
    if (this.store.note()) this.store.cancelEditing();
    else this.#router.navigate(['/syllabus', this.topicId()]);
  }
}
