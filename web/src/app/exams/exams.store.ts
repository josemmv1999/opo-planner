import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, switchMap, tap } from 'rxjs';
import { ExamAttempt, OfficialExam } from '../../common/models/exam.model';
import { SyllabusBlock } from '../../common/models/syllabus.model';
import { ExamService } from '../services/exam.service';
import { SyllabusService } from '../services/syllabus.service';

interface ExamsState {
  officialExams: OfficialExam[];
  history: ExamAttempt[];
  blocks: SyllabusBlock[];
  isCustomModalOpen: boolean;
  isLoading: boolean;
  error: 'loading' | null;
}

export const ExamsStore = signalStore(
  withState<ExamsState>({
    officialExams: [],
    history: [],
    blocks: [],
    isCustomModalOpen: false,
    isLoading: false,
    error: null,
  }),
  withMethods(
    (store, examService = inject(ExamService), syllabusService = inject(SyllabusService)) => ({
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            forkJoin([
              examService.getOfficialExams(),
              examService.getHistory(),
              syllabusService.getBlocks(),
            ]).pipe(
              tapResponse({
                next: ([officialExams, history, blocks]) =>
                  patchState(store, { officialExams, history, blocks, isLoading: false }),
                error: () => patchState(store, { isLoading: false, error: 'loading' }),
              }),
            ),
          ),
        ),
      ),
      openCustomModal(): void {
        patchState(store, { isCustomModalOpen: true });
      },
      closeCustomModal(): void {
        patchState(store, { isCustomModalOpen: false });
      },
    }),
  ),
);
