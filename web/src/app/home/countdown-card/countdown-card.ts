import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Icon } from '../../../common/components/icon/icon';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';

@Component({
  selector: 'app-countdown-card',
  imports: [TranslatePipe, FormatDatePipe, Icon],
  template: `
    <section class="card bg-primary text-white h-100">
      <div class="card-body d-flex flex-column">
        <h2 class="card-title fs-5 text-white">{{ 'home.countdown.title' | translate }}</h2>
        <p class="mb-3">
          <span class="d-block display-3 fw-bold lh-1">{{ daysLeft() }}</span>
          {{ (daysLeft() === 1 ? 'home.countdown.day' : 'home.countdown.days') | translate }}
        </p>
        <p class="d-flex align-items-center mt-auto mb-0">
          <app-icon class="me-2" name="flag" />
          {{ examDate() | formatDate: 'PPP' }}
        </p>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownCard {
  readonly examDate = input.required<string>();

  protected readonly daysLeft = computed(() => differenceInCalendarDays(parseISO(this.examDate()), new Date()));
}
