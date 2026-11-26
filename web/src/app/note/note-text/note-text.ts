import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '../../../common/components/modal/modal';
import {
  HighlightChange,
  HighlightMark,
  PdfHighlight,
} from '../../../common/models/syllabus.model';
import {
  NOTE_MARK_SELECTOR,
  NoteMark,
  changeNoteMark,
  readNoteMark,
} from '../../../common/utils/note-marks';
import { AnnotationMenu } from '../annotation-menu/annotation-menu';
import { HighlightForm } from '../highlight-form/highlight-form';

interface TappedMark extends NoteMark {
  index: number;
  text: string;
  top: number;
  left: number;
}

@Component({
  selector: 'app-note-text',
  imports: [AnnotationMenu, HighlightForm, Modal, TranslatePipe],
  host: {
    class: 'note-text d-block',
    '(click)': 'openMark($event)',
    '(document:click)': 'closeOutside($event)',
  },
  template: `
    <div #text [innerHTML]="content()"></div>
    @if (tapped(); as shown) {
      <app-annotation-menu
        class="note-text__menu"
        [style.top.px]="shown.top"
        [style.left.px]="shown.left"
        [color]="shown.color"
        [markStyle]="shown.style"
        [comment]="shown.comment"
        (marked)="change($event)"
        (commented)="isCommenting.set(true)"
        (copied)="copy(shown.text)"
        (deleted)="remove()" />
    }

    <app-modal
      [isOpen]="isCommenting()"
      [label]="'notes.highlightTitle' | translate"
      (closed)="isCommenting.set(false)">
      <ng-template>
        @if (commentedMark(); as highlight) {
          <app-highlight-form
            [highlight]="highlight"
            (saved)="saveComment($event)"
            (deleted)="remove()"
            (cancelled)="isCommenting.set(false)" />
        }
      </ng-template>
    </app-modal>
  `,
  styles: `
    :host {
      position: relative;
    }

    .note-text__menu {
      position: absolute;
      z-index: 2;
      transform: translateY(calc(-100% - 0.5rem));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteText {
  readonly content = input.required<string>();
  readonly contentChanged = output<string>();

  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly text = viewChild.required<ElementRef<HTMLDivElement>>('text');
  protected readonly tapped = signal<TappedMark | null>(null);
  protected readonly isCommenting = signal(false);
  protected readonly commentedMark = computed((): PdfHighlight | null => {
    const mark = this.tapped();
    return mark
      ? {
          id: mark.index,
          page: 1,
          text: mark.text,
          rects: [],
          note: mark.comment,
          color: mark.color,
          style: mark.style,
        }
      : null;
  });

  protected openMark({ target }: MouseEvent): void {
    const element = (target as Element).closest(NOTE_MARK_SELECTOR);
    const container = this.text().nativeElement;
    if (!container.contains(target as Node)) return;
    if (!element) return this.tapped.set(null);
    const host = this.#element.nativeElement.getBoundingClientRect();
    const { top, left } = element.getBoundingClientRect();
    this.tapped.set({
      ...readNoteMark(element),
      index: [...container.querySelectorAll(NOTE_MARK_SELECTOR)].indexOf(element),
      text: element.textContent ?? '',
      top: top - host.top,
      left: Math.max(left - host.left, 0),
    });
  }

  protected closeOutside({ target }: MouseEvent): void {
    if (!this.#element.nativeElement.contains(target as Node)) this.tapped.set(null);
  }

  protected change(mark: HighlightMark): void {
    this.#save(mark);
  }

  protected saveComment({ note, color }: HighlightChange): void {
    this.#save({ comment: note, color });
  }

  protected copy(text: string): void {
    void navigator.clipboard?.writeText(text);
    this.tapped.set(null);
  }

  protected remove(): void {
    this.#save(null);
  }

  #save(change: Partial<NoteMark> | null): void {
    const index = this.tapped()?.index;
    this.tapped.set(null);
    this.isCommenting.set(false);
    if (index !== undefined)
      this.contentChanged.emit(changeNoteMark(this.content(), index, change));
  }
}
