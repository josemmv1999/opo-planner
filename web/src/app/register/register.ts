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
      (submitted)="store.register($event)"
      [error]="store.error()" />
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
