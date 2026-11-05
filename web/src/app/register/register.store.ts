import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { AccountService } from '../services/account.service';
import { RegisterData } from '../../common/models/register-data.model';
import { NotificationService } from '../../common/services/notification.service';

interface RegisterState {
  isRegistering: boolean;
  hasRegistered: boolean;
  error: 'register' | null;
}

export const RegisterStore = signalStore(
  withState<RegisterState>({
    isRegistering: false,
    hasRegistered: false,
    error: null,
  }),
  withMethods(
    (
      store,
      accountService = inject(AccountService),
      notificationService = inject(NotificationService),
    ) => ({
      register: rxMethod<RegisterData>(
        pipe(
          tap(() => patchState(store, { isRegistering: true, error: null })),
          switchMap((data) =>
            accountService.register(data).pipe(
              tapResponse({
                next: () => {
                  notificationService.success('register.success');
                  patchState(store, { isRegistering: false, hasRegistered: true });
                },
                error: () => {
                  patchState(store, { isRegistering: false, error: 'register' });
                  notificationService.error('register.error');
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
