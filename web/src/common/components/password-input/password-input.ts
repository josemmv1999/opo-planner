import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../icon/icon';

let nextId = 0;

@Component({
  selector: 'app-password-input',
  imports: [ReactiveFormsModule, TranslatePipe, Icon],
  template: `
    <label class="form-label" [for]="id">{{ label() }}</label>
    <div class="input-group">
      <input
        class="form-control border-end-0"
        [class.is-invalid]="error()"
        [id]="id"
        [type]="isVisible() ? 'text' : 'password'"
        [formControl]="control()"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-invalid]="!!error()"
        [attr.aria-describedby]="error() ? messageId : null" />
      @let toggleLabel = (isVisible() ? 'passwordInput.hide' : 'passwordInput.show') | translate;
      <button
        type="button"
        class="input-group-text bg-white border-start-0 ms-0"
        [class.border-danger]="error()"
        [title]="toggleLabel"
        [attr.aria-label]="toggleLabel"
        [attr.aria-pressed]="isVisible()"
        [attr.aria-controls]="id"
        (click)="isVisible.set(!isVisible())">
        <app-icon [name]="isVisible() ? 'eye-off' : 'eye'" />
      </button>
    </div>
    @if (error()) {
      <div class="invalid-feedback" [id]="messageId" role="alert">{{ error() }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInput {
  readonly id = `app-password-input-${nextId++}`;
  readonly messageId = `${this.id}-msg`;

  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly error = input('');
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');

  protected readonly isVisible = signal(false);
}
