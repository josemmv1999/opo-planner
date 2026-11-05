import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoginForm } from './login-form/login-form';
import { LoginStore } from './login.store';

@Component({
  selector: 'app-login',
  imports: [LoginForm],
  providers: [LoginStore],
  template: `
    <app-login-form
      [isLoggingIn]="store.isLoggingIn()"
      [hasError]="store.error() === 'login'"
      (submitted)="store.login($event)" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly store = inject(LoginStore);
}
