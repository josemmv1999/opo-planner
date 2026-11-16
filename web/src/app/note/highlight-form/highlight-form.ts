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
import { PdfHighlight } from '../../../common/models/syllabus.model';

const NOTE_MAX_LENGTH = 500;

@Component({
  selector: 'app-highlight-form',
  imports: [Button, ReactiveFormsModule, TranslatePipe],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <h2 class="h5 mb-0">{{ 'notes.highlightTitle' | translate }}</h2>
      <blockquote class="highlight-form__quote mb-0">{{ highlight().text }}</blockquote>
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
      background-color: rgba(var(--bs-warning-rgb), 0.3);
      border-left: 0.25rem solid var(--bs-warning);
      border-radius: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightForm implements OnInit {
  readonly highlight = input.required<PdfHighlight>();
  readonly isSaving = input(false);
  readonly isDeleting = input(false);
  readonly saved = output<string>();
  readonly deleted = output();
  readonly cancelled = output();

  readonly #fb = inject(NonNullableFormBuilder);
  protected readonly isBusy = computed(() => this.isSaving() || this.isDeleting());
  protected readonly form = this.#fb.group({
    note: ['', Validators.maxLength(NOTE_MAX_LENGTH)],
  });

  ngOnInit(): void {
    this.form.setValue({ note: this.highlight().note });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.saved.emit(this.form.getRawValue().note.trim());
  }
}
