import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { PercentPipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Button } from '../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { ERASER_WIDTHS, INK_WIDTHS } from '../../common/models/syllabus.model';
import { FormatDatePipe } from '../../common/pipes/format-date.pipe';
import { Modal } from '../../common/components/modal/modal';
import { HighlightForm } from './highlight-form/highlight-form';
import { MarginNoteForm } from './margin-note-form/margin-note-form';
import { NoteForm } from './note-form/note-form';
import { NoteText } from './note-text/note-text';
import { NoteStore } from './note.store';
import { PdfPosition, PdfViewer } from './pdf-viewer/pdf-viewer';

const NEW_NOTE_ID = 'new';
const EMPTY_DRAFT = { title: '', content: '' };
const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM_INDEX = 1;

@Component({
  selector: 'app-note',
  imports: [
    Button,
    RouterLink,
    TranslatePipe,
    Icon,
    FormatDatePipe,
    NoteForm,
    NoteText,
    PdfViewer,
    Modal,
    HighlightForm,
    MarginNoteForm,
    PercentPipe,
  ],
  providers: [NoteStore],
  host: { class: 'd-flex flex-column', '(document:click)': 'closeMenu($event)' },
  template: `
    <header class="note__bar d-flex align-items-center">
      <a
        class="note__back touch-target d-flex align-items-center"
        [routerLink]="['/syllabus', topicId()]"
        [title]="'notes.back' | translate">
        <app-icon name="chevron-left" />
        <span class="note__back-label">{{ 'notes.back' | translate }}</span>
      </a>

      @if (store.note(); as note) {
        <span class="note__kind" [class]="'note__kind--' + note.kind">
          {{ 'notes.kind.' + note.kind | translate }}
        </span>
        <span class="note__title d-flex flex-column flex-grow-1 overflow-hidden">
          <strong class="note__title-text">{{ note.title }}</strong>
          <span class="note__meta text-body-secondary">
            {{ note.updatedAt | formatDate: 'd MMM yyyy' }}
          </span>
        </span>

        @if (note.kind === 'pdf') {
          <span class="note__tools d-flex flex-wrap align-items-center">
            @if (position(); as position) {
              <span class="note__page">{{ 'notes.page' | translate: position }}</span>
            }
            <span class="note__zoom d-flex align-items-center">
              <button
                type="button"
                class="note__icon-button d-flex align-items-center justify-content-center"
                [class.note__icon-button--active]="store.inkMode() === 'draw'"
                [attr.aria-pressed]="store.inkMode() === 'draw'"
                [title]="'notes.draw' | translate"
                (click)="store.toggleInkMode('draw')">
                <app-icon name="pen" />
              </button>
              <button
                type="button"
                class="note__icon-button d-flex align-items-center justify-content-center"
                [class.note__icon-button--active]="store.inkMode() === 'erase'"
                [attr.aria-pressed]="store.inkMode() === 'erase'"
                [title]="'notes.erase' | translate"
                (click)="store.toggleInkMode('erase')">
                <app-icon name="eraser" />
              </button>
              @if (store.inkMode() !== 'off') {
                <span #widthMenu class="note__menu">
                  <button
                    type="button"
                    class="note__icon-button d-flex align-items-center justify-content-center"
                    aria-haspopup="true"
                    [attr.aria-expanded]="isWidthMenuOpen()"
                    [title]="'notes.width' | translate"
                    (click)="isWidthMenuOpen.set(!isWidthMenuOpen())">
                    <span class="note__width-dot" [style.--dot-size]="toolWidthIndex()"></span>
                  </button>
                  @if (isWidthMenuOpen()) {
                    <span class="note__menu-list d-flex flex-column" role="menu">
                      @for (width of toolWidths(); track width; let index = $index) {
                        <button
                          type="button"
                          role="menuitemradio"
                          [attr.aria-checked]="width === toolWidth()"
                          (click)="chooseWidth(width)">
                          <span class="note__width-dot" [style.--dot-size]="index"></span>
                          {{ 'notes.widths.' + index | translate }}
                        </button>
                      }
                    </span>
                  }
                </span>
              }
            </span>
            <span class="note__zoom d-flex align-items-center">
              <button
                type="button"
                class="note__icon-button d-flex align-items-center justify-content-center"
                [title]="'notes.zoomOut' | translate"
                [disabled]="zoomIndex() === 0"
                (click)="changeZoom(-1)">
                <app-icon name="zoom-out" />
              </button>
              <span class="note__zoom-level">{{ zoomLevels[zoomIndex()] | percent }}</span>
              <button
                type="button"
                class="note__icon-button d-flex align-items-center justify-content-center"
                [title]="'notes.zoomIn' | translate"
                [disabled]="zoomIndex() === zoomLevels.length - 1"
                (click)="changeZoom(1)">
                <app-icon name="zoom-in" />
              </button>
            </span>
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

        <span #menu class="note__menu">
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
              @if (!store.isMaterial()) {
                <button
                  type="button"
                  role="menuitem"
                  class="text-danger"
                  [disabled]="store.isDeleting()"
                  (click)="store.delete()">
                  <app-icon name="delete" />
                  {{ 'notes.delete' | translate }}
                </button>
              }
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
                [highlights]="store.highlights()"
                (positionChanged)="onPosition($event)"
                (selected)="store.select($event)"
                (highlightOpened)="store.openHighlight($event)"
                (highlighted)="store.highlight($event)"
                (highlightChanged)="store.saveHighlight($event)"
                (highlightDeleted)="store.deleteHighlight($event)"
                [marginNotes]="store.marginNotes()"
                [marginHint]="'notes.addMarginNote' | translate"
                [editHint]="'notes.tapToEdit' | translate"
                (marginAdded)="store.startMarginNote($event)"
                (marginNoteOpened)="store.openMarginNote($event)"
                (marginNoteMoved)="store.moveMarginNote($event)"
                [inkStrokes]="store.inkStrokes()"
                [inkMode]="store.inkMode()"
                [inkWidth]="store.inkWidth()"
                [eraserWidth]="store.eraserWidth()"
                (inkDrawn)="store.addInkStroke($event)"
                (inkErased)="store.eraseInk($event)" />
            }
          }
          @case ('image') {
            <div class="d-flex justify-content-center">
              <img class="note__image" [src]="safeFileUrl()" [alt]="note.title" />
            </div>
          }
          @default {
            @if (store.isMaterial()) {
              <article class="note__sheet note__text" [innerHTML]="note.content"></article>
            } @else {
              <app-note-text
                class="note__sheet note__text"
                [content]="note.content ?? ''"
                (contentChanged)="store.save({ title: note.title, content: $event })" />
            }
          }
        }
      }
    </main>

    @if (neighbours(); as neighbours) {
      <footer class="note__pager d-flex align-items-center justify-content-between">
        @if (neighbours.previous; as previous) {
          <a
            class="note__step touch-target d-flex align-items-center"
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
            class="note__step touch-target d-flex align-items-center justify-content-end"
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

    <app-modal
      [isOpen]="store.openedHighlightId() !== null"
      [label]="'notes.highlightTitle' | translate"
      (closed)="store.closeHighlight()">
      <ng-template>
        @if (store.openedHighlight(); as highlight) {
          <app-highlight-form
            [highlight]="highlight"
            [isSaving]="store.isSavingHighlight()"
            [isDeleting]="store.isDeletingHighlight()"
            (saved)="store.saveHighlight({ id: highlight.id, ...$event })"
            (deleted)="store.deleteHighlight(highlight.id)"
            (cancelled)="store.closeHighlight()" />
        }
      </ng-template>
    </app-modal>

    <app-modal
      [isOpen]="store.isMarginFormOpen()"
      [label]="'notes.marginTitle' | translate"
      (closed)="store.closeMarginNote()">
      <ng-template>
        <app-margin-note-form
          [marginNote]="store.openedMarginNote()"
          [isSaving]="store.isSavingMarginNote()"
          [isDeleting]="store.isDeletingMarginNote()"
          (saved)="store.saveMarginNote($event)"
          (deleted)="store.deleteMarginNote()"
          (cancelled)="store.closeMarginNote()" />
      </ng-template>
    </app-modal>
  `,
  styles: `
    :host {
      height: 100dvh;
    }

    .note__bar {
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      background-color: var(--bs-light);
      border-bottom: 2px solid var(--bs-dark);
    }

    .note__title {
      flex-basis: 8rem;
    }

    .note__title-text {
      display: -webkit-box;
      overflow: hidden;
      overflow-wrap: anywhere;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .note__tools {
      gap: 0.75rem;
    }

    .note__back {
      gap: 0.25rem;
      padding-inline: 0.75rem;
      margin-inline: -0.75rem;
      font-size: 0.875rem;
      font-weight: 800;
      text-decoration: none;
    }

    .note__kind {
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
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

    .note__zoom-level {
      min-width: 3rem;
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

    .note__icon-button--active,
    .note__icon-button--active:hover:not(:disabled) {
      color: var(--bs-white);
      background-color: var(--bs-dark);
      border-color: var(--bs-dark);
    }

    .note__menu {
      position: relative;
    }

    .note__width-dot {
      flex-shrink: 0;
      width: calc(0.375rem + var(--dot-size) * 0.3125rem);
      aspect-ratio: 1;
      background-color: currentColor;
      border-radius: 50%;
    }

    .note__menu-list [aria-checked='true'] {
      background-color: rgba(var(--bs-primary-rgb), 0.12);
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

    @media (max-width: 52rem) {
      .note__tools {
        order: 1;
        flex-basis: 100%;
        justify-content: space-between;
      }
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
  readonly noteId = input<string>();
  readonly materialId = input<string>();

  protected readonly store = inject(NoteStore);
  readonly #router = inject(Router);
  readonly #sanitizer = inject(DomSanitizer);

  protected readonly zoomLevels = ZOOM_LEVELS;
  protected readonly zoomIndex = signal(DEFAULT_ZOOM_INDEX);
  protected readonly position = signal<PdfPosition | null>(null);
  protected readonly isMenuOpen = signal(false);
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');
  protected readonly isWidthMenuOpen = signal(false);
  private readonly widthMenu = viewChild<ElementRef<HTMLElement>>('widthMenu');
  protected readonly toolWidths = computed(() =>
    this.store.inkMode() === 'erase' ? ERASER_WIDTHS : INK_WIDTHS,
  );
  protected readonly toolWidth = computed(() =>
    this.store.inkMode() === 'erase' ? this.store.eraserWidth() : this.store.inkWidth(),
  );
  protected readonly toolWidthIndex = computed(() => this.toolWidths().indexOf(this.toolWidth()));

  protected readonly draft = computed(() => {
    const note = this.store.note();
    return note ? { title: note.title, content: note.content ?? '' } : EMPTY_DRAFT;
  });
  protected readonly formError = computed(() => {
    const error = this.store.error();
    return error === 'saving' || error === 'deleting' ? error : null;
  });
  protected readonly fileUrl = computed(() => this.store.note()?.fileUrl ?? null);
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
        materialId: this.materialId() === undefined ? undefined : Number(this.materialId()),
      })),
    );
    effect(() => {
      if (this.store.hasDeleted()) this.#router.navigate(['/syllabus', this.topicId()]);
    });
  }

  protected closeMenu(event: MouseEvent): void {
    const target = event.target as Node;
    if (!this.menu()?.nativeElement.contains(target)) this.isMenuOpen.set(false);
    if (!this.widthMenu()?.nativeElement.contains(target)) this.isWidthMenuOpen.set(false);
  }

  protected chooseWidth(width: number): void {
    this.store.setToolWidth(width);
    this.isWidthMenuOpen.set(false);
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
