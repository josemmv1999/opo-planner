import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OppositionOption } from '../../common/models/onboarding.model';
import { InterfaceModeService } from '../../common/services/interface-mode.service';
import { NotificationService } from '../../common/services/notification.service';
import { AccountService } from '../services/account.service';
import { OnboardingService } from '../services/onboarding.service';
import { OppositionService } from '../services/opposition.service';
import { ProfileStore } from './profile.store';

const CATALOG: OppositionOption[] = [
  { id: 'a', level: 'C1', name: 'A', body: 'Body' },
  { id: 'b', level: 'C2', name: 'B', body: 'Body' },
];

describe('ProfileStore', () => {
  let store: InstanceType<typeof ProfileStore>;
  const changePassword = vi.fn(() => of(undefined));

  beforeEach(() => {
    changePassword.mockClear();
    TestBed.configureTestingModule({
      providers: [
        ProfileStore,
        { provide: OnboardingService, useValue: { getOppositions: () => of(CATALOG) } },
        {
          provide: OppositionService,
          useValue: {
            getUserOppositionIds: () => of(['a']),
            addOppositions: (ids: string[]) => of(['a', ...ids]),
          },
        },
        { provide: AccountService, useValue: { changePassword } },
        { provide: NotificationService, useValue: { success: vi.fn() } },
        {
          provide: InterfaceModeService,
          useValue: { mode: () => null, detectedMode: () => 'desktop' },
        },
      ],
    });
    store = TestBed.inject(ProfileStore);
    store.loadOppositions();
  });

  it('splits the user oppositions from the ones still available', () => {
    expect(store.oppositions().map(({ id }) => id)).toEqual(['a']);
    expect(store.availableOppositions().map(({ id }) => id)).toEqual(['b']);
  });

  it('adds the selected oppositions and closes the modal', () => {
    store.openAddModal();
    store.toggleSelection('b');
    store.addSelected();
    expect(store.oppositions().map(({ id }) => id)).toEqual(['a', 'b']);
    expect(store.isAddModalOpen()).toBe(false);
  });

  it('resets the password form after a change and flags a wrong password', () => {
    store.changePassword({ currentPassword: 'old', newPassword: 'New12345' });
    expect(store.passwordFormKey()).toBe(1);
    changePassword.mockReturnValueOnce(throwError(() => new Error('wrong')));
    store.changePassword({ currentPassword: 'bad', newPassword: 'New12345' });
    expect(store.error()).toBe('password');
  });
});
