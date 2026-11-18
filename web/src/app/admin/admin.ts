import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';

@Component({
  selector: 'app-admin',
  imports: [TranslatePipe, Icon],
  template: `
    <section class="card card--teal">
      <div class="card-body d-flex flex-column gap-2">
        <span class="admin__badge d-inline-flex align-items-center align-self-start">
          <app-icon class="me-2" name="settings" />{{ 'admin.badge' | translate }}
        </span>
        <p class="mb-0">{{ 'admin.intro' | translate }}</p>
      </div>
    </section>
  `,
  styles: `
    .admin__badge {
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--bs-white);
      background-color: var(--bs-dark);
      border-radius: 50rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin {}
