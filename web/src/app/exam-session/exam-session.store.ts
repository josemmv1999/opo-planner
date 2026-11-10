import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, interval, pipe, switchMap, tap } from 'rxjs';
import { ExamDetail } from '../../common/models/exam.model';
import { ExamService } from '../services/exam.service';

const LOW_TIME_SECONDS = 5 * 60;

interface ExamSessionState {
  exam: ExamDetail | null;
  answers: (number | null)[];
  flaggedIndexes: number[];
  index: number;
  secondsLeft: number;
  hasSubmitted: boolean;
  isSubmitModalOpen: boolean;
  isExitModalOpen: boolean;
  isLoading: boolean;
  error: 'loading' | null;
}

export const ExamSessionStore = signalStore(
  withState<ExamSessionState>({
    exam: null,
    answers: [],
    flaggedIndexes: [],
    index: 0,
    secondsLeft: 0,
    hasSubmitted: false,
    isSubmitModalOpen: false,
    isExitModalOpen: false,
    isLoading: false,
    error: null,
  }),
  withComputed(({ exam, answers, flaggedIndexes, index, secondsLeft }) => {
    const answeredCount = computed(() => answers().filter((answer) => answer !== null).length);
    return {
      total: computed(() => exam()?.questions.length ?? 0),
      currentQuestion: computed(() => exam()?.questions[index()] ?? null),
      currentAnswer: computed(() => answers()[index()] ?? null),
      isCurrentFlagged: computed(() => flaggedIndexes().includes(index())),
      flaggedSet: computed(() => new Set(flaggedIndexes())),
      answeredCount,
      blankCount: computed(() => answers().length - answeredCount()),
      isTimeLow: computed(() => secondsLeft() < LOW_TIME_SECONDS),
    };
  }),
  withMethods((store, examService = inject(ExamService)) => ({
    load: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((examId) =>
          examService.getExam(examId).pipe(
            tapResponse({
              next: (exam) =>
                patchState(store, {
                  exam,
                  answers: exam.questions.map(() => null),
                  flaggedIndexes: [],
                  index: 0,
                  secondsLeft: exam.minutes * 60,
                  hasSubmitted: false,
                  isLoading: false,
                }),
              error: () => patchState(store, { isLoading: false, error: 'loading' }),
            }),
          ),
        ),
      ),
    ),
    runTimer: rxMethod<void>(
      pipe(
        switchMap(() => interval(1000)),
        filter(() => store.exam() !== null && !store.hasSubmitted()),
        tap(() =>
          patchState(store, ({ secondsLeft }) =>
            secondsLeft > 1
              ? { secondsLeft: secondsLeft - 1 }
              : { secondsLeft: 0, hasSubmitted: true, isSubmitModalOpen: false },
          ),
        ),
      ),
    ),
    answer(option: number): void {
      patchState(store, ({ answers, index }) => ({
        answers: answers.map((answer, i) => (i === index ? option : answer)),
      }));
    },
    toggleFlag(): void {
      patchState(store, ({ flaggedIndexes, index }) => ({
        flaggedIndexes: flaggedIndexes.includes(index)
          ? flaggedIndexes.filter((flagged) => flagged !== index)
          : [...flaggedIndexes, index],
      }));
    },
    goTo(index: number): void {
      if (index < 0 || index >= store.total()) return;
      patchState(store, { index });
    },
    openSubmitModal(): void {
      patchState(store, { isSubmitModalOpen: true });
    },
    closeSubmitModal(): void {
      patchState(store, { isSubmitModalOpen: false });
    },
    submit(): void {
      patchState(store, { hasSubmitted: true, isSubmitModalOpen: false });
    },
    openExitModal(): void {
      patchState(store, { isExitModalOpen: true });
    },
    closeExitModal(): void {
      patchState(store, { isExitModalOpen: false });
    },
  })),
);
