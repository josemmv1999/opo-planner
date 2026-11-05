import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { AccountService } from '../services/account.service';
import { Credentials } from '../../common/models/credentials.model';
import { NotificationService } from '../../common/services/notification.service';

interface LoginState {
  isLoggingIn: boolean;
  hasLoggedIn: boolean;
  error: 'login' | null;
}

export const LoginStore = signalStore(
  withState<LoginState>({
    isLoggingIn: false,
    hasLoggedIn: false,
    error: null,
  }),
  withMethods(
    (
      store,
      accountService = inject(AccountService),
      notificationService = inject(NotificationService),
    ) => ({
      login: rxMethod<Credentials>(
        pipe(
          tap(() => patchState(store, { isLoggingIn: true, error: null })),
          switchMap((credentials) =>
            accountService.getToken(credentials).pipe(
              tapResponse({
                next: () => {
                  patchState(store, { isLoggingIn: false, hasLoggedIn: true });
                },
                error: () => {
                  patchState(store, { isLoggingIn: false, error: 'login' });
                  notificationService.error('login.error');
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
