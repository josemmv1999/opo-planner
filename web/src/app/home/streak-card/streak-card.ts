import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { getDay, isToday, parseISO } from 'date-fns';
import { Icon } from '../../../common/components/icon/icon';
import { StudyDay } from '../../../common/models/home.model';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';

type DayState = 'studied' | 'notStudied' | 'pending';

@Component({
  selector: 'app-streak-card',
  imports: [TranslatePipe, FormatDatePipe, Icon],
  template: `
    <section class="card card--yellow h-100">
      <div class="card-body d-flex flex-column gap-2 p-3 p-lg-4">
        <h2 class="streak-card__label card-label text-body-secondary">{{ 'home.streak.title' | translate }}</h2>
        <p class="streak-card__count d-flex flex-wrap align-items-center mb-0">
          <app-icon class="streak-card__flame text-secondary" name="flame" />
          <span class="streak-card__number">{{ days() }}</span>
          <span class="streak-card__unit text-body-secondary">
            {{ (days() === 1 ? 'home.streak.day' : 'home.streak.days') | translate }}
          </span>
        </p>
        <ol class="d-flex gap-1 list-unstyled mt-auto mb-0">
          @for (day of week(); track day.date) {
            <li class="streak-card__item d-flex flex-column align-items-center gap-1">
              <span
                class="streak-card__day rounded-circle"
                [class.streak-card__day--studied]="day.state === 'studied'"
                [class.streak-card__day--pending]="day.state === 'pending'"></span>
              <span class="streak-card__initial text-body-secondary" aria-hidden="true">
                {{ ('home.streak.weekdayInitials' | translate)[day.weekday] }}
              </span>
              <span class="visually-hidden">
                {{ day.date | formatDate: 'EEEE d' }}: {{ 'home.streak.' + day.state | translate }}
              </span>
            </li>
          }
        </ol>
        @if (isTodayPending()) {
          <p class="streak-card__hint text-body-secondary mb-0">
            {{ 'home.streak.studyToday' | translate: { days: days() + 1 } }}
          </p>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .streak-card__label {
      font-size: 0.75rem;
    }

    .streak-card__count {
      gap: 0 0.375rem;
    }

    .streak-card__flame {
      width: 1.75rem;
      height: 1.75rem;
    }

    .streak-card__number {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1.05;
    }

    .streak-card__unit {
      flex-basis: 100%;
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .streak-card__item {
      flex: 1 1 0;
      min-width: 0;
    }

    .streak-card__day {
      width: 100%;
      max-width: 1.875rem;
      aspect-ratio: 1;
      border: 2px solid var(--bs-border-color);
    }

    .streak-card__day--studied {
      background-color: var(--bs-secondary);
      border-color: var(--bs-dark);
    }

    .streak-card__day--pending {
      border-style: dashed;
      border-color: var(--bs-primary);
    }

    .streak-card__initial {
      font-size: 0.625rem;
      font-weight: 700;
    }

    .streak-card__hint {
      font-size: 0.75rem;
    }

    @container (min-width: 16rem) {
      .streak-card__label {
        font-size: 0.9375rem;
      }

      .streak-card__count {
        gap: 0.625rem;
      }

      .streak-card__flame {
        width: 2.25rem;
        height: 2.25rem;
      }

      .streak-card__number {
        font-size: 3rem;
        line-height: 1;
      }

      .streak-card__unit {
        flex-basis: auto;
        font-size: 1rem;
      }

      .streak-card__initial {
        font-size: 0.75rem;
      }

      .streak-card__hint {
        font-size: 0.8125rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreakCard {
  readonly days = input.required<number>();
  readonly lastSevenDays = input.required<StudyDay[]>();

  protected readonly week = computed(() =>
    this.lastSevenDays().map(({ date, hasStudied }) => ({
      date,
      weekday: getDay(parseISO(date)),
      state: (hasStudied ? 'studied' : isToday(parseISO(date)) ? 'pending' : 'notStudied') satisfies DayState,
    })),
  );
  protected readonly isTodayPending = computed(() => this.week().some(({ state }) => state === 'pending'));
}
