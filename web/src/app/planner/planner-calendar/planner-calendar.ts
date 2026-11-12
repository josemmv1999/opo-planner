import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../../common/components/icon/icon';
import { PlacedEntry, PlannerDay } from '../../../common/models/planner.model';
import { TaskMove, TaskSlot } from '../planner.store';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';
import {
  FIRST_HOUR,
  HOUR_LABELS,
  ROW_COUNT,
  ROWS_PER_HOUR,
  ROWS_PER_SLOT,
  rowTime,
  slotStartAt,
} from '../planner-layout';

const DRAG_THRESHOLD_PX = 5;
const LAST_DAY = 6;

interface DragState {
  id: number;
  dayIndex: number;
  isResize: boolean;
  x: number;
  y: number;
  rowHeight: number;
  columnWidth: number;
  startRow: number;
  endRow: number;
  rowDelta: number;
  dayDelta: number;
  hasMoved: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

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
        #strip
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

      <div #body class="planner-calendar__body d-flex">
        <div class="planner-calendar__hours">
          <div class="planner-calendar__head"></div>
          <div class="planner-calendar__rows">
            @for (label of hourLabels; track label) {
              <span #hourCell class="planner-calendar__hour" [style.grid-row]="hourRow($index)">
                {{ label }}
              </span>
            }
          </div>
        </div>

