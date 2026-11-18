import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import { InputField } from '../../../common/components/input/input';
import { ExamImportFiles } from '../../../common/models/exam-import.model';

@Component({
  selector: 'app-exam-import-form',
  imports: [ReactiveFormsModule, TranslatePipe, InputField, Button],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <app-input
        formControlName="name"
        [label]="'admin.import.name' | translate"
        [placeholder]="'admin.import.namePlaceholder' | translate"
        [required]="true" />
      <div>
        <label class="form-label" for="import-questionnaire">
          {{ 'admin.import.questionnaire' | translate }}
        </label>
        <input
          id="import-questionnaire"
          class="form-control"
          type="file"
          accept="application/pdf"
          [disabled]="isReading()"
          (change)="pick('questionnaire', $event)" />
      </div>
      <div>
        <label class="form-label" for="import-answer-key">
          {{ 'admin.import.answerKey' | translate }}
        </label>
        <input
          id="import-answer-key"
          class="form-control"
          type="file"
          accept="application/pdf"
          [disabled]="isReading()"
          (change)="pick('answerKey', $event)" />
      </div>
      @if (hasError()) {
        <p class="text-danger small fw-bold mb-0" role="alert">
          {{ 'admin.import.readError' | translate }}
        </p>
      }
      <div>
        <button
          app-button
          type="submit"
          icon="upload"
          [isLoading]="isReading()"
          [disabled]="form.invalid || isReading()">
          {{ 'admin.import.read' | translate }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamImportForm {
  readonly isReading = input.required<boolean>();
  readonly hasError = input.required<boolean>();
  readonly submitted = output<ExamImportFiles & { name: string }>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    questionnaire: [null as File | null, Validators.required],
    answerKey: [null as File | null, Validators.required],
  });

  protected pick(control: 'questionnaire' | 'answerKey', event: Event): void {
    this.form.controls[control].setValue((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  protected submit(): void {
    const { name, questionnaire, answerKey } = this.form.getRawValue();
    if (questionnaire && answerKey) this.submitted.emit({ name, questionnaire, answerKey });
  }
}
