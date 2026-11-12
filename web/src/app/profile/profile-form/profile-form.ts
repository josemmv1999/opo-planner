import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { InputField } from '../../../common/components/input/input';
import { ProfileData } from '../../../common/models/user.model';
import { validationErrorKey } from '../../../common/utils/validation-error-key';

const NAME_MAX_LENGTH = 60;

@Component({
  selector: 'app-profile-form',
  imports: [Button, ReactiveFormsModule, TranslatePipe, InputField],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <div class="profile-form__names">
        <app-input
          formControlName="name"
          autocomplete="given-name"
          [label]="'profile.name' | translate"
          [required]="true"
          [error]="errorKey(form.controls.name) | translate" />
        <app-input
          formControlName="surname"
          autocomplete="family-name"
          [label]="'profile.surname' | translate"
          [required]="true"
          [error]="errorKey(form.controls.surname) | translate" />
      </div>
      <app-input
        formControlName="email"
        type="email"
        autocomplete="email"
        [label]="'profile.email' | translate"
        [required]="true"
        [error]="errorKey(form.controls.email) | translate" />
      @if (hasError()) {
        <p class="text-danger small fw-bold mb-0" role="alert">
          {{ 'profile.saveError' | translate }}
        </p>
      }
      <button
        app-button
        type="submit"
        class="align-self-start"
        [isLoading]="isSaving()"
        [disabled]="isSaving()">
        {{ 'actions.save' | translate }}
      </button>
    </form>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .profile-form__names {
      display: grid;
      gap: 1rem;

      @container (min-width: 30rem) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileForm implements OnInit {
  readonly #fb = inject(NonNullableFormBuilder);

  readonly profile = input.required<ProfileData>();
  readonly isSaving = input(false);
  readonly hasError = input(false);
  readonly submitted = output<ProfileData>();

  protected readonly errorKey = validationErrorKey;
  protected readonly form = this.#fb.group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    surname: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    effect(() => (this.isSaving() ? this.form.disable() : this.form.enable()));
  }

  ngOnInit(): void {
    this.form.setValue(this.profile());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, surname, email } = this.form.getRawValue();
    this.submitted.emit({ name: name.trim(), surname: surname.trim(), email: email.trim() });
  }
}
