import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import type { PDFDocumentLoadingTask } from 'pdfjs-dist';
import { TopicNote } from '../../../common/models/syllabus.model';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';
import { startLoading } from '../../note/pdf-viewer/pdf-viewer';

@Component({
  selector: 'app-note-tile',
  imports: [RouterLink, TranslatePipe, FormatDatePipe],
  template: `
    <a
      class="note-tile d-flex flex-column h-100"
      [class]="'note-tile--' + note().kind"
      [routerLink]="['/syllabus', topicId(), 'notes', note().id]">
      <span class="note-tile__preview d-block">
        <span class="note-tile__kind">{{ 'notes.kind.' + note().kind | translate }}</span>
        @switch (note().kind) {
          @case ('pdf') {
            <span #pdfPreview class="d-block"></span>
          }
          @case ('image') {
            <img class="note-tile__image" [src]="note().preview" alt="" />
          }
          @default {
            <span class="note-tile__text d-block">{{ note().preview }}</span>
          }
        }
      </span>
      <span class="note-tile__body d-flex flex-column">
        <strong>{{ note().title }}</strong>
        <span class="note-tile__meta text-body-secondary">
          {{ note().updatedAt | formatDate: 'd MMM' }}
        </span>
      </span>
    </a>
  `,
  styles: `
    :host {
      display: block;
    }

    .note-tile {
      --note-kind: var(--bs-secondary);

      overflow: hidden;
      color: var(--bs-body-color);
      text-decoration: none;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: 1rem;
      box-shadow: 0.3125rem 0.3125rem 0 var(--note-kind);
      transition:
        transform 0.12s,
        box-shadow 0.12s;

      &:hover {
        transform: translate(-2px, -2px);
        box-shadow: 0.4375rem 0.4375rem 0 var(--note-kind);
      }
    }

    .note-tile--image {
      --note-kind: var(--bs-info);
    }

    .note-tile--text {
      --note-kind: var(--bs-warning);
    }

    .note-tile__preview {
      position: relative;
      height: 10rem;
      overflow: hidden;
      background-color: var(--bs-light);
      border-bottom: 2px solid var(--bs-dark);

      canvas {
        display: block;
        width: 100%;
        height: auto;
      }
    }

    .note-tile__kind {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 1;
      padding: 0.125rem 0.5rem;
      font-size: 0.6875rem;
      font-weight: 900;
      text-transform: uppercase;
      background-color: var(--note-kind);
      border: 1.5px solid var(--bs-dark);
      border-radius: 0.375rem;
    }

    .note-tile__image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .note-tile__text {
      padding: 2.25rem 1rem 1rem;
      font-size: 0.75rem;
      line-height: 1.5;
      color: var(--bs-secondary-color);
    }

    .note-tile__body {
      gap: 0.125rem;
      padding: 0.75rem 0.875rem;

      strong {
        font-weight: 900;
        line-height: 1.25;
      }
    }

    .note-tile__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteTile {
  readonly note = input.required<TopicNote>();
  readonly topicId = input.required<number>();

  private readonly pdfPreview = viewChild<ElementRef<HTMLElement>>('pdfPreview');
  #loadingTask: PDFDocumentLoadingTask | null = null;

  constructor() {
    afterNextRender(() => void this.#paintFirstPage());
    inject(DestroyRef).onDestroy(() => void this.#loadingTask?.destroy());
  }

  async #paintFirstPage(): Promise<void> {
    const container = this.pdfPreview()?.nativeElement;
    const src = this.note().preview;
    if (!container || !src) return;
    this.#loadingTask = await startLoading(src);
    const page = await (await this.#loadingTask.promise).getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({
      scale: (container.clientWidth / base.width) * devicePixelRatio,
    });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    container.replaceChildren(canvas);
    await page.render({ canvas, viewport }).promise;
  }
}
