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
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-baseline gap-2 mb-3">
          <h2 class="card-title fs-5 mb-0">{{ 'home.today.title' | translate }}</h2>
          <span class="text-body-secondary">
            {{ 'home.today.progress' | translate: { done: doneCount(), total: tasks().length } }}
          </span>
          <a class="ms-auto fw-bold" routerLink="/planner">{{ 'home.today.seePlanner' | translate }}</a>
        </div>
        <ul class="list-unstyled d-flex flex-column gap-3 mb-0">
          @for (task of tasks(); track task.id) {
            <li class="d-flex align-items-start gap-2">
              <div class="form-check flex-grow-1 mb-0">
                <input
                  class="form-check-input"
                  type="checkbox"
                  [id]="'task-' + task.id"
                  [checked]="task.isDone"
                  (change)="toggled.emit(task.id)" />
                <label
                  class="form-check-label"
                  [class.text-decoration-line-through]="task.isDone"
                  [class.text-body-secondary]="task.isDone"
                  [for]="'task-' + task.id">
                  {{ task.text }}
                </label>
              </div>
              <span class="badge rounded-pill bg-primary-subtle text-primary-emphasis text-nowrap mt-1">
                {{ task.start | formatDate: 'HH:mm' }} – {{ task.end | formatDate: 'HH:mm' }}
              </span>
            </li>
          } @empty {
            <li class="text-body-secondary">{{ 'home.today.empty' | translate }}</li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .form-check {
      padding-left: 2rem;
    }

    .form-check .form-check-input {
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0.125rem;
      margin-left: -2rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayCard {
  readonly tasks = input.required<PlannerTask[]>();
  readonly toggled = output<number>();

  protected readonly doneCount = computed(() => this.tasks().filter(({ isDone }) => isDone).length);
}
