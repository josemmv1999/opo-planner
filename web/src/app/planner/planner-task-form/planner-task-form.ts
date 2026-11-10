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
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InputField } from '../../../common/components/input/input';
import { OtherPlannerEntry, TaskDraft } from '../../../common/models/planner.model';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';
import { map } from 'rxjs';
import { validationErrorKey } from '../../../common/utils/validation-error-key';
import { findClash } from '../planner-layout';

const TEXT_MAX_LENGTH = 80;

const endAfterStart = (group: AbstractControl): ValidationErrors | null => {
  const { start, end } = group.value as Pick<TaskDraft, 'start' | 'end'>;
  return start && end && end <= start ? { timeRange: true } : null;
};

@Component({
  selector: 'app-planner-task-form',
  imports: [ReactiveFormsModule, TranslatePipe, InputField, FormatDatePipe],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <h2 class="h5 mb-0">
        {{ (isEditing() ? 'planner.task.editTitle' : 'planner.task.newTitle') | translate }}
      </h2>
      <app-input
        formControlName="text"
        [label]="'planner.task.text' | translate"
        [placeholder]="'planner.task.textPlaceholder' | translate"
        [required]="true"
        [error]="errorKey(form.controls.text) | translate" />
      <div class="planner-task-form__times">
        <app-input
          class="planner-task-form__date"
          formControlName="date"
          type="date"
          [label]="'planner.task.date' | translate"
          [required]="true"
          [error]="errorKey(form.controls.date) | translate" />
        <app-input
          formControlName="start"
          type="time"
          [label]="'planner.task.start' | translate"
          [required]="true"
          [error]="errorKey(form.controls.start) | translate" />
        <app-input
          formControlName="end"
          type="time"
          [label]="'planner.task.end' | translate"
          [required]="true"
          [error]="errorKey(form.controls.end) | translate" />
      </div>
      @if (hasTimeRangeError()) {
        <p class="text-danger small fw-bold mb-0" role="alert">
          {{ 'validation.timeRange' | translate }}
        </p>
      }
      @if (clash(); as clash) {
        <p class="alert alert-warning small fw-bold mb-0" role="status">
          {{
            'planner.task.clash'
              | translate
                : {
                    text: clash.text,
                    start: clash.start | formatDate: 'HH:mm',
                    end: clash.end | formatDate: 'HH:mm',
                    opposition: clash.oppositionName,
                  }
          }}
        </p>
      }
      @if (error()) {
        <p class="text-danger small fw-bold mb-0" role="alert">
          {{ 'planner.task.errors.' + error() | translate }}
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
            {{ 'planner.task.delete' | translate }}
          </button>
        }
        <button
          type="button"
          class="btn btn-outline-primary ms-auto"
          [disabled]="isBusy()"
          (click)="cancelled.emit()">
          {{ 'actions.cancel' | translate }}
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [class.is-loading]="isSaving()"
          [disabled]="isBusy()">
          {{ 'actions.save' | translate }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .planner-task-form__times {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .planner-task-form__date {
      grid-column: 1 / -1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerTaskForm implements OnInit {
  readonly #fb = inject(NonNullableFormBuilder);

  readonly draft = input.required<TaskDraft>();
  readonly isEditing = input(false);
  readonly isSaving = input(false);
  readonly isDeleting = input(false);
  readonly error = input<'saving' | 'deleting' | null>(null);
  readonly otherEntries = input<OtherPlannerEntry[]>([]);
  readonly submitted = output<TaskDraft>();
  readonly deleted = output();
  readonly cancelled = output();

  protected readonly errorKey = validationErrorKey;
  protected readonly isBusy = computed(() => this.isSaving() || this.isDeleting());
  protected readonly form = this.#fb.group(
    {
      text: ['', [Validators.required, Validators.maxLength(TEXT_MAX_LENGTH)]],
      date: ['', Validators.required],
      start: ['', Validators.required],
      end: ['', Validators.required],
    },
    { validators: endAfterStart },
  );
  readonly #value = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  protected readonly clash = computed(() => findClash(this.#value(), this.otherEntries()));

  constructor() {
    effect(() => (this.isBusy() ? this.form.disable() : this.form.enable()));
  }

  ngOnInit(): void {
    this.form.setValue(this.draft());
  }

  protected hasTimeRangeError(): boolean {
    return this.form.hasError('timeRange') && this.form.controls.end.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit({ ...this.form.getRawValue(), text: this.form.controls.text.value.trim() });
  }
}
