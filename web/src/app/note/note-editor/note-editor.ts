import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ChainedCommands, Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

interface FormatAction {
  name: string;
  attributes?: Record<string, unknown>;
  labelKey: string;
  text: string;
  apply: (chain: ChainedCommands) => ChainedCommands;
}

const FORMAT_ACTIONS: FormatAction[] = [
  {
    name: 'bold',
    labelKey: 'notes.editor.bold',
    text: 'B',
    apply: (chain) => chain.toggleBold(),
  },
  {
    name: 'italic',
    labelKey: 'notes.editor.italic',
    text: 'I',
    apply: (chain) => chain.toggleItalic(),
  },
  {
    name: 'heading',
    attributes: { level: 2 },
    labelKey: 'notes.editor.heading',
    text: 'T',
    apply: (chain) => chain.toggleHeading({ level: 2 }),
  },
  {
    name: 'paragraph',
    labelKey: 'notes.editor.paragraph',
    text: '¶',
    apply: (chain) => chain.setParagraph(),
  },
  {
    name: 'bulletList',
    labelKey: 'notes.editor.list',
    text: '•',
    apply: (chain) => chain.toggleBulletList(),
  },
  {
    name: 'orderedList',
    labelKey: 'notes.editor.numberedList',
    text: '1.',
    apply: (chain) => chain.toggleOrderedList(),
  },
];

let nextId = 0;

@Component({
  selector: 'app-note-editor',
  imports: [TranslatePipe],
  host: { class: 'note-editor' },
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="note-editor__toolbar d-flex flex-wrap gap-1"
      role="toolbar"
      [attr.aria-label]="'notes.editor.toolbar' | translate">
      @for (action of actions; track action.labelKey) {
        <button
          type="button"
          class="note-editor__tool"
          [class.fst-italic]="action.name === 'italic'"
          [title]="action.labelKey | translate"
          [attr.aria-label]="action.labelKey | translate"
          [attr.aria-pressed]="activeLabels().has(action.labelKey)"
          [disabled]="isDisabled()"
          (mousedown)="$event.preventDefault()"
          (click)="format(action)">
          {{ action.text }}
        </button>
      }
    </div>
    <span class="visually-hidden" [id]="labelId">{{ label() }}</span>
    <div #area class="note-editor__area"></div>
  `,
  styles: `
    .note-editor {
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

      &:hover:not(:disabled),
      &[aria-pressed='true'] {
        background-color: rgba(var(--bs-primary-rgb), 0.12);
      }
    }

    .note-editor__content {
      min-height: 18rem;
      padding: 0.875rem 1rem;
      line-height: 1.6;
      outline: none;

      h2 {
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

  private readonly area = viewChild.required<ElementRef<HTMLElement>>('area');
  protected readonly actions = FORMAT_ACTIONS;
  protected readonly isDisabled = signal(false);
  protected readonly activeLabels = signal(new Set<string>());
  protected readonly labelId = `note-editor-label-${nextId++}`;
  #editor: Editor | null = null;
  #value = '';
  #onChange?: (value: string) => void;
  #onTouched?: () => void;

  constructor() {
    afterNextRender(() => (this.#editor = this.#createEditor()));
    inject(DestroyRef).onDestroy(() => this.#editor?.destroy());
  }

  writeValue(value: string | null): void {
    this.#value = value ?? '';
    this.#editor?.commands.setContent(this.#value, { emitUpdate: false });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
    this.#editor?.setEditable(!isDisabled, false);
  }

  protected format({ apply }: FormatAction): void {
    if (this.#editor) apply(this.#editor.chain().focus()).run();
  }

  #createEditor(): Editor {
    return new Editor({
      element: this.area().nativeElement,
      extensions: [StarterKit.configure({ heading: { levels: [2] } })],
      content: this.#value,
      editable: !this.isDisabled(),
      editorProps: {
        attributes: {
          class: 'note-editor__content',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-labelledby': this.labelId,
        },
      },
      onUpdate: ({ editor }) => this.#onChange?.(editor.getHTML()),
      onBlur: () => this.#onTouched?.(),
      onTransaction: ({ editor }) =>
        this.activeLabels.set(
          new Set(
            FORMAT_ACTIONS.filter(({ name, attributes }) => editor.isActive(name, attributes)).map(
              ({ labelKey }) => labelKey,
            ),
          ),
        ),
    });
  }
}
