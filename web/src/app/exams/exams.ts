import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { FormatDatePipe } from '../../common/pipes/format-date.pipe';
import { ExamsStore } from './exams.store';

@Component({
  selector: 'app-exams',
  imports: [Button, RouterLink, TranslatePipe, Icon, FormatDatePipe],
  providers: [ExamsStore],
  host: { class: 'd-flex flex-column gap-4' },
  template: `
    <p class="exams__lead text-body-secondary mb-0">{{ 'exams.lead' | translate }}</p>

    <div class="exams__starters">
      <section class="card card--cyan exams__starter">
        <span class="exams__tag bg-info">{{ 'exams.kinds.official' | translate }}</span>
        <h2 class="exams__starter-title mb-0">{{ 'exams.official.title' | translate }}</h2>
        <p class="text-body-secondary mb-0">{{ 'exams.official.text' | translate }}</p>
        <button
          app-button
          type="button"
          class="align-self-start mt-auto"
          (click)="scrollToOfficialList()"
          icon="tests">
          {{ 'exams.official.choose' | translate }}
        </button>
      </section>
      <section class="card card--yellow exams__starter">
        <span class="exams__tag bg-warning">{{ 'exams.kinds.mixed' | translate }}</span>
        <h2 class="exams__starter-title mb-0">{{ 'exams.mixed.title' | translate }}</h2>
        <p class="text-body-secondary mb-0">{{ 'exams.mixed.text' | translate }}</p>
        <a
          class="btn btn-primary d-flex align-items-center align-self-start mt-auto"
          routerLink="/exams/mixed">
          <app-icon class="me-2" name="tests" />
          {{ 'exams.mixed.start' | translate }}
        </a>
      </section>
    </div>

    @if (store.isLoading()) {
      <div class="d-flex justify-content-center py-5">
        <span class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'exams.loading' | translate }}</span>
        </span>
      </div>
    } @else if (store.error()) {
      <div class="alert alert-danger mb-0" role="alert">{{ 'exams.loadError' | translate }}</div>
    } @else {
      <div class="exams__lists">
        <section #officialList class="card card--cyan">
          <div class="card-body d-flex flex-column gap-3">
            <h2 class="exams__section mb-0">{{ 'exams.official.listTitle' | translate }}</h2>
            <ul class="list-unstyled mb-0">
              @for (exam of store.officialExams(); track exam.id) {
                <li class="exams__row d-flex align-items-center gap-3">
                  <span class="d-flex flex-column flex-grow-1 overflow-hidden">
                    <span class="fw-bold">{{ exam.name }}</span>
                    <span class="exams__meta text-body-secondary">
                      {{
                        'exams.official.meta'
                          | translate: { questions: exam.questionCount, minutes: exam.minutes }
                      }}
                      ·
                      {{
                        exam.lastPercentage === null
                          ? ('exams.official.notTaken' | translate)
                          : ('exams.official.lastAttempt'
                            | translate: { percentage: exam.lastPercentage })
                      }}
                    </span>
                  </span>
                  <a class="btn btn-outline-primary btn-sm" [routerLink]="['/exams', exam.id]">
                    {{
                      (exam.lastPercentage === null
                        ? 'exams.official.take'
                        : 'exams.official.retake'
                      ) | translate
                    }}
                  </a>
                </li>
              }
            </ul>
          </div>
        </section>

        <section class="card card--teal">
          <div class="card-body d-flex flex-column gap-3">
            <h2 class="exams__section mb-0">{{ 'exams.history.title' | translate }}</h2>
            <ul class="list-unstyled mb-0">
              @for (attempt of store.history(); track attempt.id) {
                <li class="exams__row d-flex align-items-center gap-3">
                  <span
                    class="exams__tag"
                    [class.bg-info]="attempt.kind === 'official'"
                    [class.bg-warning]="attempt.kind === 'mixed'">
                    {{ 'exams.kinds.' + attempt.kind | translate }}
                  </span>
                  <span class="d-flex flex-column flex-grow-1 overflow-hidden">
                    <span class="fw-bold">{{ attempt.name }}</span>
                    <span class="exams__meta text-body-secondary">
                      {{ attempt.date | formatDate: 'd MMM' }} ·
                      {{ 'exams.history.minutes' | translate: { minutes: attempt.minutesTaken } }}
                    </span>
                  </span>
                  <span class="exams__percentage">{{ attempt.percentage }} %</span>
                </li>
              } @empty {
                <li class="text-body-secondary">{{ 'exams.history.empty' | translate }}</li>
              }
            </ul>
          </div>
        </section>
      </div>
    }

    <p class="exams__note text-body-secondary mb-0">{{ 'exams.note' | translate }}</p>
  `,
  styles: `
    :host {
      container-type: inline-size;
    }

    .exams__starters {
      display: grid;
      gap: 1rem;

      @container (min-width: 40rem) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .exams__lists {
      display: grid;
      gap: 1rem;
      align-items: start;

      @container (min-width: 64rem) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .exams__starter {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
    }

    .exams__starter-title {
      font-size: 1.25rem;
      font-weight: 900;
    }

    .exams__tag {
      align-self: flex-start;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 900;
      color: var(--bs-dark);
      text-transform: uppercase;
      border: 1.5px solid var(--bs-dark);
      border-radius: 0.375rem;
    }

    .exams__section {
      font-size: 1.125rem;
      font-weight: 900;
    }

    .exams__row {
      padding: 0.75rem 0;
      border-top: 2px dashed rgba(var(--bs-dark-rgb), 0.14);

      &:first-child {
        padding-top: 0;
        border-top: 0;
      }

      .exams__tag {
        align-self: center;
      }
    }

    .exams__meta {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .exams__percentage {
      min-width: 3.5rem;
      font-weight: 900;
      text-align: right;
    }

    .exams__note {
      padding: 0.625rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 700;
      border: 2px dashed var(--bs-secondary);
      border-radius: var(--bs-border-radius);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Exams {
  protected readonly store = inject(ExamsStore);
  private readonly officialList = viewChild<ElementRef<HTMLElement>>('officialList');

  constructor() {
    this.store.load();
  }

  protected scrollToOfficialList(): void {
    this.officialList()?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
