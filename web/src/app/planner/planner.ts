import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '../../common/components/button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../common/components/icon/icon';
import { InputField } from '../../common/components/input/input';
import { Modal } from '../../common/components/modal/modal';
import { FormatDatePipe } from '../../common/pipes/format-date.pipe';
import { ScheduleEditor } from '../onboarding/schedule-editor/schedule-editor';
import { PlannerCalendar } from './planner-calendar/planner-calendar';
import { PlannerTaskForm } from './planner-task-form/planner-task-form';
import { PlannerStore } from './planner.store';

@Component({
  selector: 'app-planner',
  imports: [
    Button,
    InputField,
    TranslatePipe,
    Icon,
    Modal,
    FormatDatePipe,
    PlannerCalendar,
    PlannerTaskForm,
    ScheduleEditor,
  ],
  providers: [PlannerStore],
  host: { class: 'd-flex flex-column gap-3' },
  template: `
    <div class="planner__top">
      @if (store.examDate(); as examDate) {
        <section class="card card--yellow planner__exam d-flex flex-row align-items-center">
          <app-icon name="flag" />
          <span class="d-flex flex-column">
            <app-input
              class="planner__date"
              type="date"
              [label]="'planner.examDate' | translate"
              [value]="examDate"
              [disabled]="store.isSavingExamDate()"
              (valueChange)="store.saveExamDate($event)" />
            @if (store.error() === 'savingExamDate') {
              <span class="text-danger small">{{ 'planner.examDateError' | translate }}</span>
            }
          </span>
          <span class="planner__days-left ms-auto">
            {{ 'planner.daysLeft' | translate: { days: store.daysToExam() } }}
          </span>
        </section>
      }

      <div class="d-flex flex-wrap align-items-center gap-2">
        <button
          app-button
          variant="outline-primary"
          type="button"
          class="planner__icon-button"
          [title]="'planner.previousWeek' | translate"
          (click)="store.previousWeek()"
          icon="chevron-left"
          [isIconOnly]="true"></button>
        <button
          app-button
          variant="outline-primary"
          size="sm"
          type="button"
          (click)="store.goToToday()">
          {{ 'planner.today' | translate }}
        </button>
        <button
          app-button
          variant="outline-primary"
          type="button"
          class="planner__icon-button"
          [title]="'planner.nextWeek' | translate"
          (click)="store.nextWeek()"
          icon="chevron-right"
          [isIconOnly]="true"></button>
        <h2 class="planner__range mb-0 ms-1">
          {{ store.weekStart() | formatDate: 'd MMM' }} –
          {{ store.weekEnd() | formatDate: 'd MMM yyyy' }}
        </h2>
        <div class="d-flex flex-wrap align-items-center gap-2 ms-auto">
          <div
            class="planner__segmented d-flex"
            role="group"
            [attr.aria-label]="'planner.view.label' | translate">
            <button
              type="button"
              class="planner__segment"
              [attr.aria-pressed]="!store.isFullCalendar()"
              (click)="store.showFullCalendar(false)">
              {{ 'planner.view.own' | translate }}
            </button>
            <button
              type="button"
              class="planner__segment"
              [attr.aria-pressed]="store.isFullCalendar()"
              (click)="store.showFullCalendar(true)">
              {{ 'planner.view.full' | translate }}
            </button>
          </div>
          <button
            app-button
            variant="outline-primary"
            type="button"
            (click)="store.openScheduleModal()"
            icon="settings">
            {{ 'planner.schedule.open' | translate }}
          </button>
          <button app-button type="button" (click)="store.openNewTask(null)" icon="add">
            {{ 'planner.task.new' | translate }}
          </button>
        </div>
      </div>
    </div>

    @if (store.error() === 'moving') {
      <div class="alert alert-danger mb-0" role="alert">{{ 'planner.moveError' | translate }}</div>
    }

    @if (store.error() === 'loading') {
      <div class="alert alert-danger mb-0" role="alert">{{ 'planner.loadError' | translate }}</div>
    } @else {
      <app-planner-calendar
        [class.planner__calendar--loading]="store.isLoading()"
        [attr.aria-busy]="store.isLoading()"
        [days]="store.days()"
        [selectedDay]="store.selectedDay()"
        [isFullCalendar]="store.isFullCalendar()"
        (daySelected)="store.selectDay($event)"
        (doneToggled)="store.toggleDone($event)"
        (entryOpened)="store.openTask($event)"
        (slotSelected)="store.openNewTask($event)"
        (entryMoved)="store.moveTask($event)" />
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
            [otherEntries]="store.otherEntries()"
            (submitted)="store.saveTask($event)"
            (deleted)="store.deleteTask()"
            (cancelled)="store.closeTaskModal()" />
        }
      </ng-template>
    </app-modal>

    <app-modal
      size="lg"
      [isOpen]="store.isScheduleModalOpen()"
      [label]="'planner.schedule.title' | translate"
      (closed)="store.closeScheduleModal()">
      <ng-template>
        @if (store.scheduleDraft(); as schedule) {
          <div class="d-flex flex-column gap-3">
            <div>
              <h2 class="h5 mb-1">{{ 'planner.schedule.title' | translate }}</h2>
              <p class="text-body-secondary mb-0">{{ 'planner.schedule.lead' | translate }}</p>
            </div>
            <app-schedule-editor
              [oppositions]="[]"
              [activeId]="null"
              [completedIds]="noCompletedIds"
              [schedule]="schedule"
              [issues]="store.scheduleIssues()"
              [clashes]="store.scheduleClashes()"
              [weeklyHours]="store.scheduleWeeklyHours()"
              (dayToggled)="store.toggleScheduleDay($event)"
              (slotAdded)="store.addScheduleSlot()"
              (slotRemoved)="store.removeScheduleSlot($event)"
              (slotChanged)="store.updateScheduleSlot($event.index, $event.part, $event.value)" />
            @if (store.error() === 'savingSchedule') {
              <p class="text-danger small fw-bold mb-0" role="alert">
                {{ 'planner.schedule.saveError' | translate }}
              </p>
            }
            <div class="d-flex flex-wrap justify-content-end gap-2">
              <button
                app-button
                variant="outline-primary"
                type="button"
                [disabled]="store.isSavingSchedule()"
                (click)="store.closeScheduleModal()">
                {{ 'actions.cancel' | translate }}
              </button>
              <button
                app-button
                type="button"
                [isLoading]="store.isSavingSchedule()"
                [disabled]="!store.canSaveSchedule() || store.isSavingSchedule()"
                (click)="store.saveSchedule()">
                {{ 'actions.save' | translate }}
              </button>
            </div>
          </div>
        }
      </ng-template>
    </app-modal>
  `,
  styles: `
    .planner__top {
      display: grid;
      gap: 1rem;
      align-items: center;

      @container (min-width: 80rem) {
        grid-template-columns: auto minmax(0, 1fr);
      }
    }

    .planner__exam {
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
    }

    .planner__date {
      align-self: flex-start;
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

    .planner__segmented {
      padding: 0.25rem;
      background-color: var(--bs-white);
      border: 2px solid var(--bs-dark);
      border-radius: var(--bs-border-radius);
    }

    .planner__segment {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 800;
      background: none;
      border: 0;
      border-radius: calc(var(--bs-border-radius) - 0.25rem);

      &[aria-pressed='true'] {
        color: var(--bs-white);
        background-color: var(--bs-primary);
      }
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
  protected readonly noCompletedIds = new Set<string>();

  constructor() {
    this.store.load(this.store.weekStart);
  }
}
