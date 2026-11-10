import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  formatISO,
  isSameDay,
  isToday,
  parseISO,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { pipe, switchMap, tap } from 'rxjs';
import { StudySchedule } from '../../common/models/onboarding.model';
import { PlannerDay, PlannerEntry } from '../../common/models/planner.model';
import { PlannerService } from '../services/planner.service';
import { placeEntries, slotRows } from './planner-layout';

interface PlannerState {
  weekStart: string;
  selectedDay: number;
  examDate: string | null;
  schedule: StudySchedule;
  entries: PlannerEntry[];
  isLoading: boolean;
  error: 'loading' | null;
}

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
    isLoading: false,
    error: null,
  }),
  withComputed(({ weekStart, examDate, schedule, entries }) => ({
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
    weekEnd: computed(() => toIsoDate(addDays(parseISO(weekStart()), 6))),
    daysToExam: computed(() => {
      const date = examDate();
      return date ? differenceInCalendarDays(parseISO(date), startOfToday()) : null;
    }),
  })),
  withMethods((store, plannerService = inject(PlannerService)) => {
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
