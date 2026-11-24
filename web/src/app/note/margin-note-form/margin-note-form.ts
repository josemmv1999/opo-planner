import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import {
  HighlightColor,
  MarginNote,
  MarginNoteChange,
} from '../../../common/models/syllabus.model';
import { ColorPicker } from '../color-picker/color-picker';

const TEXT_MAX_LENGTH = 500;

@Component({
  selector: 'app-margin-note-form',
  imports: [Button, ColorPicker, ReactiveFormsModule, TranslatePipe],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <h2 class="h5 mb-0">{{ 'notes.marginTitle' | translate }}</h2>
      <label class="d-flex flex-column gap-1 fw-bold">
        {{ 'notes.marginText' | translate }}
        <textarea
          class="form-control"
          rows="4"
          formControlName="text"
          [placeholder]="'notes.marginPlaceholder' | translate"></textarea>
      </label>
      <div class="d-flex align-items-center gap-2 fw-bold">
        {{ 'notes.highlightColor' | translate }}
        <app-color-picker
          [value]="form.controls.color.value"
          (changed)="form.controls.color.setValue($event)" />
      </div>
      <div class="d-flex flex-wrap align-items-center gap-2">
        @if (marginNote()) {
          <button
            app-button
            variant="link"
            type="button"
            class="link-danger text-decoration-none px-0 me-auto"
            [isLoading]="isDeleting()"
            [disabled]="isBusy()"
            (click)="deleted.emit()">
            {{ 'notes.removeMarginNote' | translate }}
          </button>
        }
        <button
          app-button
          variant="outline-primary"
          type="button"
          class="ms-auto"
          [disabled]="isBusy()"
          (click)="cancelled.emit()">
          {{ 'actions.cancel' | translate }}
        </button>
        <button app-button type="submit" [isLoading]="isSaving()" [disabled]="isBusy()">
          {{ 'actions.save' | translate }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarginNoteForm implements OnInit {
  readonly marginNote = input<MarginNote | null>(null);
  readonly isSaving = input(false);
  readonly isDeleting = input(false);
  readonly saved = output<MarginNoteChange>();
  readonly deleted = output();
  readonly cancelled = output();

  readonly #fb = inject(NonNullableFormBuilder);

  protected readonly isBusy = computed(() => this.isSaving() || this.isDeleting());
  protected readonly form = this.#fb.group({
    text: ['', [Validators.required, Validators.maxLength(TEXT_MAX_LENGTH)]],
    color: ['yellow' as HighlightColor],
  });

  ngOnInit(): void {
    const marginNote = this.marginNote();
    if (marginNote) this.form.setValue({ text: marginNote.text, color: marginNote.color });
  }

  protected submit(): void {
    const { text, color } = this.form.getRawValue();
    if (this.form.invalid || !text.trim()) return;
    this.saved.emit({ text: text.trim(), color });
  }
}
