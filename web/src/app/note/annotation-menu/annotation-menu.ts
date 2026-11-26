import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import {
  HighlightColor,
  HighlightMark,
  HighlightStyle,
} from '../../../common/models/syllabus.model';
import { ColorPicker } from '../color-picker/color-picker';

@Component({
  selector: 'app-annotation-menu',
  imports: [ColorPicker, Icon, TranslatePipe],
  host: {
    class: 'annotation-menu d-flex flex-column',
    '(pointerdown)': '$event.preventDefault(); $event.stopPropagation()',
    '(click)': '$event.stopPropagation()',
  },
  template: `
    @if (comment()) {
      <button
        type="button"
        class="annotation-menu__comment text-start"
        [title]="'notes.menu.editComment' | translate"
        (click)="commented.emit()">
        {{ comment() }}
      </button>
    }
    <div
      class="d-flex align-items-center gap-1"
      role="toolbar"
      [attr.aria-label]="'notes.menu.label' | translate">
      <app-color-picker [value]="color()" (changed)="mark($event, markStyle() ?? 'highlight')" />
      <span class="annotation-menu__divider"></span>
      <button
        type="button"
        class="annotation-menu__action d-flex align-items-center justify-content-center"
        [class.annotation-menu__action--active]="markStyle() === 'underline'"
        [title]="'notes.menu.underline' | translate"
        [attr.aria-pressed]="markStyle() === 'underline'"
        (click)="
          mark(color() ?? 'yellow', markStyle() === 'underline' ? 'highlight' : 'underline')
        ">
        <app-icon name="underline" />
      </button>
      <button
        type="button"
        class="annotation-menu__action d-flex align-items-center justify-content-center"
        [title]="'notes.menu.comment' | translate"
        (click)="commented.emit()">
        <app-icon name="comment" />
      </button>
      <button
        type="button"
        class="annotation-menu__action d-flex align-items-center justify-content-center"
        [title]="'notes.menu.copy' | translate"
        (click)="copied.emit()">
        <app-icon name="copy" />
      </button>
      @if (markStyle()) {
        <button
          type="button"
          class="annotation-menu__action d-flex align-items-center justify-content-center text-danger"
          [title]="'notes.removeHighlight' | translate"
          (click)="deleted.emit()">
          <app-icon name="delete" />
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      gap: 0.25rem;
      max-width: min(22rem, 100vw - 2rem);
      padding: 0.375rem;
      color: var(--bs-white);
      background-color: var(--bs-dark);
      border-radius: 0.75rem;
      box-shadow: 0.25rem 0.25rem 0 rgba(var(--bs-dark-rgb), 0.18);
      user-select: none;
      -webkit-user-select: none;
    }

    .annotation-menu__comment {
      max-height: 4.5rem;
      overflow: hidden;
      padding: 0.25rem 0.375rem;
      font-size: 0.875rem;
      color: inherit;
      white-space: pre-line;
      background: none;
      border: 0;
    }

    .annotation-menu__divider {
      align-self: stretch;
      width: 1px;
      margin: 0 0.25rem;
      background-color: rgba(var(--bs-white-rgb), 0.25);
    }

    .annotation-menu__action {
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      color: inherit;
      background: none;
      border: 0;
      border-radius: 0.5rem;

      &:hover,
      &.annotation-menu__action--active {
        background-color: rgba(var(--bs-white-rgb), 0.15);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationMenu {
  readonly color = input<HighlightColor | null>(null);
  readonly markStyle = input<HighlightStyle | null>(null);
  readonly comment = input('');
  readonly marked = output<HighlightMark>();
  readonly commented = output();
  readonly copied = output();
  readonly deleted = output();

  protected mark(color: HighlightColor, style: HighlightStyle): void {
    this.marked.emit({ color, style });
  }
}
