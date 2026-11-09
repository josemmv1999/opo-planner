import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-empty-state',
  imports: [TranslatePipe, Icon],
  host: { class: 'd-flex flex-column align-items-center text-center gap-2 py-5' },
  template: `
    <app-icon class="empty-state__icon text-primary" [name]="icon()" />
    <p class="text-body-secondary mb-0">{{ 'emptyState.message' | translate }}</p>
  `,
  styles: `
    .empty-state__icon {
      width: 3rem;
      height: 3rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly icon = input.required<string>();
}
