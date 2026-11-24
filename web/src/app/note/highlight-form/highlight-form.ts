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
  HighlightChange,
  HighlightColor,
  PdfHighlight,
} from '../../../common/models/syllabus.model';
import { ColorPicker } from '../color-picker/color-picker';

const NOTE_MAX_LENGTH = 500;

@Component({
  selector: 'app-highlight-form',
  imports: [Button, ColorPicker, ReactiveFormsModule, TranslatePipe],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <h2 class="h5 mb-0">{{ 'notes.highlightTitle' | translate }}</h2>
      <blockquote
        class="highlight-form__quote mb-0"
        [style.--highlight-color]="'var(--bs-' + form.controls.color.value + ')'">
        {{ highlight().text }}
      </blockquote>
      <div class="d-flex align-items-center gap-2 fw-bold">
        {{ 'notes.highlightColor' | translate }}
        <app-color-picker
          [value]="form.controls.color.value"
          (changed)="form.controls.color.setValue($event)" />
      </div>
      <label class="d-flex flex-column gap-1 fw-bold">
        {{ 'notes.highlightNote' | translate }}
        <textarea
          class="form-control"
          rows="4"
          formControlName="note"
          [placeholder]="'notes.highlightNotePlaceholder' | translate"></textarea>
      </label>
      <div class="d-flex flex-wrap align-items-center gap-2">
        <button
          app-button
          variant="link"
          type="button"
          class="link-danger text-decoration-none px-0 me-auto"
          [isLoading]="isDeleting()"
          [disabled]="isBusy()"
          (click)="deleted.emit()">
          {{ 'notes.removeHighlight' | translate }}
        </button>
        <button
          app-button
          variant="outline-primary"
          type="button"
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
  styles: `
    .highlight-form__quote {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      background-color: color-mix(in srgb, var(--highlight-color) 30%, transparent);
      border-left: 0.25rem solid var(--highlight-color);
      border-radius: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightForm implements OnInit {
  readonly highlight = input.required<PdfHighlight>();
  readonly isSaving = input(false);
  readonly isDeleting = input(false);
  readonly saved = output<HighlightChange>();
  readonly deleted = output();
  readonly cancelled = output();

  readonly #fb = inject(NonNullableFormBuilder);
  protected readonly isBusy = computed(() => this.isSaving() || this.isDeleting());
  protected readonly form = this.#fb.group({
    note: ['', Validators.maxLength(NOTE_MAX_LENGTH)],
    color: ['yellow' as HighlightColor],
  });

  ngOnInit(): void {
    this.form.setValue({ note: this.highlight().note, color: this.highlight().color });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const { note, color } = this.form.getRawValue();
    this.saved.emit({ note: note.trim(), color });
  }
}
