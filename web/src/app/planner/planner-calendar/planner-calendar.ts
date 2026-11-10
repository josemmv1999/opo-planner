import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { PlannerDay } from '../../../common/models/planner.model';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';
import { HOUR_LABELS, ROW_COUNT, ROWS_PER_HOUR } from '../planner-layout';

@Component({
  selector: 'app-planner-calendar',
  host: {
    '[style.--planner-row-count]': 'rowCount',
    '[style.--planner-rows-per-hour]': 'rowsPerHour',
  },
  imports: [TranslatePipe, Icon, FormatDatePipe],
  template: `
    <section class="card card--teal overflow-hidden">
      <div
        class="planner-calendar__strip"
        role="group"
        [attr.aria-label]="'planner.days' | translate">
        @for (day of days(); track day.date) {
          <button
            type="button"
            class="planner-calendar__strip-day d-flex flex-column align-items-center"
            [attr.aria-pressed]="$index === selectedDay()"
            [attr.aria-label]="day.date | formatDate: 'EEEE d'"
            (click)="daySelected.emit($index)">
            {{ day.date | formatDate: 'EEEEE' }}
            <strong>{{ day.date | formatDate: 'd' }}</strong>
            <span class="planner-calendar__dot" [class.invisible]="!day.entries.length"></span>
          </button>
        }
      </div>

      <div class="d-flex">
        <div class="planner-calendar__hours">
          <div class="planner-calendar__head"></div>
          <div class="planner-calendar__rows">
            @for (label of hourLabels; track label) {
              <span class="planner-calendar__hour" [style.grid-row]="hourRow($index)">
                {{ label }}
              </span>
            }
          </div>
        </div>

        @for (day of days(); track day.date) {
          <div
            class="planner-calendar__day flex-grow-1"
            [class.planner-calendar__day--selected]="$index === selectedDay()"
            [class.planner-calendar__day--today]="day.isToday">
            <div class="planner-calendar__head d-flex flex-column align-items-center">
              {{ day.date | formatDate: 'EEE' }}
              <strong>{{ day.date | formatDate: 'd' }}</strong>
            </div>
            <div class="planner-calendar__rows planner-calendar__rows--lined">
              @for (range of day.studyRows; track range.startRow) {
                <div
                  class="planner-calendar__study"
                  [style.grid-row]="range.startRow + ' / ' + range.endRow"></div>
              }
              @for (entry of day.entries; track entry.id) {
                <div
                  class="planner-calendar__entry d-flex"
                  [class.planner-calendar__entry--short]="entry.isShort"
                  [class.planner-calendar__entry--done]="entry.isDone"
                  [class.planner-calendar__entry--record]="entry.isRecord"
                  [style.grid-row]="entry.startRow + ' / ' + entry.endRow"
                  [style.--lane]="entry.lane"
                  [title]="
                    entry.isRecord
                      ? ('planner.record' | translate)
                      : (entry.start | formatDate: 'HH:mm') +
                        ' – ' +
                        (entry.end | formatDate: 'HH:mm')
                  ">
                  <span class="planner-calendar__entry-head d-flex align-items-center">
                    @if (entry.isRecord) {
                      <app-icon class="planner-calendar__record-icon" name="tests" />
                    } @else {
                      <input
                        type="checkbox"
                        class="form-check-input m-0"
                        [checked]="entry.isDone"
                        [attr.aria-label]="'planner.done' | translate: { text: entry.text }"
                        (change)="doneToggled.emit(entry.id)" />
                    }
                    <span class="planner-calendar__time text-truncate">
                      {{ entry.start | formatDate: 'HH:mm' }} –
                      {{ entry.end | formatDate: 'HH:mm' }}
                    </span>
                  </span>
                  <span class="planner-calendar__text">{{ entry.text }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <div class="planner-calendar__legend d-flex flex-wrap">
        <span class="d-flex align-items-center">
          <i class="planner-calendar__swatch planner-calendar__swatch--study"></i>
          {{ 'planner.legend.study' | translate }}
        </span>
        <span class="d-flex align-items-center">
          <i class="planner-calendar__swatch"></i>
          {{ 'planner.legend.task' | translate }}
        </span>
        <span class="d-flex align-items-center">
          <i class="planner-calendar__swatch planner-calendar__swatch--record"></i>
          {{ 'planner.legend.record' | translate }}
        </span>
      </div>
    </section>
  `,
  styles: `
    :host {
      --planner-row: 1.125rem;

      display: block;
      container-type: inline-size;
    }

    .planner-calendar__strip {
      display: none;
    }

    .planner-calendar__hours {
      flex: 0 0 3.25rem;
    }

    .planner-calendar__head {
      height: 3.75rem;
      padding: 0.5rem 0.25rem;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--bs-secondary-color);
      text-transform: uppercase;
      border-bottom: 2px solid var(--bs-dark);

      strong {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        font-size: 1rem;
        color: var(--bs-body-color);
        border-radius: 50%;
      }
    }

    .planner-calendar__rows {
      display: grid;
      grid-template-rows: repeat(var(--planner-row-count), var(--planner-row));
      grid-template-columns: minmax(0, 1fr);

      > * {
        grid-column: 1;
      }
    }

    .planner-calendar__rows--lined {
      background-image: linear-gradient(rgba(var(--bs-dark-rgb), 0.1) 1px, transparent 1px);
      background-size: 100% calc(var(--planner-row) * var(--planner-rows-per-hour));
    }

    .planner-calendar__hour {
      padding: 0 0.375rem;
      font-size: 0.6875rem;
      font-weight: 800;
      color: var(--bs-secondary-color);
      text-align: right;
      transform: translateY(-0.5rem);

      &:first-child {
        transform: none;
      }
    }

    .planner-calendar__day {
      flex-basis: 0;
      min-width: 0;
      border-left: 1px solid rgba(var(--bs-dark-rgb), 0.1);
    }

    .planner-calendar__day--today {
      background-color: rgba(var(--bs-primary-rgb), 0.04);

      .planner-calendar__head strong {
        color: var(--bs-white);
        background-color: var(--bs-primary);
      }
    }

    .planner-calendar__study {
      background: repeating-linear-gradient(
        135deg,
        rgba(var(--bs-info-rgb), 0.12) 0 0.5rem,
        rgba(var(--bs-info-rgb), 0.06) 0.5rem 1rem
      );
      border-left: 3px solid var(--bs-info);
    }

    .planner-calendar__entry {
      z-index: calc(1 + var(--lane));
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
      margin: 1px 3px 1px calc(3px + var(--lane) * 2.5rem);
      padding: 0.25rem 0.375rem;
      overflow: hidden;
      font-size: 0.8125rem;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: 0.5rem;
      box-shadow: 2px 2px 0 var(--bs-primary);
    }

    .planner-calendar__entry-head {
      gap: 0.375rem;
      min-width: 0;
    }

    .planner-calendar__time {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--bs-secondary-color);
    }

    .planner-calendar__text {
      font-weight: 800;
      line-height: 1.2;
      overflow-wrap: break-word;
      hyphens: auto;
    }

    .planner-calendar__entry--short {
      flex-direction: row;
      align-items: center;
      gap: 0.375rem;

      .planner-calendar__time {
        display: none;
      }

      .planner-calendar__text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .planner-calendar__entry--done {
      background-color: var(--bs-light);
      border-color: rgba(var(--bs-dark-rgb), 0.14);
      box-shadow: none;

      .planner-calendar__text {
        color: var(--bs-secondary-color);
        text-decoration: line-through;
      }
    }

    .planner-calendar__entry--record {
      background-color: #e7f1f3;
      border-style: dashed;
      box-shadow: none;
    }

    .planner-calendar__record-icon {
      color: var(--bs-primary);
    }

    .planner-calendar__legend {
      gap: 0.5rem 1rem;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--bs-secondary-color);
      border-top: 2px solid var(--bs-dark);

      span {
        gap: 0.375rem;
      }
    }

    .planner-calendar__swatch {
      width: 0.875rem;
      height: 0.875rem;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: 0.25rem;
    }

    .planner-calendar__swatch--study {
      border: 0;
      border-left: 3px solid var(--bs-info);
      border-radius: 0;
    }

    .planner-calendar__swatch--record {
      background-color: #e7f1f3;
      border-style: dashed;
    }

    @container (max-width: 40rem) {
      .planner-calendar__strip {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 0.25rem;
        padding: 0.5rem;
        border-bottom: 2px solid var(--bs-dark);
      }

      .planner-calendar__strip-day {
        padding: 0.375rem 0;
        font-size: 0.6875rem;
        font-weight: 800;
        color: var(--bs-secondary-color);
        text-transform: uppercase;
        background: none;
        border: 0;
        border-radius: 0.75rem;

        strong {
          font-size: 1rem;
          color: var(--bs-body-color);
        }

        &[aria-pressed='true'] {
          color: var(--bs-white);
          background-color: var(--bs-primary);

          strong {
            color: var(--bs-white);
          }
        }
      }

      .planner-calendar__dot {
        width: 0.375rem;
        height: 0.375rem;
        background-color: currentColor;
        border-radius: 50%;
        opacity: 0.6;
      }

      .planner-calendar__head {
        display: none !important;
      }

      .planner-calendar__day:not(.planner-calendar__day--selected) {
        display: none;
      }

      .planner-calendar__entry {
        font-size: 0.875rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerCalendar {
  readonly days = input.required<PlannerDay[]>();
  readonly selectedDay = input.required<number>();
  readonly daySelected = output<number>();
  readonly doneToggled = output<number>();

  protected readonly hourLabels = HOUR_LABELS;
  protected readonly rowCount = ROW_COUNT;
  protected readonly rowsPerHour = ROWS_PER_HOUR;

  protected hourRow(index: number): string {
    return `${index * ROWS_PER_HOUR + 1} / span ${ROWS_PER_HOUR}`;
  }
}
