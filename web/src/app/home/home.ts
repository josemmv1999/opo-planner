import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TrueFalseGame } from '../../common/components/true-false-game/true-false-game';
import { CalendarCard } from './calendar-card/calendar-card';
import { CountdownCard } from './countdown-card/countdown-card';
import { HomeStore } from './home.store';
import { StreakCard } from './streak-card/streak-card';
import { StudiedBlocksCard } from './studied-blocks-card/studied-blocks-card';
import { WeakBlocksCard } from './weak-blocks-card/weak-blocks-card';

@Component({
  selector: 'app-home',
  imports: [
    TranslatePipe,
    CountdownCard,
    StreakCard,
    CalendarCard,
    WeakBlocksCard,
    StudiedBlocksCard,
    TrueFalseGame,
  ],
  providers: [HomeStore],
  host: { class: 'd-flex flex-column flex-grow-1' },
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
          <app-countdown-card
            class="home__countdown"
            [examDate]="examDate"
            [studyStartDate]="store.studyStartDate()" />
        }
        <app-streak-card
          class="home__streak"
          [days]="store.streakDays()"
          [lastSevenDays]="store.lastSevenDays()" />
        <app-calendar-card
          class="home__calendar"
          [tasks]="store.tasks()"
          [mockExamLogs]="store.mockExamLogs()"
          [weekDaysWithTasks]="store.weekDaysWithTasks()"
          (toggled)="store.toggleTask($event)" />
        @if (store.statements().length) {
          <app-true-false-game class="home__game" [statements]="store.statements()" />
        }
        <app-weak-blocks-card class="home__weak" [weakBlocks]="store.weakBlocks()" />
        <app-studied-blocks-card class="home__studied" [studiedBlocks]="store.studiedBlocks()" />
      </div>
    }
  `,
  styles: `
    .home__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-areas:
        'countdown streak'
        'calendar calendar'
        'game game'
        'weak weak'
        'studied studied';
      gap: 0.875rem;

      > * {
        min-width: 0;
      }
    }

    .home__countdown {
      grid-area: countdown;
    }

    .home__streak {
      grid-area: streak;
    }

    .home__calendar {
      grid-area: calendar;
    }

    .home__game {
      grid-area: game;
    }

    .home__weak {
      grid-area: weak;
    }

    .home__studied {
      grid-area: studied;
    }

    @container (max-width: 20rem) {
      .home__grid {
        grid-template-columns: minmax(0, 1fr);
        grid-template-areas: 'countdown' 'streak' 'calendar' 'game' 'weak' 'studied';
      }
    }

    @container (min-width: 44rem) {
      .home__grid {
        grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
        grid-template-areas:
          'countdown streak'
          'calendar calendar'
          'game game'
          'weak studied';
        gap: 1.25rem;
      }
    }

    @container (min-width: 56rem) {
      .home__grid {
        flex: 1;
        grid-template-columns: minmax(0, 1.25fr) minmax(0, 1.25fr) minmax(0, 1fr);
        grid-template-rows: auto minmax(12rem, auto) auto;
        grid-template-areas:
          'countdown streak calendar'
          'game game calendar'
          'weak weak studied';
        gap: 1rem 1.25rem;
      }

      .home__game {
        min-height: 0;
        contain: size;
      }

      @media (min-width: 992px) and (max-height: 56rem) {
        .home__grid {
          row-gap: 0.75rem;
        }
      }

      .home__calendar {
        --calendar-card-agenda-height: 0;
        --calendar-card-agenda-min-height: 5.5rem;
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
