import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HIGHLIGHT_COLORS, HighlightColor } from '../../../common/models/syllabus.model';

@Component({
  selector: 'app-color-picker',
  imports: [TranslatePipe],
  host: { class: 'd-flex align-items-center gap-1', role: 'radiogroup' },
  template: `
    @for (color of colors; track color) {
      <button
        type="button"
        role="radio"
        class="color-picker__swatch"
        [style.--swatch-color]="'var(--bs-' + color + ')'"
        [attr.aria-checked]="color === value()"
        [title]="'notes.colors.' + color | translate"
        [attr.aria-label]="'notes.colors.' + color | translate"
        (pointerdown)="$event.preventDefault()"
        (click)="changed.emit(color)"></button>
    }
  `,
  styles: `
    .color-picker__swatch {
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      background-color: var(--swatch-color);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.2);
      border-radius: 50%;

      &[aria-checked='true'] {
        border-color: var(--bs-dark);
        box-shadow: 0 0 0 2px var(--bs-white) inset;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPicker {
  readonly value = input.required<HighlightColor | null>();
  readonly changed = output<HighlightColor>();

  protected readonly colors = HIGHLIGHT_COLORS;
}
