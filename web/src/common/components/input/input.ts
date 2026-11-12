import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-input',
  template: `
    @if (label()) {
      <label class="form-label" [for]="id">
        {{ label() }}
        @if (required()) {
          <span aria-hidden="true">*</span>
        }
      </label>
    }

    <input
      class="form-control"
      [class.is-invalid]="hasError()"
      [id]="id"
      [type]="type()"
      [value]="value()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled() || disabled()"
      [readOnly]="readonly()"
      [required]="required()"
      [attr.autocomplete]="autocomplete()"
      [attr.aria-invalid]="hasError()"
      [attr.aria-describedby]="hasError() || hint() ? messageId : null"
      (input)="onInput($event)"
      (blur)="onBlur()" />

    @if (hasError()) {
      <div class="invalid-feedback" [id]="messageId" role="alert">{{ error() }}</div>
    } @else if (hint()) {
      <div class="form-text" [id]="messageId">{{ hint() }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputField), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputField implements ControlValueAccessor {
  readonly id = `app-input-${nextId++}`;
  readonly messageId = `${this.id}-msg`;

  readonly label = input('');
  readonly type = input<
    'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url' | 'date' | 'time'
  >('text');
  readonly placeholder = input('');
  readonly autocomplete = input<string | null>(null);
  readonly readonly = input(false);
  readonly required = input(false);
  readonly error = input('');
  readonly hint = input('');

  readonly value = model('');
  readonly disabled = input(false);
  protected readonly isDisabled = signal(false);
  protected readonly hasError = computed(() => this.error().length > 0);

  #onChange?: (value: string) => void;
  #onTouched?: () => void;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const { value } = event.target as HTMLInputElement;
    this.value.set(value);
    this.#onChange?.(value);
  }

  protected onBlur(): void {
    this.#onTouched?.();
  }
}
