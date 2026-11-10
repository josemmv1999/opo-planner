import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  SecurityContext,
  afterRenderEffect,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';

interface FormatAction {
  command: string;
  value?: string;
  labelKey: string;
  text: string;
}

const FORMAT_ACTIONS: FormatAction[] = [
  { command: 'bold', labelKey: 'notes.editor.bold', text: 'B' },
  { command: 'italic', labelKey: 'notes.editor.italic', text: 'I' },
  { command: 'formatBlock', value: 'h2', labelKey: 'notes.editor.heading', text: 'T' },
  { command: 'formatBlock', value: 'p', labelKey: 'notes.editor.paragraph', text: '¶' },
  { command: 'insertUnorderedList', labelKey: 'notes.editor.list', text: '•' },
  { command: 'insertOrderedList', labelKey: 'notes.editor.numberedList', text: '1.' },
];

@Component({
  selector: 'app-note-editor',
  imports: [TranslatePipe],
  template: `
    <div
      class="note-editor__toolbar d-flex flex-wrap gap-1"
      role="toolbar"
      [attr.aria-label]="'notes.editor.toolbar' | translate">
      @for (action of actions; track action.labelKey) {
        <button
          type="button"
          class="note-editor__tool"
          [class.fst-italic]="action.command === 'italic'"
          [title]="action.labelKey | translate"
          [attr.aria-label]="action.labelKey | translate"
          [disabled]="isDisabled()"
          (mousedown)="$event.preventDefault()"
          (click)="format(action)">
          {{ action.text }}
        </button>
      }
    </div>
    <div
      #area
      class="note-editor__area"
      role="textbox"
      aria-multiline="true"
      tabindex="0"
      [attr.aria-label]="label()"
      [attr.contenteditable]="!isDisabled()"
      (input)="emitChange()"
      (blur)="onTouched?.()"></div>
  `,
  styles: `
    :host {
      display: block;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.14);
      border-radius: var(--bs-border-radius);

      &:focus-within {
        border-color: var(--bs-primary);
      }
    }

    .note-editor__toolbar {
      padding: 0.375rem;
      border-bottom: 2px solid rgba(var(--bs-dark-rgb), 0.14);
    }

    .note-editor__tool {
      min-width: 2.25rem;
      height: 2.25rem;
      font-weight: 900;
      background: none;
      border: 0;
      border-radius: 0.5rem;

      &:hover:not(:disabled) {
        background-color: rgba(var(--bs-primary-rgb), 0.08);
      }
    }

    .note-editor__area {
      min-height: 18rem;
      padding: 0.875rem 1rem;
      line-height: 1.6;
      outline: none;

      :is(h2) {
        font-size: 1.25rem;
        font-weight: 900;
      }
    }
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NoteEditor), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteEditor implements ControlValueAccessor {
  readonly label = input('');

  readonly #sanitizer = inject(DomSanitizer);
  private readonly area = viewChild.required<ElementRef<HTMLElement>>('area');
  protected readonly actions = FORMAT_ACTIONS;
  protected readonly isDisabled = signal(false);
  protected onTouched?: () => void;
  readonly #writtenValue = signal('');
  #onChange?: (value: string) => void;

  constructor() {
    afterRenderEffect(() => {
      this.area().nativeElement.innerHTML =
        this.#sanitizer.sanitize(SecurityContext.HTML, this.#writtenValue()) ?? '';
    });
  }

  writeValue(value: string | null): void {
    this.#writtenValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected format({ command, value }: FormatAction): void {
    this.area().nativeElement.focus();
    document.execCommand(command, false, value);
    this.emitChange();
  }

  protected emitChange(): void {
    this.#onChange?.(this.area().nativeElement.innerHTML);
  }
}
