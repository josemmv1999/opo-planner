import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationType } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { Icon } from '../icon/icon';

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  success: 'check',
  error: 'warning',
  info: 'info',
};

@Component({
  selector: 'app-toast-container',
  imports: [TranslatePipe, Icon],
  host: { class: 'position-fixed top-0 end-0 d-flex flex-column gap-2 p-3' },
  template: `
    @for (region of regions(); track region.live) {
      <div class="d-flex flex-column gap-2" [attr.aria-live]="region.live">
        @for (notification of region.notifications; track notification.id) {
          <div
            class="toast-card card flex-row align-items-center gap-2 p-2"
            [class]="'toast-card--' + notification.type">
            <app-icon class="toast-card__icon" [name]="icons[notification.type]" />
            <span class="flex-grow-1">{{ notification.messageKey | translate }}</span>
            <button
              type="button"
              class="btn btn-link text-body d-flex align-items-center p-1"
              [title]="'notifications.close' | translate"
              (click)="notificationService.remove(notification.id)">
              <app-icon name="close" />
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      z-index: 1090;
      width: 22rem;
      max-width: 100%;
      pointer-events: none;
    }

    @media (max-width: 575.98px) {
      :host {
        width: 100%;
      }
    }

    .toast-card {
      --op-card-shadow-offset: 0.25rem;
      pointer-events: auto;
    }

    .toast-card--success {
      --op-card-shadow-color: var(--bs-success);
    }

    .toast-card--error {
      --op-card-shadow-color: var(--bs-danger);
    }

    .toast-card--info {
      --op-card-shadow-color: var(--bs-info);
    }

    .toast-card__icon {
      color: var(--op-card-shadow-color);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  protected readonly notificationService = inject(NotificationService);
  protected readonly icons = NOTIFICATION_ICONS;

  protected readonly regions = computed(() => {
    const notifications = this.notificationService.notifications();
    return [
      { live: 'assertive', notifications: notifications.filter(({ type }) => type === 'error') },
      { live: 'polite', notifications: notifications.filter(({ type }) => type !== 'error') },
    ];
  });
}
