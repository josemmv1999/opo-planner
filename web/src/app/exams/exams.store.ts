import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, switchMap, tap } from 'rxjs';
import { ExamAttempt, OfficialExam } from '../../common/models/exam.model';
import { ExamService } from '../services/exam.service';

interface ExamsState {
  officialExams: OfficialExam[];
  history: ExamAttempt[];
  isLoading: boolean;
  error: 'loading' | null;
}

export const ExamsStore = signalStore(
  withState<ExamsState>({
    officialExams: [],
    history: [],
    isLoading: false,
    error: null,
  }),
  withMethods((store, examService = inject(ExamService)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          forkJoin([examService.getOfficialExams(), examService.getHistory()]).pipe(
            tapResponse({
              next: ([officialExams, history]) =>
                patchState(store, { officialExams, history, isLoading: false }),
              error: () => patchState(store, { isLoading: false, error: 'loading' }),
            }),
          ),
        ),
      ),
    ),
  })),
);
