import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Icon } from '../../../common/components/icon/icon';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';

@Component({
  selector: 'app-countdown-card',
  imports: [TranslatePipe, FormatDatePipe, Icon],
  template: `
    <section class="card card--ink bg-primary text-white h-100">
      <div class="card-body d-flex flex-column gap-2 p-3 p-lg-4">
        <h2 class="countdown-card__label card-label text-white">{{ 'home.countdown.title' | translate }}</h2>
        <p class="countdown-card__days mb-0">
          <span class="countdown-card__number">{{ daysLeft() }}</span>
          <span class="countdown-card__unit">
            {{ (daysLeft() === 1 ? 'home.countdown.day' : 'home.countdown.days') | translate }}
          </span>
        </p>
        <p class="countdown-card__date d-flex align-items-center gap-2 mt-auto mb-0">
          <app-icon class="countdown-card__flag" name="flag" />
          <span class="countdown-card__date-long">
            {{ 'home.countdown.examDate' | translate: { date: examDate() | formatDate: 'PPP' } }}
          </span>
          <span class="countdown-card__date-short">{{ examDate() | formatDate: 'd MMM yyyy' }}</span>
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .countdown-card__label {
      font-size: 0.75rem;
      opacity: 0.85;
    }

    .countdown-card__days {
      display: flex;
      flex-direction: column;
    }

    .countdown-card__number {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1.05;
    }

    .countdown-card__unit,
    .countdown-card__date {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .countdown-card__flag,
    .countdown-card__date-long {
      display: none;
    }

    @container (min-width: 16rem) {
      .countdown-card__label {
        font-size: 0.9375rem;
      }

      .countdown-card__days {
        flex-direction: row;
        align-items: baseline;
        gap: 0.625rem;
      }

      .countdown-card__number {
        font-size: 4rem;
        line-height: 1;
        letter-spacing: -0.125rem;
      }

      .countdown-card__unit {
        font-size: 1.125rem;
      }

      .countdown-card__date {
        font-size: 0.9375rem;
        font-weight: 600;
      }

      .countdown-card__flag,
      .countdown-card__date-long {
        display: inline-block;
      }

      .countdown-card__date-short {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownCard {
  readonly examDate = input.required<string>();

  protected readonly daysLeft = computed(() => differenceInCalendarDays(parseISO(this.examDate()), new Date()));
}
