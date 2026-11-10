import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, switchMap, tap } from 'rxjs';
import { Opposition } from '../../common/models/opposition.model';
import { ProfileData, User } from '../../common/models/user.model';
import { NotificationService } from '../../common/services/notification.service';
import { AccountService } from '../services/account.service';
import { OppositionService } from '../services/opposition.service';

interface AppLayoutState {
  currentUser: User | null;
  activeOpposition: Opposition | null;
  isLoadingLayoutData: boolean;
  isSavingUser: boolean;
  error: 'loading' | 'saving' | null;
}

export const AppLayoutStore = signalStore(
  withState<AppLayoutState>({
    currentUser: null,
    activeOpposition: null,
    isLoadingLayoutData: false,
    isSavingUser: false,
    error: null,
  }),
  withMethods(
    (
      store,
      accountService = inject(AccountService),
      oppositionService = inject(OppositionService),
      notificationService = inject(NotificationService),
    ) => ({
      loadLayoutData: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoadingLayoutData: true, error: null })),
          switchMap(() =>
            forkJoin({
              currentUser: accountService.getCurrentUser(),
              activeOpposition: oppositionService.getActiveOpposition(),
            }).pipe(
              tapResponse({
                next: ({ currentUser, activeOpposition }) =>
                  patchState(store, { currentUser, activeOpposition, isLoadingLayoutData: false }),
                error: () => patchState(store, { isLoadingLayoutData: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      updateUser: rxMethod<ProfileData>(
        pipe(
          tap(() => patchState(store, { isSavingUser: true, error: null })),
          switchMap((profile) =>
            accountService.updateProfile(profile).pipe(
              tapResponse({
                next: (saved) => {
                  patchState(store, ({ currentUser }) => ({
                    currentUser: currentUser && { ...currentUser, ...saved },
                    isSavingUser: false,
                  }));
                  notificationService.success('profile.saved');
                },
                error: () => patchState(store, { isSavingUser: false, error: 'saving' }),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
