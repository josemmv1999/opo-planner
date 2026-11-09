import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { addDays, eachDayOfInterval, format, formatISO, getDay, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Icon } from '../../../common/components/icon/icon';
import { MockExamLog, PlannerTask } from '../../../common/models/home.model';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';
import { injectNow } from '../../../common/utils/inject-now';
import { buildAgenda } from './build-agenda';

@Component({
  selector: 'app-calendar-card',
  imports: [RouterLink, TranslatePipe, FormatDatePipe, Icon],
  template: `
    <section class="card card--cyan h-100">
      <div class="calendar-card__body card-body card-body--home d-flex flex-column gap-3">
        <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
          <h2 class="card-title calendar-card__title mb-0">{{ 'home.calendar.title' | translate }}</h2>
          <span class="calendar-card__meta text-body-secondary">{{ month() }}</span>
        </div>

        <ol class="calendar-card__week list-unstyled mb-0" [attr.aria-label]="'home.calendar.thisWeek' | translate">
          @for (day of week(); track day.date) {
            <li
              class="calendar-card__day"
              [class.calendar-card__day--today]="day.isToday"
              [attr.aria-current]="day.isToday ? 'date' : null">
              <span class="calendar-card__weekday" aria-hidden="true">
                {{ ('home.streak.weekdayInitials' | translate)[day.weekday] }}
              </span>
              <span class="calendar-card__number" aria-hidden="true">{{ day.number }}</span>
              <span class="calendar-card__dot" [class.invisible]="!day.hasTasks" aria-hidden="true"></span>
              <span class="visually-hidden">
                {{ day.label }}{{ day.hasTasks ? ', ' + ('home.calendar.hasTasks' | translate) : '' }}
              </span>
            </li>
          }
        </ol>

        <div class="d-flex align-items-baseline justify-content-between gap-2">
          <h3 class="calendar-card__subtitle mb-0">{{ 'home.calendar.today' | translate }}</h3>
          @if (tasks().length) {
            <span class="calendar-card__meta text-body-secondary">
              {{ 'home.calendar.progress' | translate: { done: doneCount(), total: tasks().length } }}
            </span>
          }
        </div>

        <ul class="calendar-card__agenda list-unstyled d-flex flex-column gap-2 mb-0">
          @for (entry of agenda(); track entry.id) {
            @if (entry.kind === 'task') {
              <li>
                <label class="calendar-card__entry" [class.calendar-card__entry--done]="entry.task.isDone">
                  <input
                    class="calendar-card__check form-check-input m-0"
                    type="checkbox"
                    [checked]="entry.task.isDone"
                    (change)="toggled.emit(entry.task.id)" />
                  <span class="calendar-card__entry-body">
                    <span class="calendar-card__entry-title">{{ entry.task.text }}</span>
                    <span class="calendar-card__entry-time">
                      {{ entry.task.start | formatDate: 'HH:mm' }} – {{ entry.task.end | formatDate: 'HH:mm' }}
                    </span>
                  </span>
                </label>
              </li>
            } @else if (entry.kind === 'log') {
              <li class="calendar-card__entry calendar-card__entry--log">
                <app-icon class="calendar-card__log-icon text-primary" name="tests" />
                <span class="calendar-card__entry-body">
                  <span class="calendar-card__entry-title">{{ entry.log.text }}</span>
                  <span class="calendar-card__entry-time">
                    {{ entry.log.start | formatDate: 'HH:mm' }} – {{ entry.log.end | formatDate: 'HH:mm' }} ·
                    {{ 'home.calendar.autoLog' | translate }}
                  </span>
                </span>
                <span class="calendar-card__score badge rounded-pill bg-info text-dark border border-dark ms-auto">
                  {{ entry.log.correctAnswers }}/{{ entry.log.totalQuestions }}
                  <span class="visually-hidden">{{ 'home.calendar.correctAnswers' | translate }}</span>
                </span>
              </li>
            } @else {
              <li class="calendar-card__now d-flex align-items-center gap-2">
                <span class="visually-hidden">{{ 'home.calendar.now' | translate }}</span>
                <span class="calendar-card__now-time text-danger">{{ nowTime() }}</span>
                <span class="calendar-card__now-line flex-grow-1" aria-hidden="true"></span>
              </li>
            }
          }
        </ul>
        @if (!tasks().length && !mockExamLogs().length) {
          <p class="text-body-secondary mb-0">{{ 'home.calendar.empty' | translate }}</p>
        }

        <div class="calendar-card__footer d-flex justify-content-end mt-auto">
          <a class="calendar-card__link d-inline-flex align-items-center" routerLink="/planner">
            {{ 'home.calendar.openPlanner' | translate }}
            <app-icon class="ms-1" name="arrow-right" />
          </a>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .calendar-card__title {
      font-size: 1.125rem;
    }

    .calendar-card__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .calendar-card__subtitle {
      font-size: 1rem;
      font-weight: 800;
    }

    .calendar-card__week {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 0.25rem;
    }

    .calendar-card__day {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
      padding: 0.5rem 0 0.375rem;
      border-radius: var(--bs-border-radius);
    }

    .calendar-card__day--today {
      color: var(--bs-white);
      background-color: var(--bs-dark);

      .calendar-card__weekday {
        color: rgba(var(--bs-white-rgb), 0.8);
      }

      .calendar-card__dot {
        background-color: var(--bs-warning);
        opacity: 1;
      }
    }

    .calendar-card__weekday {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--bs-secondary-color);
    }

    .calendar-card__number {
      font-size: 1.0625rem;
      font-weight: 800;
    }

    .calendar-card__dot {
      width: 0.3125rem;
      height: 0.3125rem;
      background-color: var(--bs-primary);
      border-radius: 50%;
      opacity: 0.6;
    }

    .calendar-card__agenda {
      flex: 1 1 auto;
      height: var(--calendar-card-agenda-height, auto);
      min-height: var(--calendar-card-agenda-min-height, auto);
      overflow-y: auto;
    }

    .calendar-card__entry {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.625rem 0.75rem;
      cursor: pointer;
      border: 2px solid rgba(var(--bs-dark-rgb), 0.12);
      border-left: 0.375rem solid var(--bs-primary);
      border-radius: var(--bs-border-radius);
    }

    .calendar-card__entry--done {
      background-color: rgba(var(--bs-dark-rgb), 0.04);
      border-left-color: rgba(var(--bs-dark-rgb), 0.12);

      .calendar-card__entry-title {
        color: var(--bs-secondary-color);
        text-decoration: line-through;
      }
    }

    .calendar-card__entry--log {
      cursor: default;
      background-color: rgba(var(--bs-info-rgb), 0.08);
      border-style: dashed;
      border-left-style: solid;
      border-left-color: var(--bs-info);
    }

    .calendar-card__check {
      flex-shrink: 0;
      width: 1.125rem;
      height: 1.125rem;
      margin-top: 0.125rem !important;
    }

    .calendar-card__log-icon {
      width: 1.125rem;
      height: 1.125rem;
      margin-top: 0.125rem;
    }

    .calendar-card__entry-body {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .calendar-card__entry-title {
      font-weight: 700;
      line-height: 1.3;
    }

    .calendar-card__entry-time {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--bs-secondary-color);
    }

    .calendar-card__score {
      align-self: flex-start;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .calendar-card__now-time {
      font-size: 0.75rem;
      font-weight: 800;
    }

    .calendar-card__now-line {
      position: relative;
      height: 2px;
      background-color: var(--bs-danger);

      &::before {
        content: '';
        position: absolute;
        top: -0.25rem;
        left: -0.25rem;
        width: 0.625rem;
        height: 0.625rem;
        background-color: var(--bs-danger);
        border-radius: 50%;
      }
    }

    .calendar-card__footer {
      padding-top: 0.75rem;
      border-top: 2px dashed rgba(var(--bs-dark-rgb), 0.12);
    }

    .calendar-card__link {
      min-height: 1.5rem;
      font-size: 0.875rem;
      font-weight: 800;

      app-icon {
        width: 1rem;
        height: 1rem;
      }
    }

    @container (min-width: 30rem) {
      .calendar-card__title {
        font-size: 1.25rem;
      }

      .calendar-card__meta {
        font-size: 0.875rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarCard {
  readonly tasks = input.required<PlannerTask[]>();
  readonly mockExamLogs = input.required<MockExamLog[]>();
  readonly weekDaysWithTasks = input.required<string[]>();
  readonly toggled = output<number>();

  readonly #now = injectNow();

  protected readonly month = computed(() => format(this.#now(), "LLLL 'de' yyyy", { locale: es }));
  protected readonly nowTime = computed(() => format(this.#now(), 'HH:mm'));
  protected readonly doneCount = computed(() => this.tasks().filter(({ isDone }) => isDone).length);
  protected readonly agenda = computed(() => buildAgenda(this.tasks(), this.mockExamLogs(), this.#now()));
  protected readonly week = computed(() => {
    const daysWithTasks = new Set(this.weekDaysWithTasks());
    const monday = startOfWeek(this.#now(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: monday, end: addDays(monday, 6) }).map((day) => {
      const date = formatISO(day, { representation: 'date' });
      return {
        date,
        weekday: getDay(day),
        number: format(day, 'd'),
        label: format(day, 'EEEE d', { locale: es }),
        isToday: isToday(day),
        hasTasks: daysWithTasks.has(date),
      };
    });
  });
}
