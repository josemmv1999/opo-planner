import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { Modal } from '../../common/components/modal/modal';
import { FormatDatePipe } from '../../common/pipes/format-date.pipe';
import { PlannerCalendar } from './planner-calendar/planner-calendar';
import { PlannerTaskForm } from './planner-task-form/planner-task-form';
import { PlannerStore } from './planner.store';

@Component({
  selector: 'app-planner',
  imports: [TranslatePipe, Icon, Modal, FormatDatePipe, PlannerCalendar, PlannerTaskForm],
  providers: [PlannerStore],
  host: { class: 'd-flex flex-column gap-3' },
  template: `
    @if (store.examDate(); as examDate) {
      <section class="card card--yellow planner__exam d-flex flex-row align-items-center">
        <app-icon name="flag" />
        <span class="d-flex flex-column">
          <strong>{{ 'planner.examDate' | translate }}</strong>
          <span class="planner__meta text-body-secondary">
            {{ examDate | formatDate: "EEEE, d 'de' MMMM 'de' yyyy" }}
          </span>
        </span>
        <span class="planner__days-left ms-auto">
          {{ 'planner.daysLeft' | translate: { days: store.daysToExam() } }}
        </span>
      </section>
    }

    <div class="d-flex flex-wrap align-items-center gap-2">
      <button
        type="button"
        class="btn btn-outline-primary planner__icon-button d-flex align-items-center justify-content-center"
        [title]="'planner.previousWeek' | translate"
        (click)="store.previousWeek()">
        <app-icon name="chevron-left" />
      </button>
      <button type="button" class="btn btn-outline-primary btn-sm" (click)="store.goToToday()">
        {{ 'planner.today' | translate }}
      </button>
      <button
        type="button"
        class="btn btn-outline-primary planner__icon-button d-flex align-items-center justify-content-center"
        [title]="'planner.nextWeek' | translate"
        (click)="store.nextWeek()">
        <app-icon name="chevron-right" />
      </button>
      <h2 class="planner__range mb-0 ms-1">
        {{ store.weekStart() | formatDate: 'd MMM' }} –
        {{ store.weekEnd() | formatDate: 'd MMM yyyy' }}
      </h2>
      <button
        type="button"
        class="btn btn-primary d-flex align-items-center ms-auto"
        (click)="store.openNewTask(null)">
        <app-icon class="me-2" name="add" />
        {{ 'planner.task.new' | translate }}
      </button>
    </div>

    @if (store.error() === 'loading') {
      <div class="alert alert-danger mb-0" role="alert">{{ 'planner.loadError' | translate }}</div>
    } @else {
      <app-planner-calendar
        [class.planner__calendar--loading]="store.isLoading()"
        [attr.aria-busy]="store.isLoading()"
        [days]="store.days()"
        [selectedDay]="store.selectedDay()"
        (daySelected)="store.selectDay($event)"
        (doneToggled)="store.toggleDone($event)"
        (entryOpened)="store.openTask($event)"
        (slotSelected)="store.openNewTask($event)" />
    }

    <app-modal
      [isOpen]="store.isTaskModalOpen()"
      [label]="
        (store.editingTaskId() === null ? 'planner.task.newTitle' : 'planner.task.editTitle')
          | translate
      "
      (closed)="store.closeTaskModal()">
      <ng-template>
        @if (store.taskDraft(); as draft) {
          <app-planner-task-form
            [draft]="draft"
            [isEditing]="store.editingTaskId() !== null"
            [isSaving]="store.isSaving()"
            [isDeleting]="store.isDeleting()"
            [error]="store.taskError()"
            (submitted)="store.saveTask($event)"
            (deleted)="store.deleteTask()"
            (cancelled)="store.closeTaskModal()" />
        }
      </ng-template>
    </app-modal>
  `,
  styles: `
    .planner__exam {
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
    }

    .planner__meta {
      font-size: 0.875rem;
      font-weight: 700;

      &::first-letter {
        text-transform: uppercase;
      }
    }

    .planner__days-left {
      padding: 0.25rem 0.75rem;
      font-weight: 900;
      white-space: nowrap;
      background-color: var(--bs-warning);
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius-pill);
    }

    .planner__icon-button {
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
    }

    .planner__range {
      font-size: 1.125rem;
      font-weight: 900;
    }

    .planner__calendar--loading {
      opacity: 0.6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Planner {
  protected readonly store = inject(PlannerStore);

  constructor() {
    this.store.load(this.store.weekStart);
  }
}
