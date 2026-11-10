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
import { concatMap, filter, map, pipe, switchMap, tap } from 'rxjs';
import { StudySchedule, TimeSlot } from '../../common/models/onboarding.model';
import {
  CalendarEntry,
  OtherPlannerEntry,
  OtherSchedule,
  PlannerDay,
  PlannerEntry,
  TaskDraft,
} from '../../common/models/planner.model';
import {
  addScheduleSlot,
  findClash,
  isScheduleComplete,
  removeScheduleSlot,
  slotIssue,
  toggleScheduleDay,
  updateScheduleSlot,
  weeklyMinutes,
} from '../onboarding/schedule';
import { PlannerService } from '../services/planner.service';
import { placeEntries, slotRows } from './planner-layout';

interface PlannerState {
  weekStart: string;
  selectedDay: number;
  examDate: string | null;
  schedule: StudySchedule;
  otherSchedules: OtherSchedule[];
  isFullCalendar: boolean;
  scheduleDraft: StudySchedule | null;
  isScheduleModalOpen: boolean;
  isSavingSchedule: boolean;
  entries: PlannerEntry[];
  otherEntries: OtherPlannerEntry[];
  taskDraft: TaskDraft | null;
  editingTaskId: number | null;
  isTaskModalOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: 'loading' | 'saving' | 'deleting' | 'moving' | 'savingSchedule' | null;
}

export interface TaskSlot {
  date: string;
  start: string;
}

export interface TaskMove extends TaskSlot {
  id: number;
  end: string;
}

const toIsoDateTime = (date: string, time: string): string =>
  parseISO(`${date}T${time}`).toISOString();

