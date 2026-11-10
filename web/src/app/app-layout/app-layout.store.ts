import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, switchMap, tap } from 'rxjs';
import { Opposition } from '../../common/models/opposition.model';
import { User } from '../../common/models/user.model';
import { AccountService } from '../services/account.service';
import { OppositionService } from '../services/opposition.service';

interface AppLayoutState {
  currentUser: User | null;
  activeOpposition: Opposition | null;
  isLoadingLayoutData: boolean;
  isAccountModalOpen: boolean;
  error: 'loading' | null;
}

export const AppLayoutStore = signalStore(
  withState<AppLayoutState>({
    currentUser: null,
    activeOpposition: null,
    isLoadingLayoutData: false,
    isAccountModalOpen: false,
    error: null,
  }),
  withMethods(
    (
      store,
      accountService = inject(AccountService),
      oppositionService = inject(OppositionService),
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
      openAccountModal(): void {
        patchState(store, { isAccountModalOpen: true });
      },
      closeAccountModal(): void {
        patchState(store, { isAccountModalOpen: false });
      },
    }),
  ),
);
