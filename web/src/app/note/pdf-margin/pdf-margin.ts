import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { MarginNote, MarginSide } from '../../../common/models/syllabus.model';

export interface MarginNoteGrab {
  id: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-pdf-margin',
  host: {
    class: 'pdf-margin',
    '[class.pdf-margin--left]': "side() === 'left'",
    '[attr.title]': 'hint()',
    '(click)': 'add($event)',
  },
  template: `
    @for (note of notes(); track note.id) {
      <button
        type="button"
        class="pdf-margin__note"
        [style.top.%]="note.y"
        [style.--note-color]="'var(--bs-' + note.color + ')'"
        [title]="note.text"
        (pointerdown)="grab($event, note.id)"
        (click)="open($event, note.id)">
        <span class="pdf-margin__text">{{ note.text }}</span>
      </button>
    }
  `,
  styles: `
    :host {
      position: relative;
      flex: 0 0 1.75rem;
      cursor: copy;

      @container (min-width: 56rem) {
        flex-basis: 10rem;
      }
    }

    .pdf-margin__note {
      position: absolute;
      left: 0.25rem;
      right: 0.25rem;
      padding: 0;
      text-align: start;
      background-color: var(--note-color);
      border: 2px solid var(--bs-dark);
      border-radius: 50%;
      aspect-ratio: 1;
      transform: translateY(-50%);
      cursor: grab;
      touch-action: none;

      @container (min-width: 56rem) {
        padding: 0.25rem 0.5rem;
        background-color: color-mix(in srgb, var(--note-color) 30%, var(--bs-white));
        border-width: 0 0 0 0.25rem;
        border-color: var(--note-color);
        border-radius: 0.25rem;
        aspect-ratio: auto;
        transform: none;
      }
    }

    .pdf-margin__text {
      display: none;

      @container (min-width: 56rem) {
        display: -webkit-box;
        overflow: hidden;
        font-size: 0.75rem;
        line-height: 1.3;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfMargin {
  readonly side = input.required<MarginSide>();
  readonly notes = input<MarginNote[]>([]);
  readonly hint = input('');
  readonly added = output<number>();
  readonly opened = output<number>();
  readonly grabbed = output<MarginNoteGrab>();

  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);

  protected grab(event: PointerEvent, id: number): void {
    event.preventDefault();
    this.grabbed.emit({ id, x: event.clientX, y: event.clientY });
  }

  protected add({ clientY }: MouseEvent): void {
    const { top, height } = this.#element.nativeElement.getBoundingClientRect();
    this.added.emit(Math.round(((clientY - top) / height) * 1000) / 10);
  }

  protected open(event: MouseEvent, noteId: number): void {
    event.stopPropagation();
    this.opened.emit(noteId);
  }
}
