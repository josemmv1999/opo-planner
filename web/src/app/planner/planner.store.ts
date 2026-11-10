import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  addDays,
  addHours,
  format,
  addWeeks,
  differenceInCalendarDays,
  formatISO,
  isSameDay,
  isToday,
  parseISO,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { filter, map, pipe, switchMap, tap } from 'rxjs';
import { StudySchedule } from '../../common/models/onboarding.model';
import { PlannerDay, PlannerEntry, TaskDraft } from '../../common/models/planner.model';
import { PlannerService } from '../services/planner.service';
import { placeEntries, slotRows } from './planner-layout';

interface PlannerState {
  weekStart: string;
  selectedDay: number;
  examDate: string | null;
  schedule: StudySchedule;
  entries: PlannerEntry[];
  taskDraft: TaskDraft | null;
  editingTaskId: number | null;
  isTaskModalOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: 'loading' | 'saving' | 'deleting' | null;
}

export interface TaskSlot {
  date: string;
  start: string;
}

const DEFAULT_SLOT_START = '17:00';

const toIsoDate = (date: Date): string => formatISO(date, { representation: 'date' });
const currentWeekStart = (): string => toIsoDate(startOfWeek(startOfToday(), { weekStartsOn: 1 }));
const todayIndex = (): number => (startOfToday().getDay() + 6) % 7;

export const PlannerStore = signalStore(
  withState<PlannerState>({
    weekStart: currentWeekStart(),
    selectedDay: todayIndex(),
    examDate: null,
    schedule: { days: [], slots: [] },
    entries: [],
    taskDraft: null,
    editingTaskId: null,
    isTaskModalOpen: false,
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    error: null,
  }),
  withComputed(({ weekStart, examDate, schedule, entries, error }) => ({
    days: computed<PlannerDay[]>(() => {
      const studyRows = slotRows(schedule().slots);
      return Array.from({ length: 7 }, (_, i) => addDays(parseISO(weekStart()), i)).map(
        (date, i) => ({
          date: toIsoDate(date),
          isToday: isToday(date),
          entries: placeEntries(
            entries().filter((entry) => isSameDay(parseISO(entry.start), date)),
          ),
          studyRows: schedule().days.includes(i) ? studyRows : [],
        }),
      );
    }),
    taskError: computed(() => {
      const currentError = error();
      return currentError === 'loading' ? null : currentError;
    }),
    weekEnd: computed(() => toIsoDate(addDays(parseISO(weekStart()), 6))),
    daysToExam: computed(() => {
      const date = examDate();
      return date ? differenceInCalendarDays(parseISO(date), startOfToday()) : null;
    }),
  })),
  withMethods((store, plannerService = inject(PlannerService)) => {
    const updateTaskModalOpening = (
      taskDraft: TaskDraft | null,
      editingTaskId: number | null = null,
    ): void =>
      patchState(store, {
        taskDraft,
        editingTaskId,
        isTaskModalOpen: taskDraft !== null,
        error: null,
      });

    const moveWeeks = (weeks: number): void =>
      patchState(store, ({ weekStart }) => ({
        weekStart: toIsoDate(addWeeks(parseISO(weekStart), weeks)),
      }));

    return {
      load: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((weekStart) =>
            plannerService.getWeek(weekStart).pipe(
              tapResponse({
                next: ({ examDate, schedule, entries }) =>
                  patchState(store, { examDate, schedule, entries, isLoading: false }),
                error: () => patchState(store, { isLoading: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      previousWeek: (): void => moveWeeks(-1),
      nextWeek: (): void => moveWeeks(1),
      goToToday(): void {
        patchState(store, { weekStart: currentWeekStart(), selectedDay: todayIndex() });
      },
      selectDay(selectedDay: number): void {
        patchState(store, { selectedDay });
      },
      openNewTask(slot: TaskSlot | null): void {
        const { date, start } = slot ?? {
          date: toIsoDate(startOfToday()),
          start: DEFAULT_SLOT_START,
        };
        updateTaskModalOpening({
          text: '',
          date,
          start,
          end: format(addHours(parseISO(`${date}T${start}`), 1), 'HH:mm'),
        });
      },
      openTask(taskId: number): void {
        const entry = store.entries().find(({ id }) => id === taskId);
        if (!entry || entry.isRecord) return;
        const [start, end] = [parseISO(entry.start), parseISO(entry.end)];
        updateTaskModalOpening(
          {
            text: entry.text,
            date: toIsoDate(start),
            start: format(start, 'HH:mm'),
            end: format(end, 'HH:mm'),
          },
          taskId,
        );
      },
      closeTaskModal(): void {
        updateTaskModalOpening(null);
      },
      saveTask: rxMethod<TaskDraft>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap((draft) =>
            plannerService.saveTask(store.editingTaskId(), draft).pipe(
              tapResponse({
                next: (saved) => {
                  patchState(store, ({ entries }) => {
                    const previous = entries.find(({ id }) => id === saved.id);
                    const entry = { ...saved, isDone: previous?.isDone ?? false };
                    return {
                      entries: previous
                        ? entries.map((current) => (current.id === saved.id ? entry : current))
                        : [...entries, entry],
                      isSaving: false,
                    };
                  });
                  updateTaskModalOpening(null);
                },
                error: () => patchState(store, { isSaving: false, error: 'saving' }),
              }),
            ),
          ),
        ),
      ),
      deleteTask: rxMethod<void>(
        pipe(
          map(() => store.editingTaskId()),
          filter((taskId): taskId is number => taskId !== null),
          tap(() => patchState(store, { isDeleting: true, error: null })),
          switchMap((taskId) =>
            plannerService.deleteTask(taskId).pipe(
              tapResponse({
                next: (deletedId) => {
                  patchState(store, ({ entries }) => ({
                    entries: entries.filter(({ id }) => id !== deletedId),
                    isDeleting: false,
                  }));
                  updateTaskModalOpening(null);
                },
                error: () => patchState(store, { isDeleting: false, error: 'deleting' }),
              }),
            ),
          ),
        ),
      ),
      toggleDone(entryId: number): void {
        patchState(store, ({ entries }) => ({
          entries: entries.map((entry) =>
            entry.id === entryId ? { ...entry, isDone: !entry.isDone } : entry,
          ),
        }));
      },
    };
  }),
);
