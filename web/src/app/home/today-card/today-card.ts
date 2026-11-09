import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PlannerTask } from '../../../common/models/home.model';
import { FormatDatePipe } from '../../../common/pipes/format-date.pipe';

@Component({
  selector: 'app-today-card',
  imports: [RouterLink, TranslatePipe, FormatDatePipe],
  template: `
    <section class="card h-100">
      <div class="card-body d-flex flex-column gap-3 p-3 p-lg-4">
        <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
          <div class="d-flex align-items-baseline gap-2">
            <h2 class="card-title today-card__title mb-0">{{ 'home.today.title' | translate }}</h2>
            <span class="today-card__progress text-body-secondary">
              {{ 'home.today.progress' | translate: { done: doneCount(), total: tasks().length } }}
            </span>
          </div>
          <a class="today-card__link" routerLink="/planner">{{ 'home.today.seePlanner' | translate }}</a>
        </div>
        <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
          @for (task of tasks(); track task.id) {
            <li>
              <label class="today-card__task" [class.today-card__task--done]="task.isDone" [for]="'task-' + task.id">
                <input
                  class="today-card__check form-check-input m-0"
                  type="checkbox"
                  [id]="'task-' + task.id"
                  [checked]="task.isDone"
                  (change)="toggled.emit(task.id)" />
                <span class="today-card__body">
                  <span class="today-card__time">
                    {{ task.start | formatDate: 'HH:mm' }} – {{ task.end | formatDate: 'HH:mm' }}
                  </span>
                  <span class="today-card__text">{{ task.text }}</span>
                </span>
              </label>
            </li>
          } @empty {
            <li class="text-body-secondary">{{ 'home.today.empty' | translate }}</li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .today-card__title {
      font-size: 1.125rem;
    }

    .today-card__progress {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .today-card__link {
      display: inline-flex;
      align-items: center;
      min-height: 1.5rem;
      font-size: 0.875rem;
      font-weight: 800;
    }

    .today-card__task {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem;
      cursor: pointer;
      border: 2px solid rgba(var(--bs-dark-rgb), 0.12);
      border-radius: var(--bs-border-radius);
    }

    .today-card__task--done {
      background-color: rgba(var(--bs-dark-rgb), 0.04);
      border-color: transparent;
    }

    .today-card__check {
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
    }

    .today-card__body {
      display: flex;
      flex-direction: column-reverse;
      min-width: 0;
    }

    .today-card__time {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--bs-primary);
    }

    .today-card__text {
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .today-card__task--done .today-card__text {
      color: var(--bs-secondary-color);
      text-decoration: line-through;
    }

    @container (min-width: 30rem) {
      .today-card__title {
        font-size: 1.25rem;
      }

      .today-card__progress {
        font-size: 0.875rem;
      }

      .today-card__task {
        gap: 0.875rem;
        padding: 0.75rem 0.875rem;
      }

      .today-card__body {
        flex-direction: row;
        align-items: center;
        gap: 0.875rem;
      }

      .today-card__time {
        flex-shrink: 0;
        padding: 0.25rem 0.625rem;
        font-size: 0.8125rem;
        font-weight: 800;
        background-color: rgba(var(--bs-primary-rgb), 0.1);
        border-radius: var(--bs-border-radius-sm);
      }

      .today-card__text {
        font-size: 1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayCard {
  readonly tasks = input.required<PlannerTask[]>();
  readonly toggled = output<number>();

  protected readonly doneCount = computed(() => this.tasks().filter(({ isDone }) => isDone).length);
}
