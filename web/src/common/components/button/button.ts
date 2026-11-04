import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `
    <button
      [class]="'btn btn-' + variant()"
      [class.w-100]="isFullWidth()"
      [type]="type()"
      [disabled]="isDisabled() || isLoading()"
      [attr.aria-busy]="isLoading()">
      @if (isLoading()) {
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<
    'primary' | 'secondary' | 'danger' | 'outline-primary' | 'outline-secondary' | 'link'
  >('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly isDisabled = input(false);
  readonly isLoading = input(false);
  readonly isFullWidth = input(false);
}
