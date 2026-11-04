import { computed, inject, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { AccountService } from '../services/account.service';
import { Credentials } from '../pages/login/models/credentials.model';
import { LocalStorageService } from 'src/app/shared/services/local-storage.service';
import { NotificationsService } from 's1m-angular-bootstrap-lib';
import { TranslateService } from '@ngx-translate/core';
import { AccessEventsService } from '../services/access-events.service';
import { LanguageService } from '../services/language.service'; // Asumiendo que existe
import { BsLocalService } from '../services/bs-local.service'; // Asumiendo que existe
import { CurrentUser } from '../models/current-user.model'; // Asumiendo que existe
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, switchMap, catchError, EMPTY, tap, pipe } from 'rxjs';

export const LoginStore = signalStore(
  { providedIn: 'root' },
  withState(() => ({
    credentials: null as Credentials | null,
    currentUser: null as CurrentUser | null,
    isLoggingIn: false,
    loginError: null as string | null,
    loginSuccess: false,
  })),
  withMethods((store) => {
    const accountService = inject(AccountService);
    const localStorage = inject(LocalStorageService);
    const toast = inject(NotificationsService);
    const translate = inject(TranslateService);
    const events = inject(AccessEventsService);
    const languageService = inject(LanguageService);
    const bsLocalService = inject(BsLocalService);

    // Lógica para configurar el idioma después del login exitoso
    const configureUserLanguage = (currentUser: CurrentUser) => {
      if (currentUser.languageId) {
        languageService
          .getLanguages()
          .pipe(map((languages) => languages.find((l) => l.id === currentUser.languageId)))
          .subscribe({
            next: (lang) => {
              if (lang) {
                const newLanguage = lang.name.toLowerCase();
                translate.use(newLanguage);
                localStorage.language = newLanguage;
                bsLocalService.use(newLanguage);
              } else {
                // Fallback si no se encuentra el idioma
                setDefaultLanguage();
              }
            },
            error: (error) => {
              console.error('Error loading languages:', error);
              setDefaultLanguage();
            },
          });
      } else {
        setDefaultLanguage();
      }
    };

    const setDefaultLanguage = () => {
      localStorage.language = environment.language;
      bsLocalService.use(environment.language);
      translate.use(environment.language);
    };

    // Computed para el estado del login
    const loginStatus = computed(() => {
      const isLogging = store.isLoggingIn();
      const user = store.currentUser();
      const error = store.loginError();
      const success = store.loginSuccess();

      return {
        isLoading: isLogging,
        isSuccess: success && !!user,
        isError: !isLogging && !!error,
        isIdle: !isLogging && !user && !error && !success,
      };
    });

    // Método reactivo para manejar el login usando rxMethod
    const login = rxMethod<Credentials>(
      pipe(
        tap(() => {
          store.isLoggingIn.set(true);
          store.loginError.set(null);
          store.loginSuccess.set(false);
        }),
        switchMap((credentials) =>
          accountService.getToken(credentials).pipe(
            switchMap((token) => {
              // Guardar token y disparar evento
              localStorage.token = token;
              events.login();

              // Obtener información del usuario
              return accountService.getCurrentUserInfo();
            }),
            tap((currentUser: CurrentUser) => {
              store.currentUser.set(currentUser);
              configureUserLanguage(currentUser);
              store.isLoggingIn.set(false);
              store.loginSuccess.set(true);
            }),
            catchError((error: HttpErrorResponse) => {
              store.isLoggingIn.set(false);

              // Determinar si es error de login o de obtención de user info
              const isLoginError = !localStorage.token;

              if (isLoginError) {
                const errorMessage = translate.instant('login.wrongUserOrPass');
                const errorTitle = translate.instant('login.invalidCredentials');
                store.loginError.set(errorMessage);
                toast.addError(errorMessage, errorTitle);
              } else {
                store.loginError.set('Error fetching user info');
                console.error('Error fetching user info:', error);
              }

              return EMPTY;
            }),
          ),
        ),
      ),
    );

    return {
      // Método público para disparar el login
      login,

      // Método para limpiar el estado de error
      clearError: () => {
        store.loginError.set(null);
      },

      // Método para limpiar todo el estado
      reset: () => {
        store.currentUser.set(null);
        store.isLoggingIn.set(false);
        store.loginError.set(null);
        store.loginSuccess.set(false);
      },

      // Estado computado del login
      loginStatus,

      // Selectores individuales para facilitar el uso
      isLoggingIn: store.isLoggingIn.asReadonly(),
      currentUser: store.currentUser.asReadonly(),
      loginError: store.loginError.asReadonly(),
      loginSuccess: store.loginSuccess.asReadonly(),
    };
  }),
);
