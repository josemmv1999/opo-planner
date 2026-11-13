import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '../../../common/components/button/button';
import { CustomExamConfig } from '../../../common/models/exam.model';
import { SyllabusBlock } from '../../../common/models/syllabus.model';

const QUESTION_COUNTS = [10, 20, 40, 60];

@Component({
  selector: 'app-custom-test-form',
  imports: [Button, ReactiveFormsModule, TranslatePipe],
  template: `
    <form class="d-flex flex-column gap-3" [formGroup]="form" (ngSubmit)="submit()">
      <h2 class="h5 mb-0">{{ 'exams.custom.title' | translate }}</h2>

      <fieldset class="d-flex flex-column gap-3 m-0 p-0 border-0">
        <legend class="custom-test-form__legend">{{ 'exams.custom.topics' | translate }}</legend>
        @for (block of blocks(); track block.id) {
          @let selectedCount = selectedPerBlock().get(block.id) ?? 0;
          <div class="d-flex flex-column gap-1">
            <label class="form-check fw-bold mb-0">
              <input
                class="form-check-input"
                type="checkbox"
                [checked]="selectedCount === block.topics.length"
                [indeterminate]="selectedCount > 0 && selectedCount < block.topics.length"
                (change)="toggleBlock(block)" />
              {{ block.label }} · {{ block.name }}
            </label>
            @for (topic of block.topics; track topic.id) {
              <label class="form-check ms-4 mb-0">
                <input
                  class="form-check-input"
                  type="checkbox"
                  [checked]="selectedIds().has(topic.id)"
                  (change)="toggleTopic(topic.id)" />
                {{ topic.number }}. {{ topic.name }}
              </label>
            }
          </div>
        }
      </fieldset>
      @if (form.controls.topicIds.touched && form.controls.topicIds.invalid) {
        <p class="text-danger small fw-bold mb-0" role="alert">
          {{ 'exams.custom.noTopics' | translate }}
        </p>
      }

      <label class="d-flex flex-column gap-1 fw-bold">
        {{ 'exams.custom.count' | translate }}
        <select class="form-select" formControlName="questionCount">
          @for (count of questionCounts; track count) {
            <option [ngValue]="count">
              {{ 'exams.custom.countOption' | translate: { count } }}
            </option>
          }
        </select>
      </label>

      <label class="form-check mb-0">
        <input class="form-check-input" type="checkbox" formControlName="isOfficialOnly" />
        {{ 'exams.custom.officialOnly' | translate }}
      </label>

      <div class="d-flex justify-content-end gap-2">
        <button app-button variant="outline-primary" type="button" (click)="cancelled.emit()">
          {{ 'actions.cancel' | translate }}
        </button>
        <button app-button type="submit" icon="tests">{{ 'actions.start' | translate }}</button>
      </div>
    </form>
  `,
  styles: `
    .custom-test-form__legend {
      font-size: 1rem;
      font-weight: 900;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTestForm {
  readonly blocks = input.required<SyllabusBlock[]>();
  readonly started = output<CustomExamConfig>();
  readonly cancelled = output();

  readonly #fb = inject(NonNullableFormBuilder);
  protected readonly questionCounts = QUESTION_COUNTS;
  protected readonly form = this.#fb.group({
    topicIds: this.#fb.control<number[]>([], Validators.required),
    questionCount: this.#fb.control(QUESTION_COUNTS[1]),
    isOfficialOnly: this.#fb.control(false),
  });

  readonly #topicIds = toSignal(this.form.controls.topicIds.valueChanges, { initialValue: [] });
  protected readonly selectedIds = computed(() => new Set(this.#topicIds()));
  protected readonly selectedPerBlock = computed(
    () =>
      new Map(
        this.blocks().map(({ id, topics }) => [
          id,
          topics.filter((topic) => this.selectedIds().has(topic.id)).length,
        ]),
      ),
  );

  protected toggleTopic(topicId: number): void {
    const ids = this.selectedIds();
    this.#setTopics(ids.has(topicId) ? [...ids].filter((id) => id !== topicId) : [...ids, topicId]);
  }

  protected toggleBlock({ id, topics }: SyllabusBlock): void {
    const blockIds = new Set(topics.map((topic) => topic.id));
    const others = [...this.selectedIds()].filter((topicId) => !blockIds.has(topicId));
    const isFull = this.selectedPerBlock().get(id) === blockIds.size;
    this.#setTopics(isFull ? others : [...others, ...blockIds]);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.started.emit(this.form.getRawValue());
  }

  #setTopics(topicIds: number[]): void {
    this.form.controls.topicIds.setValue(topicIds);
    this.form.controls.topicIds.markAsTouched();
  }
}
