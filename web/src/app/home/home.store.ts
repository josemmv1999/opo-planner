import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { formatISO, isToday, parseISO, startOfToday, startOfWeek } from 'date-fns';
import { concatMap, filter, forkJoin, map, pipe, switchMap, tap } from 'rxjs';
import { HomeData, MockExamLog, PlannerTask } from '../../common/models/home.model';
import { PlannerEntry } from '../../common/models/planner.model';
import { HomeService } from '../services/home.service';
import { PlannerService } from '../services/planner.service';

interface HomeState extends Omit<HomeData, 'examDate'> {
  examDate: string | null;
  tasks: PlannerTask[];
  mockExamLogs: MockExamLog[];
  weekDaysWithTasks: string[];
  isLoading: boolean;
  error: 'loading' | null;
}

const currentWeekStart = (): string =>
  formatISO(startOfWeek(startOfToday(), { weekStartsOn: 1 }), { representation: 'date' });

const todayFrom = (
  entries: PlannerEntry[],
): Pick<HomeState, 'tasks' | 'mockExamLogs' | 'weekDaysWithTasks'> => ({
  tasks: entries
    .filter(({ start, isRecord }) => !isRecord && isToday(parseISO(start)))
    .map(({ id, text, start, end, isDone }) => ({ id, text, start, end, isDone })),
  mockExamLogs: entries
    .filter(({ start, isRecord }) => isRecord && isToday(parseISO(start)))
    .map(({ id, text, start, end }) => ({ id, text, start, end })),
  weekDaysWithTasks: [
    ...new Set(
      entries
        .filter(({ isRecord }) => !isRecord)
        .map(({ start }) => formatISO(parseISO(start), { representation: 'date' })),
    ),
  ],
});

const setTaskDone = (tasks: PlannerTask[], taskId: number, isDone: boolean): PlannerTask[] =>
  tasks.map((task) => (task.id === taskId ? { ...task, isDone } : task));

export const HomeStore = signalStore(
  withState<HomeState>({
    examDate: null,
    studyStartDate: null,
    tasks: [],
    mockExamLogs: [],
    weekDaysWithTasks: [],
    streakDays: 0,
    lastSevenDays: [],
    studiedBlocks: [],
    weakBlocks: [],
    statements: [],
    isLoading: false,
    error: null,
  }),
  withMethods(
    (store, homeService = inject(HomeService), plannerService = inject(PlannerService)) => ({
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            forkJoin({
              homeData: homeService.getHomeData(),
              week: plannerService.getWeek(currentWeekStart()),
            }).pipe(
              tapResponse({
                next: ({ homeData, week }) =>
                  patchState(store, { ...homeData, ...todayFrom(week.entries), isLoading: false }),
                error: () => patchState(store, { isLoading: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      toggleTask: rxMethod<number>(
        pipe(
          map((taskId) => store.tasks().find(({ id }) => id === taskId)),
          filter((task): task is PlannerTask => task !== undefined),
          tap((task) =>
            patchState(store, ({ tasks }) => ({
              tasks: setTaskDone(tasks, task.id, !task.isDone),
            })),
          ),
          concatMap((task) =>
            plannerService.setDone(task.id, !task.isDone).pipe(
              tapResponse({
                next: () => undefined,
                error: () =>
                  patchState(store, ({ tasks }) => ({
                    tasks: setTaskDone(tasks, task.id, task.isDone),
                  })),
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
