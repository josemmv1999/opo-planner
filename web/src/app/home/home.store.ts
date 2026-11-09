import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, switchMap, tap } from 'rxjs';
import { HomeData } from '../../common/models/home.model';
import { AccountService } from '../services/account.service';
import { HomeService } from '../services/home.service';

interface HomeState extends Omit<HomeData, 'oppositionName' | 'examDate'> {
  userName: string | null;
  oppositionName: string | null;
  examDate: string | null;
  isLoading: boolean;
  error: 'loading' | null;
}

export const HomeStore = signalStore(
  withState<HomeState>({
    userName: null,
    oppositionName: null,
    examDate: null,
    tasks: [],
    streakDays: 0,
    lastSevenDays: [],
    studiedBlocks: [],
    weakBlocks: [],
    statements: [],
    isLoading: false,
    error: null,
  }),
  withMethods((store, homeService = inject(HomeService), accountService = inject(AccountService)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          forkJoin({ homeData: homeService.getHomeData(), user: accountService.getCurrentUser() }).pipe(
            tapResponse({
              next: ({ homeData, user }) => patchState(store, { ...homeData, userName: user.name, isLoading: false }),
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
