import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { subSeconds } from 'date-fns';
import { filter, interval, map, pipe, switchMap, tap } from 'rxjs';
import { ExamDetail, WeakBlock } from '../../common/models/exam.model';
import { ExamService } from '../services/exam.service';
import { PlannerService } from '../services/planner.service';

const LOW_TIME_SECONDS = 5 * 60;
const WEAK_BLOCKS_SHOWN = 3;

interface ExamSessionState {
  exam: ExamDetail | null;
  answers: (number | null)[];
  flaggedIndexes: number[];
  index: number;
  secondsLeft: number;
  hasSubmitted: boolean;
  isReviewing: boolean;
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
    isReviewing: false,
    isSubmitModalOpen: false,
    isExitModalOpen: false,
    isLoading: false,
    error: null,
  }),
  withComputed(({ exam, answers, flaggedIndexes, index, secondsLeft }) => {
    const answeredCount = computed(() => answers().filter((answer) => answer !== null).length);
    const total = computed(() => exam()?.questions.length ?? 0);
    const isCorrect = (i: number): boolean => answers()[i] === exam()?.questions[i].correctOption;
    const correctCount = computed(() => answers().filter((_, i) => isCorrect(i)).length);
    const secondsTaken = computed(() => (exam()?.minutes ?? 0) * 60 - secondsLeft());
    return {
      total,
      currentQuestion: computed(() => exam()?.questions[index()] ?? null),
      currentAnswer: computed(() => answers()[index()] ?? null),
      isCurrentFlagged: computed(() => flaggedIndexes().includes(index())),
      flaggedSet: computed(() => new Set(flaggedIndexes())),
      answeredCount,
      blankCount: computed(() => answers().length - answeredCount()),
      isTimeLow: computed(() => secondsLeft() < LOW_TIME_SECONDS),
      correctCount,
      wrongCount: computed(() => answeredCount() - correctCount()),
      percentage: computed(() => (total() ? Math.round((correctCount() / total()) * 100) : 0)),
      secondsTaken,
      secondsPerQuestion: computed(() => (total() ? Math.round(secondsTaken() / total()) : 0)),
      weakBlocks: computed<WeakBlock[]>(() => {
        const blocks = new Map<string, { questions: number; misses: number }>();
        exam()?.questions.forEach(({ block }, i) => {
          const stats = blocks.get(block) ?? { questions: 0, misses: 0 };
          blocks.set(block, {
            questions: stats.questions + 1,
            misses: stats.misses + (isCorrect(i) ? 0 : 1),
          });
        });
        return [...blocks]
          .map(([name, { questions, misses }]) => ({
            name,
            errorPercentage: Math.round((misses / questions) * 100),
          }))
          .filter(({ errorPercentage }) => errorPercentage > 0)
          .sort((a, b) => b.errorPercentage - a.errorPercentage)
          .slice(0, WEAK_BLOCKS_SHOWN);
      }),
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
                  isReviewing: false,
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
    startReview(): void {
      patchState(store, { isReviewing: true, index: 0 });
    },
    closeReview(): void {
      patchState(store, { isReviewing: false });
    },
    openExitModal(): void {
      patchState(store, { isExitModalOpen: true });
    },
    closeExitModal(): void {
      patchState(store, { isExitModalOpen: false });
    },
  })),
  withHooks((store, plannerService = inject(PlannerService)) => ({
    onInit(): void {
      rxMethod<boolean>(
        pipe(
          filter(Boolean),
          map(() => store.exam()),
          filter((exam): exam is ExamDetail => exam !== null),
          switchMap(({ name }) => {
            const end = new Date();
            return plannerService
              .logRecord({
                kind: 'exam',
                name,
                percentage: store.percentage(),
                start: subSeconds(end, store.secondsTaken()).toISOString(),
                end: end.toISOString(),
              })
              .pipe(tapResponse({ next: () => undefined, error: () => undefined }));
          }),
        ),
      )(store.hasSubmitted);
    },
  })),
);
