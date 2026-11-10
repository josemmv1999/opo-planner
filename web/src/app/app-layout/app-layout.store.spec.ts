import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileData, User } from '../../common/models/user.model';
import { NotificationService } from '../../common/services/notification.service';
import { AccountService } from '../services/account.service';
import { OppositionService } from '../services/opposition.service';
import { AppLayoutStore } from './app-layout.store';

const USER: User = {
  name: 'Alba',
  surname: 'Ruiz',
  email: 'alba@example.com',
  hasCompletedOnboarding: true,
};
const PROFILE: ProfileData = { name: 'Alba María', surname: 'Ruiz', email: 'alba@example.com' };

describe('AppLayoutStore', () => {
  let store: InstanceType<typeof AppLayoutStore>;
  const updateProfile = vi.fn((profile: ProfileData) => of(profile));
  const success = vi.fn();

  beforeEach(() => {
    updateProfile.mockClear();
    success.mockClear();
    TestBed.configureTestingModule({
      providers: [
        AppLayoutStore,
        { provide: AccountService, useValue: { getCurrentUser: () => of(USER), updateProfile } },
        {
          provide: OppositionService,
          useValue: {
            getActiveOpposition: () => of({ id: 'age-c2', abbreviation: 'C2', name: 'AGE' }),
          },
        },
        { provide: NotificationService, useValue: { success } },
      ],
    });
    store = TestBed.inject(AppLayoutStore);
    store.loadLayoutData();
  });

  it('updates the current user and confirms it', () => {
    store.updateUser(PROFILE);
    expect(store.currentUser()).toEqual({ ...USER, name: 'Alba María' });
    expect(store.isSavingUser()).toBe(false);
    expect(success).toHaveBeenCalledWith('profile.saved');
  });

  it('keeps the user and flags the error when saving fails', () => {
    updateProfile.mockReturnValueOnce(throwError(() => new Error('down')));
    store.updateUser(PROFILE);
    expect(store.currentUser()).toEqual(USER);
    expect(store.error()).toBe('saving');
  });
});
