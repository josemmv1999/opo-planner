import { Injectable, signal } from '@angular/core';
import { AppNotification, NotificationType } from '../models/notification.model';

const AUTO_DISMISS_MS = 4000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly #notifications = signal<AppNotification[]>([]);
  #nextId = 0;

  readonly notifications = this.#notifications.asReadonly();

  success(messageKey: string): void {
    this.#add('success', messageKey);
  }

  error(messageKey: string): void {
    this.#add('error', messageKey);
  }

  info(messageKey: string): void {
    this.#add('info', messageKey);
  }

  remove(id: number): void {
    this.#notifications.update((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    );
  }

  #add(type: NotificationType, messageKey: string): void {
    const id = this.#nextId++;
    this.#notifications.update((notifications) => [...notifications, { id, type, messageKey }]);
    setTimeout(() => this.remove(id), AUTO_DISMISS_MS);
  }
}
