import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginForm } from './login-form/login-form';
import { LoginStore } from './login.store';

@Component({
  selector: 'app-login',
  imports: [LoginForm],
  providers: [LoginStore],
  template: `
    <app-login-form
      [isLoggingIn]="store.isLoggingIn()"
      (submitted)="store.login($event)"
      [error]="store.error()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly store = inject(LoginStore);
  readonly #router = inject(Router);

  constructor() {
    effect(() => {
      const currentUser = this.store.currentUser();
      if (this.store.hasLoggedIn() && currentUser) {
        this.#router.navigate([currentUser.hasCompletedOnboarding ? '/home' : '/onboarding']);
      }
    });
  }
}
