import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { OppositionOption, StudySchedule, TimeSlot } from '../../../common/models/onboarding.model';
import { DaysLabelPipe } from '../days-label.pipe';
import { ScheduleClash, SlotIssue } from '../schedule';

export interface SlotChange {
  index: number;
  part: keyof TimeSlot;
  value: string;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const hoursFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

@Component({
  selector: 'app-schedule-editor',
  imports: [TranslatePipe, Icon, DaysLabelPipe],
  template: `
    @if (oppositions().length > 1) {
      <div
        class="d-flex flex-wrap gap-2 mb-3"
        role="tablist"
        [attr.aria-label]="'onboarding.schedule.tabsLabel' | translate">
        @for (opposition of oppositions(); track opposition.id) {
          @let isActive = opposition.id === activeId();
          <button
            type="button"
            class="schedule-editor__tab d-flex align-items-center"
            role="tab"
            [id]="'schedule-tab-' + opposition.id"
            aria-controls="schedule-panel"
            [attr.aria-selected]="isActive"
            [tabIndex]="isActive ? 0 : -1"
            (click)="scheduleSelected.emit(opposition.id)"
            (keydown)="moveTab($event)">
            {{ opposition.name }}
            @if (completedIds().has(opposition.id)) {
              <app-icon class="schedule-editor__done ms-2" name="check" />
              <span class="visually-hidden"
                >, {{ 'onboarding.schedule.completed' | translate }}</span
              >
            }
          </button>
        }
      </div>
    }

    <div
      class="schedule-editor__panel card"
      id="schedule-panel"
      [attr.role]="oppositions().length > 1 ? 'tabpanel' : null"
      [attr.aria-labelledby]="oppositions().length > 1 ? 'schedule-tab-' + activeId() : null">
      <div class="card-body d-flex flex-column gap-4">
        <fieldset class="m-0 p-0 border-0">
          <legend class="schedule-editor__legend">
            {{ 'onboarding.schedule.days' | translate }}
          </legend>
          <div class="schedule-editor__days d-flex flex-wrap">
            @for (day of days; track day) {
              <label
                class="schedule-editor__day"
                [attr.title]="('onboarding.schedule.dayLabels' | translate).names?.[day]">
                <input
                  class="visually-hidden"
                  type="checkbox"
                  [checked]="schedule().days.includes(day)"
                  [attr.aria-label]="('onboarding.schedule.dayLabels' | translate).names?.[day]"
                  (change)="dayToggled.emit(day)" />
                <span
                  class="d-flex align-items-center justify-content-center rounded-circle"
                  aria-hidden="true">
                  {{ ('onboarding.schedule.dayInitials' | translate)[day] }}
                </span>
              </label>
            }
          </div>
        </fieldset>

        <fieldset class="d-flex flex-column gap-3 m-0 p-0 border-0">
          <legend class="schedule-editor__legend">
            {{ 'onboarding.schedule.slots' | translate }}
          </legend>
          @for (slot of schedule().slots; track $index; let i = $index) {
            @let issue = issues()[i];
            @let clash = clashes()[i];
            <div class="schedule-editor__slot d-flex flex-wrap align-items-end gap-3">
              <label class="schedule-editor__time d-flex flex-column gap-1">
                {{ 'onboarding.schedule.start' | translate }}
                <input
                  class="form-control"
                  type="time"
                  [class.is-invalid]="issue"
                  [class.schedule-editor__input--warning]="clash"
                  [value]="slot.start"
                  [attr.aria-invalid]="issue ? true : null"
                  [attr.aria-describedby]="issue || clash ? 'slot-message-' + i : null"
                  (change)="emitSlotChange(i, 'start', $event)" />
              </label>
              <label class="schedule-editor__time d-flex flex-column gap-1">
                {{ 'onboarding.schedule.end' | translate }}
                <input
                  class="form-control"
                  type="time"
                  [class.is-invalid]="issue"
                  [class.schedule-editor__input--warning]="clash"
                  [value]="slot.end"
                  [attr.aria-invalid]="issue ? true : null"
                  [attr.aria-describedby]="issue || clash ? 'slot-message-' + i : null"
                  (change)="emitSlotChange(i, 'end', $event)" />
              </label>
              <button
                type="button"
                class="schedule-editor__remove btn btn-link text-danger d-flex align-items-center justify-content-center p-0"
                [title]="'onboarding.schedule.removeSlot' | translate"
                [attr.aria-label]="'onboarding.schedule.removeSlotLabel' | translate: slot"
                (click)="removeSlot(i)">
                <app-icon name="delete" />
              </button>
              @if (issue) {
                <p
                  class="schedule-editor__message text-danger d-flex gap-2 mb-0"
                  [id]="'slot-message-' + i">
                  <app-icon name="close" />
                  @if (issue.kind === 'reversed') {
                    {{ 'onboarding.schedule.reversed' | translate }}
                  } @else {
                    {{ 'onboarding.schedule.overlap' | translate: issue.slot }}
                  }
                </p>
              } @else if (clash) {
                <p
                  class="schedule-editor__message schedule-editor__message--warning d-flex gap-2 mb-0"
                  [id]="'slot-message-' + i">
                  <app-icon name="warning" />
                  {{
                    'onboarding.schedule.clash'
                      | translate
                        : {
                            name: clash.oppositionName,
                            days:
                              clash.days | daysLabel: ('onboarding.schedule.dayLabels' | translate),
                            start: clash.start,
                            end: clash.end,
                          }
                  }}
                </p>
              }
            </div>
          }
          <button
            type="button"
            class="schedule-editor__add btn btn-outline-primary d-flex align-items-center align-self-start"
            (click)="addSlot()">
            <app-icon class="me-2" name="add" />
            {{ 'onboarding.schedule.addSlot' | translate }}
          </button>
        </fieldset>

        <p class="schedule-editor__summary border-top pt-3 mb-0" aria-live="polite">
          {{
            (schedule().days.length === 1
              ? 'onboarding.schedule.summaryOne'
              : 'onboarding.schedule.summary'
            ) | translate: { days: schedule().days.length, hours: formattedHours() }
          }}
        </p>
      </div>
    </div>
  `,
  styles: `
    .schedule-editor__tab {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--bs-body-color);
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-pill);

      &[aria-selected='true'] {
        color: var(--bs-white);
        background-color: var(--bs-dark);
      }
    }

    .schedule-editor__done {
      width: 1rem;
      height: 1rem;
      color: var(--bs-success);

      [aria-selected='true'] > & {
        color: var(--bs-warning);
      }
    }

    .schedule-editor__panel {
      --op-card-shadow-color: var(--bs-secondary);
    }

    .schedule-editor__legend {
      margin-bottom: 0.75rem;
      font-size: 1.0625rem;
      font-weight: 800;
    }

    .schedule-editor__days {
      gap: 0.625rem;
    }

    .schedule-editor__day span {
      width: 3rem;
      height: 3rem;
      font-weight: 900;
      cursor: pointer;
      background-color: var(--bs-white);
      border: 2px solid rgba(var(--bs-dark-rgb), 0.16);
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease;
    }

    .schedule-editor__day input:checked + span {
      color: var(--bs-white);
      background-color: var(--bs-primary);
      border-color: var(--bs-dark);
    }

    .schedule-editor__day input:focus-visible + span {
      outline: 0.1875rem solid var(--bs-primary);
      outline-offset: 0.125rem;
    }

    .schedule-editor__time {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--bs-secondary-color);

      input {
        width: 7.5rem;
        font-weight: 700;
      }
    }

    .schedule-editor__input--warning {
      border-color: var(--bs-secondary);
    }

    .schedule-editor__remove {
      width: 2.875rem;
      height: 2.875rem;
    }

    .schedule-editor__message {
      flex-basis: 100%;
      font-size: 0.8125rem;
      font-weight: 700;
      line-height: 1.4;

      app-icon {
        width: 1rem;
        height: 1rem;
        margin-top: 0.0625rem;
      }
    }

    .schedule-editor__message--warning {
      padding: 0.5rem 0.625rem;
      color: var(--bs-dark);
      background-color: rgba(var(--bs-warning-rgb), 0.25);
      border-radius: var(--bs-border-radius-sm);
    }

    .schedule-editor__add {
      border-style: dashed;
    }

    .schedule-editor__summary {
      font-weight: 800;
      border-top-style: dashed !important;
    }

    @media (max-width: 575.98px) {
      .schedule-editor__days {
        gap: 0.375rem;
      }

      .schedule-editor__day span {
        width: 2.25rem;
        height: 2.25rem;
      }

      .schedule-editor__slot {
        flex-wrap: nowrap;
      }

      .schedule-editor__slot:has(.schedule-editor__message) {
        flex-wrap: wrap;
      }

      .schedule-editor__time {
        flex: 1;
        min-width: 0;

        input {
          width: 100%;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .schedule-editor__day span {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleEditor {
  readonly oppositions = input.required<OppositionOption[]>();
  readonly activeId = input.required<string | null>();
  readonly completedIds = input.required<Set<string>>();
  readonly schedule = input.required<StudySchedule>();
  readonly issues = input.required<(SlotIssue | null)[]>();
  readonly clashes = input.required<(ScheduleClash | null)[]>();
  readonly weeklyHours = input.required<number>();

  readonly scheduleSelected = output<string>();
  readonly dayToggled = output<number>();
  readonly slotAdded = output();
  readonly slotRemoved = output<number>();
  readonly slotChanged = output<SlotChange>();

  protected readonly days = DAYS;
  protected readonly formattedHours = computed(() => hoursFormat.format(this.weeklyHours()));

  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);

  protected emitSlotChange(index: number, part: keyof TimeSlot, event: Event): void {
    this.slotChanged.emit({ index, part, value: (event.target as HTMLInputElement).value });
  }

  protected addSlot(): void {
    this.slotAdded.emit();
    this.#focusAfterRender(() =>
      [...this.#queryAll('.schedule-editor__slot')].at(-1)?.querySelector('input'),
    );
  }

  protected removeSlot(index: number): void {
    this.slotRemoved.emit(index);
    this.#focusAfterRender(
      () =>
        this.#queryAll('.schedule-editor__slot input').item(0) ??
        this.#host.nativeElement.querySelector('.schedule-editor__add'),
    );
  }

  protected moveTab(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const ids = this.oppositions().map(({ id }) => id);
    const step = event.key === 'ArrowRight' ? 1 : ids.length - 1;
    const nextId = ids[(ids.indexOf(this.activeId() ?? '') + step) % ids.length];
    this.scheduleSelected.emit(nextId);
    this.#focusAfterRender(() =>
      this.#host.nativeElement.querySelector<HTMLElement>(`#schedule-tab-${nextId}`),
    );
  }

  #queryAll(selector: string): NodeListOf<HTMLElement> {
    return this.#host.nativeElement.querySelectorAll<HTMLElement>(selector);
  }

  #focusAfterRender(target: () => HTMLElement | null | undefined): void {
    afterNextRender(() => target()?.focus(), { injector: this.#injector });
  }
}