        @for (day of days(); track day.date; let dayIndex = $index) {
          <div
            class="planner-calendar__day flex-grow-1"
            [class.planner-calendar__day--selected]="$index === selectedDay()"
            [class.planner-calendar__day--today]="day.isToday">
            <div class="planner-calendar__head d-flex flex-column align-items-center">
              {{ day.date | formatDate: 'EEE' }}
              <strong>{{ day.date | formatDate: 'd' }}</strong>
            </div>
            <!-- Clicking an empty slot is a mouse shortcut; the "New task" button covers the keyboard. -->
            <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
            <div
              class="planner-calendar__rows planner-calendar__rows--lined"
              (click)="selectSlot($event, day.date)">
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
                  [class.planner-calendar__entry--other]="entry.oppositionName !== null"
                  [class.planner-calendar__entry--dragging]="drag()?.id === entry.id"
                  [style.grid-row]="rowsOf(entry)"
                  [style.transform]="shiftOf(entry)"
                  (pointerdown)="startDrag($event, entry, dayIndex)"
                  (pointermove)="moveDrag($event)"
                  (pointerup)="endDrag()"
                  (pointercancel)="drag.set(null)"
                  [style.--lane]="entry.lane"
                  [style.--slot]="entry.slot"
                  [style.--slots]="entry.slots"
                  [title]="
                    entry.isRecord
                      ? ('planner.record' | translate)
                      : (entry.start | formatDate: 'HH:mm') +
                        ' – ' +
                        (entry.end | formatDate: 'HH:mm') +
                        (entry.oppositionName ? ' · ' + entry.oppositionName : '')
                  ">
                  <span class="planner-calendar__entry-head d-flex align-items-center">
                    @if (entry.isRecord) {
                      <app-icon class="planner-calendar__record-icon" name="tests" />
                    } @else if (entry.oppositionName === null) {
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
                  @if (entry.isRecord || entry.oppositionName !== null) {
                    <span class="planner-calendar__text">{{ entry.text }}</span>
                  } @else {
                    <button
                      type="button"
                      class="planner-calendar__text planner-calendar__open stretched-link text-start"
                      (click)="openEntry(entry.id)">
                      {{ entry.text }}
                    </button>
                    <span class="planner-calendar__resize" aria-hidden="true"></span>
                  }
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
        @if (isFullCalendar()) {
          <span class="d-flex align-items-center">
            <i class="planner-calendar__swatch planner-calendar__swatch--other"></i>
            {{ 'planner.legend.other' | translate }}
          </span>
        }
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

    .planner-calendar__body {
      position: relative;
      max-height: 70dvh;
      overflow-y: auto;
    }

    .planner-calendar__head {
      position: sticky;
      top: 0;
      z-index: 3;
      height: 3.75rem;
      background-color: var(--bs-card-bg);
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
      pointer-events: none;
      background: repeating-linear-gradient(
        135deg,
        rgba(var(--bs-info-rgb), 0.12) 0 0.5rem,
        rgba(var(--bs-info-rgb), 0.06) 0.5rem 1rem
      );
      border-left: 3px solid var(--bs-info);
    }

    .planner-calendar__rows--lined {
      cursor: copy;
    }

    .planner-calendar__entry:not(
      .planner-calendar__entry--record,
      .planner-calendar__entry--other
    ) {
      cursor: grab;
    }

    .planner-calendar__entry--dragging {
      z-index: 10;
      cursor: grabbing;
      opacity: 0.9;
      box-shadow: 4px 4px 0 var(--bs-primary);
    }

    .planner-calendar__resize {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 2;
      height: 0.5rem;
      cursor: ns-resize;

      &::after {
        display: block;
        width: 1.25rem;
        height: 0.1875rem;
        margin: 0.1875rem auto 0;
        content: '';
        background-color: rgba(var(--bs-dark-rgb), 0.2);
        border-radius: var(--bs-border-radius-pill);
      }
    }

    .planner-calendar__open {
      min-width: 0;
      padding: 0;
      color: inherit;
      background: none;
      border: 0;
    }

    .planner-calendar__entry {
      position: relative;
      cursor: default;
      user-select: none;
      touch-action: none;

      input {
        position: relative;
        z-index: 2;
      }
      z-index: calc(1 + var(--lane));
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
      --indent: min(calc(var(--lane) * 2.5rem), calc(var(--lane) * 20%));

      width: calc((100% - 6px - var(--indent)) / var(--slots));
      margin: 1px 0;
      margin-left: calc(
        3px + var(--indent) + (100% - 6px - var(--indent)) * var(--slot) / var(--slots)
      );
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

    .planner-calendar__entry--other {
      background-color: #fdebd6;
      border-color: var(--bs-secondary);
      box-shadow: none;
    }

    .planner-calendar__swatch--other {
      background-color: #fdebd6;
      border-color: var(--bs-secondary);
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
  readonly isFullCalendar = input(false);
  readonly selectedDay = input.required<number>();
  readonly daySelected = output<number>();
  readonly doneToggled = output<number>();
  readonly entryOpened = output<number>();
  readonly slotSelected = output<TaskSlot>();
  readonly entryMoved = output<TaskMove>();

  protected readonly drag = signal<DragState | null>(null);
  private readonly strip = viewChild.required<ElementRef<HTMLElement>>('strip');
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly hourCells = viewChildren<ElementRef<HTMLElement>>('hourCell');
  #isClickSuppressed = false;
  #scrolledHour: number | null = null;

  constructor() {
    afterRenderEffect(() => {
      const hour = this.#startHour();
      const cell = this.hourCells()[hour]?.nativeElement;
      if (!this.days().length || !cell || hour === this.#scrolledHour) return;
      this.#scrolledHour = hour;
      this.body().nativeElement.scrollTop = cell.offsetTop - (cell.parentElement?.offsetTop ?? 0);
    });
  }

  #startHour(): number {
    const studyRow = this.days().find(({ studyRows }) => studyRows.length)?.studyRows[0].startRow;
    const hour = studyRow
      ? Math.floor((studyRow - 1) / ROWS_PER_HOUR)
      : new Date().getHours() - FIRST_HOUR;
    return Math.max(0, hour - 1);
  }

  protected readonly hourLabels = HOUR_LABELS;
  protected readonly rowCount = ROW_COUNT;
  protected readonly rowsPerHour = ROWS_PER_HOUR;

  protected openEntry(entryId: number): void {
    if (!this.#isClickSuppressed) this.entryOpened.emit(entryId);
  }

  protected rowsOf({ id, startRow, endRow }: PlacedEntry): string {
    const drag = this.drag();
    if (drag?.id !== id) return `${startRow} / ${endRow}`;
    return `${startRow + (drag.isResize ? 0 : drag.rowDelta)} / ${endRow + drag.rowDelta}`;
  }

  protected shiftOf({ id }: PlacedEntry): string | null {
    const drag = this.drag();
    return drag?.id === id && drag.dayDelta
      ? `translateX(${drag.dayDelta * drag.columnWidth}px)`
      : null;
  }

  protected startDrag(event: PointerEvent, entry: PlacedEntry, dayIndex: number): void {
    const target = event.target as HTMLElement;
    const isReadOnly = entry.isRecord || entry.oppositionName !== null;
    if (isReadOnly || event.button !== 0 || target.matches('input')) return;
    const element = event.currentTarget as HTMLElement;
    const rows = element.parentElement;
    if (!rows) return;
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    const isSingleDay = getComputedStyle(this.strip().nativeElement).display !== 'none';
    this.drag.set({
      id: entry.id,
      dayIndex,
      isResize: target.classList.contains('planner-calendar__resize'),
      x: event.clientX,
      y: event.clientY,
      rowHeight: rows.clientHeight / ROW_COUNT,
      columnWidth: isSingleDay ? 0 : rows.clientWidth,
      startRow: entry.startRow,
      endRow: entry.endRow,
      rowDelta: 0,
      dayDelta: 0,
      hasMoved: false,
    });
  }

  protected moveDrag(event: PointerEvent): void {
    const drag = this.drag();
    if (!drag) return;
    const [dx, dy] = [event.clientX - drag.x, event.clientY - drag.y];
    if (!drag.hasMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    const steps = Math.round(dy / (drag.rowHeight * ROWS_PER_SLOT)) * ROWS_PER_SLOT;
    const lastRow = ROW_COUNT + 1;
    this.drag.set({
      ...drag,
      hasMoved: true,
      rowDelta: drag.isResize
        ? clamp(steps, drag.startRow + ROWS_PER_SLOT - drag.endRow, lastRow - drag.endRow)
        : clamp(steps, 1 - drag.startRow, lastRow - drag.endRow),
      dayDelta:
        drag.isResize || !drag.columnWidth
          ? 0
          : clamp(Math.round(dx / drag.columnWidth), -drag.dayIndex, LAST_DAY - drag.dayIndex),
    });
  }

  protected endDrag(): void {
    const drag = this.drag();
    this.drag.set(null);
    if (!drag) return;
    if (!drag.hasMoved) {
      this.entryOpened.emit(drag.id);
      return;
    }
    this.#isClickSuppressed = true;
    setTimeout(() => (this.#isClickSuppressed = false));
    if (!drag.rowDelta && !drag.dayDelta) return;
    this.entryMoved.emit({
      id: drag.id,
      date: this.days()[drag.dayIndex + drag.dayDelta].date,
      start: rowTime(drag.startRow + (drag.isResize ? 0 : drag.rowDelta)),
      end: rowTime(drag.endRow + drag.rowDelta),
    });
  }

  protected selectSlot(event: MouseEvent, date: string): void {
    const rows = event.currentTarget as HTMLElement;
    if (event.target !== rows || this.#isClickSuppressed) return;
    this.slotSelected.emit({ date, start: slotStartAt(event.offsetY / rows.clientHeight) });
  }

  protected hourRow(index: number): string {
    return `${index * ROWS_PER_HOUR + 1} / span ${ROWS_PER_HOUR}`;
  }
}
