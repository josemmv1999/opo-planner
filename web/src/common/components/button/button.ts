import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'button[app-button]',
  imports: [Icon],
  host: {
    '[class]': "'btn btn-' + variant() + (size() ? ' btn-' + size() : '')",
    '[class.d-flex]': 'icon()',
    '[class.align-items-center]': 'icon()',
    '[class.justify-content-center]': 'isIconOnly()',
    '[class.is-loading]': 'isLoading()',
    '[attr.aria-busy]': 'isLoading()',
  },
  template: `
    @if (icon(); as icon) {
      <app-icon [class.me-2]="!isIconOnly()" [name]="icon" />
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'light'
    | 'outline-primary'
    | 'outline-secondary'
    | 'outline-danger'
    | 'link'
  >('primary');
  readonly size = input<'sm' | 'lg' | null>(null);
  readonly icon = input<string | null>(null);
  readonly isIconOnly = input(false);
  readonly isLoading = input(false);
}
