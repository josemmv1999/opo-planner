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
      <div class="card-body d-flex flex-column">
        <h2 class="card-title fs-5">{{ 'home.streak.title' | translate }}</h2>
        <p class="d-flex align-items-center gap-2 mb-3">
          <app-icon class="streak-card__flame text-secondary" name="flame" />
          <span class="display-5 fw-bold lh-1">{{ days() }}</span>
          {{ (days() === 1 ? 'home.streak.day' : 'home.streak.days') | translate }}
        </p>
        <ol class="d-flex gap-1 list-unstyled mt-auto mb-0">
          @for (day of week(); track day.date) {
            <li class="streak-card__item d-flex flex-column align-items-center gap-1">
              <span
                class="streak-card__day rounded-circle"
                [class.streak-card__day--studied]="day.state === 'studied'"
                [class.streak-card__day--pending]="day.state === 'pending'"></span>
              <span class="small text-body-secondary" aria-hidden="true">
                {{ ('home.streak.weekdayInitials' | translate)[day.weekday] }}
              </span>
              <span class="visually-hidden">
                {{ day.date | formatDate: 'EEEE d' }}: {{ 'home.streak.' + day.state | translate }}
              </span>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: `
    .streak-card__flame {
      width: 2rem;
      height: 2rem;
    }

    .streak-card__item {
      flex: 1 1 0;
      min-width: 0;
    }

    .streak-card__day {
      width: 100%;
      max-width: 2.5rem;
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
}
