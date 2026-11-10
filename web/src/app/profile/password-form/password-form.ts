import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PasswordInput } from '../../../common/components/password-input/password-input';
import { PasswordChange } from '../../../common/models/user.model';
import { passwordValidator } from '../../../common/utils/password.validator';
import { validationErrorKey } from '../../../common/utils/validation-error-key';

@Component({
  selector: 'app-password-form',
  imports: [ReactiveFormsModule, TranslatePipe, PasswordInput],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <app-password-input
        [control]="form.controls.currentPassword"
        [label]="'profile.currentPassword' | translate"
        [error]="errorKey(form.controls.currentPassword) | translate" />
      <app-password-input
        [control]="form.controls.newPassword"
        autocomplete="new-password"
        [label]="'profile.newPassword' | translate"
        [error]="errorKey(form.controls.newPassword) | translate" />
      @if (hasError()) {
        <p class="text-danger small fw-bold mb-0" role="alert">
          {{ 'profile.passwordError' | translate }}
        </p>
      }
      <button
        type="submit"
        class="btn btn-outline-primary align-self-start"
        [class.is-loading]="isSaving()"
        [disabled]="isSaving()">
        {{ 'profile.changePassword' | translate }}
      </button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordForm {
  readonly #fb = inject(NonNullableFormBuilder);

  readonly isSaving = input(false);
  readonly hasError = input(false);
  readonly submitted = output<PasswordChange>();

  protected readonly errorKey = validationErrorKey;
  protected readonly form = this.#fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, passwordValidator]],
  });

  constructor() {
    effect(() => (this.isSaving() ? this.form.disable() : this.form.enable()));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
