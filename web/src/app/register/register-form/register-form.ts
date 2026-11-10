import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import { InputField } from '../../../common/components/input/input';
import { RegisterData } from '../../../common/models/register-data.model';
import { passwordValidator } from '../../../common/utils/password.validator';
import { validationErrorKey } from '../../../common/utils/validation-error-key';
import { PasswordInput } from '../../../common/components/password-input/password-input';

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, InputField, Button, PasswordInput],
  template: `
    <h1 class="h3 card-title">{{ 'register.title' | translate }}</h1>
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <div class="row g-3">
        <app-input
          class="col-sm-6"
          formControlName="name"
          autocomplete="given-name"
          [label]="'register.name' | translate"
          [error]="errorKey(form.controls.name) | translate" />
        <app-input
          class="col-sm-6"
          formControlName="surname"
          autocomplete="family-name"
          [label]="'register.surname' | translate"
          [error]="errorKey(form.controls.surname) | translate" />
      </div>
      <app-input
        formControlName="email"
        type="email"
        autocomplete="email"
        [label]="'register.email' | translate"
        [placeholder]="'register.emailPlaceholder' | translate"
        [error]="errorKey(form.controls.email) | translate" />
      <app-password-input
        [control]="form.controls.password"
        autocomplete="new-password"
        [label]="'register.password' | translate"
        [error]="errorKey(form.controls.password) | translate" />
      <!-- TODO: Modularize this part of the code, this can be an standalone component too -->
      @if (error() === 'register') {
        <span class="mb-0 text-danger fs-7">
          {{ 'register.error' | translate }}
        </span>
      }
      <app-button type="submit" [isFullWidth]="true" [isLoading]="isRegistering()">
        {{ 'register.submit' | translate }}
      </app-button>
      <span class="text-center mb-0">
        {{ 'register.hasAccount' | translate }}
        <a routerLink="/login">{{ 'register.goToLogin' | translate }}</a>
      </span>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterForm {
  readonly #fb = inject(NonNullableFormBuilder);

  readonly isRegistering = input(false);
  readonly submitted = output<RegisterData>();
  readonly error = input<'register' | null>(null);

  protected readonly errorKey = validationErrorKey;
  protected readonly form = this.#fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordValidator]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
