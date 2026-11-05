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
      (submitted)="store.login($event)"
      [error]="store.error()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly store = inject(LoginStore);
}
