import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InputField } from '../../../common/components/input/input';
import { NoteDraft } from '../../../common/models/syllabus.model';
import { validationErrorKey } from '../../../common/utils/validation-error-key';
import { NoteEditor } from '../note-editor/note-editor';

const TITLE_MAX_LENGTH = 80;

@Component({
  selector: 'app-note-form',
  imports: [ReactiveFormsModule, TranslatePipe, InputField, NoteEditor],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <app-input
        formControlName="title"
        [label]="'notes.title' | translate"
        [placeholder]="'notes.titlePlaceholder' | translate"
        [required]="true"
        [error]="errorKey(form.controls.title) | translate" />
      <app-note-editor formControlName="content" [label]="'notes.content' | translate" />
      @if (error()) {
        <p class="text-danger small fw-bold mb-0" role="alert">
          {{ 'notes.errors.' + error() | translate }}
        </p>
      }
      <div class="d-flex flex-wrap align-items-center gap-2">
        @if (isEditing()) {
          <button
            type="button"
            class="btn btn-link link-danger text-decoration-none px-0 me-auto"
            [class.is-loading]="isDeleting()"
            [disabled]="isBusy()"
            (click)="deleted.emit()">
            {{ 'notes.delete' | translate }}
          </button>
        }
        <button
          type="submit"
          class="btn btn-primary ms-auto"
          [class.is-loading]="isSaving()"
          [disabled]="isBusy()">
          {{ 'actions.save' | translate }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteForm implements OnInit {
  readonly #fb = inject(NonNullableFormBuilder);

  readonly draft = input.required<NoteDraft>();
  readonly isEditing = input(false);
  readonly isSaving = input(false);
  readonly isDeleting = input(false);
  readonly error = input<'saving' | 'deleting' | null>(null);
  readonly submitted = output<NoteDraft>();
  readonly deleted = output();

  protected readonly errorKey = validationErrorKey;
  protected readonly isBusy = computed(() => this.isSaving() || this.isDeleting());
  protected readonly form = this.#fb.group({
    title: ['', [Validators.required, Validators.maxLength(TITLE_MAX_LENGTH)]],
    content: [''],
  });

  constructor() {
    effect(() => (this.isBusy() ? this.form.disable() : this.form.enable()));
  }

  ngOnInit(): void {
    this.form.setValue(this.draft());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, content } = this.form.getRawValue();
    this.submitted.emit({ title: title.trim(), content });
  }
}
