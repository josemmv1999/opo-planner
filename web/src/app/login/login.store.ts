import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { AccountService } from '../services/account.service';
import { Credentials } from '../../common/models/credentials.model';
import { User } from '../../common/models/user.model';
import { NotificationService } from '../../common/services/notification.service';
import { SessionService } from '../../common/services/session.service';

interface LoginState {
  currentUser: User | null;
  isLoggingIn: boolean;
  hasLoggedIn: boolean;
  error: 'login' | null;
}

export const LoginStore = signalStore(
  withState<LoginState>({
    currentUser: null,
    isLoggingIn: false,
    hasLoggedIn: false,
    error: null,
  }),
  withMethods(
    (
      store,
      accountService = inject(AccountService),
      notificationService = inject(NotificationService),
      session = inject(SessionService),
    ) => ({
      login: rxMethod<Credentials>(
        pipe(
          tap(() => patchState(store, { isLoggingIn: true, error: null })),
          switchMap((credentials) =>
            accountService.getToken(credentials).pipe(
              tap((token) => session.start(token)),
              switchMap(() => accountService.getCurrentUser()),
              tapResponse({
                next: (currentUser) => {
                  patchState(store, { currentUser, isLoggingIn: false, hasLoggedIn: true });
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
