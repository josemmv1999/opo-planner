import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { HomeData } from '../../common/models/home.model';
import { HomeService } from '../services/home.service';

interface HomeState extends Omit<HomeData, 'examDate'> {
  examDate: string | null;
  isLoading: boolean;
  error: 'loading' | null;
}

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
  withMethods((store, homeService = inject(HomeService)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          homeService.getHomeData().pipe(
            tapResponse({
              next: (homeData) => patchState(store, { ...homeData, isLoading: false }),
              error: () => patchState(store, { isLoading: false, error: 'loading' }),
            }),
          ),
        ),
      ),
    ),
    toggleTask(taskId: number): void {
      patchState(store, ({ tasks }) => ({
        tasks: tasks.map((task) => (task.id === taskId ? { ...task, isDone: !task.isDone } : task)),
      }));
    },
  })),
);
