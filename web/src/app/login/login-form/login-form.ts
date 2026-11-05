import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Credentials } from '../../../common/models/credentials.model';
import { InputField } from '../../../common/components/input/input';
import { Button } from '../../../common/components/button/button';
import { validationErrorKey } from '../../../common/utils/validation-error-key';
import { PasswordInput } from '../../../common/components/password-input/password-input';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, InputField, Button, PasswordInput],
  template: `
    <h1 class="h3 card-title">{{ 'login.title' | translate }}</h1>
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <app-input
        formControlName="email"
        type="email"
        [label]="'login.email' | translate"
        [placeholder]="'login.emailPlaceholder' | translate"
        [error]="errorKey(form.controls.email) | translate" />
      <app-password-input
        [control]="form.controls.password"
        [label]="'login.password' | translate"
        [error]="errorKey(form.controls.password) | translate" />

      @if (hasError()) {
        <div class="alert alert-danger mb-0" role="alert">{{ 'login.error' | translate }}</div>
      }

      <app-button type="submit" [isFullWidth]="true" [isDisabled]="form.invalid" [isLoading]="isLoggingIn()">
        {{ 'login.submit' | translate }}
      </app-button>
      <p class="text-center mb-0">
        {{ 'login.noAccount' | translate }}
        <a routerLink="/register">{{ 'login.goToRegister' | translate }}</a>
      </p>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  readonly #fb = inject(NonNullableFormBuilder);

  readonly isLoggingIn = input(false);
  readonly hasError = input(false);
  readonly submitted = output<Credentials>();

  protected readonly errorKey = validationErrorKey;
  protected readonly form = this.#fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    this.submitted.emit(this.form.getRawValue());
  }
}