const replaceEntry = (entries: PlannerEntry[], entry: PlannerEntry): PlannerEntry[] =>
  entries.map((current) => (current.id === entry.id ? entry : current));

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
    otherSchedules: [],
    isFullCalendar: false,
    scheduleDraft: null,
    isScheduleModalOpen: false,
    isSavingSchedule: false,
    entries: [],
    otherEntries: [],
    taskDraft: null,
    editingTaskId: null,
    isTaskModalOpen: false,
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    error: null,
  }),
  withComputed(
    ({
      weekStart,
      examDate,
      schedule,
      entries,
      otherEntries,
      isFullCalendar,
      scheduleDraft,
      otherSchedules,
      error,
    }) => {
      const calendarEntries = computed<CalendarEntry[]>(() => [
        ...entries().map((entry) => ({ ...entry, oppositionName: null })),
        ...(isFullCalendar()
          ? otherEntries().map(({ oppositionName, ...entry }) => ({
              ...entry,
              oppositionName,
              isDone: false,
              isRecord: false,
            }))
          : []),
      ]);
      const scheduleIssues = computed(
        () => scheduleDraft()?.slots.map((_, i, slots) => slotIssue(slots, i)) ?? [],
      );
      return {
        days: computed<PlannerDay[]>(() => {
          const studyRows = slotRows(schedule().slots);
          return Array.from({ length: 7 }, (_, i) => addDays(parseISO(weekStart()), i)).map(
            (date, i) => ({
              date: toIsoDate(date),
              isToday: isToday(date),
              entries: placeEntries(
                calendarEntries().filter((entry) => isSameDay(parseISO(entry.start), date)),
              ),
              studyRows: schedule().days.includes(i) ? studyRows : [],
            }),
          );
        }),
        scheduleIssues,
        scheduleClashes: computed(() => {
          const draft = scheduleDraft();
          return (
            draft?.slots.map((slot, i) =>
              scheduleIssues()[i] ? null : findClash(slot, draft.days, otherSchedules()),
            ) ?? []
          );
        }),
        scheduleWeeklyHours: computed(() => {
          const draft = scheduleDraft();
          return draft ? weeklyMinutes(draft) / 60 : 0;
        }),
        canSaveSchedule: computed(() => {
          const draft = scheduleDraft();
          return draft !== null && isScheduleComplete(draft);
        }),
        taskError: computed(() => {
          const currentError = error();
          return currentError === 'saving' || currentError === 'deleting' ? currentError : null;
        }),
        weekEnd: computed(() => toIsoDate(addDays(parseISO(weekStart()), 6))),
        daysToExam: computed(() => {
          const date = examDate();
          return date ? differenceInCalendarDays(parseISO(date), startOfToday()) : null;
        }),
      };
    },
  ),
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

    const updateScheduleDraft = (update: (draft: StudySchedule) => StudySchedule): void =>
      patchState(store, ({ scheduleDraft }) => ({
        scheduleDraft: scheduleDraft && update(scheduleDraft),
      }));

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
                next: ({ examDate, schedule, otherSchedules, entries, otherEntries }) =>
                  patchState(store, {
                    examDate,
                    schedule,
                    otherSchedules,
                    entries,
                    otherEntries,
                    isLoading: false,
                  }),
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
      moveTask: rxMethod<TaskMove>(
        pipe(
          map((move) => ({ move, previous: store.entries().find(({ id }) => id === move.id) })),
          filter(
            (change): change is { move: TaskMove; previous: PlannerEntry } =>
              change.previous !== undefined,
          ),
          tap(({ move: { date, start, end }, previous }) =>
            patchState(store, ({ entries }) => ({
              entries: replaceEntry(entries, {
                ...previous,
                start: toIsoDateTime(date, start),
                end: toIsoDateTime(date, end),
              }),
              error: null,
            })),
          ),
          concatMap(({ move: { id, date, start, end }, previous }) =>
            plannerService.saveTask(id, { text: previous.text, date, start, end }).pipe(
              tapResponse({
                next: () => undefined,
                error: () =>
                  patchState(store, ({ entries }) => ({
                    entries: replaceEntry(entries, previous),
                    error: 'moving' as const,
                  })),
              }),
            ),
          ),
        ),
      ),
      showFullCalendar(isFullCalendar: boolean): void {
        patchState(store, { isFullCalendar });
      },
      openScheduleModal(): void {
        patchState(store, {
          scheduleDraft: store.schedule(),
          isScheduleModalOpen: true,
          error: null,
        });
      },
      closeScheduleModal(): void {
        patchState(store, { scheduleDraft: null, isScheduleModalOpen: false });
      },
      toggleScheduleDay(day: number): void {
        updateScheduleDraft((draft) => toggleScheduleDay(draft, day));
      },
      addScheduleSlot(): void {
        updateScheduleDraft((draft) => addScheduleSlot(draft, DEFAULT_SLOT_START));
      },
      removeScheduleSlot(index: number): void {
        updateScheduleDraft((draft) => removeScheduleSlot(draft, index));
      },
      updateScheduleSlot(index: number, part: keyof TimeSlot, value: string): void {
        updateScheduleDraft((draft) => updateScheduleSlot(draft, index, part, value));
      },
      saveSchedule: rxMethod<void>(
        pipe(
          map(() => store.scheduleDraft()),
          filter((draft): draft is StudySchedule => draft !== null && isScheduleComplete(draft)),
          tap(() => patchState(store, { isSavingSchedule: true, error: null })),
          switchMap((draft) =>
            plannerService.saveSchedule(draft).pipe(
              tapResponse({
                next: (schedule) =>
                  patchState(store, {
                    schedule,
                    scheduleDraft: null,
                    isScheduleModalOpen: false,
                    isSavingSchedule: false,
                  }),
                error: () =>
                  patchState(store, { isSavingSchedule: false, error: 'savingSchedule' }),
              }),
            ),
          ),
        ),
      ),
      toggleDone: rxMethod<number>(
        pipe(
          map((entryId) => store.entries().find(({ id }) => id === entryId)),
          filter((entry): entry is PlannerEntry => entry !== undefined && !entry.isRecord),
          tap((entry) =>
            patchState(store, ({ entries }) => ({
              entries: replaceEntry(entries, { ...entry, isDone: !entry.isDone }),
            })),
          ),
          concatMap((entry) =>
            plannerService.setDone(entry.id, !entry.isDone).pipe(
              tapResponse({
                next: () => undefined,
                error: () =>
                  patchState(store, ({ entries }) => ({
                    entries: replaceEntry(entries, entry),
                    error: 'moving' as const,
                  })),
              }),
            ),
          ),
        ),
      ),
    };
  }),
);
