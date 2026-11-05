import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a notification of each type', () => {
    service.success('success.key');
    service.error('error.key');
    service.info('info.key');

    expect(service.notifications().map(({ type, messageKey }) => ({ type, messageKey }))).toEqual([
      { type: 'success', messageKey: 'success.key' },
      { type: 'error', messageKey: 'error.key' },
      { type: 'info', messageKey: 'info.key' },
    ]);
  });

  it('removes only the requested notification', () => {
    service.success('first.key');
    service.success('second.key');

    service.remove(service.notifications()[0].id);

    expect(service.notifications().map(({ messageKey }) => messageKey)).toEqual(['second.key']);
  });

  it('removes a notification after 4 seconds', () => {
    service.info('info.key');

    vi.advanceTimersByTime(3999);
    expect(service.notifications()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(service.notifications()).toHaveLength(0);
  });

  it('keeps each notification on its own timer', () => {
    service.info('first.key');
    vi.advanceTimersByTime(2000);
    service.info('second.key');

    vi.advanceTimersByTime(2000);

    expect(service.notifications().map(({ messageKey }) => messageKey)).toEqual(['second.key']);
  });
});
