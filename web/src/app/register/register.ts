import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RegisterForm } from './register-form/register-form';
import { RegisterStore } from './register.store';

@Component({
  selector: 'app-register',
  imports: [RegisterForm],
  providers: [RegisterStore],
  template: `
    <app-register-form
      [isRegistering]="store.isRegistering()"
      [hasError]="store.error() === 'register'"
      (submitted)="store.register($event)" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  readonly #router = inject(Router);

  protected readonly store = inject(RegisterStore);

  constructor() {
    effect(() => this.store.hasRegistered() && this.#router.navigate(['/login']));
  }
}
