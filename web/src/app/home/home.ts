import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TrueFalseGame } from '../../common/components/true-false-game/true-false-game';
import { BlocksCard } from './blocks-card/blocks-card';
import { CountdownCard } from './countdown-card/countdown-card';
import { HomeStore } from './home.store';
import { StreakCard } from './streak-card/streak-card';
import { TodayCard } from './today-card/today-card';

@Component({
  selector: 'app-home',
  imports: [TranslatePipe, CountdownCard, StreakCard, TodayCard, BlocksCard, TrueFalseGame],
  providers: [HomeStore],
  host: { class: 'd-block' },
  template: `
    @if (store.isLoading()) {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'home.loading' | translate }}</span>
        </span>
      </div>
    } @else if (store.error()) {
      <div class="alert alert-danger" role="alert">{{ 'home.error' | translate }}</div>
    } @else {
      <div class="home__grid">
        @if (store.examDate(); as examDate) {
          <app-countdown-card class="home__countdown" [examDate]="examDate" [studyStartDate]="store.studyStartDate()" />
        }
        <app-streak-card class="home__streak" [days]="store.streakDays()" [lastSevenDays]="store.lastSevenDays()" />
        <app-today-card class="home__today" [tasks]="store.tasks()" (toggled)="store.toggleTask($event)" />
        @if (store.statements().length) {
          <app-true-false-game class="home__game" [statements]="store.statements()" />
        }
        <app-blocks-card
          class="home__blocks"
          [studiedBlocks]="store.studiedBlocks()"
          [weakBlocks]="store.weakBlocks()" />
      </div>
    }
  `,
  styles: `
    .home__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.875rem;

      > * {
        min-width: 0;
      }
    }

    .home__today,
    .home__game,
    .home__blocks {
      grid-column: 1 / -1;
    }

    @container (max-width: 20rem) {
      .home__grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    @container (min-width: 40rem) {
      .home__grid {
        gap: 1.75rem;
      }
    }

    @container (min-width: 64rem) {
      .home__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .home__countdown {
        grid-area: 1 / 1;
      }

      .home__streak {
        grid-area: 1 / 2;
      }

      .home__game {
        grid-area: 1 / 3 / span 2;
      }

      .home__today {
        grid-area: 2 / 1 / auto / span 2;
      }

      .home__blocks {
        grid-area: 3 / 1 / auto / -1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly store = inject(HomeStore);

  constructor() {
    this.store.load();
  }
}
